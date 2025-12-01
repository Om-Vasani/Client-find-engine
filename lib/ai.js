// lib/ai.js
import fetch from "node-fetch";

const OPENAI_KEY = process.env.OPENAI_API_KEY;

export async function generateAIContent(prompt) {
  if (!OPENAI_KEY) throw new Error("Missing OPENAI_API_KEY environment variable");

  const body = {
    model: "gpt-4o-mini", // adjust if needed
    messages: [{ role: "user", content: prompt }],
    max_tokens: 250,
    temperature: 0.6,
  };

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI error: ${res.status} ${text}`);
  }

  const data = await res.json();
  const message = data?.choices?.[0]?.message?.content;
  return (message || "").trim();
}
