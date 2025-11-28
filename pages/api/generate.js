// /pages/api/generate.js

import OpenAI from "openai";

export default async function handler(req, res) {
  if (req.method === "GET") {
    return res.status(200).json({
      status: "OK",
      message: "API Running Successfully. Use POST to generate AI message.",
      usage: "POST /api/generate with JSON body: { clientName, companyName, clientIssue }",
    });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  const { clientName, companyName, clientIssue } = req.body;

  if (!clientName || !companyName || !clientIssue) {
    return res.status(400).json({ error: "Missing required fields." });
  }

  try {
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const prompt = `You are an aggressive high-ticket sales closer.
Write a short cold email that forces the client to make a $3,000 advance payment today.

Client Name: ${clientName}
Company: ${companyName}
Main Problem: ${clientIssue}

Offer: 30-day AI Automation Setup with guaranteed 25% faster operations.

Write in a powerful, urgent, closing tone.`;

    const completion = await openai.responses.create({
      model: "gpt-4o-mini",
      input: prompt,
    });

    const text = completion.output[0].content[0].text;

    return res.status(200).json({
      success: true,
      messageContent: text,
    });

  } catch (err) {
    console.error("OpenAI Error:", err);
    return res.status(500).json({
      error: "AI Message Generation Failed. Check OPENAI_API_KEY.",
      details: err.message,
    });
  }
      }
