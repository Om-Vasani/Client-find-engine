import axios from "axios";

export const config = {
  maxDuration: 30,
};

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      return res.status(200).json({
        status: "API is running",
        supportedActions: ["scrape", "aiMessage", "send"],
      });
    }

    if (req.method === "POST") {
      const { action, city, category, business, phone, message } = req.body;

      // -------------------------
      // 1) GOOGLE MAPS SCRAPER
      // -------------------------
      if (action === "scrape") {
        if (!category || !city) {
          return res.status(400).json({ error: "Category and city are required" });
        }

        const q = `${category} in ${city}`;
        const url = `https://serpapi.com/search.json?engine=google_maps&q=${encodeURIComponent(
          q
        )}&api_key=${process.env.SERPAPI_API_KEY}`;

        const response = await axios.get(url);
        const results = response.data.local_results || [];

        const leads = results.map((b) => ({
          name: b.title || "",
          rating: b.rating || "N/A",
          address: b.address || "",
          phone: b.phone || "",
          website: b.website || "",
        }));

        return res.status(200).json({ leads });
      }

      // -------------------------
      // 2) AI MESSAGE GENERATION (GROQ)
      // -------------------------
      if (action === "aiMessage") {
        if (!business) {
          return res.status(400).json({ error: "Business details missing" });
        }

          // Request body માંથી યુઝરની ડાયનેમિક ડિટેલ્સ મેળવો
           const { senderName, agencyName } = req.body;

  const prompt = `
Business Info:
Name: ${business.name || "N/A"}
Address: ${business.address || "N/A"}
Rating: ${business.rating || "N/A"}

Sender Info:
Agency Name: ${agencyName || "our agency"}
Sender Name: ${senderName || "there"}

Write a short, direct WhatsApp outreach message in under 70 words without placeholders. Do not use generic bracket texts like [Your Name] or [Your Agency]. Use the Sender Info provided above directly in the text. Include a simple Call to Action.
`;

        let messageText = "";

        try {
          if (!process.env.GROQ_API_KEY) throw new Error("GROQ_API_KEY missing");

          // Groq API Call (Llama 3 Model)
          const groqRes = await axios.post(
            "https://api.groq.com/openai/v1/chat/completions",
            {
              model: "openai/gpt-oss-120b",
              messages: [{ role: "user", content: prompt }],
            },
            {
              headers: {
                Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
                "Content-Type": "application/json",
              },
            }
          );

          messageText = groqRes.data.choices[0].message.content;
        } catch (err) {
          console.error("Groq Error:", err.response?.data || err.message);
          return res.status(500).json({
            error: "Groq AI failed to generate response",
            details: err.response?.data || err.message,
          });
        }

        return res.status(200).json({ message: messageText });
      }
