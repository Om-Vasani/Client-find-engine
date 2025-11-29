import { useState } from "react";
import axios from "axios";

export default function Home() {
  const [niche, setNiche] = useState("");
  const [location, setLocation] = useState("");
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(false);

  const findClients = async () => {
    if (!niche || !location) return alert("Please select niche and location");
    setLoading(true);
    try {
      const res = await axios.get("/api/generate", {
        params: { niche, location }
      });
      setClients(res.data.clients);
    } catch (err) {
      alert("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 800, margin: "auto", padding: 20 }}>
      <h1>🔥 One-Click Client Finder</h1>

      <div style={{ marginBottom: 20 }}>
        <label>Niche: </label>
        <select value={niche} onChange={e => setNiche(e.target.value)}>
          <option value="">Select Niche</option>
          <option value="Website">Website</option>
          <option value="Branding">Branding</option>
          <option value="AI Automation">AI Automation</option>
          <option value="Local Business">Local Business</option>
          <option value="E-commerce">E-commerce</option>
          <option value="Real Estate">Real Estate</option>
        </select>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label>Location: </label>
        <select value={location} onChange={e => setLocation(e.target.value)}>
          <option value="">Select Location</option>
          <option value="Surat">Surat</option>
          <option value="Gujarat">Gujarat</option>
          <option value="India">India</option>
          <option value="USA">USA</option>
          <option value="Worldwide">Worldwide</option>
        </select>
      </div>

      <button onClick={findClients} disabled={loading}>
        {loading ? "Searching..." : "FIND CLIENTS"}
      </button>

      <div style={{ marginTop: 30 }}>
        {clients.length > 0 ? (
          <ul>
            {clients.map(c => (
              <li key={c.id} style={{ marginBottom: 10 }}>
                <strong>{c.name}</strong> – {c.address || "No Address"} <br />
                Phone: {c.phone || "N/A"} <br />
                Website: {c.website || "N/A"} <br />
                Message: {c.message} <br />
                <button onClick={() => navigator.clipboard.writeText(c.message)}>
                  COPY MESSAGE
                </button>
              </li>
            ))}
          </ul>
        ) : (
          <p>No clients found yet</p>
        )}
      </div>
    </div>
  );
  }
