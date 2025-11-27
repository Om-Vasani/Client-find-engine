// /pages/api/generate.js

import OpenAI from "openai";

const SERVICE_OFFER =
  "30-day AI Automation Setup to reduce workload, speed up operations, and guarantee 25% faster lead response time. Advance Fee: $3,000 USD.";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { clientName, companyName, clientIssue } = req.body;

  if (!clientName || !companyName || !clientIssue) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const prompt = `
You are an aggressive high-ticket sales closer.

Write a short, personalized, urgent cold email that closes a $3,000 advance payment today.

Client Name: ${clientName}
Company: ${companyName}
Main Problem: ${clientIssue}

Offer: ${SERVICE_OFFER}

Write the email in professional, persuasive tone with urgency.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // You can switch to "gpt-3.5-turbo" if needed
      messages: [
        { role: "system", content: "You are an aggressive high-ticket sales closer." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 250,
      top_p: 0.9,
    });

    const aiMessage = completion.choices[0].message.content;

    return res.status(200).json({
      success: true,
      messageContent: aiMessage,
    });
  } catch (error) {
    console.error("OpenAI Error:", error);
    return res.status(500).json({
      error: "AI Message Generation Failed. Check OPENAI_API_KEY in environment variables.",
      details: error.message,
    });
  }
}
