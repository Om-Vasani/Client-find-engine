// /pages/api/generate.js

import { GoogleGenerativeAI } from "@google/generative-ai";

// Load Gemini API Key from environment variable
const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

// Your high-ticket service offer
const SERVICE_OFFER =
  "30-day AI Automation Setup to cut operational costs and guarantee 25% faster lead response time. Advance Fee: $3,000 USD.";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  const { clientName, companyName, clientIssue } = req.body;

  // If input missing → use default test data (only for testing)
  if (!clientName || !companyName || !clientIssue) {
    const testData = {
      clientName: "Test Client",
      companyName: "Test Company",
      clientIssue: "High costs due to manual data entry.",
    };

    const prompt = createPrompt(
      testData.clientName,
      testData.companyName,
      testData.clientIssue
    );

    try {
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
      });

      return res.status(200).json({
        success: true,
        messageContent: response.text,
        note: "Using default test data as input was missing.",
      });
    } catch (error) {
      console.error("Gemini API Error:", error);
      return res.status(500).json({
        error:
          "Gemini API call failed. Check your Vercel GEMINI_API_KEY setting.",
      });
    }
  }

  // If all inputs exist → generate real prompt
  const prompt = createPrompt(clientName, companyName, clientIssue);

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    res.status(200).json({
      success: true,
      client: companyName,
      messageContent: response.text,
    });
  } catch (error) {
    console.error("Gemini API Error:", error);
    res.status(500).json({
      error: "Gemini API call failed. Check your Vercel GEMINI_API_KEY setting.",
    });
  }
}

function createPrompt(name, company, issue) {
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
