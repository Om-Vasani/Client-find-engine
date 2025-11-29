// pages/api/generate.js
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(400).json({ error: "POST Only" });
  }

  const { action, city, category, business, phone } = req.body;

  try {
    // -------------------------
    // 1) GOOGLE MAPS SCRAPER
    // -------------------------
    if (action === "scrape") {
      const q = `${category} in ${city}`;

      const url = `https://serpapi.com/search.json?engine=google_maps&q=${q}&api_key=${process.env.SERPAPI_KEY}`;

      const response = await axios.get(url);
      const results = response.data.local_results || [];

      const leads = results.map((b) => ({
        name: b.title,
        rating: b.rating,
        address: b.address,
        phone: b.phone,
        website: b.website,
      }));

      return res.json({ leads });
    }

    // -------------------------
    // 2) AI MESSAGE GENERATION
    // -------------------------

    if (action === "aiMessage") {
      const prompt = `
Business Info:
Name: ${business.name}
Address: ${business.address}
Rating: ${business.rating}

Write a short, high-converting WhatsApp outreach message for selling digital services.
`;

      let message = "";

      // Try Gemini first
      try {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

        const result = await model.generateContent(prompt);
        message = result.response.text();
      } catch (err) {
        console.log("Gemini failed → using OpenAI...");
        // fallback → OpenAI
        const aiRes = await axios.post(
          "https://api.openai.com/v1/chat/completions",
          {
            model: "gpt-4o-mini",
            messages: [{ role: "user", content: prompt }],
          },
          {
            headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
          }
        );

        message = aiRes.data.choices[0].message.content;
      }

      return res.json({ message });
    }

    // -------------------------
    // 3) SEND MESSAGE (WATI)
    // -------------------------
    if (action === "send") {
      const send = await axios.post(
        "https://app-server.wati.io/api/v1/sendMessage",
        {
          messageText: req.body.message,
          phoneNumber: phone,
        },
        {
          headers: { Authorization: `Bearer ${process.env.WATI_KEY}` },
        }
      );

      return res.json({ status: "sent", data: send.data });
    }

    res.status(400).json({ error: "Invalid action" });
  } catch (error) {
    return res
      .status(500)
      .json({ error: "Server Error", details: error.message });
  }
          }
