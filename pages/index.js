import { useState } from "react";
import axios from "axios";

export default function Home() {
  const [city, setCity] = useState("");
  const [keyword, setKeyword] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(null);

  const findLeads = async () => {
    if (!city || !keyword) return alert("Please enter city & keyword");

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
      keyword
    });

    alert("AI Message:\n\n" + r.data.message);

    setSending(null);
  };

  return (
    <div style={{ padding: 20 }}>
      <h1 style={{ fontSize: 32, fontWeight: "bold", marginBottom: 20 }}>
        Client Find Engine
      </h1>

      <input
        placeholder="City (Surat)"
        value={city}
        onChange={(e) => setCity(e.target.value)}
        className="w-full border p-2 mb-2 rounded"
      />

      <input
        placeholder="Business Type (Spa, Salon, Gym...)"
        value={keyword}
        onChange={(e) => setKeyword(e.target.value)}
        className="w-full border p-2 mb-2 rounded"
      />

      <button
        onClick={findLeads}
        className="w-full bg-black text-white py-2 mb-4 rounded"
      >
        {loading ? "Loading..." : "Find Leads"}
      </button>

      {results.map((item, index) => (
        <div key={index} className="border p-4 rounded mb-4 shadow bg-white">
          <h2 className="text-xl font-semibold">{item.name}</h2>
          <p className="text-sm mb-2">{item.address}</p>
          <p className="mb-2">📞 {item.phone || "No phone"}</p>

          <button
            onClick={() => sendMessage(item, index)}
            className="w-full bg-green-600 text-white py-2 rounded"
          >
            {sending === index ? "Sending..." : "Send AI Message"}
          </button>
        </div>
      ))}
    </div>
  );
          }ual Withdraw Request</h3>   
                        <input placeholder="Amount" value={withdrawAmount} onChange={(e)=>setWithdrawAmount(e.target.value)} className="w-full border p-2 mb-2 rounded" />   
                        <input placeholder="UPI ID (example@bank)" value={upi} onChange={(e)=>setUpi(e.target.value)} className="w-full border p-2 mb-2 rounded" />   
                        <button onClick={requestWithdraw} className="w-full bg-purple-600 text-white py-2 rounded">Request Withdraw</button>   
                        <div className="mt-4 text-sm text-gray-600">   
                            Note: MANUAL TRANSFER REQUIRED.  
                        </div>   
                    </aside>   
                </section>

                <section className="mt-6 bg-white p-6 rounded shadow">
                    <h2 className="text-xl font-semibold mb-3">Recent Logs</h2>

                    <div className="space-y-2 max-h-80 overflow-y-auto">
                        {logs.map(l => (
                            <div key={l.id} className="p-3 border rounded text-sm bg-white">
                                <div className="font-semibold">{l.business?.name || l.phone}</div>
                                <div className="text-xs text-gray-500">
                                    {new Date(l.createdAt).toLocaleString()}
                                </div>
                                <div className="text-xs text-gray-600">
                                    {l.type} — ₹{l.amount}
                                </div>
                            </div>
                        ))}

                        {logs.length === 0 && <div className="text-gray-500 p-4 text-center">No logs yet.</div>}
                    </div>
                </section>

                <footer className="mt-6 text-center text-sm text-gray-500">
                    Deployed on Vercel (Temporary File Storage)
                </footer>
            </div>
        </div>
    );
}
