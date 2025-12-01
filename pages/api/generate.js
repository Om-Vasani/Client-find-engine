// pages/api/generate.js (LinkedIn System Updated)
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import csv from 'csv-parser'; // CSV ફાઇલ વાંચવા માટે નવી લાઇબ્રેરી ઉમેરો
import { Writable } from 'stream'; // CSV રીડર માટે

const LOG_DIR = path.join(process.cwd(), "data");
const LOG_FILE = path.join(LOG_DIR, "sends_logs.json");
const INCOME_FILE = path.join(LOG_DIR, "income.json");

// અહીં Scraper નો આઉટપુટ ફાઇલ નામ સેટ કરો
const LINKEDIN_LEADS_FILE = path.join(process.cwd(), 'LinkedIn_Leads_Today_Income.csv'); 

function ensureFiles() {
// ... (આ ફંક્શન યથાવત રાખો) ...
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
if (!fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, "[]");
if (!fs.existsSync(INCOME_FILE)) fs.writeFileSync(INCOME_FILE, JSON.stringify({
today: 0,
total: 0,
wallet: 0,
lastResetDate: new Date().toISOString().slice(0,10)
}, null, 2));
}
// ... (બાકીના readLogs, writeLogs, readIncome, writeIncome ફંક્શન્સ યથાવત રાખો) ...

// Followup intervals ms: 1 hour, 6 hours, 24 hours
const FOLLOWUP_INTERVALS = [1 * 60 * 60 * 1000, 6 * 60 * 60 * 1000, 24 * 60 * 60 * 1000];


// *** નવું CSV રીડિંગ ફંક્શન ***
function readLinkedInLeads() {
    return new Promise((resolve, reject) => {
        const results = [];
        if (!fs.existsSync(LINKEDIN_LEADS_FILE)) {
            console.warn("LinkedIn CSV file not found:", LINKEDIN_LEADS_FILE);
            return resolve([]);
        }
        
        fs.createReadStream(LINKEDIN_LEADS_FILE)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => {
                // દરેક લીડને UID આપો
                const leads = results.map((lead, index) => ({
                    ...lead,
                    id: `li_${index}_${Date.now()}`,
                    name: lead.Name || lead['Name'] || 'N/A',
                    role: lead['Role/Headline'] || 'N/A',
                    phone: lead.Profile_URL || 'N/A' // ફોન નંબરને બદલે પ્રોફાઇલ URL નો ઉપયોગ કરો
                }));
                resolve(leads);
            })
            .on('error', reject);
    });
}
// *******************************


export default async function handler(req, res) {
try {
    ensureFiles();

    // GET - status + income
    if (req.method === "GET") { 
        const income = readIncome(); 
        return res.json({ status: "LinkedIn AI Client Engine Running", version: "final-1.1-linkedin", income }); 
    } 

    // POST - actions
    if (req.method === "POST") { 
        const { action, city, category, business, phone, message } = req.body; 

        // 1) SCRAPE (હવે CSV રીડિંગ)
        if (action === "scrape") { 
            // city અને category હવે UI માં ફિલ્ટરિંગ માટે ઉપયોગ કરી શકાય છે, પણ ડેટા CSV માંથી આવશે
            const leads = await readLinkedInLeads();
            return res.json({ leads: leads });
        } 

        // 2) AI MESSAGE generation (Gemini -> OpenAI)
        if (action === "aiMessage") { 
            if (!business) return res.status(400).json({ error: "business required" }); 
            
            // *** LinkedIn Hook (Message 1) માટે પ્રોમ્પ્ટ અપડેટ કરો ***
            const prompt = ` 
                Business Info:
                Name: ${business.name}
                Role/Headline: ${business.role || "Founder/CEO"}
                Industry: ${business.Industry || "N/A"}
                Location: ${business.Location || "World-wide"}

                Write a short, HIGH-CONVERTING LinkedIn Connection Request Message (Hook - Message 1) to offer:
                • AI Automation for revenue increase
                • Fast closing (5x faster than freelancing)
                
                The message must be friendly, professional, and end with the audit video CTA. 
                Keep max 3 short sentences. 
                Example: "Hey {name}, I checked {company_name}. I help founders increase revenue using AI Automation. Can I send a 2-minute free audit video?"
            `; 
            
            let generated = ""; 
            try { 
                // Gemini Logic (તમારા વર્તમાન કોડમાંથી)
                // ...
                if (process.env.GEMINI_API_KEY) { 
                    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); 
                    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 
                    const r = await model.generateContent(prompt); 
                    generated = (r?.response?.text && r.response.text()) || (r?.response?.content?.[0]?.text || ""); 
                } else { 
                    throw new Error("No Gemini key"); 
                } 
            } catch (e) { 
                // fallback OpenAI (તમારા વર્તમાન કોડમાંથી)
                const aiRes = await axios.post( 
                    "https://api.openai.com/v1/chat/completions", 
                    { model: "gpt-4o-mini", messages: [{ role: "user", content: prompt }] }, 
                    { headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` } }
                );
                generated = aiRes.data.choices[0].message.content;
            }
            return res.json({ message: (generated || "").trim() });
        }

        // 3) SEND message (WATI -> LinkedIn Messaging System)
        // નોંધ: WATI અહીં WhatsApp હતું. LinkedIn મેસેજિંગ માટે તમારે 
        // એક અલગ API (દા.ત., Phantombuster, અથવા કસ્ટમ બ્રાઉઝર ઓટોમેશન) વાપરવું પડશે.
        // આ કોડ હાલમાં માત્ર લોગિંગ અને ઇન્કમને અપડેટ કરે છે.
        if (action === "send") { 
            if (!phone || !message) return res.status(400).json({ error: "Profile URL and message required" }); 
            
            // ... (અહીં LinkedIn મેસેજ મોકલવાનો લોજિક આવશે, જે WATI જેવો નથી) ...
            
            // હાલ પૂરતું Simulated Send રાખો
            let sendResp = { simulated: true, data: { info: "Simulated LinkedIn send - API not integrated" } };
            
            // ... (બાકીનું લોગ અપડેટ અને ઇન્કમ અપડેટ લોજિક યથાવત રાખો) ...
            // income update per send (configurable)
            const PRICE_PER_LEAD = Number(process.env.PRICE_PER_LEAD || 500); // LinkedIn લીડ્સ મોંઘા હોય છે
            const income = readIncome(); 
            income.today = (income.today || 0) + PRICE_PER_LEAD; 
            income.total = (income.total || 0) + PRICE_PER_LEAD; 
            income.wallet = (income.wallet || 0) + PRICE_PER_LEAD; 
            writeIncome(income); 
            
            return res.json({ status: "sent", log: entry, income }); 
        } 
        
        // 4) runFollowups - process due followups (Call/Manual followups)
        // Message 3 (Closing) માટેનો લોજિક અહીં ચાલુ રહેશે, પણ હવે તે LinkedIn મેસેજિંગ પર ફોકસ કરશે.
        if (action === "runFollowups") { 
            const logs = readLogs(); 
            const now = Date.now(); 
            const results = []; 
            for (let entry of logs) { 
                // ... (બાકીનો લોજિક) ...
                if (entry.followUpCount === 2) { 
                    // *** Message 3 - Closing Hook ***
                    followupPrompt = ` 
                        Business Info: Name: ${entry.business?.name || "Founder"}
                        Write a final, direct closing LinkedIn message. State the solution starts from ₹50,000 - ₹1,00,000. Ask: "Shall we start onboarding or would you like to see a demo?" Max 2 short sentences.
                    `;
                    followupMsg = "Our solutions start from ₹50,000 – ₹1,00,000. Shall we start onboarding?";
                    // ... (AI દ્વારા જનરેટ કરાવવાનો લોજિક) ...
                }
                
                // ... (મેસેજ મોકલવાનો અને લોગ કરવાનો બાકીનો લોજિક) ...
            } 
            writeLogs(logs); 
            return res.json({ status: "followups_processed", results }); 
        } 
        
        // ... (getLogs અને income status - યથાવત) ...

        // 7) CLOSE DEAL + Income Update (Manual closing)
        if (action === "closeDeal") {
            const { amount, business } = req.body;
            // ... (ડીલ ક્લોઝનો લોજિક યથાવત રાખો) ...
            // આ તમારો સૌથી મહત્વનો મેન્યુઅલ સ્ટેપ છે (Step 4: Manual Call Closing)
        }
        
        return res.status(400).json({ error: "Invalid action" }); 
    } 
    res.status(405).json({ error: "Method Not Allowed" }); 

} catch (err) {
    return res.status(500).json({ error: "Server Error", details: err.message || err.toString() });
}
}
eturn res.status(400).json({ error: "Invalid action" });
    }

    res.status(405).json({ error: "Method Not Allowed" });
  } catch (err) {
    return res.status(500).json({ error: "Server Error", details: err.message || err.toString() });
  }
        }
