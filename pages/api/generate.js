// /pages/api/generate.js

import { OpenAI } from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const SERVICE_OFFER =
  "30-day AI Automation Setup to reduce workload, speed up operations, and guarantee 25% faster lead response time. Advance Fee: $3,000 USD.";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { clientName, companyName, clientIssue } = req.body;

  if (!clientName || !companyName || !clientIssue) {
    return res.status(400).json({
      error: "Missing required fields.",
    });
  }

  const prompt = `
You are an expert high-ticket sales closer.

Write a short, personalized, urgent cold email that closes a $3,000 advance payment today.

Client Name: ${clientName}
Company: ${companyName}
Main Problem: ${clientIssue}

Offer: ${SERVICE_OFFER}

Write the email in professional, persuasive tone with urgency.
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    });

    return res.status(200).json({
      success: true,
      messageContent: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error("OpenAI Error:", error);
    return res.status(500).json({
      error:
        "AI Message Generation Failed. Check OPENAI_API_KEY in environment variables.",
    });
  }
}
