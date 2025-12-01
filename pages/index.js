import { useEffect, useState } from "react";

export default function Home() {
    const [city] = useState("World-Wide");
    const [category] = useState("Founder, CEO, Director");
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(false);
    const [income, setIncome] = useState({ today: 0, total: 0, wallet: 0 });
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
        const r = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "scrape" }),
        });
        const d = await r.json();
        setLeads(d.leads || []);
        setLoading(false);
    }

    async function handleSend(lead) {
        const msgRes = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ action: "aiMessage", business: lead }),
        });
        const msgData = await msgRes.json();

        const sendRes = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "send",
                phone: lead.Profile_URL,
                message: msgData.message,
                business: lead,
            }),
        });

        await sendRes.json();
        await fetchIncome();
        await fetchLogs();
        alert("AI Message Sent ✔");
    }

    async function handleDealClose(lead) {
        const finalPrice = prompt(`Enter Deal Amount for ${lead.Name}:`);
        if (!finalPrice || isNaN(Number(finalPrice))) return alert("Invalid Price");

        const r = await fetch("/api/generate", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                action: "closeDeal",
                amount: Number(finalPrice),
                business: lead,
            }),
        });

        const d = await r.json();
        if (d.status === "closed") {
            alert("Deal Closed!");
            setLeads(prev => prev.filter(l => l.Profile_URL !== lead.Profile_URL));
            fetchIncome();
            fetchLogs();
        }
    }

    async function requestWithdraw() {
        if (!withdrawAmount || !upi) return alert("Amount and UPI required");

        const currentWallet = income.wallet || 0;
        if (Number(withdrawAmount) > currentWallet)
            return alert(`Max withdrawable: ₹${currentWallet}`);

        const r = await fetch("/api/withdraw", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ amount: Number(withdrawAmount), upi }),
        });

        const d = await r.json();
        if (!d.error) {
            setWithdrawAmount("");
            setUpi("");
            fetchLogs();
            fetchIncome();
        }
        alert(d.message || "Withdraw Requested.");
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
        alert(`Followups Sent: ${d.results?.length || 0}`);
        fetchLogs();
    }

    return (
        <div className="min-h-screen bg-gray-100 p-4 sm:p-8">
            <div className="max-w-7xl mx-auto">

                <header className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold">🚀 LinkedIn AI Target Hitter</h1>
                    <p className="text-gray-600">Goal: ₹1,00,000 – ₹1,50,000</p>
                </header>

                <div className="grid grid-cols-3 gap-4 mb-6 text-center">
                    <div className="bg-white p-4 rounded shadow">
                        Today: <div className="text-xl font-bold text-green-600">₹{income.today}</div>
                    </div>
                    <div className="bg-white p-4 rounded shadow">
                        Wallet: <div className="text-xl font-bold text-blue-600">₹{income.wallet}</div>
                    </div>
                    <div className="bg-white p-4 rounded shadow">
                        Total: <div className="text-xl font-bold text-gray-700">₹{income.total}</div>
                    </div>
                </div>

                <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    <div className="lg:col-span-2 bg-white p-6 rounded shadow">
                        <h2 className="text-xl font-semibold mb-4">Lead Generation & Messaging</h2>

                        <button onClick={fetchLeads} className="bg-black text-white px-4 py-2 rounded mb-4">
                            Load Leads (Mock)
                        </button>

                        {loading ? (
                            <div>Loading…</div>
                        ) : (
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {leads.map((l, i) => (
                                    <div key={i} className="p-3 border rounded bg-gray-50">
                                        <div className="font-semibold">{l.Name}</div>
                                        <div className="text-xs text-gray-600">{l["Role/Headline"]}</div>
                                        <div className="text-xs text-blue-500">🔗 {l.Profile_URL}</div>

                                        <div className="flex gap-2 mt-2">
                                            <button
                                                onClick={() => handleSend(l)}
                                                className="bg-green-600 text-white px-3 py-1 rounded text-xs"
                                            >
                                                Send Msg 1
                                            </button>

                                            <button
                                                onClick={() => handleDealClose(l)}
                                                className="bg-red-600 text-white px-3 py-1 rounded text-xs"
                                            >
                                                Close Deal
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Withdraw + Followups */}
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
                            Note: MANUAL TRANSFER REQUIRED.  
                        </div>   
                    </aside>   
                </section>

                <section className="mt-6 bg-white p-6 rounded shadow">
                    <h2 className="text-xl font-semibold mb-3">Recent Logs</h2>

                    <div className="space-y-2 max-h-80 overflow-y-auto">
                        {logs.map(l => (
                            <div key={l.id} className="p-3 border rounded text-sm bg-white">
                                <div className="font-semibold">{l.business?.name || l.phone}</div>
                                <div className="text-xs text-gray-500">
                                    {new Date(l.createdAt).toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-600">
                                    {l.type} — ₹{l.amount}
                                </div>
                            </div>
                        ))}

                        {logs.length === 0 && <div className="text-gray-500 p-4 text-center">No logs yet.</div>}
                    </div>
                </section>

                <footer className="mt-6 text-center text-sm text-gray-500">
                    Deployed on Vercel (Temporary File Storage)
                </footer>
            </div>
        </div>
    );
}
