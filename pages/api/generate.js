// /pages/api/generate.js

import OpenAI from "openai";

const SERVICE_OFFER =
  "30-day AI Automation Setup to reduce workload, speed up operations, and guarantee 25% faster lead response time. Advance Fee: $3,000 USD.";

export default async function handler(req, res) {
  // --- Allow GET request for browser testing ---
  if (req.method === "GET") {
    return res.status(200).json({
      status: "OK",
      message: "API Running Successfully. Use POST to generate AI message.",
      usage: "POST /api/generate with JSON body: { clientName, companyName, clientIssue }",
    });
  }

  // --- Block other methods ---
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  // --- POST Body Validate ---
  const { clientName, companyName, clientIssue } = req.body;

  if (!clientName || !companyName || !clientIssue) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
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

Write the email in a powerful, persuasive, urgent closing tone.
`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // or gpt-3.5-turbo
      messages: [
        { role: "system", content: "You are an aggressive high-ticket sales closer." },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 250,
    });

    return res.status(200).json({
      success: true,
      messageContent: completion.choices[0].message.content,
    });

  } catch (error) {
    console.error("OpenAI Error:", error);
    return res.status(500).json({
      error: "AI Message Generation Failed. Check OPENAI_API_KEY.",
      details: error.message,
    });
  }
      }
