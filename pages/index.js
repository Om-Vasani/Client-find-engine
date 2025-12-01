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
