import React, { useState } from 'react';

export default function App() {
  const [apiKey, setApiKey] = useState(localStorage.getItem('GEMINI_API_KEY') || '');
  const [prompt, setPrompt] = useState('');
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const sampleChips = [
    { label: "🌾 Fasal Bimari (धान/गेहूँ)", text: "Dhaan ke patte peele pad rahe hain aur brown daag hain. Desi aur kam kharche wala ilaj batayein." },
    { label: "📜 Sarkari KCC & Bima", text: "Chhote kisan ke liye Kisan Credit Card (KCC) aur Fasal Bima yojana lene ka aasan tarika kya hai?" },
    { label: "🌿 Desi Jaivik Khad", text: "Ghar par sasti neem aur gobar ki jaivik khad banane ka aasan tarika kya hai?" }
  ];

  const handleApiKeyChange = (e) => {
    const val = e.target.value;
    setApiKey(val);
    localStorage.setItem('GEMINI_API_KEY', val);
  };

  const handleAsk = async (queryText) => {
    const textToSend = queryText || prompt;
    if (!apiKey.trim()) {
      setError("Pehle apni Google AI Studio API key upar enter karein!");
      return;
    }
    if (!textToSend.trim()) {
      setError("Kripya kisan bhai samasya likhein ya select karein.");
      return;
    }

    setLoading(true);
    setError('');
    setAnswer('');

    const systemPrompt = `Aap Gramin-Mitra AI hain, ek rural development aur kisan sahayak assistant powered by Google Gemma open architecture.
Aapko gaon ke kisan ke liye aasan Hinglish (Hindi written in Roman script) me step-by-step practical jawab dena hai:
1. 🔍 Samasya / Bimari ki pehchan
2. 🌿 Sasta ya Desi Samadhan / Upchaar (kam kharche wala)
3. 🏛️ Sarkari Yojana / Sahayata (PM-Kisan, KCC, Fasal Bima)
Jawab bilkul practical, simple aur bullet points me rakhein.`;

    try {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.8-flash:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            contents: [{ parts: [{ text: `${systemPrompt}\n\nKisan ki samasya: ${textToSend}` }] }]
          })
        }
      );

      const data = await res.json();
      if (data.error) {
        throw new Error(data.error.message || "API call fail hui.");
      }
      const outText = data?.candidates?.[0]?.content?.parts?.[0]?.text || "Jawab prapt nahi ho saka.";
      setAnswer(outText);
    } catch (err) {
      console.error(err);
      setError(err.message || "Network ya API issue aaya hai.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#064e3b', color: '#ecfdf5', fontFamily: 'system-ui, sans-serif', padding: '24px 16px' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', backgroundColor: '#022c22', borderRadius: '16px', padding: '28px', border: '1px solid #10b981', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5)' }}>
        
        {/* Header */}
        <header style={{ textAlign: "center", marginBottom: "20px", borderBottom: "1px solid #065f46", paddingBottom: "16px" }}>
          <span style={{ backgroundColor: "#059669", color: "#fff", padding: "4px 12px", borderRadius: "20px", fontSize: "0.8rem", fontWeight: "bold" }}>
            Powered by Google Gemma Open Architecture
          </span>
          <h1 style={{ fontSize: "2.2rem", margin: "12px 0 6px", color: "#34d399", fontWeight: 800 }}>
            🌾 ग्रामीण मित्र (Gramin-Mitra AI)
          </h1>
          <p style={{ margin: 0, color: "#a7f3d0", fontSize: "0.95rem" }}>
            Vernacular Agritech & Rural Welfare Assistant | Hacktoberfest Ranchi 2026
          </p>
        </header>

        {/* API Key Box */}
        <div style={{ backgroundColor: "#064e3b", padding: "12px", borderRadius: "8px", marginBottom: "18px" }}>
          <label style={{ fontSize: "0.85rem", color: "#a7f3d0", display: "block", marginBottom: "4px", fontWeight: 600 }}>
            🔑 Google AI Studio API Key:
          </label>
          <input
            type="password"
            value={apiKey}
            onChange={handleApiKeyChange}
            placeholder="Paste your Google AI Studio API key here..."
            style={{ width: "100%", padding: "8px 12px", borderRadius: "6px", border: "1px solid #10b981", backgroundColor: "#022c22", color: "#fff", outline: "none", boxSizing: "border-box" }}
          />
        </div>

        {/* Quick Chips */}
        <div style={{ marginBottom: "16px" }}>
          <span style={{ fontSize: "0.85rem", color: "#a7f3d0", display: "block", marginBottom: "6px" }}>
            ⚡ Turant Jankari (Click to test):
          </span>
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
            {sampleChips.map((chip, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setPrompt(chip.text);
                  handleAsk(chip.text);
                }}
                style={{ backgroundColor: "#065f46", border: "1px solid #34d399", color: "#ecfdf5", padding: "7px 12px", borderRadius: "8px", fontSize: "0.85rem", cursor: "pointer" }}
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>

        {/* Query Input */}
        <div style={{ marginBottom: "20px" }}>
          <textarea
            rows="4"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Apni fasal rog, kisan yojana ya sinchai ki pareshani yahan likhein..."
            style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #10b981", backgroundColor: "#064e3b", color: "#fff", fontSize: "1rem", boxSizing: "border-box", outline: "none" }}
          />
          <button
            type="button"
            onClick={() => handleAsk(prompt)}
            disabled={loading}
            style={{ width: "100%", marginTop: "12px", padding: "14px", backgroundColor: loading ? "#047857" : "#10b981", color: "#022c22", fontWeight: 800, fontSize: "1.05rem", border: "none", borderRadius: "8px", cursor: loading ? "not-allowed" : "pointer" }}
          >
            {loading ? "Gemma Model Samadhan Dhoondh Raha Hai..." : "Samadhan Prapt Karein (Ask AI) 🚜"}
          </button>
        </div>

        {/* Error Card */}
        {error && (
          <div style={{ marginTop: "20px", backgroundColor: "#7f1d1d", border: "1px solid #f87171", borderRadius: "10px", padding: "16px", color: "#fee2e2" }}>
            ⚠️ <strong>Error:</strong> {error}
          </div>
        )}

        {/* Result Card */}
        {answer && (
          <div style={{ marginTop: "24px", backgroundColor: "#064e3b", border: "1px solid #34d399", borderRadius: "12px", padding: "20px" }}>
            <h3 style={{ margin: "0 0 12px", color: "#6ee7b7", fontSize: "1.15rem" }}>
              💡 Gramin-Mitra Salah & Upchaar:
            </h3>
            <div style={{ whiteSpace: "pre-wrap", lineHeight: "1.7", color: "#f0fdf4", fontSize: "0.98rem" }}>
              {answer}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}