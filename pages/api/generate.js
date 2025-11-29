// pages/api/generate.js
import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(400).json({ error: "POST Only" });
  }

  try {
    const { action, city, category, business, phone } = req.body;

    // ----------- SCRAPER ----------
    if (action === "scrape") {
      const q = `${category} in ${city}`;

      const url = `https://serpapi.com/search.json?engine=google_maps&q=${q}&api_key=${process.env.SERPAPI_KEY}`;

      const r = await axios.get(url);
      const data = r.data.local_results || [];

      const leads = data.map((b) => ({
        name: b.title,
        rating: b.rating,
        address: b.address,
        phone: b.phone,
        website: b.website,
      }));

      return res.json({ leads });
    }

    // ----------- AI MESSAGE ----------
    if (action === "aiMessage") {
      const prompt = `
Write a short WhatsApp cold message for:
Business: ${business.name}
Address: ${business.address}
Rating: ${business.rating}
      `;

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

      const msg = aiRes.data.choices[0].message.content;
      return res.json({ message: msg });
    }

    // ----------- WHATSAPP SEND ----------
    if (action === "send") {
      const resp = await axios.post(
        "https://app-server.wati.io/api/v1/sendMessage",
        {
          messageText: req.body.message,
          phoneNumber: phone,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.WATI_KEY}`,
          },
        }
      );

      return res.json({ status: "sent", data: resp.data });
    }

    res.status(400).json({ error: "Invalid action" });
  } catch (e) {
    console.log(e);
    res.status(500).json({ error: "Server Error", details: e.message });
  }
  }
