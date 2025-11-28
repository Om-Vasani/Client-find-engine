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

    const prompt = `
Write a short aggressive high-ticket email.

Client: ${clientName}
Company: ${companyName}
Problem: ${clientIssue}

Offer: 30-day AI automation setup. $3000 advance.
`;

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
