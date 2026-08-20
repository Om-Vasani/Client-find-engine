import { useState, useEffect } from "react";
import Link from "next/link";

export default function Home() {
  const [city, setCity] = useState("");
  const [category, setCategory] = useState("");
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(null);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    const savedLeads = sessionStorage.getItem("client-find-leads");
    if (savedLeads) {
      setLeads(JSON.parse(savedLeads));
      setHasSearched(true);
    }
  }, []);

  const fetchLeads = async (e) => {
    e?.preventDefault();
    if (!city || !category) {
      alert("Please enter both city and category");
      return;
    }

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

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch leads");
      }

      const fetchedLeads = data.leads || [];
      setLeads(fetchedLeads);
      sessionStorage.setItem("client-find-leads", JSON.stringify(fetchedLeads));
      setHasSearched(true);

    } catch (err) {
      console.error(err);
      alert(err.message || "Error fetching leads");
    } finally {
      setLoading(false);
    }
  };

  const handleSendFromUserNumber = async (lead, index) => {
    setSending(index);
    try {
      const savedProfile = JSON.parse(
        localStorage.getItem("client-find-profile") ||
        sessionStorage.getItem("client-find-profile") || "{}"
      );

      const senderName = savedProfile.username || "";
      const agencyName = savedProfile.agencyName || "";

      const messageResponse = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "aiMessage",
          business: lead,
          senderName: senderName,
          agencyName: agencyName,
        }),
      });

      const messageData = await messageResponse.json();
      if (!messageResponse.ok) {
        throw new Error(messageData.error || "Message generation failed");
      }

      let leadPhone = (lead.phone || "").replace(/[^0-9]/g, "");

      if (leadPhone.length === 10) {
        leadPhone = `91${leadPhone}`;
      }

      if (!leadPhone) {
        alert("This lead does not have a valid phone number!");
        return;
      }

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

  const resetSearch = () => {
    setHasSearched(false);
    setLeads([]);
    sessionStorage.removeItem("client-find-leads");
  };

  return (
    <div className="app-shell">
      <header className="topbar">
        <Link className="brand" href="/landing">
          <span className="brand-mark">C</span> Client Find Engine
        </Link>
        <nav className="nav">
          <Link className="nav-link" href="/profile">
            Profile
          </Link>
        </nav>
      </header>

      <main className="container">
        {!hasSearched ? (
          <section className="panel">
            <div className="page-heading">
              <div className="eyebrow">Search Leads</div>
              <h1>Find local businesses to target.</h1>
              <p>Enter a city and category to scrape local leads for your outreach.</p>
            </div>

            <form className="form-grid" onSubmit={fetchLeads}>
              <div className="field">
                <label htmlFor="city">City</label>
                <input
                  id="city"
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="e.g. Surat, Ahmedabad"
                  required
                />
              </div>

              <div className="field">
                <label htmlFor="category">Category</label>
                <input
                  id="category"
                  type="text"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  placeholder="e.g. Spa, Salon, Dentist"
                  required
                />
              </div>

              <button
                type="submit"
                className="button button-primary"
                disabled={loading}
              >
                {loading ? "Searching Leads..." : "Find Leads"}
              </button>
            </form>
          </section>
        ) : (
          <div>
            <div className="results-header">
              <div>
                <div className="eyebrow">Your shortlist</div>
                <h1>Search results</h1>
              </div>
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <span className="results-count">
                  {leads.length} {leads.length === 1 ? "lead" : "leads"} found
                </span>
                <button className="button" onClick={resetSearch}>
                  New Search
                </button>
              </div>
            </div>

            {leads.length === 0 ? (
              <div className="empty-state">
                <h3>No leads found</h3>
                <p>Try running a search with a different city or category.</p>
                <button className="button button-primary" onClick={resetSearch}>
                  Start new search
                </button>
              </div>
            ) : (
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
            )}
          </div>
        )}
      </main>
    </div>
  );
}
