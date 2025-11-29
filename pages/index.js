// pages/index.js
import { useState, useEffect } from "react";

export default function Home() {
  const [city, setCity] = useState("Surat");
  const [category, setCategory] = useState("Salon");
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState([]);
  const [runningFollowups, setRunningFollowups] = useState(false);

  const fetchLeads = async () => {
    setLoading(true);
    const r = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "scrape", city, category }),
    });
    const data = await r.json();
    setLeads(data.leads || []);
    setLoading(false);
  };

  const sendInitial = async (lead) => {
    // 1) generate AI message
    const msgRes = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "aiMessage", business: lead }),
    });
    const aiData = await msgRes.json();

    // 2) send & schedule followups
    const sendRes = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "send",
        phone: lead.phone,
        message: aiData.message,
        business: lead,
      }),
    });
    const sendData = await sendRes.json();
    alert("Initial message sent (logged).");
    // refresh logs
    await fetchLogs();
  };

  const runFollowups = async () => {
    setRunningFollowups(true);
    const r = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "runFollowups" }),
    });
    const data = await r.json();
    alert("Followups processed: " + (data.results?.length || 0));
    setRunningFollowups(false);
    fetchLogs();
  };

  const fetchLogs = async () => {
    const r = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "getLogs" }),
    });
    const d = await r.json();
    setLogs(d.logs || []);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Surat Auto Client Finder + Followups</h1>

      <div style={{ marginBottom: 12 }}>
        <input
          value={city}
          onChange={(e) => setCity(e.target.value)}
          placeholder="City"
          style={{ padding: 8, marginRight: 8 }}
        />
        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category"
          style={{ padding: 8 }}
        />
        <button onClick={fetchLeads} style={{ marginLeft: 10, padding: 8 }}>
          {loading ? "Loading..." : "Find Leads"}
        </button>
      </div>

      <div>
        <button onClick={runFollowups} style={{ padding: 10, background: "orange", color: "white" }}>
          {runningFollowups ? "Running..." : "Run Followups Now"}
        </button>
        <button onClick={fetchLogs} style={{ marginLeft: 8, padding: 10 }}>
          Refresh Logs
        </button>
      </div>

      <h2 style={{ marginTop: 18 }}>Leads</h2>
      {leads.map((lead, idx) => (
        <div key={idx} style={{ border: "1px solid #ddd", padding: 12, marginTop: 8 }}>
          <strong>{lead.name}</strong>
          <div>{lead.address}</div>
          <div>📞 {lead.phone}</div>
          <div>⭐ {lead.rating}</div>
          <button onClick={() => sendInitial(lead)} style={{ marginTop: 8, padding: 8, background: "green", color: "white" }}>
            Send Initial AI Message & Schedule Followups
          </button>
        </div>
      ))}

      <h2 style={{ marginTop: 18 }}>Logs (Last 50)</h2>
      {logs.slice().reverse().slice(0, 50).map((l) => (
        <div key={l.id} style={{ border: "1px solid #eee", padding: 10, marginTop: 8 }}>
          <div><strong>{l.business?.name || l.phone}</strong> — {new Date(l.createdAt).toLocaleString()}</div>
          <div>Initial: {l.initialMessage?.slice(0, 120)}</div>
          <div>FollowUps: {l.followUpCount} / {FOLLOWUP_PLACEHOLDER}</div>
          <div>Done: {l.done ? "Yes" : "No"}</div>
        </div>
      ))}
    </div>
  );
        }
