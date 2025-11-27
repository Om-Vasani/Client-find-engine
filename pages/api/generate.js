// /pages/api/generate-openai.js

import { OpenAI } from "openai";

// Load OpenAI API Key from environment variable
// *** તમારે Vercel માં OPENAI_API_KEY સેટ કરવી પડશે ***
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY }); 

// Your high-ticket service offer
const SERVICE_OFFER =
  "30-day AI Automation Setup to cut operational costs and guarantee 25% faster lead response time. Advance Fee: $3,000 USD.";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { clientName, companyName, clientIssue } = req.body;

  // Input missing logic remains the same...
  const promptData = (!clientName || !companyName || !clientIssue)
    ? {
        clientName: "Test Client",
        companyName: "Test Company",
        clientIssue: "High costs due to manual data entry.",
        note: "Using default test data as input was missing.",
      }
    : { clientName, companyName, clientIssue, note: null };

  const prompt = createPrompt(
    promptData.clientName,
    promptData.companyName,
    promptData.clientIssue
  );

  try {
    // *** OpenAI API Call Method ***
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
