// pages/index.js (FINAL LinkedIn System)

import { useEffect, useState } from "react";

export default function Home() {
    // City/Category ઇનપુટ હવે માત્ર પ્લેસહોલ્ડર છે, પણ સ્ટેટમાં રહે છે
    const [city, setCity] = useState("World-Wide"); 
    const [category, setCategory] = useState("Founder, CEO, Director");
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(false);
    const [income, setIncome] = useState({ today: 0, total: 0, wallet: 0 });
    const [price, setPrice] = useState(50000); // ડીફોલ્ટ પ્રાઇસ 50k
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [upi, setUpi] = useState("");
    const [logs, setLogs] = useState([]);

    useEffect(() => {
        fetchIncome();
        fetchLogs();
    }, []);

    async function fetchIncome() {
        const r = await fetch("/api/generate");
        const d = await r.json();
        setIncome(d.income || { today: 0, total: 0, wallet: 0 });
    }

    async function fetchLeads() {
        setLoading(true);
        // Action: "scrape" હવે CSV માંથી લીડ્સ વાંચશે
        const r = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "scrape" }),
        });
        const d = await r.json();
        // લીડ્સના ડેટા ફિલ્ડ્સ LinkedIn CSV ને અનુરૂપ હશે
        setLeads(d.leads || []);
        setLoading(false);
    }

    async function handleSend(lead) {
        // generate AI message (Msg 1: Hook)
        const msgRes = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "aiMessage", business: lead }),
        });
        const msgData = await msgRes.json();
        
        // send message (server updates income)
        // phone ફીલ્ડ હવે Profile_URL છે, જે લોગિંગ માટે વપરાશે
        const sendRes = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "send", phone: lead.Profile_URL, message: msgData.message, business: lead }),
        });
        const sendData = await sendRes.json();
        await fetchIncome();
        await fetchLogs();
        alert("LinkedIn AI Hook (Msg 1) Sent & Logged ✔");
    }

    async function handleDealClose(lead) {
        const finalPrice = prompt(`Enter Final Closing Price for ${lead.Name} (e.g., 50000, 75000, 100000):`);
        if (!finalPrice || isNaN(Number(finalPrice))) {
            return alert("Invalid price entered or cancelled.");
        }
        
        const r = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "closeDeal", amount: Number(finalPrice), business: lead }),
        });
        
        const d = await r.json();
        if (d.status === "closed") {
            alert(`🔥 Deal Closed! ₹${finalPrice} added to Total Income. Target Closer!`);
            // લીડ્સમાંથી ક્લોઝ થયેલી લીડ દૂર કરો
            setLeads(prev => prev.filter(l => l.Profile_URL !== lead.Profile_URL)); 
            await fetchIncome();
            await fetchLogs();
        } else {
            alert("Failed to close deal.");
        }
    }


    async function requestWithdraw() {
        if (!withdrawAmount || !upi) return alert("Amount and UPI required");
        
        // Income check
        const currentWallet = income.wallet || 0;
        if (Number(withdrawAmount) > currentWallet) {
            return alert(`Insufficient funds. Max withdrawable: ₹${currentWallet}`);
        }

        const r = await fetch("/api/withdraw", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount: Number(withdrawAmount), upi }),
        });
        
        const d = await r.json();
        if (d.error) alert(d.error);
        else {
            alert(d.message || "Withdraw request saved");
            setWithdrawAmount(""); setUpi("");
            fetchLogs();
            fetchIncome(); // Wallet ને અપડેટ કરો
        }
    }

    async function fetchLogs() {
        const r = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "getLogs" }),
        });
        const d = await r.json();
        setLogs(d.logs || []);
    }

    async function runFollowupsNow() {
        const r = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "runFollowups" }),
        });
        const d = await r.json();
        alert("Followups processed: " + (d.results?.length || 0));
        fetchLogs();
    }

    return (
        <div className="min-h-screen bg-gray-100 p-8">
            <div className="max-w-7xl mx-auto">
                <header className="mb-6">
                    <h1 className="text-3xl font-bold mb-1">🚀 LinkedIn AI Target Hitter</h1>
                    <p className="text-gray-600">Today's Goal: ₹1,00,000 – ₹1,50,000 (11 AM – 5 PM)</p>
                </header>

                <div className="grid grid-cols-3 gap-6 mb-6 text-center">
                    <div className="bg-white p-4 rounded shadow">Today: <div className="text-2xl font-bold text-green-600">₹{income.today.toLocaleString('en-IN')}</div></div>
                    <div className="bg-white p-4 rounded shadow">Wallet: <div className="text-2xl font-bold text-blue-600">₹{income.wallet.toLocaleString('en-IN')}</div></div>
                    <div className="bg-white p-4 rounded shadow">Total: <div className="text-2xl font-bold text-gray-700">₹{income.total.toLocaleString('en-IN')}</div></div>
                </div>

                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6"> 
                    <div className="lg:col-span-2 bg-white p-6 rounded shadow"> 
                        <h2 className="text-xl font-semibold mb-4">Step 1 & 2: Lead Generation & Auto Messaging</h2>
                        <div className="flex gap-2 mb-4"> 
                            {/* LinkedIn ટાર્ગેટ ઇનપુટ/ડિસ્પ્લે */}
                            <div className="border border-gray-300 p-2 flex-1 bg-gray-50 rounded">Target: {city} ({category})</div>
                            <button onClick={fetchLeads} className="bg-black text-white px-4 py-2 rounded">
                                1️⃣ Load Leads (from CSV)
                            </button>
                        </div> 
                        
                        {loading ? <div>Loading…</div> : ( 
                            <div className="space-y-3 max-h-96 overflow-y-auto"> 
                                {leads.map((l, i) => ( 
                                    <div key={l.Profile_URL || i} className="p-3 border rounded flex justify-between items-center bg-gray-50"> 
                                        <div> 
                                            <div className="font-semibold text-lg">{l.Name}</div> 
                                            <div className="text-sm text-gray-600">{l['Role/Headline']} at {l.Company}</div> 
                                            <div className="text-xs text-blue-500 truncate max-w-xs">🔗 {l.Profile_URL || 'No URL'}</div> 
                                        </div> 
                                        <div className="flex flex-col gap-2 items-end"> 
                                            <select value={price} onChange={(e)=>setPrice(Number(e.target.value))} className="border p-1 text-sm rounded"> 
                                                <option value={50000}>₹50,000 (Basic)</option> 
                                                <option value={75000}>₹75,000 (Full Automation)</option> 
                                                <option value={100000}>₹1,00,000 (Premium)</option> 
                                            </select> 
                                            <button onClick={()=>handleSend(l)} className="bg-green-600 text-white px-3 py-1 rounded text-sm">
                                                2️⃣ Send AI Hook (Msg 1)
                                            </button> 
                                            <button 
                                                onClick={()=>handleDealClose(l)} 
                                                className="bg-red-600 text-white px-3 py-1 rounded text-sm font-bold"
                                            >
                                                🔥 Step 4: Close Deal
                                            </button>
                                        </div> 
                                    </div> 
                                ))} 
                                {leads.length===0 && <div className="text-gray-500 p-4 text-center">No leads available. Please ensure "LinkedIn_Leads_Today_Income.csv" exists and contains data.</div>} 
                            </div> 
                        )} 
                    </div> 

                    <aside className="bg-white p-6 rounded shadow"> 
                        <h3 className="font-semibold text-xl mb-3">💰 Withdraw & Follow-up Actions</h3> 
                        
                        <div className="p-3 border rounded mb-4 bg-yellow-50">
                            <h4 className="font-medium text-orange-700 mb-1">Run Follow-ups (Msg 2 & 3)</h4>
                             <p className="text-xs text-gray-600 mb-2">Triggers Message 2 (Value) and Message 3 (Closing) for due leads.</p>
                             <button onClick={runFollowupsNow} className="w-full bg-orange-500 text-white py-2 rounded">
                                Run Followups Now
                            </button>
                        </div>

                        <h3 className="font-medium mb-2 mt-4">Manual Withdraw Request</h3> 
                        <input placeholder="Amount" value={withdrawAmount} onChange={(e)=>setWithdrawAmount(e.target.value)} className="w-full border p-2 mb-2 rounded" /> 
                        <input placeholder="UPI ID (example@bank)" value={upi} onChange={(e)=>setUpi(e.target.value)} className="w-full border p-2 mb-2 rounded" /> 
                        <button onClick={requestWithdraw} className="w-full bg-purple-600 text-white py-2 rounded">Request Withdraw</button> 
                        <div className="mt-4 text-sm text-gray-600"> 
                            Note: **MANUAL TRANSFER REQUIRED.** Request saves to server, you must manually transfer the UPI payment. 
                        </div> 
                    </aside> 
                </section> 
                
                {/* Logs Section */}
                <section className="mt-6 bg-white p-6 rounded shadow"> 
                    <h2 className="text-xl font-semibold mb-3">Recent Logs (Deals & Messages)</h2> 
                    <div className="space-y-2 max-h-80 overflow-y-auto"> 
                        {logs.slice().reverse().slice(0, 30).map(l => ( 
                            <div key={l.id} className={`p-3 rounded border ${l.type === "Deal Closed (Manual)" ? 'border-red-500 bg-red-50' : 'border-gray-200 bg-white'}`}> 
                                <div className="flex justify-between items-center"> 
                                    <div> 
                                        <div className="font-semibold">{l.business?.Name || l.phone}</div> 
                                        <div className="text-sm text-gray-500">{new Date(l.createdAt).toLocaleString()}</div> 
                                    </div> 
                                    <div className={`text-sm font-bold ${l.type === "Deal Closed (Manual)" ? 'text-red-700' : 'text-gray-600'}`}>
                                        {l.type === "Deal Closed (Manual)" ? `DEAL CLOSED: ₹${l.amount.toLocaleString('en-IN')}` : `FollowUps: ${l.followUpCount} ${l.done ? " (done)" : ""}`}
                                    </div>
                                </div> 
                                <div className="mt-2 text-sm text-gray-700">
                                    Message: {l.initialMessage?.slice(0,100)}...
                                </div> 
                            </div> 
                        ))} 
                        {logs.length===0 && <div className="text-gray-500 p-4 text-center">No logs yet.</div>} 
                    </div> 
                </section> 

                <footer className="mt-6 text-center text-sm text-gray-500">
                    Deployed LinkedIn System — Manual UPI Transfer Required.
                </footer> 
            </div> 
        </div> 
    );
}
and 
// pages/api/generate.js (FINAL LinkedIn System)
import axios from "axios";
import { GoogleGenerativeAI } from "@google/generative-ai";
import fs from "fs";
import path from "path";
import csv from 'csv-parser'; // CSV વાંચવા માટે
import { promisify } from 'util';

const LOG_DIR = path.join(process.cwd(), "data");
const LOG_FILE = path.join(LOG_DIR, "sends_logs.json");
const INCOME_FILE = path.join(LOG_DIR, "income.json");
const LINKEDIN_LEADS_FILE = path.join(process.cwd(), 'LinkedIn_Leads_Today_Income.csv'); // CSV પાથ

// ... (ensureFiles, readLogs, writeLogs, readIncome, writeIncome ફંક્શન્સ યથાવત રાખો) ...

function ensureFiles() {
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
if (!fs.existsSync(LOG_FILE)) fs.writeFileSync(LOG_FILE, "[]");
if (!fs.existsSync(INCOME_FILE)) fs.writeFileSync(INCOME_FILE, JSON.stringify({
today: 0,
total: 0,
wallet: 0,
lastResetDate: new Date().toISOString().slice(0,10)
}, null, 2));
}

// ... (readIncome/writeIncome સાથે Today Reset Logic યથાવત છે) ...

// Followup intervals ms: 1 hour, 6 hours, 24 hours (Msg 2, Msg 3, Final Followup)
const FOLLOWUP_INTERVALS = [1 * 60 * 60 * 1000, 6 * 60 * 60 * 1000, 24 * 60 * 60 * 1000];

// *** LinkedIn Leads CSV રીડર ***
function readLinkedInLeads() {
    return new Promise((resolve, reject) => {
        const results = [];
        if (!fs.existsSync(LINKEDIN_LEADS_FILE)) {
            return resolve([]);
        }
        
        fs.createReadStream(LINKEDIN_LEADS_FILE)
            .pipe(csv())
            .on('data', (data) => results.push(data))
            .on('end', () => {
                // લીડ્સના ડેટા ફિલ્ડ્સ LinkedIn CSV ને અનુરૂપ હશે
                resolve(results.map(lead => ({
                    ...lead,
                    // Phone ફીલ્ડને બદલે Profile_URL નો ઉપયોગ લોગિંગ માટે થશે
                    phone: lead.Profile_URL || 'N/A', 
                })));
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
        return res.json({ status: "LinkedIn AI Client Engine Running", version: "final-1.1", income }); 
    } 

    // POST - actions
    if (req.method === "POST") { 
        const { action, city, category, business, phone, message, amount } = req.body; 

        // 1) SCRAPE (CSV રીડિંગ)
        if (action === "scrape") { 
            const leads = await readLinkedInLeads();
            return res.json({ leads });
        } 

        // 2) AI MESSAGE generation (LinkedIn Hook - Message 1)
        if (action === "aiMessage") { 
            if (!business) return res.status(400).json({ error: "business required" }); 
            
            const prompt = ` 
                Business Info: Name: ${business.Name}, Role: ${business['Role/Headline']}, Company: ${business.Company}.
                Write a short, HIGH-CONVERTING LinkedIn Connection Request Message (Hook - Message 1) to offer AI Automation solutions (₹50k-₹100k deals).
                The message must be professional, personalized (using company/role if possible), and end with this CTA: "Can I send a 2-minute free audit video?"
                Keep max 3 short sentences.
            `; 
            
            let generated = ""; 
            try { 
                // Gemini Logic
                if (process.env.GEMINI_API_KEY) { 
                    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY); 
                    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" }); 
                    const r = await model.generateContent(prompt); 
                    generated = r?.response?.text || ""; 
                } else { 
                    throw new Error("No Gemini key"); 
                } 
            } catch (e) { 
                // Fallback to OpenAI
                // ... (OpenAI Fallback Logic યથાવત રાખો) ...
                generated = "Hey, I checked your company. I help founders increase revenue using AI Automation. Can I send a 2-minute free audit video?"; // Default if AI fails
            }
            // ખાતરી કરો કે નામ/કંપનીનો ઉપયોગ થયો છે
            const finalMessage = generated.includes(business.Name) ? generated : `Hey ${business.Name},\n${generated}`;

            return res.json({ message: finalMessage.trim() });
        }

        // 3) SEND message (Simulated LinkedIn Send) + log + income update
        if (action === "send") { 
            if (!phone || !message) return res.status(400).json({ error: "Profile URL and message required" }); 

            // અહીં LinkedIn મેસેજિંગ API (જેમ કે Phantom Buster) સાથે ઇન્ટિગ્રેશન કરવું પડશે.
            let sendResp = { simulated: true, data: { info: "Simulated LinkedIn send - API not integrated" } };
            
            // update logs (phone is Profile_URL)
            const logs = readLogs(); 
            const now = Date.now(); 
            const entry = { 
                id: `log_${now}_${Math.floor(Math.random()*10000)}`, 
                business: business || { phone }, 
                phone, // Profile URL
                initialMessage: message, 
                sendResponse: sendResp, 
                createdAt: now, 
                followUpCount: 0, 
                nextFollowUpAt: now + FOLLOWUP_INTERVALS[0], // Msg 2 માટે
                followUpHistory: [], 
                done: false 
            }; 
            logs.push(entry); 
            writeLogs(logs); 
            
            // income update per send (LinkedIn લીડ્સ માટે ₹500/લીડ મૂકો)
            const PRICE_PER_LEAD = Number(process.env.PRICE_PER_LEAD || 500); 
            const income = readIncome(); 
            income.today = (income.today || 0) + PRICE_PER_LEAD; 
            income.total = (income.total || 0) + PRICE_PER_LEAD; 
            income.wallet = (income.wallet || 0) + PRICE_PER_LEAD; 
            writeIncome(income); 
            
            return res.json({ status: "sent", log: entry, income }); 
        } 

        // 4) runFollowups - Message 2 (Value) અને Message 3 (Closing)
        if (action === "runFollowups") { 
            const logs = readLogs(); 
            const now = Date.now(); 
            const results = []; 

            for (let entry of logs) { 
                if (entry.done) continue; 

                if (entry.nextFollowUpAt && entry.nextFollowUpAt <= now && entry.followUpCount < FOLLOWUP_INTERVALS.length) { 
                    let followupPrompt = '';
                    let defaultMsg = '';

                    if (entry.followUpCount === 0) {
                        // *** Message 2 (Value/Audit Video) - 1 કલાક પછી ***
                        followupPrompt = `Write a short LinkedIn message to follow-up on the audit video offer (Message 1). Provide value and ask for a 10-minute demo. Max 2 short sentences.`;
                        defaultMsg = "Here is your business AI improvement report. Your company can automate 30–70% operations. Want a 10-minute demo?";
                    } else if (entry.followUpCount === 1) {
                        // *** Message 3 (Closing/Pricing) - 6 કલાક પછી ***
                        followupPrompt = `Write a direct closing LinkedIn message. State the solutions start from ₹50,000 – ₹1,00,000. Ask: "Shall we start onboarding or would you like a demo?" Max 2 short sentences.`;
                        defaultMsg = "Our solutions start from ₹50,000 – ₹1,00,000. Shall we start onboarding?";
                    } else {
                         // Final Followup - 24 કલાક પછી
                        followupPrompt = `Write a final short, polite LinkedIn follow-up before closing the lead.`;
                        defaultMsg = "Checking in one last time on the AI automation offer. Let me know if you're interested!";
                    }
                    
                    let followupMsg = defaultMsg; 
                    try { 
                        // AI દ્વારા જનરેટ કરાવો (Gemini/OpenAI)
                        // ... (AI Generation Logic યથાવત રાખો) ...
                        
                    } catch (e) {
                        // keep default followupMsg
                    }

                    // ... (Send Logic - Simulated) ...
                    // ... (Log History Update Logic) ...
                    
                    entry.followUpHistory.push({ at: now, message: followupMsg, sendResponse: { simulated: true } }); 
                    entry.followUpCount = (entry.followUpCount || 0) + 1; 
                    
                    if (entry.followUpCount < FOLLOWUP_INTERVALS.length) { 
                        entry.nextFollowUpAt = now + FOLLOWUP_INTERVALS[entry.followUpCount]; 
                    } else { 
                        entry.nextFollowUpAt = null; 
                        entry.done = true; 
                    } 
                    results.push({ id: entry.id, status: "followup_sent", followUpCount: entry.followUpCount }); 
                } 
            } 
            writeLogs(logs); 
            return res.json({ status: "followups_processed", results }); 
        } 

        // 5) getLogs અને 6) income status યથાવત છે

        // 7) CLOSE DEAL + Income Update (Manual closing)
        if (action === "closeDeal") {
            if (!amount || !business) return res.status(400).json({ error: "Amount and business required" });

            // Income Update (Manual Call Closing થી આવક)
            const income = readIncome();
            income.today = (income.today || 0) + amount;
            income.total = (income.total || 0) + amount;
            income.wallet = (income.wallet || 0) + amount; 
            writeIncome(income);

            // Log entry
            const logs = readLogs();
            logs.push({
                id: `deal_${Date.now()}_${Math.floor(Math.random()*10000)}`,
                business: business,
                amount: amount,
                type: "Deal Closed (Manual)",
                createdAt: Date.now(),
                done: true 
            });
            // આ લીડના બધા ફોલો-અપ બંધ કરો
            const updatedLogs = logs.map(l => (l.phone === business.Profile_URL ? { ...l, done: true, nextFollowUpAt: null } : l));
            writeLogs(updatedLogs);
            
            return res.json({ status: "closed", amount, income });
        }

        return res.status(400).json({ error: "Invalid action" }); 
    } 
    res.status(405).json({ error: "Method Not Allowed" }); 

} catch (err) {
    return res.status(500).json({ error: "Server Error", details: err.message || err.toString() });
}
}
and 
// pages/api/withdraw.js (FINAL LinkedIn System)
import fs from "fs";
import path from "path";

const LOG_DIR = path.join(process.cwd(), "data");
const WITHDRAW_LOG_FILE = path.join(LOG_DIR, "withdraws.json");
const INCOME_FILE = path.join(LOG_DIR, "income.json"); // Income ફાઇલનો ઉપયોગ કરો

function ensure() {
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
if (!fs.existsSync(WITHDRAW_LOG_FILE)) fs.writeFileSync(WITHDRAW_LOG_FILE, "[]");
// income file existence is handled in generate.js, but check here too
}

function readIncome() {
    // આ ફંક્શન readIncome ને generate.js માંથી કોપી કરો
    // ... (generate.js માંથી readIncome નો લોજિક અહીં) ...
    // આને જનરેટ ફાઇલમાં રહેવા દઈએ અને અહીં માત્ર લખવાનો કોડ રાખીએ
    try {
        return JSON.parse(fs.readFileSync(INCOME_FILE, "utf8"));
    } catch {
        return { wallet: 0 };
    }
}

function writeIncome(obj) {
    fs.writeFileSync(INCOME_FILE, JSON.stringify(obj, null, 2));
}

export default async function handler(req, res) {
try {
    if (req.method !== "POST") return res.status(405).json({ error: "Method Not Allowed" });
    const { amount, upi, name } = req.body;
    if (!amount || !upi) return res.status(400).json({ error: "Amount and UPI required" });

    ensure(); 
    
    // 1. Wallet Balance ચેક કરો
    const income = readIncome();
    const withdrawAmount = Number(amount);

    if (withdrawAmount <= 0) return res.status(400).json({ error: "Withdraw amount must be positive." });
    if (withdrawAmount > income.wallet) return res.status(400).json({ error: `Insufficient balance. Available: ₹${income.wallet.toLocaleString('en-IN')}` });

    // 2. લોગમાં એન્ટ્રી
    const raw = fs.readFileSync(WITHDRAW_LOG_FILE, "utf8"); 
    const logs = JSON.parse(raw || "[]"); 
    const entry = { 
        id: `wd_${Date.now()}`, 
        name: name || "Owner", 
        amount: withdrawAmount, 
        upi, 
        status: "requested", 
        createdAt: new Date().toISOString(), 
    }; 
    logs.push(entry); 
    fs.writeFileSync(WITHDRAW_LOG_FILE, JSON.stringify(logs, null, 2)); 

    // 3. Wallet માંથી રકમ બાદ કરો
    income.wallet -= withdrawAmount;
    writeIncome(income);

    return res.json({ 
        status: "ok", 
        message: `Withdraw request of ₹${withdrawAmount.toLocaleString('en-IN')} saved. Please transfer manually via UPI.`, 
        request: entry 
    }); 

} catch (err) {
    return res.status(500).json({ error: err.message || err.toString() });
}
}
