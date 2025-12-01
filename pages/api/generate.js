// pages/api/generate.js (FINAL NO CSV/NO MONGO - File System Storage)
import { 
    readLogs, writeLogs, 
    readIncome, writeIncome, 
    ensureFiles 
} from '../lib/db'; 
import { generateAIContent } from '../lib/ai'; 

// Constants
const FOLLOWUP_INTERVALS = [1 * 60 * 60 * 1000, 6 * 60 * 60 * 1000, 24 * 60 * 60 * 1000];
// Ensure PRICE_PER_LEAD is set in Vercel or defaults to 500
const PRICE_PER_LEAD = Number(process.env.PRICE_PER_LEAD || 500); 

// *** Hardcoded Mock Leads (CSV replacement) ***
const MOCK_LEADS = [
    { Name: "Ankit Shah", 'Role/Headline': "Founder & CEO", Company: "AI Launchpad", Profile_URL: "https://linkedin.com/in/ankit-shah", name: "Ankit Shah", role: "Founder & CEO", company: "AI Launchpad" },
    { Name: "Priya Patel", 'Role/Headline': "Director of Strategy", Company: "Digital Grow", Profile_URL: "https://linkedin.com/in/priya-patel", name: "Priya Patel", role: "Director of Strategy", company: "Digital Grow" },
    { Name: "Rajesh Kumar", 'Role/Headline': "Head of Operations", Company: "Tech Solutions", Profile_URL: "https://linkedin.com/in/rajesh-kumar", name: "Rajesh Kumar", role: "Head of Operations", company: "Tech Solutions" },
];

function readMockLeads() {
    return MOCK_LEADS;
}
// ********************************************

export default async function handler(req, res) {
    try {
        ensureFiles();
        let income = readIncome(); // Read and reset 'today' if needed
        
        // GET - status + income
        if (req.method === "GET") { 
            return res.json({ status: "LinkedIn AI Client Engine Running (File System)", version: "final-4.0-fs-no-csv", income }); 
        } 

        // POST - actions
        if (req.method === "POST") { 
            const { action, business, phone, message, amount } = req.body; 

            // 1) SCRAPE (Mock Leads)
            if (action === "scrape") { 
                const leads = readMockLeads();
                return res.json({ leads });
            } 

            // 2) AI MESSAGE generation (Message 1: Hook)
            if (action === "aiMessage") { 
                if (!business) return res.status(400).json({ error: "business required" }); 
                
                const prompt = `Write a short, HIGH-CONVERTING LinkedIn Connection Request Message (Hook - Message 1) to offer AI Automation solutions (₹50k-₹100k deals). Max 3 short sentences. Target: ${business.name}, ${business.role} at ${business.company}.`; 
                let generated = `Hey ${business.name}, I checked ${business.company}. I help founders increase revenue using AI Automation. Can I send a 2-minute free audit video?`; 
                try { 
                    generated = await generateAIContent(prompt); 
                } catch (e) { }
                const finalMessage = generated.includes(business.name) ? generated : `Hey ${business.name},\n${generated}`;
                return res.json({ message: finalMessage.trim() });
            }

            // 3) SEND message (Simulated LinkedIn Send) + log + income update
            if (action === "send") { 
                if (!phone || !message) return res.status(400).json({ error: "Profile URL and message required" }); 
                
                const logs = readLogs(); 
                const now = Date.now(); 
                const entry = { id: `log_${now}_${Math.floor(Math.random()*10000)}`, business: business, phone, initialMessage: message, createdAt: now, followUpCount: 0, nextFollowUpAt: now + FOLLOWUP_INTERVALS[0], followUpHistory: [], done: false }; 
                logs.push(entry); 
                writeLogs(logs); 
                
                // Income update per send
                income.today = (income.today || 0) + PRICE_PER_LEAD; 
                income.total = (income.total || 0) + PRICE_PER_LEAD; 
                income.wallet = (income.wallet || 0) + PRICE_PER_LEAD; 
                writeIncome(income); 
                
                return res.json({ status: "sent", log: entry, income }); 
            } 

            // 4) runFollowups (Message 2 & 3)
            if (action === "runFollowups") { 
                const logs = readLogs(); 
                const now = Date.now(); 
                const results = []; 

                for (let entry of logs) { 
                    if (entry.done || !entry.nextFollowUpAt || entry.nextFollowUpAt > now || entry.followUpCount >= FOLLOWUP_INTERVALS.length) continue; 
                    
                    let followupPrompt = '';
                    if (entry.followUpCount === 0) followupPrompt = `Write Message 2 (Value) for ${entry.business.name}. Ask for a 10-minute demo.`; 
                    else if (entry.followUpCount === 1) followupPrompt = `Write Message 3 (Closing). Solutions start from ₹50,000 – ₹1,00,000. Ask for onboarding.`;
                    else followupPrompt = `Write a final short, polite LinkedIn follow-up.`;
                    
                    let followupMsg = "Default Followup."; 
                    try { followupMsg = await generateAIContent(followupPrompt); } catch (e) { }

                    const newFollowUpCount = entry.followUpCount + 1;
                    entry.followUpHistory.push({ at: now, message: followupMsg }); 
                    entry.followUpCount = newFollowUpCount;
                    
                    if (newFollowUpCount < FOLLOWUP_INTERVALS.length) { 
                        entry.nextFollowUpAt = now + FOLLOWUP_INTERVALS[newFollowUpCount]; 
                    } else { 
                        entry.nextFollowUpAt = null; entry.done = true; 
                    } 
                    results.push({ id: entry.id, status: "followup_sent", followUpCount: entry.followUpCount }); 
                } 
                writeLogs(logs); 
                return res.json({ status: "followups_processed", results }); 
            } 

            // 7) CLOSE DEAL + Income Update (Manual closing)
            if (action === "closeDeal") {
                if (!amount || !business) return res.status(400).json({ error: "Amount and business required" });
                const finalAmount = Number(amount);
                
                const logs = readLogs();
                const updatedLogs = logs.map(l => (l.phone === business.Profile_URL ? { ...l, done: true, nextFollowUpAt: null } : l));
                updatedLogs.push({ id: `deal_${Date.now()}_${Math.floor(Math.random()*10000)}`, business: business, amount: finalAmount, type: "Deal Closed (Manual)", createdAt: Date.now(), done: true });
                writeLogs(updatedLogs);
                
                income.today = (income.today || 0) + finalAmount; 
                income.total = (income.total || 0) + finalAmount; 
                income.wallet = (income.wallet || 0) + finalAmount; 
                writeIncome(income);
                
                return res.json({ status: "closed", amount: finalAmount, income });
            }
            
            // 5) getLogs
            if (action === "getLogs") { return res.json({ logs: readLogs().reverse().slice(0, 30) }); }

            return res.status(400).json({ error: "Invalid action" }); 
        } 
        res.status(405).json({ error: "Method Not Allowed" }); 

    } catch (err) {
        console.error("API Error:", err);
        return res.status(500).json({ error: "Server Error", details: err.message || err.toString() });
    }
}
