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
}    // *** OpenAI API Call Method ***
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo", // અથવા "gpt-4" વાપરી શકાય
      messages: [
        { role: "user", content: prompt }, // Prompt ને user message તરીકે મોકલો
      ],
      temperature: 0.7, // સૃજનાત્મકતા (Creativity) માટે
    });

    const messageContent = completion.choices[0].message.content;

    res.status(200).json({
      success: true,
      client: companyName,
      messageContent: messageContent,
      note: promptData.note,
    });
  } catch (error) {
    console.error("OpenAI API Error:", error);
    // *** ભૂલને અહીં બદલવી ***
    res.status(500).json({
      error: "OpenAI API call failed. Check your Vercel OPENAI_API_KEY setting.",
    });
  }
}

// Prompt function remains the same
function createPrompt(name, company, issue) {
//... (Same logic as your original function)
  return `
You are an extremely successful high-ticket sales consultant.
Your goal is to help a client who urgently needs to secure a $3,000 USD advance TODAY.

Draft a highly personalized, direct, and urgent cold email targeting this specific client:

Client Name: ${name}
Company: ${company}
Observed Pain Point: ${issue}
Your High-Value Service: ${SERVICE_OFFER}

The email must be brief, aggressive, strong CTA, and clearly state the immediate solution and the need for immediate action to secure the slot today.
`;
}
