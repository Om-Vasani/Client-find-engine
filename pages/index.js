// pages/index.js
import { useState } from "react";

export default function Home() {
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLeads = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "scrape",
          city,
          category,
        }),
      });

      const data = await res.json();
      setLeads(data.leads || []);
    } catch (err) {
      console.error(err);
      alert("Error fetching leads");
    }
    setLoading(false);
  };

  const handleSend = async (lead) => {
    try {
      // 1) AI MESSAGE
      const msgRes = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "aiMessage",
          business: lead,
        }),
      });

      const aiData = await msgRes.json();

      // 2) SEND via WhatsApp
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
    } catch (err) {
      console.error(err);
      alert("Failed to send message");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ marginBottom: 20 }}>Client Find Engine</h1>

      <input
        value={city}
        onChange={(e) => setCity(e.target.value)}
        placeholder="City (ex: Ahmedabad)"
        style={{
          padding: 12,
          width: "100%",
          border: "1px solid #ccc",
          marginBottom: 10,
        }}
      />

      <input
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        placeholder="Category (Salon, Spa, Dentist...)"
        style={{
          padding: 12,
          width: "100%",
          border: "1px solid #ccc",
          marginBottom: 10,
        }}
      />

      <button
        onClick={fetchLeads}
        style={{
          padding: 12,
          background: "black",
          color: "white",
          width: "100%",
        }}
      >
        Find Leads
      </button>

      {loading && <p>Loading...</p>}

      {leads.map((lead, idx) => (
        <div
          key={idx}
          style={{
            border: "1px solid #ddd",
            padding: 15,
            borderRadius: 8,
            marginTop: 12,
          }}
        >
          <h3>{lead.name}</h3>
          <p>{lead.address}</p>
          <p>📞 {lead.phone || "No phone"}</p>

          <button
            onClick={() => handleSend(lead)}
            style={{
              padding: 10,
              background: "green",
              color: "white",
              marginTop: 10,
              width: "100%",
            }}
          >
            Send AI Message
          </button>
        </div>
      ))}
    </div>
  );
  }
