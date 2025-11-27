import React, { useState } from "react";

export default function Home() {
  const [inputData, setInputData] = useState({
    clientName: "John Doe",
    companyName: "TechCorp Solutions",
    clientIssue: "High overhead costs due to slow manual processes.",
  });

  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setInputData({ ...inputData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setError("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inputData),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(data.messageContent);
      } else {
        setError(data.error || "Unknown error occurred.");
      }
    } catch (err) {
      setError("Network or system error.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: "20px", maxWidth: "800px", margin: "auto" }}>
      <h1>🎯 AI Sales Message Generator</h1>
      <p>Generate aggressive high-ticket closing messages for clients.</p>

      <form
        onSubmit={handleSubmit}
        style={{
          display: "grid",
          gap: "10px",
          padding: "20px",
          border: "1px solid #ccc",
        }}
      >
        <label>
          Client Name:
          <input
            type="text"
            name="clientName"
            value={inputData.clientName}
            onChange={handleChange}
            style={{ width: "100%", padding: "8px" }}
            required
          />
        </label>

        <label>
          Company Name:
          <input
            type="text"
            name="companyName"
            value={inputData.companyName}
            onChange={handleChange}
            style={{ width: "100%", padding: "8px" }}
            required
          />
        </label>

        <label>
          Client Problem:
          <textarea
            name="clientIssue"
            value={inputData.clientIssue}
            onChange={handleChange}
            style={{ width: "100%", padding: "8px" }}
            required
          ></textarea>
        </label>

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: "10px",
            backgroundColor: loading ? "#aaa" : "blue",
            color: "white",
            border: "none",
            cursor: "pointer",
          }}
        >
          {loading ? "Generating..." : "Generate AI Message"}
        </button>
      </form>

      {error && (
        <div style={{ color: "red", marginTop: "15px" }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {message && (
        <div
          style={{
            marginTop: "20px",
            border: "2px solid green",
            padding: "15px",
            backgroundColor: "#e6ffe6",
          }}
        >
          <h3>✅ AI Generated Sales Message:</h3>
          <pre style={{ whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
            {message}
          </pre>
          <p>Send this message to the client immediately.</p>
        </div>
      )}
    </div>
  );
}
