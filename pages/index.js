// pages/index.js
import { useState } from "react";

export default function Home() {
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLeads = async () => {
    setLoading(true);

    const r = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "scrape",
        city,
        category,
      }),
    });

    const data = await r.json();
    setLeads(data.leads || []);
    setLoading(false);
  };

  const sendToLead = async (lead) => {
    // 1) Generate AI message
    const ai = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "aiMessage",
        business: lead,
      }),
    });

    const aiData = await ai.json();

    // 2) Send message via WhatsApp
    await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        action: "send",
        phone: lead.phone,
        message: aiData.message,
      }),
    });

    alert("Message Sent ✔");
  };

  return (
    <div style={{ padding: 20 }}>
      <h1>Client Finder AI</h1>

      <input
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="Enter City"
        style={{
          padding: 12,
          width: "100%",
          marginBottom: 10,
          border: "1px solid #ccc",
        }}
      />

      <input
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        placeholder="Business Category (Salon, Spa...)"
        style={{
          padding: 12,
          width: "100%",
          marginBottom: 10,
          border: "1px solid #ccc",
        }}
      />

      <button
        onClick={fetchLeads}
        style={{
          padding: 12,
          width: "100%",
          background: "black",
          color: "white",
        }}
      >
        Find Leads
      </button>

      {loading && <p>Loading...</p>}

      {leads.map((l, i) => (
        <div
          key={i}
          style={{
            marginTop: 15,
            padding: 15,
            border: "1px solid #ddd",
            borderRadius: 8,
          }}
        >
          <h3>{l.name}</h3>
          <p>{l.address}</p>
          <p>📞 {l.phone || "No phone available"}</p>

          <button
            onClick={() => sendToLead(l)}
            style={{
              padding: 10,
              width: "100%",
              background: "green",
              color: "white",
              marginTop: 10,
            }}
          >
            Send AI Message
          </button>
        </div>
      ))}
    </div>
  );
          }
