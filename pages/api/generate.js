// pages/api/generate.js
import axios from "axios";

export default async function handler(req, res) {
  // -----------------------------------
  // 🔹 ALLOW GET REQUESTS
  // -----------------------------------
  if (req.method === "GET") {
    return res.status(200).json({
      message: "API Working ✔ — Use POST for actions",
      endpoints: {
        scrape: "POST /api/generate { action:'scrape', city, category }",
        aiMessage: "POST /api/generate { action:'aiMessage', business:{} }",
        send: "POST /api/generate { action:'send', phone, message }"
      }
    });
  }

  // -----------------------------------
  // 🔹 ONLY POST ALLOWED FOR ACTIONS
  // -----------------------------------
  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method Not Allowed — Use GET for testing, POST for actions"
    });
  }

  try {
    const { action, city, category, business, phone } = req.body;

    // -----------------------------
    // 🔍 SCRAPE GOOGLE MAPS
    // -----------------------------
    if (action === "scrape") {
      const query = `${category} in ${city}`;
      const url = `https://serpapi.com/search.json?engine=google_maps&q=${query}&api_key=${process.env.SERPAPI_KEY}`;

      const r = await axios.get(url);
      const data = r.data.local_results || [];

      const leads = data.map((b) => ({
        name: b.title,
        address: b.address,
        phone: b.phone,
        rating: b.rating,
        website: b.website
      }));

      return res.json({ leads });
    }

    // -----------------------------
    // 🤖 AI MESSAGE GENERATION
    // -----------------------------
    if (action === "aiMessage") {
      const prompt = `
Write a high-converting WhatsApp message for:
Business: ${business.name}
Address: ${business.address}
Rating: ${business.rating}
      `;

      const r = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }]
        },
        {
          headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }
        }
      );

      const msg = r.data.choices[0].message.content;
      return res.json({ message: msg });
    }

    // -----------------------------
    // 📲 SEND VIA WHATSAPP (WATI)
    // -----------------------------
    if (action === "send") {
      const r = await axios.post(
        "https://app-server.wati.io/api/v1/sendMessage",
        {
          phoneNumber: phone,
          messageText: req.body.message
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.WATI_KEY}`
          }
        }
      );

      return res.json({ status: "sent", data: r.data });
    }

    return res.status(400).json({ error: "Invalid Action" });
  } catch (e) {
    console.error(e);
    return res.status(500).json({
      error: "Server Error",
      details: e.message
    });
  }
        }
