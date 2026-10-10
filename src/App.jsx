import { useState } from "react";

const GEMINI_MODEL = "gemini-2.5-flash";
const MAX_PROMPT_LENGTH = 2000;
const HELPLINE = "Kisan Call Center: 1800-180-1551";

const RESPONSE_SCHEMA = {
  type: "OBJECT",
  properties: {
    greeting: { type: "STRING" },
    crop: { type: "STRING" },
    disease_name: { type: "STRING" },
    risk_level: { type: "STRING" },
    risk_score_percent: { type: "NUMBER" },
    diagnosis: { type: "STRING" },
    desi_remedies: {
      type: "ARRAY",
      items: { type: "STRING" },
    },
    government_schemes: {
      type: "ARRAY",
      items: {
        type: "OBJECT",
        properties: {
          name: { type: "STRING" },
          benefit: { type: "STRING" },
          how_to_apply: { type: "STRING" },
        },
        required: ["name", "benefit", "how_to_apply"],
      },
    },
    emergency_helpline: { type: "STRING" },
  },
  required: [
    "greeting",
    "crop",
    "disease_name",
    "risk_level",
    "risk_score_percent",
    "diagnosis",
    "desi_remedies",
    "government_schemes",
    "emergency_helpline",
  ],
};

const SYSTEM_INSTRUCTION = `You are Gramin-Mitra AI (ग्रामीण मित्र), a practical rural agriculture and farmer-welfare assistant. Analyze the user's actual crop, symptoms, soil, farming, or government-scheme question; do not assume the crop is rice or invent symptoms not provided. Reply in simple Hinglish. If important information is missing, say what needs clarification in the diagnosis and avoid guessing. Give crop-specific, low-cost remedies; do not give pesticide dosages or spray schedules without a confirmed diagnosis. Do not invent scheme eligibility or benefits; advise verification with official sources when uncertain. Return only the requested JSON object. Set risk_score_percent to a number from 0 to 100. Always include arrays for desi_remedies and government_schemes.`;

const PRESETS = [
  {
    label: "🌾 Fasal ki dikkat",
    prompt: "Mere dhaan ke patton par peele rang ke saath brown daag hain. Kya karun?",
  },
  {
    label: "🌿 Desi upchaar",
    prompt: "Tamatar ki fasal mein keede dikh rahe hain. Kam kharch wala jaivik upchaar batayein.",
  },
  {
    label: "🏛️ Sarkari yojana",
    prompt: "Chhote kisan ke liye Kisan Credit Card aur fasal bima ke liye kaise aavedan karein?",
  },
];

function validateAnswer(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Gemini ka jawab JSON object nahi hai. Kripya phir koshish karein.");
  }

  const requiredStrings = [
    "greeting",
    "crop",
    "disease_name",
    "risk_level",
    "diagnosis",
    "emergency_helpline",
  ];
  if (requiredStrings.some((key) => typeof value[key] !== "string")) {
    throw new Error("Gemini ka JSON jawab zaroori fields ke bina mila.");
  }
  if (
    typeof value.risk_score_percent !== "number" ||
    !Number.isFinite(value.risk_score_percent) ||
    value.risk_score_percent < 0 ||
    value.risk_score_percent > 100
  ) {
    throw new Error("Gemini ke jawab mein risk score 0 se 100 ke beech nahi hai.");
  }
  if (
    !Array.isArray(value.desi_remedies) ||
    value.desi_remedies.some((item) => typeof item !== "string")
  ) {
    throw new Error("Gemini ke jawab mein desi_remedies valid array nahi hai.");
  }
  if (
    !Array.isArray(value.government_schemes) ||
    value.government_schemes.some(
      (scheme) =>
        !scheme ||
        typeof scheme !== "object" ||
        typeof scheme.name !== "string" ||
        typeof scheme.benefit !== "string" ||
        typeof scheme.how_to_apply !== "string",
    )
  ) {
    throw new Error("Gemini ke jawab mein government_schemes valid array nahi hai.");
  }

  return value;
}

async function analyzeCrop(apiKey, prompt) {
  const endpoint = new URL(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`,
  );
  endpoint.searchParams.set("key", apiKey);

  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      contents: [
        {
          role: "user",
          parts: [{ text: `${SYSTEM_INSTRUCTION}\n\nFarmer's question: ${prompt}` }],
        },
      ],
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: RESPONSE_SCHEMA,
      },
    }),
  });

  const data = await response.json().catch(() => null);
  if (!response.ok || data?.error) {
    throw new Error(
      data?.error?.message || `Gemini API ne request asweekar ki (HTTP ${response.status}).`,
    );
  }

  const answerText = data?.candidates?.[0]?.content?.parts
    ?.map((part) => part.text)
    .filter(Boolean)
    .join("")
    .trim();
  if (!answerText) {
    throw new Error("Gemini se jawab nahi mila. Kripya apni API key aur sawal jaanchein.");
  }

  let parsed;
  try {
    parsed = JSON.parse(answerText);
  } catch {
    throw new Error("Gemini ka jawab valid JSON nahi tha. Kripya phir koshish karein.");
  }
  return validateAnswer(parsed);
}

function ResultCard({ title, icon, children }) {
  return (
    <section className="solution-section" aria-label={title}>
      <h3>
        <span aria-hidden="true">{icon}</span>
        {title}
      </h3>
      {children}
    </section>
  );
}

function AnswerCards({ answer }) {
  return (
    <article className="solution-card" aria-labelledby="solution-title">
      <header className="solution-heading">
        <span className="solution-icon" aria-hidden="true">🌱</span>
        <div>
          <p className="eyebrow">Aapke sawal ka jawab</p>
          <h2 id="solution-title">Gramin-Mitra Salah</h2>
        </div>
        <span className="answer-tag">{answer.crop}</span>
      </header>
      <div className="solution-sections">
        <ResultCard title="Pehchan" icon="🔍">
          <p className="solution-text"><strong>{answer.greeting}</strong></p>
          <p className="solution-text"><strong>{answer.disease_name}</strong> · Risk: {answer.risk_level} ({answer.risk_score_percent}%)</p>
          <p className="solution-text">{answer.diagnosis}</p>
        </ResultCard>

        <ResultCard title="Desi Upchaar" icon="🌿">
          {answer.desi_remedies.length ? (
            <ol
              className="solution-text"
              style={{ display: "grid", gap: 10, paddingLeft: 20 }}
            >
              {answer.desi_remedies.map((remedy, index) => (
                <li key={`${index}-${remedy}`}>{remedy}</li>
              ))}
            </ol>
          ) : (
            <p className="solution-text">Is sawal ke liye koi upchaar sujhav nahi diya gaya.</p>
          )}
        </ResultCard>

        <ResultCard title="Sarkari Yojana" icon="🏛️">
          {answer.government_schemes.length ? (
            <div style={{ display: "grid", gap: 11 }}>
              {answer.government_schemes.map((scheme, index) => (
                <div
                  key={`${index}-${scheme.name}`}
                  style={{
                    paddingBottom: 10,
                    borderBottom:
                      index < answer.government_schemes.length - 1
                        ? "1px solid rgba(167, 243, 208, 0.09)"
                        : "none",
                  }}
                >
                  <h4 style={{ margin: "0 0 5px", color: "#bfdbfe", fontSize: 13 }}>
                    {scheme.name}
                  </h4>
                  <p className="solution-text">{scheme.benefit}</p>
                  <p className="solution-text" style={{ marginTop: 5 }}>
                    <strong>Aavedan:</strong> {scheme.how_to_apply}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <p className="solution-text">Is sawal ke liye koi yojana sujhav nahi diya gaya.</p>
          )}
          <a
            href="tel:18001801551"
            style={{
              display: "inline-flex",
              marginTop: 13,
              padding: "9px 12px",
              border: "1px solid rgba(96, 165, 250, 0.42)",
              borderRadius: 999,
              color: "#bfdbfe",
              fontSize: 12,
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            📞 {answer.emergency_helpline || HELPLINE}
          </a>
        </ResultCard>
      </div>
      <p className="solution-disclaimer">
        Dawa ya yojana se juda kadam uthane se pehle adhikarik srot ya sthaniya krishi adhikari se tasdeek karein.
      </p>
    </article>
  );
}

export default function App() {
  const [apiKey, setApiKey] = useState("");
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    const cleanKey = apiKey.trim();
    const cleanPrompt = prompt.trim();
    if (!cleanKey) {
      setError("Kripya apni Google AI Studio API key enter karein.");
      return;
    }
    if (!cleanPrompt) {
      setError("Kripya apni fasal ya samasya ka vivaran likhein.");
      return;
    }

    setLoading(true);
    setError("");
    setAnswer(null);
    try {
      setAnswer(await analyzeCrop(cleanKey, cleanPrompt));
    } catch (requestError) {
      console.error("Gemini analysis failed:", requestError);
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Gemini se sampark nahi ho saka. Network aur API key jaanchein.",
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
          <span className="badge badge-model">Gemini 2.5 Flash</span>
        </div>
      </header>

      <main className="main-content">
        <section className="hero">
          <div className="hero-copy">
            <span className="hero-kicker">🌱 Kisanon ke liye AI salah</span>
            <h1>Kheti ki har baat,<br /><span>aapki bhasha mein.</span></h1>
            <p>Fasal, upchaar ya sarkari yojana ke baare mein poochhein aur apni zaroorat ke mutabik jawab paayein.</p>
          </div>
        </section>

        <div className="workspace">
          <section className="api-key-panel" aria-labelledby="api-key-label">
            <div className="api-key-copy">
              <span className="api-key-icon" aria-hidden="true">🔑</span>
              <div>
                <label className="field-label" id="api-key-label" htmlFor="api-key">
                  Google AI Studio API key
                </label>
                <p className="field-hint">Key is session mein hi rahegi; is browser mein save nahi hogi.</p>
              </div>
            </div>
            <input
              className="api-key-input"
              id="api-key"
              type="password"
              autoComplete="off"
              spellCheck="false"
              value={apiKey}
              onChange={(event) => setApiKey(event.target.value)}
              placeholder="Apni API key enter karein"
              disabled={loading}
              required
            />
          </section>

          <section className="assistant-panel" id="ask-mitra" aria-label="Fasal analysis">
            <form className="query-form" onSubmit={handleSubmit}>
              <label className="field-label" htmlFor="farmer-question">Fasal ya samasya ka vivaran</label>
              <div className="textarea-wrap">
                <textarea
                  id="farmer-question"
                  rows={4}
                  maxLength={MAX_PROMPT_LENGTH}
                  value={prompt}
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Fasal ka naam, lakshan, aur dikkat apne shabdon mein likhein..."
                  disabled={loading}
                  required
                />
                <span className="character-count">{prompt.length}/{MAX_PROMPT_LENGTH}</span>
              </div>
              <div className="form-footer">
                <p className="form-note">Aapki key seedhe Google Gemini API ko bheji jaati hai.</p>
                <button className="submit-button" type="submit" disabled={loading || !prompt.trim() || !apiKey.trim()}>
                  {loading ? (
                    <><span className="spinner" aria-hidden="true" /> Vishleshan ho raha hai...</>
                  ) : (
                    <>Vishleshan karein <span aria-hidden="true">↗</span></>
                  )}
                </button>
              </div>
              <div className="presets">
                <span className="presets-label">Misal sawal</span>
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
                      disabled={loading}
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </form>
            {error && (
              <div className="error-message" role="alert">
                <span aria-hidden="true">!</span>
                <div><strong>Jawab nahi mil saka:</strong> {error}</div>
              </div>
            )}
          </section>

          {answer ? (
            <AnswerCards answer={answer} />
          ) : (
            !loading && !error && (
              <div className="empty-state">
                <span className="empty-icon" aria-hidden="true">🌱</span>
                <p>Aapka jawab yahan milega</p>
                <span>API key aur sawal enter karke analysis shuru karein.</span>
              </div>
            )
          )}
        </div>
      </main>

      <footer className="site-footer">
        <span>Gramin-Mitra AI</span>
        <span className="footer-divider" aria-hidden="true">✦</span>
        Aapki mehnat, hamari madad.
      </footer>
    </div>
  );
}
