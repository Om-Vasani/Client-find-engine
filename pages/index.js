// pages/index.js
import { useState } from "react";

export default function Home() {
  const [niche, setNiche] = useState("Website");
  const [location, setLocation] = useState("Surat");
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);

  const findClients = async () => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/generate?niche=${encodeURIComponent(niche)}&location=${encodeURIComponent(location)}`
      );
      const data = await res.json();
      setClients(data.clients || []);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch clients");
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "20px", fontFamily: "Arial" }}>
      <h1>🔥 One-Click Client Finder</h1>

      <div style={{ marginBottom: "10px" }}>
        <label>Niche: </label>
        <select value={niche} onChange={(e) => setNiche(e.target.value)}>
          <option>Website</option>
          <option>Branding</option>
          <option>AI Automation</option>
          <option>Local Business</option>
          <option>E-commerce</option>
          <option>Real Estate</option>
        </select>
      </div>

      <div style={{ marginBottom: "10px" }}>
        <label>Location: </label>
        <select value={location} onChange={(e) => setLocation(e.target.value)}>
          <option>Surat</option>
          <option>Gujarat</option>
          <option>India</option>
          <option>USA</option>
          <option>Worldwide</option>
        </select>
      </div>

      <button onClick={findClients} disabled={loading}>
        {loading ? "Fetching..." : "FIND CLIENTS"}
      </button>

      <div style={{ marginTop: "20px" }}>
        {clients.length > 0 ? (
          clients.map((c, idx) => (
            <div key={idx} style={{ border: "1px solid #ccc", padding: "10px", marginBottom: "10px" }}>
              <h3>{c.name}</h3>
              <p>{c.address}</p>
              <p>{c.phone}</p>
              {c.website && <p>Website: {c.website}</p>}
            </div>
          ))
        ) : (
          <p>No clients found yet</p>
        )}
      </div>
    </div>
  );
}
