# 🚀 Client Find Engine — AI Powered Lead Finder + WhatsApp Outreach  
Built with **Next.js 14**, **Gemini AI**, **OpenAI**, **SerpAPI**, and **WATI WhatsApp API**

This tool allows you to:

✅ Find real business leads from Google Maps  
✅ Auto-generate high-converting outreach messages  
✅ Auto-send messages to WhatsApp  
✅ Run everything inside **2 files only**  
- /pages/api/generate.js → Backend  
- /pages/index.js → Frontend UI  

Fully deployable on **Vercel**.

---

## 📁 Project Structure

client-find-engine  
│  
├── pages/  
│   ├── api/  
│   │   └── generate.js        ← backend (scraper + AI + WhatsApp)  
│   └── index.js               ← frontend UI  
│  
├── package.json  
├── next.config.js  
├── .env.local (create manually)  
└── README.md  

---

## 🧠 Features

### 🔍 Lead Finder  
- Scrapes Google Maps via SERPAPI  
- Extracts business name, address, rating, phone, website  

### 🤖 AI Message Generator  
Uses **Gemini 1.5** (fallback → OpenAI GPT-4o-mini)

### 📲 WhatsApp Sender  
Sends messages to any number via **WATI API**

---

## 🔧 Environment Variables

Create `.env.local`:
