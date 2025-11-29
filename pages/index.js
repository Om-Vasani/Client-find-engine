import { useState } from "react";

export default function Home() {
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchLeads = async () => {
    setLoading(true);
    const r = await fetch("http://localhost:5000/api/scrape", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ city, category }),
    });

    const data = await r.json();
    setLeads(data.leads);
    setLoading(false);
  };

  const sendAIMessage = async (lead) => {
    const r = await fetch("http://localhost:5000/api/message", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ business: lead }),
    });
    const data = await r.json();

    const s = await fetch("http://localhost:5000/api/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        phone: lead.phone,
        message: data.message,
      }),
    });

    alert("Message Sent ✔");
  };

  return (
    <div style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h1>Client Finder AI</h1>

      <input
        placeholder="City"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        style={{ padding: 10, margin: 5, width: "100%" }}
      />

      <input
        placeholder="Business Category (ex: Salon, Spa)"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        style={{ padding: 10, margin: 5, width: "100%" }}
      />

      <button
        onClick={fetchLeads}
        style={{
          padding: 12,
          marginTop: 10,
          width: "100%",
          background: "black",
          color: "white",
        }}
      >
        Find Leads
      </button>

      {loading && <p>Loading...</p>}

      {leads.map((l, index) => (
        <div
          key={index}
          style={{
            padding: 15,
            border: "1px solid #ccc",
            marginTop: 10,
            borderRadius: 8,
          }}
        >
          <h3>{l.name}</h3>
          <p>{l.address}</p>
          <p>📞 {l.phone || "No phone"}</p>
          <button
            onClick={() => sendAIMessage(l)}
            style={{
              padding: 10,
              background: "green",
              color: "white",
              marginTop: 5,
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
