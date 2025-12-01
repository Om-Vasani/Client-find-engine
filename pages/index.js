// pages/index.js
import { useEffect, useState } from "react";

export default function Home() {
  const [city, setCity] = useState("Surat");
  const [category, setCategory] = useState("Salon");
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [income, setIncome] = useState({ today: 0, total: 0, wallet: 0 });
  const [price, setPrice] = useState(50000);
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
    setIncome(d.income || { today:0, total:0, wallet:0 });
  }

  async function fetchLeads() {
    setLoading(true);
    const r = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "scrape", city, category }),
    });
    const d = await r.json();
    setLeads(d.leads || []);
    setLoading(false);
  }

  async function handleSend(lead) {
    // generate AI message
    const msgRes = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "aiMessage", business: lead }),
    });
    const msgData = await msgRes.json();
    // send message (server updates income)
    const sendRes = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "send", phone: lead.phone, message: msgData.message, business: lead }),
    });
    const sendData = await sendRes.json();
    await fetchIncome();
    await fetchLogs();
    alert("Message Sent & Logged ✔");
  }

  async function requestWithdraw() {
    if (!withdrawAmount || !upi) return alert("Amount and UPI required");
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
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">AI Client Finder — Surat</h1>
          <div className="text-right">
            <div className="text-sm text-gray-600">Today: ₹{income.today}</div>
            <div className="text-sm text-gray-600">Wallet: ₹{income.wallet}</div>
            <div className="text-sm text-gray-600">Total: ₹{income.total}</div>
          </div>
        </header>

        <section className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white p-4 rounded shadow">
            <div className="flex gap-2 mb-4">
              <input value={city} onChange={(e)=>setCity(e.target.value)} className="border p-2 flex-1" />
              <input value={category} onChange={(e)=>setCategory(e.target.value)} className="border p-2 w-56" />
              <button onClick={fetchLeads} className="bg-black text-white px-4 rounded">Find Leads</button>
            </div>

            {loading ? <div>Loading…</div> : (
              <div className="space-y-3">
                {leads.map((l, i) => (
                  <div key={i} className="p-3 border rounded flex justify-between items-center">
                    <div>
                      <div className="font-semibold">{l.name}</div>
                      <div className="text-sm text-gray-500">{l.address}</div>
                      <div className="text-sm">📞 {l.phone}</div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      <select value={price} onChange={(e)=>setPrice(Number(e.target.value))} className="border p-1">
                        <option value={50000}>₹50,000</option>
                        <option value={75000}>₹75,000</option>
                        <option value={100000}>₹1,00,000</option>
                      </select>
                      <button onClick={()=>handleSend(l)} className="bg-green-600 text-white px-3 py-1 rounded">Send AI Msg</button>
                    </div>
                  </div>
                ))}
                {leads.length===0 && <div className="text-gray-500">No leads yet. Click "Find Leads".</div>}
              </div>
            )}
          </div>

          <aside className="bg-white p-4 rounded shadow">
            <h3 className="font-medium mb-2">Withdraw</h3>
            <input placeholder="Amount" value={withdrawAmount} onChange={(e)=>setWithdrawAmount(e.target.value)} className="w-full border p-2 mb-2" />
            <input placeholder="UPI ID (example@bank)" value={upi} onChange={(e)=>setUpi(e.target.value)} className="w-full border p-2 mb-2" />
            <button onClick={requestWithdraw} className="w-full bg-purple-600 text-white py-2 rounded">Request Withdraw</button>

            <div className="mt-4 text-sm text-gray-600">
              Withdraw requests saved to server. Transfer manually via UPI to provided ID.
            </div>

            <div className="mt-6">
              <button onClick={runFollowupsNow} className="w-full bg-orange-500 text-white py-2 rounded">Run Followups Now</button>
            </div>
          </aside>
        </section>

        <section className="mt-6">
          <h2 className="text-lg font-semibold mb-2">Recent Logs</h2>
          <div className="space-y-2">
            {logs.slice().reverse().slice(0, 30).map(l => (
              <div key={l.id} className="p-3 bg-white rounded border">
                <div className="flex justify-between">
                  <div>
                    <div className="font-semibold">{l.business?.name || l.phone}</div>
                    <div className="text-sm text-gray-500">{new Date(l.createdAt).toLocaleString()}</div>
                  </div>
                  <div className="text-sm text-gray-600">FollowUps: {l.followUpCount} {l.done ? " (done)" : ""}</div>
                </div>
                <div className="mt-2 text-sm">Message: {l.initialMessage?.slice(0,120)}</div>
              </div>
            ))}
            {logs.length===0 && <div className="text-gray-500">No logs yet.</div>}
          </div>
        </section>

        <footer className="mt-6 text-center text-sm text-gray-500">Deployed system — manual UPI transfer required for withdrawals.</footer>
      </div>
    </div>
  );
          }
