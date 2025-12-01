// pages/api/generate.js
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";

const LOG_DIR = path.join(process.cwd(), "data");
const LOG_FILE = path.join(LOG_DIR, "sends_logs.json");
const INCOME_FILE = path.join(LOG_DIR, "income.json");

function ensureFiles() {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
  if (!fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, "[]");
  if (!fs.existsSync(INCOME_FILE)) fs.writeFileSync(INCOME_FILE, JSON.stringify({
    today: 0,
    total: 0,
    wallet: 0,
    lastResetDate: new Date().toISOString().slice(0,10)
  }, null, 2));
}

function readLogs() {
  ensureFiles();
  try {
    return JSON.parse(fs.readFileSync(LOG_FILE, "utf8") || "[]");
  } catch { return []; }
}

function writeLogs(logs) {
  ensureFiles();
  fs.writeFileSync(LOG_FILE, JSON.stringify(logs, null, 2));
}

function readIncome() {
  ensureFiles();
  try {
    const raw = JSON.parse(fs.readFileSync(INCOME_FILE, "utf8") || "{}");
    // reset today if new day
    const todayStr = new Date().toISOString().slice(0,10);
    if (raw.lastResetDate !== todayStr) {
      raw.today = 0;
      raw.lastResetDate = todayStr;
      fs.writeFileSync(INCOME_FILE, JSON.stringify(raw, null, 2));
    }
    return raw;
  } catch {
    return { today:0, total:0, wallet:0, lastResetDate: new Date().toISOString().slice(0,10) };
  }
}

function writeIncome(obj) {
  ensureFiles();
  fs.writeFileSync(INCOME_FILE, JSON.stringify(obj, null, 2));
}

// Followup intervals ms: 1 hour, 6 hours, 24 hours
const FOLLOWUP_INTERVALS = [1 * 60 * 60 * 1000, 6 * 60 * 60 * 1000, 24 * 60 * 60 * 1000];

export default async function handler(req, res) {
  try {
    ensureFiles();

    // GET - status + income
    if (req.method === "GET") {
      const income = readIncome();
      return res.json({
        status: "AI Client Engine Running",
        version: "final-1.0",
        income,
      });
    }

    // POST - actions
    if (req.method === "POST") {
      const { action, city, category, business, phone, message } = req.body;

      // 1) SCRAPE (SerpAPI)
      if (action === "scrape") {
        if (!city || !category) return res.status(400).json({ error: "city and category required" });
        const q = `${category} in ${city}`;
        const url = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(q)}&api_key=${process.env.SERPAPI_KEY}`;
        const r = await axios.get(url);
        const results = r.data.local_results || [];
        const leads = results
          .filter(b => b && b.phone) // only with phone
          .map(b => ({
            name: b.title,
            rating: b.rating || "N/A",
            address: b.address || "",
            phone: b.phone || "",
            website: b.website || "",
          }));
        return res.json({ leads });
      }

      // 2) AI MESSAGE generation (Gemini -> OpenAI)
      if (action === "aiMessage") {
        if (!business) return res.status(400).json({ error: "business required" });
        const prompt = `
Business Info:
Name: ${business.name}
Address: ${business.address || "N/A"}
Rating: ${business.rating || "N/A"}
Website: ${business.website || "N/A"}

Write a short, HIGH-CONVERTING WhatsApp outreach message to offer:
• Website (Next.js)
• AI Automation
• Social media integration
Keep it friendly, local, include clear CTA (reply or demo link). Keep max 2 short sentences.
`;
        let generated = "";
        try {
          if (process.env.GEMINI_API_KEY) {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
            const r = await model.generateContent(prompt);
            generated = (r?.response?.text && r.response.text()) || (r?.response?.content?.[0]?.text || "");
          } else {
            throw new Error("No Gemini key");
          }
        } catch (e) {
          // fallback OpenAI
          const aiRes = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            { model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }] },
            { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
          );
          generated = aiRes.data.choices[0].message.content;
        }
        return res.json({ message: (generated || "").trim() });
      }

      // 3) SEND message (WATI or simulated) + log + schedule followups + income update
      if (action === "send") {
        if (!phone || !message) return res.status(400).json({ error: "phone and message required" });

        // send via WATI if key present
        let sendResp = { simulated: true };
        try {
          if (process.env.WATI_KEY) {
            const r = await axios.post("https://app-server.wati.io/api/v1/sendMessage", {
              messageText: message,
              phoneNumber: phone,
            }, {
              headers: { Authorization: `Bearer ${process.env.WATI_KEY}` },
            });
            sendResp = { simulated: false, data: r.data };
          } else {
            // simulated
            sendResp = { simulated: true, data: { info: "Simulated send - no WATI_KEY" } };
          }
        } catch (err) {
          // return failure but do not crash
          return res.status(500).json({ error: "Send failed", details: err.message || err.toString() });
        }

        // update logs
        const logs = readLogs();
        const now = Date.now();
        const entry = {
          id: `log_${now}_${Math.floor(Math.random()*10000)}`,
          business: business || { phone },
          phone,
          initialMessage: message,
          sendResponse: sendResp,
          createdAt: now,
          followUpCount: 0,
          nextFollowUpAt: now + FOLLOWUP_INTERVALS[0],
          followUpHistory: [],
          done: false
        };
        logs.push(entry);
        writeLogs(logs);

        // income update per send (configurable)
        const PRICE_PER_LEAD = Number(process.env.PRICE_PER_LEAD || 200); // default 200
        const income = readIncome();
        income.today = (income.today || 0) + PRICE_PER_LEAD;
        income.total = (income.total || 0) + PRICE_PER_LEAD;
        income.wallet = (income.wallet || 0) + PRICE_PER_LEAD;
        writeIncome(income);

        return res.json({ status: "sent", log: entry, income });
      }

      // 4) runFollowups - process due followups (call via cron)
      if (action === "runFollowups") {
        const logs = readLogs();
        const now = Date.now();
        const results = [];
        for (let entry of logs) {
          if (entry.done) continue;
          if (entry.nextFollowUpAt && entry.nextFollowUpAt <= now && entry.followUpCount < FOLLOWUP_INTERVALS.length) {
            // create followup message via AI
            const followupPrompt = `
Business Info:
Name: ${entry.business?.name || "Business"}
Phone: ${entry.phone}

Write a SHORT follow-up WhatsApp message reminding about previous offer.
Keep it friendly and include a CTA to reply or book demo. Max 1 short sentence.
`;
            let followupMsg = `Hi, just checking — did you get my previous message about a website + AI system? Reply if interested.`;
            try {
              if (process.env.GEMINI_API_KEY) {
                const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
                const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
                const r = await model.generateContent(followupPrompt);
                followupMsg = (r?.response?.text && r.response.text()) || followupMsg;
              } else {
                const aiRes = await axios.post(
                  "https://api.openai.com/v1/chat/completions",
                  { model: "gpt-4o-mini", messages: [{ role: "user", content: followupPrompt }] },
                  { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
                );
                followupMsg = aiRes.data.choices[0].message.content || followupMsg;
              }
            } catch (e) {
              // keep default followupMsg
            }

            // send followup
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
              entry.followUpHistory.push({ at: now, message: followupMsg, error: err.message || err.toString() });
              continue;
            }

            entry.followUpHistory.push({ at: now, message: followupMsg, sendResponse: sendResp });
            entry.followUpCount = (entry.followUpCount || 0) + 1;
            if (entry.followUpCount < FOLLOWUP_INTERVALS.length) {
              entry.nextFollowUpAt = now + FOLLOWUP_INTERVALS[entry.followUpCount];
            } else {
              entry.nextFollowUpAt = null;
              entry.done = true;
            }
            results.push({ id: entry.id, status: "followup_sent", followUpCount: entry.followUpCount });
          }
        }
        writeLogs(logs);
        return res.json({ status: "followups_processed", results });
      }

      // 5) getLogs
      if (action === "getLogs") {
        const logs = readLogs();
        return res.json({ logs });
      }

      // 6) income status (alias)
      if (action === "income") {
        const income = readIncome();
        return res.json({ income });
      }

      return res.status(400).json({ error: "Invalid action" });
    }

    res.status(405).json({ error: "Method Not Allowed" });
  } catch (err) {
    return res.status(500).json({ error: "Server Error", details: err.message || err.toString() });
  }
        }
