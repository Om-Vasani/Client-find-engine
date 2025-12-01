// lib/ai.js (OpenAI Integration)
import axios from "axios";

export async function generateAIContent(prompt) {
    if (!process.env.OPENAI_API_KEY) {
        throw new Error("OPENAI_API_KEY is not set in Vercel environment variables.");
    }
    // ... (બાકીનું OpenAI API કૉલ લોજિક યથાવત) ...
    try {
        const aiRes = await axios.post(
            "https://api.openai.com/v1/chat/completions",
            {
                model: "gpt-4o-mini", // Fast and Cost-effective
                messages: [{ role: "user", content: prompt }],
                max_tokens: 200, 
                temperature: 0.7, 
            },
            {
                headers: { 
                    'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
                    'Content-Type': 'application/json'
                }
            }
        );
        return aiRes.data.choices[0].message.content.trim();
    } catch (error) {
        console.error("OpenAI API Error:", error.response?.data || error.message);
        throw new Error("AI Content Generation Failed. Using default fallback.");
    }
}
