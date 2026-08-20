// pages/index.js
import { useState, useEffect } from "react";

export default function Home() {
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(null);

  useEffect(() => {
    const savedLeads = sessionStorage.getItem("client-find-leads");
    if (savedLeads) setLeads(JSON.parse(savedLeads));
  }, []);

  const handleSendFromUserNumber = async (lead, index) => {
    setSending(index);
    try {
      // ૧. Signup/Profile માંથી સાઇન-ઇન યુઝરની ડિટેલ્સ મેળવો
      const savedProfile = JSON.parse(
        localStorage.getItem("client-find-profile") ||
        sessionStorage.getItem("client-find-profile") || "{}"
      );

      const senderName = savedProfile.username || "";
      const agencyName = savedProfile.agencyName || "";

      // ૨. Groq AI પાસે Real Name & Agency સાથે મેસેજ બનાવડાવો
      const messageResponse = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "aiMessage",
          business: lead,
          senderName: senderName,
          agencyName: agencyName
        }),
      });

      const messageData = await messageResponse.json();
      if (!messageResponse.ok) throw new Error(messageData.error || "Message generation failed");

      // ૩. Receiver (Lead) ના નંબરને Clean ફોર્મેટમાં ફેરવો (Country Code 91 સાથે)
      let leadPhone = (lead.phone || "").replace(/[^0-9]/g, "");

      if (leadPhone.length === 10) {
        leadPhone = `91${leadPhone}`; // ઇન્ડિયન નંબર માટે 91 ઉમેરવું
      }

      if (!leadPhone) {
        alert("This lead does not have a valid phone number!");
        return;
      }

      // ૪. Receiver ના નંબર પર યુઝરના પોતાના WhatsApp માંથી મેસેજ ઓપન થશે
      const encodedText = encodeURIComponent(messageData.message);
      const whatsappUrl = `https://wa.me/${leadPhone}?text=${encodedText}`;

      window.open(whatsappUrl, "_blank");

    } catch (error) {
      console.error(error);
      alert(error.message || "Failed to process message");
    } finally {
      setSending(null);
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
        <div className="lead-grid">
            {leads.map((lead, index) => (
              <article className="lead-card" key={`${lead.name}-${index}`}>
                <h3>{lead.name}</h3>
                <p className="lead-meta">{lead.address || "No address available"}</p>
                <p className="lead-meta">Rating: {lead.rating || "N/A"}</p>
                <p className="lead-meta">Phone: {lead.phone || "No phone available"}</p>
                {lead.website && <p className="lead-meta">{lead.website}</p>}

                <button
                  className="button button-primary lead-action"
                  onClick={() => handleSendFromUserNumber(lead, index)}
                  disabled={!lead.phone || sending === index}
                >
                  {sending === index
                    ? "Generating Message..."
                    : !lead.phone
                      ? "No Phone Number"
                      : "Send via WhatsApp"}
                </button>
              </article>
            ))}
          </div>
      ))}
    </div>
  );
  }

  
