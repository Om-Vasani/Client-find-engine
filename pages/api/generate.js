import axios from "axios";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { action, city, category, business, senderName, agencyName } = req.body;

  try {
    // 1. Scraping Action
    if (action === "scrape") {
      // SerpAPI or Google Maps Scraping Call
      const apiKey = process.env.SERPAPI_KEY || "";
      if (!apiKey) {
        return res.status(500).json({ error: "SerpAPI key missing" });
      }

      const serpUrl = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(
        `${category} in ${city}`
      )}&api_key=${apiKey}`;

      const response = await axios.get(serpUrl);
      const results = response.data.local_results || [];

      const leads = results.map((item) => ({
        name: item.title,
        address: item.address,
        phone: item.phone,
        rating: item.rating,
        website: item.website,
      }));

      return res.status(200).json({ leads });
    }

    // 2. AI Message Action
    if (action === "aiMessage") {
      if (!business) {
        return res.status(400).json({ error: "Business details missing" });
      }

      const cleanSender = senderName ? senderName.trim() : "";
      const cleanAgency = agencyName ? agencyName.trim() : "";

      const formattedAgency = cleanAgency
        ? cleanAgency.toLowerCase().includes("agency")
          ? cleanAgency
          : `${cleanAgency} Agency`
        : "";

      const prompt = `
Target Business Name: ${business.name || "there"}
Sender Name: ${cleanSender || "a Growth Specialist"}
Sender Agency: ${formattedAgency}

Task:
Write a personalized, professional WhatsApp outreach message.

Format Rules:
1. ALWAYS start with exact greeting: "Hi ${business.name || "there"}, I'm ${cleanSender || "a growth specialist"}${formattedAgency ? ` from ${formattedAgency}` : ""}."
2. Keep the message under 60 words.
3. Offer digital marketing/booking boost services concisely.
4. End with a friendly call-to-action (e.g., "When can we chat?").
5. Do NOT add extra "the" or duplicate words.
`;

      const groqRes = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.1-8b-instant",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.5,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY ? process.env.GROQ_API_KEY.trim() : ""}`,
            "Content-Type": "application/json",
          },
        }
      );

      const messageText = groqRes.data.choices[0].message.content;
      return res.status(200).json({ message: messageText });
    }

    return res.status(400).json({ error: "Invalid action" });

  } catch (err) {
    console.error("API Error:", err.response?.data || err.message);
    return res.status(500).json({ error: err.message || "Server Error" });
  }
}
