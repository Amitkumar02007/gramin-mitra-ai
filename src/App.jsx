import { useState } from "react";
import { getSavedApiKey } from "./components/ApiKeyBar.jsx";
import { askGemma } from "./services/gemmaService.js";

const ENV_API_KEY = import.meta.env.VITE_GEMINI_API_KEY?.trim() || "";
const DEFAULT_HELPLINE = "Kisan Call Center: 1800-180-1551";

const PRESETS = [
  {
    label: "🌾 Fasal Bimari",
    prompt:
      "Dhaan ke patte peele pad rahe hain aur brown daag hain. Desi aur kam kharche wala ilaj batayein.",
  },
  {
    label: "📜 Sarkari KCC & Bima",
    prompt:
      "Chhote kisan ke liye Kisan Credit Card (KCC) aur Fasal Bima yojana lene ka aasan tarika kya hai?",
  },
  {
    label: "🌿 Desi Jaivik Khad",
    prompt:
      "Ghar par sasti neem aur gobar ki jaivik khad banane ka aasan tarika kya hai?",
  },
];

const cardStyles = {
  base: {
    padding: 18,
    border: "1px solid",
    borderRadius: 15,
    background: "rgba(1, 25, 19, 0.34)",
  },
  heading: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
    margin: "0 0 15px",
    color: "#e7f5ed",
    fontSize: 15,
  },
  badge: {
    padding: "5px 9px",
    border: "1px solid",
    borderRadius: 999,
    fontSize: 10,
    fontWeight: 700,
    whiteSpace: "nowrap",
  },
  body: {
    margin: 0,
    color: "#c2d7ca",
    fontSize: 13,
    lineHeight: 1.7,
    whiteSpace: "pre-wrap",
  },
};

function extractJsonObject(text) {
  const cleaned = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/i, "")
    .trim();
  const start = cleaned.indexOf("{");

  if (start < 0) {
    throw new Error("AI ka jawab valid JSON format mein nahi mila. Dobara koshish karein.");
  }

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let index = start; index < cleaned.length; index += 1) {
    const character = cleaned[index];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (character === "\\") {
        escaped = true;
      } else if (character === '"') {
        inString = false;
      }
      continue;
    }

    if (character === '"') {
      inString = true;
    } else if (character === "{") {
      depth += 1;
    } else if (character === "}") {
      depth -= 1;
      if (depth === 0) {
        return JSON.parse(cleaned.slice(start, index + 1));
      }
    }
  }

  throw new Error("AI ka JSON jawab adhura tha. Kripya dobara koshish karein.");
}

function normalizeAnswer(text) {
  const parsed = extractJsonObject(text);

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("AI ka jawab expected JSON object format mein nahi hai.");
  }

  const asText = (value, fallback = "") =>
    typeof value === "string" ? value.trim() : fallback;
  const parsedScore = Number(parsed.risk_score_percent);
  const riskScore = Number.isFinite(parsedScore)
    ? Math.min(100, Math.max(0, Math.round(parsedScore)))
    : 0;
  const schemes = Array.isArray(parsed.government_schemes)
    ? parsed.government_schemes
        .filter((scheme) => scheme && typeof scheme === "object")
        .map((scheme) => ({
          name: asText(scheme.name, "Sarkari yojana"),
          benefit: asText(scheme.benefit, "Fayde ki jankari uplabdh nahi hai."),
          howToApply: asText(
            scheme.how_to_apply,
            "Apne najdeeki krishi karyalaya ya adhikarik portal par sampark karein.",
          ),
        }))
    : [];
  const helpline = asText(parsed.emergency_helpline, DEFAULT_HELPLINE);

  return {
    greeting: asText(parsed.greeting),
    crop: asText(parsed.crop, "Aapki fasal / query"),
    diseaseName: asText(parsed.disease_name, "Samasya ki pehchan"),
    riskLevel: asText(
      parsed.risk_level,
      riskScore >= 70 ? "Gambhir (High)" : riskScore >= 35 ? "Madhyam (Medium)" : "Samanya (Low)",
    ),
    riskScore,
    diagnosis: asText(parsed.diagnosis, "Vistar se pehchan nahi di gayi."),
    remedies: Array.isArray(parsed.desi_remedies)
      ? parsed.desi_remedies.filter(
          (remedy) => typeof remedy === "string" && remedy.trim(),
        )
      : [],
    schemes,
    helpline,
  };
}

function getInitialApiKey() {
  return getSavedApiKey().trim() || ENV_API_KEY;
}

function getRiskColors(score) {
  if (score >= 70) {
    return {
      foreground: "#f87171",
      background: "rgba(248, 113, 113, 0.15)",
      border: "rgba(248, 113, 113, 0.38)",
    };
  }
  if (score >= 35) {
    return {
      foreground: "#fbbf24",
      background: "rgba(251, 191, 36, 0.12)",
      border: "rgba(251, 191, 36, 0.38)",
    };
  }
  return {
    foreground: "#34d399",
    background: "rgba(52, 211, 153, 0.12)",
    border: "rgba(52, 211, 153, 0.36)",
  };
}

function ResultCard({ children, color, background }) {
  return (
    <section
      style={{
        ...cardStyles.base,
        borderColor: color,
        backgroundColor: background,
      }}
    >
      {children}
    </section>
  );
}

function SolutionView({ answer }) {
  const riskColors = getRiskColors(answer.riskScore);
  const callableNumber = answer.helpline.replace(/[^\d+]/g, "");
  const phoneHref = callableNumber
    ? `tel:${callableNumber}`
    : "tel:18001801551";

  return (
    <article className="solution-card" aria-labelledby="solution-title">
      <header className="solution-heading">
        <span className="solution-icon" aria-hidden="true">💡</span>
        <div>
          <p className="eyebrow">Aapke liye taiyar kiya gaya</p>
          <h2 id="solution-title">Gramin-Mitra Salah &amp; Upchaar</h2>
        </div>
        <span className="answer-tag">Kheti salah</span>
      </header>

      <div style={{ display: "grid", gap: 14, padding: 18 }}>
        <ResultCard
          color="rgba(251, 146, 60, 0.65)"
          background="rgba(124, 45, 18, 0.11)"
        >
          <h3 style={cardStyles.heading}>
            <span>🔍 Pehchan</span>
            <span
              style={{
                ...cardStyles.badge,
                color: riskColors.foreground,
                borderColor: riskColors.border,
                backgroundColor: riskColors.background,
              }}
            >
              {answer.diseaseName}
            </span>
          </h3>
          {answer.greeting && (
            <p style={{ ...cardStyles.body, marginBottom: 10 }}>
              {answer.greeting}
            </p>
          )}
          <p style={{ ...cardStyles.body, marginBottom: 8 }}>
            <strong style={{ color: "#fcd34d" }}>Fasal / sandarbh:</strong>{" "}
            {answer.crop}
          </p>
          <p style={cardStyles.body}>{answer.diagnosis}</p>

          <div style={{ marginTop: 17 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 10,
                marginBottom: 8,
                color: "#e7f5ed",
                fontSize: 12,
              }}
            >
              <strong>Fasal Risk Meter</strong>
              <span style={{ color: riskColors.foreground, fontWeight: 700 }}>
                {answer.riskLevel} · {answer.riskScore}%
              </span>
            </div>
            <div
              role="progressbar"
              aria-label="Fasal risk score"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={answer.riskScore}
              style={{
                height: 9,
                overflow: "hidden",
                borderRadius: 999,
                background: "rgba(167, 243, 208, 0.12)",
              }}
            >
              <div
                style={{
                  width: `${answer.riskScore}%`,
                  height: "100%",
                  borderRadius: "inherit",
                  backgroundColor: riskColors.foreground,
                  transition: "width 300ms ease",
                }}
              />
            </div>
          </div>
        </ResultCard>

        <ResultCard
          color="rgba(52, 211, 153, 0.65)"
          background="rgba(6, 78, 59, 0.2)"
        >
          <h3 style={cardStyles.heading}>
            <span>🌿 Desi &amp; Sasta Upchaar</span>
            <span
              style={{
                ...cardStyles.badge,
                color: "#6ee7b7",
                borderColor: "rgba(52, 211, 153, 0.35)",
                backgroundColor: "rgba(52, 211, 153, 0.1)",
              }}
            >
              Step-by-step
            </span>
          </h3>
          {answer.remedies.length ? (
            <ol
              style={{
                display: "grid",
                gap: 12,
                margin: 0,
                padding: 0,
                listStyle: "none",
              }}
            >
              {answer.remedies.map((remedy, index) => (
                <li
                  key={`${index}-${remedy}`}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "28px 1fr",
                    gap: 10,
                    alignItems: "start",
                    color: "#c2d7ca",
                    fontSize: 13,
                    lineHeight: 1.65,
                  }}
                >
                  <span
                    aria-hidden="true"
                    style={{
                      display: "grid",
                      width: 26,
                      height: 26,
                      placeItems: "center",
                      borderRadius: "50%",
                      background: "rgba(52, 211, 153, 0.15)",
                      color: "#6ee7b7",
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    {index + 1}
                  </span>
                  <span>{remedy}</span>
                </li>
              ))}
            </ol>
          ) : (
            <p style={cardStyles.body}>Is query ke liye upchaar ki jankari nahi mili.</p>
          )}
        </ResultCard>

        <ResultCard
          color="rgba(96, 165, 250, 0.62)"
          background="rgba(30, 58, 138, 0.13)"
        >
          <h3 style={cardStyles.heading}>
            <span>🏛️ Sarkari Sahayata &amp; Helpline</span>
            <span
              style={{
                ...cardStyles.badge,
                color: "#93c5fd",
                borderColor: "rgba(96, 165, 250, 0.35)",
                backgroundColor: "rgba(96, 165, 250, 0.1)",
              }}
            >
              Kisan support
            </span>
          </h3>
          {answer.schemes.length ? (
            <div style={{ display: "grid", gap: 13 }}>
              {answer.schemes.map((scheme, index) => (
                <div
                  key={`${scheme.name}-${index}`}
                  style={{
                    paddingBottom: 12,
                    borderBottom:
                      index < answer.schemes.length - 1
                        ? "1px solid rgba(147, 197, 253, 0.12)"
                        : "none",
                  }}
                >
                  <h4
                    style={{
                      margin: "0 0 5px",
                      color: "#bfdbfe",
                      fontSize: 13,
                    }}
                  >
                    {scheme.name}
                  </h4>
                  <p style={cardStyles.body}>{scheme.benefit}</p>
                  <p style={{ ...cardStyles.body, marginTop: 5 }}>
                    <strong style={{ color: "#93c5fd" }}>Aavedan:</strong>{" "}
                    {scheme.howToApply}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p style={{ ...cardStyles.body, marginBottom: 13 }}>
              Yojana ki jankari ke liye apne najdeeki krishi karyalaya se sampark
              karein.
            </p>
          )}
          <a
            href={phoneHref}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              marginTop: 13,
              padding: "9px 12px",
              border: "1px solid rgba(96, 165, 250, 0.42)",
              borderRadius: 999,
              background: "rgba(37, 99, 235, 0.17)",
              color: "#bfdbfe",
              fontSize: 12,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            📞 {answer.helpline}
          </a>
        </ResultCard>
      </div>
      <p className="solution-disclaimer">
        Zaroori faisle se pehle apne local krishi adhikari ya adhikarik yojana
        portal se jankari pakki karein.
      </p>
    </article>
  );
}

export default function App() {
  const [apiKey, setApiKey] = useState(getInitialApiKey);
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleApiKeyChange(event) {
    const value = event.target.value;
    setApiKey(value);

    try {
      if (value.trim()) {
        window.localStorage.setItem("GEMINI_API_KEY", value.trim());
        window.localStorage.removeItem("gramin-mitra-google-ai-api-key");
      } else {
        window.localStorage.removeItem("GEMINI_API_KEY");
        window.localStorage.removeItem("gramin-mitra-google-ai-api-key");
      }
    } catch (storageError) {
      console.warn("Could not save the Google AI Studio API key.", storageError);
    }
  }

  async function handleAsk(event) {
    event.preventDefault();
    const query = prompt.trim();
    const effectiveApiKey = apiKey.trim() || ENV_API_KEY;

    if (!query) {
      setError("Kripya kisan bhai apni samasya likhein ya koi preset chunein.");
      return;
    }
    if (!effectiveApiKey) {
      setError(
        "API key uplabdh nahi hai. Developer / Evaluation Settings mein key enter karein.",
      );
      return;
    }

    setLoading(true);
    setError("");
    setAnswer(null);

    try {
      const result = await askGemma({ prompt: query, apiKey: effectiveApiKey });
      setAnswer(normalizeAnswer(result));
    } catch (requestError) {
      console.error(requestError);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Network ya API issue aaya hai.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="site-header">
        <a className="brand" href="#" aria-label="Gramin-Mitra AI home">
          <span className="brand-mark" aria-hidden="true">🌾</span>
          <span className="brand-name">
            <span className="brand-hindi">ग्रामीण मित्र</span>
            <span className="brand-subtitle">GRAMIN-MITRA AI</span>
          </span>
        </a>
        <div className="header-badges">
          <span className="badge badge-model">
            <span className="status-dot" aria-hidden="true" />
            Google Gemma 4 Open Architecture
          </span>
        </div>
      </header>

      <main className="main-content">
        <section className="hero">
          <div className="hero-copy">
            <span className="hero-kicker">
              <span className="status-dot" aria-hidden="true" />
              Hacktoberfest Ranchi 2026 · Best Use of Gemma 4
            </span>
            <h1>
              Kheti ki har samasya ka
              <br />
              <span>saathi samadhan.</span>
            </h1>
            <p>
              Fasal ki pareshani, sasta desi upchaar ya sarkari yojana — apna
              sawal poochhein aur paayen saaf, kaam ki salah.
            </p>
            <p style={{ marginTop: 9, color: "#91aea0", fontSize: 12, lineHeight: 1.6 }}>
              Gemma 4 open architecture · Edge-ready design compatible with
              Ollama / llama.cpp for offline rural kiosks.
            </p>
          </div>
          <div className="hero-art" aria-hidden="true">
            <span className="sun" />
            <span className="field field-back" />
            <span className="field" />
            <span className="field field-front" />
            <span className="art-leaf leaf-one">✦</span>
            <span className="art-leaf leaf-two">✦</span>
          </div>
        </section>

        <div className="workspace">
          <details
            style={{
              marginBottom: 14,
              overflow: "hidden",
              border: "1px solid rgba(167, 243, 208, 0.13)",
              borderRadius: 14,
              background: "rgba(6, 55, 42, 0.55)",
            }}
          >
            <summary
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                padding: "15px 17px",
                color: "#c2d7ca",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 700,
                listStylePosition: "inside",
              }}
            >
              <span>⚙️ Developer &amp; Evaluation Settings</span>
              <span
                style={{
                  color: apiKey.trim() || ENV_API_KEY ? "#6ee7b7" : "#fbbf24",
                  fontSize: 11,
                  fontWeight: 600,
                }}
              >
                {apiKey.trim() || ENV_API_KEY
                  ? "API key configured"
                  : "API key required"}
              </span>
            </summary>
            <div
              style={{
                padding: "0 17px 16px",
                borderTop: "1px solid rgba(167, 243, 208, 0.1)",
              }}
            >
              <label
                htmlFor="api-key"
                style={{
                  display: "block",
                  margin: "14px 0 7px",
                  color: "#d3e7dc",
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                🔑 Google AI Studio API Key
              </label>
              <input
                id="api-key"
                className="api-key-input"
                type="password"
                autoComplete="off"
                spellCheck="false"
                value={apiKey}
                onChange={handleApiKeyChange}
                placeholder="Paste your Google AI Studio API key here..."
              />
              <p className="field-hint">
                Browser-saved key pehle use hogi; warna VITE_GEMINI_API_KEY.
                Primary: Gemini 3.8 Flash, with automatic model fallback.
              </p>
            </div>
          </details>

          <section className="assistant-panel" aria-label="Kisan sawal form">
            <div className="presets">
              <span className="presets-label">⚡ Jaldi shuru karein</span>
              <div className="chip-list">
                {PRESETS.map((preset) => (
                  <button
                    className="preset-chip"
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      setPrompt(preset.prompt);
                      setError("");
                    }}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <form className="query-form" onSubmit={handleAsk}>
              <label className="field-label" htmlFor="farmer-question">
                Aapki kya madad karun?
              </label>
              <div className="textarea-wrap">
                <textarea
                  id="farmer-question"
                  rows={4}
                  maxLength={2000}
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Apni fasal, rog, sarkari yojana ya sinchai ki pareshani yahan likhein..."
                  disabled={loading}
                  required
                />
                <span className="character-count">{prompt.length}/2000</span>
              </div>
              <div className="form-footer">
                <p className="form-note">
                  <span aria-hidden="true">🔒</span> Aapka sawal sirf jawab
                  banane ke liye bheja jayega.
                </p>
                <button
                  className="submit-button"
                  type="submit"
                  disabled={loading || !prompt.trim()}
                >
                  {loading ? (
                    <>
                      <span className="spinner" aria-hidden="true" />
                      Samadhan dhoondh rahe hain...
                    </>
                  ) : (
                    "Samadhan Prapt Karein 🚜"
                  )}
                </button>
              </div>
              <p className="inline-hint">
                <span aria-hidden="true">✦</span> Preset chunne ke baad sawal
                dekhein ya badlein, phir button dabayein.
              </p>
            </form>

            {error && (
              <div className="error-message" role="alert">
                <span aria-hidden="true">!</span>
                <div>
                  <strong>Jawab nahi mil saka:</strong> {error}
                </div>
              </div>
            )}
          </section>

          {answer ? (
            <SolutionView answer={answer} />
          ) : (
            !loading &&
            !error && (
              <div className="empty-state">
                <span className="empty-icon" aria-hidden="true">🌱</span>
                <p>Aapka samadhan yahan dikhega</p>
                <span>Apna sawal likhein ya upar se koi vishay chunein.</span>
              </div>
            )
          )}
        </div>
      </main>

      <footer className="site-footer">
        <span>Gramin-Mitra AI</span>
        <span className="footer-divider" aria-hidden="true">•</span>
        Kisanon ke liye, kisanon ke saath
      </footer>
    </div>
  );
}
