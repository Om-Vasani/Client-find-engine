// pages/api/generate.js
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

const LOG_PATH = path.join(process.cwd(), "data", "logs.json");

// Ensure log folder/file exists
function ensureLogFile() {
  const dir = path.dirname(LOG_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(LOG_PATH)) fs.writeFileSync(LOG_PATH, JSON.stringify([]));
}

function readLogs() {
  ensureLogFile();
  const raw = fs.readFileSync(LOG_PATH, "utf8");
  try {
    return JSON.parse(raw || "[]");
  } catch {
    return [];
  }
}

function writeLogs(logs) {
  ensureLogFile();
  fs.writeFileSync(LOG_PATH, JSON.stringify(logs, null, 2));
}

// Followup intervals in milliseconds: 1 hour, 6 hours, 24 hours
const FOLLOWUP_INTERVALS = [1 * 60 * 60 * 1000, 6 * 60 * 60 * 1000, 24 * 60 * 60 * 1000];

export default async function handler(req, res) {
  try {
    // GET status or getLogs
    if (req.method === "GET") {
      return res.json({
        status: "AI Client Engine Running ✔",
        version: "2.1-auto-followups",
        features: ["Surat Auto Scraper", "AI Messages", "Auto Followups", "Logging"],
      });
    }

    if (req.method === "POST") {
      const { action, city, category, business, phone, message } = req.body;

      // 1) SCRAPE
      if (action === "scrape") {
        const q = `${category} in ${city}`;
        const url = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(q)}&api_key=${process.env.SERPAPI_KEY}`;
        const response = await axios.get(url);
        const results = response.data.local_results || [];

        const leads = results
          .filter((b) => b.phone)
          .map((b) => ({
            name: b.title,
            rating: b.rating || "N/A",
            address: b.address,
            phone: b.phone,
            website: b.website || "",
            quality: (b.rating >= 4.0 ? 10 : 5) + (b.website ? 10 : 0) + (b.phone ? 10 : 0),
          }))
          .sort((a, b) => b.quality - a.quality);

        return res.json({ leads });
      }

      // 2) AI MESSAGE GENERATION
      if (action === "aiMessage") {
        const prompt = `
Business Info:
Name: ${business.name}
Address: ${business.address}
Rating: ${business.rating}
Website: ${business.website || "N/A"}

Write a HIGH-CONVERTING short WhatsApp outreach message to offer:
• Website (Next.js)
• AI automation
• Social media integration
Keep it friendly, local, and include a clear CTA (reply or demo link). Max 2 short sentences.
`;
        let generated = "";

        try {
          const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
          const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
          const result = await model.generateContent(prompt);
          generated = result.response.text();
        } catch (err) {
          console.log("Gemini failed → using OpenAI...", err?.message || err);
          const aiRes = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
              model: "gpt-4o-mini",
              messages: [{ role: "user", content: prompt }],
            },
            { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
          );
          generated = aiRes.data.choices[0].message.content;
        }

        return res.json({ message: generated.trim() });
      }

      // 3) SEND MESSAGE (WATI) - plus logging & schedule followups
      if (action === "send") {
        const payload = {
          messageText: message,
          phoneNumber: phone,
        };

        // send via WATI if key present, otherwise simulate send
        let sendResp = { simulated: true };
        try {
          if (process.env.WATI_KEY) {
            const r = await axios.post("https://app-server.wati.io/api/v1/sendMessage", payload, {
              headers: { Authorization: `Bearer ${process.env.WATI_KEY}` },
            });
            sendResp = { simulated: false, data: r.data };
          } else {
            // Simulated send (for testing)
            sendResp = { simulated: true, data: { info: "Simulated send (no WATI_KEY)" } };
          }
        } catch (err) {
          // don't fail entire flow; return error status
          return res.status(500).json({ error: "Send failed", details: err.message });
        }

        // Log the initial send + schedule followups
        const logs = readLogs();
        const now = Date.now();

        const entry = {
          id: `log_${now}_${Math.floor(Math.random() * 10000)}`,
          business: business || { phone },
          phone,
          initialMessage: message,
          sendResponse: sendResp,
          createdAt: now,
          followUpCount: 0,
          nextFollowUpAt: now + FOLLOWUP_INTERVALS[0],
          followUpHistory: [],
          done: false,
        };

        logs.push(entry);
        writeLogs(logs);

        return res.json({ status: "sent", log: entry });
      }

      // 4) RUN FOLLOWUPS - process due followups (call this via cron or manual trigger)
      if (action === "runFollowups") {
        const logs = readLogs();
        const now = Date.now();
        const updatedLogs = [];
        const results = [];

        for (const entry of logs) {
          if (entry.done) {
            updatedLogs.push(entry);
            continue;
          }

          // if nextFollowUpAt is due
          if (entry.nextFollowUpAt && entry.nextFollowUpAt <= now && entry.followUpCount < FOLLOWUP_INTERVALS.length) {
            // create followup message via AI (short)
            const followupPrompt = `
Business Info:
Name: ${entry.business.name || "Business"}
Phone: ${entry.phone}

Write a SHORT follow-up WhatsApp message reminding about previous offer.
Keep it friendly and include a CTA to reply or book demo. Max 1 short sentence.
`;
            let followupMsg = `Hello, just checking in — did you get my previous message about a website + AI system? Reply if interested.`;

            try {
              const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
              const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
              const r = await model.generateContent(followupPrompt);
              followupMsg = r.response.text().trim();
            } catch (err) {
              try {
                const aiRes = await axios.post(
                  "https://api.openai.com/v1/chat/completions",
                  { model: "gpt-4o-mini", messages: [{ role: "user", content: followupPrompt }] },
                  { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
                );
                followupMsg = aiRes.data.choices[0].message.content.trim();
              } catch (e) {
                // fallback default message already set
              }
            }

            // Send followup
            let sendResp = { simulated: true };
            try {
              if (process.env.WATI_KEY) {
                const r = await axios.post("https://app-server.wati.io/api/v1/sendMessage", {
                  messageText: followupMsg,
                  phoneNumber: entry.phone,
                }, {
                  headers: { Authorization: `Bearer ${process.env.WATI_KEY}` },
                });
                sendResp = { simulated: false, data: r.data };
              } else {
                sendResp = { simulated: true, data: { info: "Simulated followup send" } };
              }
            } catch (err) {
              // log send error
              entry.followUpHistory.push({
                at: now,
                message: followupMsg,
                error: err.message,
              });
              updatedLogs.push(entry);
              results.push({ id: entry.id, status: "error", error: err.message });
              continue;
            }

            // update entry
            entry.followUpHistory.push({
              at: now,
              message: followupMsg,
              sendResponse: sendResp,
            });
            entry.followUpCount = (entry.followUpCount || 0) + 1;

            // schedule next followup or mark done
            if (entry.followUpCount < FOLLOWUP_INTERVALS.length) {
              entry.nextFollowUpAt = now + FOLLOWUP_INTERVALS[entry.followUpCount];
            } else {
              entry.nextFollowUpAt = null;
              entry.done = true;
            }

            updatedLogs.push(entry);
            results.push({ id: entry.id, status: "followup_sent", followUpCount: entry.followUpCount });
          } else {
            // not due
            updatedLogs.push(entry);
          }
        }

        writeLogs(updatedLogs);
        return res.json({ status: "followups_processed", results });
      }

      // 5) GET LOGS
      if (action === "getLogs") {
        const logs = readLogs();
        return res.json({ logs });
      }

      return res.status(400).json({ error: "Invalid action" });
    }

    res.status(405).json({ error: "Method Not Allowed" });
  } catch (error) {
    return res.status(500).json({ error: "Server Error", details: error.message });
  }
}
