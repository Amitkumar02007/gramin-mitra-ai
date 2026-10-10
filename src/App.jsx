import React, { useState } from "react";
import "./App.css";

const PRESETS = [
  {
    icon: "🌾",
    label: "Fasal ki dikkat",
    prompt: "Dhaan ke patte peele pad rahe hain aur brown daag hain. Kya karun?",
  },
  {
    icon: "📜",
    label: "KCC aur bima",
    prompt: "Kisan Credit Card (KCC) aur PM Fasal Bima ke liye aavedan kaise karein?",
  },
  {
    icon: "🌿",
    label: "Desi jaivik khad",
    prompt: "Ghar par sasti jaivik khad aur neemastra banane ka tarika batayein.",
  },
];

const EMPTY_ERROR = "Kripya apna sawal likhein aur Google AI Studio API key enter karein.";

export default function App() {
  const [apiKey, setApiKey] = useState("");
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState("Hinglish (Mix)");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  async function handleAsk(event) {
    event.preventDefault();
    const cleanPrompt = prompt.trim();
    const cleanKey = apiKey.trim();
    if (!cleanPrompt || !cleanKey) {
      setError(EMPTY_ERROR);
      return;
    }

    setLoading(true);
    setError("");
    setData(null);

    try {
      const endpoint = new URL(
        "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent",
      );
      endpoint.searchParams.set("key", cleanKey);

      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            role: "user",
            parts: [{
              text: `Aap Gramin-Mitra AI hain. Kisan ke asal sawal ka jawab saral bhasha mein dein, fasal ya lakshan khud se na maan lein. Adhuri jaankari ho to spashtikaran maangein. Dawa ki matra ya spray schedule tab tak na dein jab tak rog ki pehchan pakki na ho. Scheme ki jaankari anishchit ho to official source se jaanchne ko kahein. Bhasha: ${language}.
Sawal: "${cleanPrompt}"

Sirf ek valid JSON object dein, bina markdown ke. Is format ka palan karein:
{
  "greeting": "Kisan ke liye abhivadan",
  "disease_name": "Pehchani gayi samasya ya vishay",
  "risk_level": "Kam, Madhyam, ya Gambhir",
  "risk_score_percent": 40,
  "diagnosis": "Sawal par aadharit spasht salah",
  "desi_remedies": ["Upchaar ka kadam"],
  "government_schemes": [{"name": "Yojana", "benefit": "Fayda", "how_to_apply": "Aavedan ka tarika"}],
  "emergency_helpline": "Kisan Call Center: 1800-180-1551"
}
Risk score 0 se 100 ke beech number ho. desi_remedies aur government_schemes arrays hon.`,
            }],
          }],
          generationConfig: {
            responseMimeType: "application/json",
          },
        }),
      });

      const result = await response.json().catch(() => null);
      if (!response.ok || result?.error) {
        throw new Error(
          result?.error?.message || `Gemini request fail hui (HTTP ${response.status}).`,
        );
      }
      const raw = result?.candidates?.[0]?.content?.parts
        ?.map((part) => part.text)
        .filter(Boolean)
        .join("")
        .replace(/```(?:json)?/gi, "")
        .replace(/```/g, "")
        .trim();
      if (!raw) {
        throw new Error("Gemini se jawab nahi mila. API key aur network check karein.");
      }
      const parsed = JSON.parse(raw);
      if (
        typeof parsed !== "object" ||
        parsed === null ||
        typeof parsed.diagnosis !== "string" ||
        typeof parsed.disease_name !== "string" ||
        !Array.isArray(parsed.desi_remedies) ||
        !Array.isArray(parsed.government_schemes)
      ) {
        throw new Error("Gemini ka jawab zaroori JSON fields ke bina mila.");
      }
      setData(parsed);
    } catch (requestError) {
      console.error("Gemini analysis failed:", requestError);
      const reason = requestError instanceof Error
        ? requestError.message
        : "Gemini se sampark nahi ho saka.";
      setData({
        greeting: "Salah abhi taiyar nahi ho saki",
        disease_name: "AI vishleshan uplabdh nahi",
        risk_level: "Jaanch zaroori",
        risk_score_percent: null,
        diagnosis: `Aapka sawal: “${cleanPrompt}”. AI se sampark nahi ho saka (${reason}). Yeh crop diagnosis nahi hai; sahi pehchan ke liye sthaniya krishi adhikari ya KVK se salah lein.`,
        desi_remedies: [
          "Bina samasya ki pakki pehchan ke koi dawa ya spray na karein.",
          "Lakshan note karein aur prabhavit paudhon ki saaf tasveer lekar KVK ya sthaniya krishi adhikari se salah lein.",
        ],
        government_schemes: [],
        emergency_helpline: "Kisan Call Center: 1800-180-1551",
      });
      setError(null);
    } finally {
      setLoading(false);
    }
  }

  const riskScore = Number.isFinite(data?.risk_score_percent)
    ? Math.min(100, Math.max(0, data.risk_score_percent))
    : null;

  return (
    <div className="gm-page">
      <header className="gm-header">
        <a className="gm-brand" href="#" aria-label="Gramin-Mitra home">
          <span className="gm-brand-mark" aria-hidden="true">🌾</span>
          <span className="gm-brand-copy">
            <strong>ग्रामीण मित्र</strong>
            <small>Google Gemma Architecture • Vernacular Agritech Assistant for Rural Farmers</small>
          </span>
        </a>
        <span className="gm-model-pill"><span /> Gemini 3.8 Flash</span>
      </header>

      <main className="gm-main">
        <section className="gm-hero">
          <div className="gm-hero-copy">
            <span className="gm-eyebrow"><span aria-hidden="true">✦</span> KISANON KE LIYE DIGITAL SAATHI</span>
            <h1>Kheti ki har baat,<br /><em>aapki bhasha mein.</em></h1>
            <p>Fasal ki dikkat ho ya sarkari yojana ka sawal—apni boli mein poochhein, seedha jawab paayein.</p>
          </div>
          <div className="gm-hero-art" aria-hidden="true">
            <span className="gm-sun" />
            <span className="gm-field gm-field-one" />
            <span className="gm-field gm-field-two" />
            <span className="gm-leaf">🌱</span>
          </div>
        </section>

        <section className="gm-workspace" aria-label="Kisan salah">
          <div className="gm-key-card">
            <div className="gm-key-icon" aria-hidden="true">🔑</div>
            <div className="gm-key-label">
              <label htmlFor="api-key">Google AI Studio API key</label>
              <span>Key is page session mein rahegi, save nahi hogi.</span>
            </div>
            <input
              id="api-key"
              type="password"
              autoComplete="off"
              spellCheck="false"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder="Apni API key yahan paste karein"
              disabled={loading}
            />
          </div>

          <form className="gm-form-card" onSubmit={handleAsk}>
            <div className="gm-form-heading">
              <div>
                <span className="gm-section-label">AAPKA SAWAL</span>
                <h2>Kheti mein kya madad chahiye?</h2>
              </div>
              <label className="gm-language">
                <span>Jawab ki bhasha</span>
                <select
                  value={language}
                  onChange={(event) => setLanguage(event.target.value)}
                  disabled={loading}
                >
                  <option value="Hinglish (Mix)">Hinglish</option>
                  <option value="Hindi">हिन्दी</option>
                  <option value="Bhojpuri">भोजपुरी</option>
                </select>
              </label>
            </div>

            <label className="gm-visually-hidden" htmlFor="farmer-question">
              Fasal ya samasya ka vivaran
            </label>
            <textarea
              id="farmer-question"
              rows={4}
              maxLength={2000}
              value={prompt}
              onChange={(event) => setPrompt(event.target.value)}
              placeholder="Fasal ka naam, lakshan aur dikkat apne shabdon mein batayein..."
              disabled={loading}
            />
            <div className="gm-form-meta">
              <span>{prompt.length}/2000 akshar</span>
              <span>✦ Aapki jaankari sirf jawab banane ke liye bheji jaati hai</span>
            </div>

            <div className="gm-preset-row">
              <span>Shuru karne ke liye:</span>
              {PRESETS.map((preset) => (
                <button
                  className="gm-preset"
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setPrompt(preset.prompt);
                    setError("");
                  }}
                  disabled={loading}
                >
                  <span aria-hidden="true">{preset.icon}</span>
                  {preset.label}
                </button>
              ))}
            </div>

            <button className="gm-submit" type="submit" disabled={loading}>
              {loading ? (
                <><span className="gm-spinner" aria-hidden="true" /> Salah taiyar ho rahi hai...</>
              ) : (
                <>Meri fasal ka vishleshan karein <span aria-hidden="true">↗</span></>
              )}
            </button>
          </form>

          {error && (
            <div className="gm-error" role="alert">
              <span aria-hidden="true">!</span>
              <div><strong>Jawab nahi mil saka</strong><p>{error}</p></div>
            </div>
          )}

          {data ? (
            <section className="gm-results" aria-labelledby="results-heading">
              <div className="gm-results-heading">
                <div>
                  <span className="gm-section-label">AAPKE LIYE TAIYAR</span>
                  <h2 id="results-heading">{data.greeting || "Gramin-Mitra ki salah"}</h2>
                </div>
                <span className="gm-result-badge">AI vishleshan</span>
              </div>

              <article className="gm-result-card gm-diagnosis">
                <div className="gm-result-title"><span aria-hidden="true">🔍</span><h3>Pehchan</h3></div>
                <span className="gm-disease">{data.disease_name}</span>
                <p>{data.diagnosis}</p>
                {riskScore !== null && (
                  <div className="gm-risk">
                    <div><span>Fasal risk</span><strong>{data.risk_level || "Risk"} · {riskScore}%</strong></div>
                    <div className="gm-risk-track"><span style={{ width: `${riskScore}%` }} /></div>
                  </div>
                )}
              </article>

              <div className="gm-result-grid">
                <article className="gm-result-card gm-remedies">
                  <div className="gm-result-title"><span aria-hidden="true">🌿</span><h3>Desi Upchaar</h3></div>
                  {data.desi_remedies.length ? (
                    <ol>{data.desi_remedies.map((item, index) => <li key={`${index}-${item}`}>{item}</li>)}</ol>
                  ) : <p>Is sawal ke liye upchaar nahi bataya gaya.</p>}
                </article>

                <article className="gm-result-card gm-schemes">
                  <div className="gm-result-title"><span aria-hidden="true">🏛️</span><h3>Sarkari Yojana</h3></div>
                  {data.government_schemes.length ? (
                    <div className="gm-scheme-list">
                      {data.government_schemes.map((scheme, index) => (
                        <div className="gm-scheme" key={`${index}-${scheme.name}`}>
                          <strong>{scheme.name}</strong>
                          <p>{scheme.benefit}</p>
                          <p><b>Aavedan:</b> {scheme.how_to_apply}</p>
                        </div>
                      ))}
                    </div>
                  ) : <p>Yojana ki sahi jaankari ke liye adhikarik portal ya najdeeki krishi karyalaya se sampark karein.</p>}
                  <a className="gm-helpline" href="tel:18001801551">📞 {data.emergency_helpline || "Kisan Call Center: 1800-180-1551"}</a>
                </article>
              </div>
              <p className="gm-disclaimer">Kheti ya yojana se juda kadam uthane se pehle adhikarik srot ya sthaniya krishi adhikari se tasdeek karein.</p>
            </section>
          ) : (
            !loading && !error && (
              <div className="gm-empty-state">
                <span aria-hidden="true">🌱</span>
                <strong>Aapki salah yahan dikhegi</strong>
                <p>Apna sawal likhein ya upar se ek misaal chunein.</p>
              </div>
            )
          )}
        </section>

        <footer className="gm-footer">
          <span>Gramin-Mitra AI</span><i aria-hidden="true">✦</i>Aapki mehnat, hamari madad.
        </footer>
      </main>
    </div>
  );
}
