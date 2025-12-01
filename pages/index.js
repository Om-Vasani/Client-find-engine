import { useState } from "react";
import axios from "axios";

export default function Home() {
  const [city, setCity] = useState("");
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(null);

  const findLeads = async () => {
    if (!city || !keyword) return alert("Enter both fields");

    setLoading(true);
    const r = await axios.get(`/api/generate?city=${city}&keyword=${keyword}`);
    setResults(r.data.results || []);
    setLoading(false);
  };

  const sendMessage = async (item, index) => {
    setSending(index);

    const r = await axios.post("/api/generate", {
      mode: "message",
      name: item.name,
      address: item.address,
      phone: item.phone,
      keyword,
    });

    alert("AI Message:\n\n" + r.data.message);
    setSending(null);
  };

  return (
    <div style={{ padding: 16 }}>
      <h1 style={{ fontSize: 32, fontWeight: "bold", marginBottom: 20 }}>
        Client Find Engine
      </h1>

      <input
        placeholder="Surat"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        style={{
          width: "100%",
          border: "1px solid #ccc",
          padding: 10,
          borderRadius: 6,
          marginBottom: 10,
        }}
      />

      <input
        placeholder="Spa"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        style={{
          width: "100%",
          border: "1px solid #ccc",
          padding: 10,
          borderRadius: 6,
          marginBottom: 10,
        }}
      />

      <button
        onClick={findLeads}
        style={{
          width: "100%",
          padding: 12,
          background: "black",
          color: "white",
          borderRadius: 6,
          marginBottom: 20,
        }}
      >
        {loading ? "Loading..." : "Find Leads"}
      </button>

      {results.map((item, index) => (
        <div
          key={index}
          style={{
            background: "white",
            padding: 16,
            borderRadius: 10,
            border: "1px solid #ddd",
            marginBottom: 16,
          }}
        >
          <h2 style={{ fontSize: 20, fontWeight: "bold" }}>{item.name}</h2>

          <p style={{ marginTop: 8, marginBottom: 8 }}>{item.address}</p>

          <p style={{ marginBottom: 8 }}>
            📞 {item.phone ? item.phone : "No phone"}
          </p>

          <button
            onClick={() => sendMessage(item, index)}
            style={{
              width: "100%",
              padding: 12,
              background: "#0a8f2e",
              color: "white",
              borderRadius: 6,
              fontSize: 16,
            }}
          >
            {sending === index ? "Sending..." : "Send AI Message"}
          </button>
        </div>
      ))}
    </div>
  );
          }
