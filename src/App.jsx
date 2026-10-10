import React, { useEffect, useRef, useState } from "react";
import { askGemma } from "./services/gemmaService.js";

const DEFAULT_HELPLINE = "Kisan Call Center: 1800-180-1551";
const RESPONSE_LANGUAGES = [
  "Hinglish (Mix)",
  "Hindi (हिन्दी)",
  "Bhojpuri (भोजपुरी)",
];

function getInitialApiKey() {
  try {
    return window.localStorage?.getItem("GEMINI_API_KEY") || "";
  } catch (storageError) {
    console.warn("Could not read the saved custom API key.", storageError);
    return "";
  }
}

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

function createSafeFallbackAnswer(prompt, reason) {
  return {
    greeting: "Ram Ram Kisan bhai!",
    crop: prompt?.trim() || "Aapki fasal / query",
    diseaseName: "AI se pushti abhi uplabdh nahi",
    riskLevel: "Jaanch zaroori",
    riskScore: null,
    diagnosis:
      "Live AI jawab nahi mil saka, isliye kisi rog ya poshak-tatva ki kami ka nidan nahi kiya gaya. Sahi pehchan ke liye najdeeki Krishi Vigyan Kendra ya krishi adhikari se sampark karein.",
    remedies: [
      "Bina samasya ki pakki pehchan ke fasal par dawa ya spray na karein.",
      "Prabhavit paudhon ki saaf tasveer aur lakshan note karke najdeeki Krishi Vigyan Kendra ko dikhayein.",
      "Zyada nuksan ya tezi se failav dikhe to apne sthaniya krishi adhikari se jaldi salah lein.",
    ],
    schemes: [],
    helpline: DEFAULT_HELPLINE,
    isFallback: true,
    fallbackReason: reason || "Live AI service se sampark nahi ho saka.",
  };
}

function normalizeAnswer(text, prompt) {
  const rawText =
    typeof text === "string"
      ? text
          .replace(/```(?:json)?/gi, "")
          .replace(/```/g, "")
          .trim()
      : "";
  let parsed;

  try {
    parsed = extractJsonObject(rawText);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("AI ka jawab expected JSON object format mein nahi hai.");
    }
  } catch (parseError) {
    console.warn("AI response was not valid JSON.", parseError);
    return createSafeFallbackAnswer(
      prompt,
      "AI ka jawab samajhne layak JSON format mein nahi tha.",
    );
  }

  const asText = (value, fallback = "") =>
    typeof value === "string" ? value.trim() : fallback;
  const parsedScore = parsed.risk_score_percent;
  const riskScore =
    typeof parsedScore === "number" && Number.isFinite(parsedScore)
      ? Math.min(100, Math.max(0, Math.round(parsedScore)))
      : null;
  const schemes = Array.isArray(parsed?.government_schemes)
    ? parsed.government_schemes
        ?.filter((scheme) => scheme && typeof scheme === "object")
        ?.map((scheme) => ({
          name: asText(scheme.name, "Sarkari yojana"),
          benefit: asText(scheme.benefit, "Fayde ki jankari uplabdh nahi hai."),
          howToApply: asText(
            scheme.how_to_apply,
            "Apne najdeeki krishi karyalaya ya adhikarik portal par sampark karein.",
          ),
        })) || []
    : [];
  const helpline = asText(parsed.emergency_helpline, DEFAULT_HELPLINE);

  return {
    greeting: asText(parsed.greeting),
    crop: asText(parsed.crop, "Aapki fasal / query"),
    diseaseName: asText(parsed.disease_name, "Samasya ki pehchan"),
    riskLevel: asText(
      parsed.risk_level,
      riskScore === null
        ? "Risk score uplabdh nahi"
        : riskScore >= 70
          ? "Gambhir (High)"
          : riskScore >= 35
            ? "Madhyam (Medium)"
            : "Samanya (Low)",
    ),
    riskScore,
    diagnosis: asText(parsed.diagnosis, "Vistar se pehchan nahi di gayi."),
    remedies: Array.isArray(parsed?.desi_remedies)
      ? parsed.desi_remedies?.filter(
          (remedy) => typeof remedy === "string" && remedy.trim(),
        ) || []
      : [],
    schemes,
    helpline,
    isFallback: false,
    fallbackReason: "",
  };
}

function getRiskColors(score) {
  if (score === null || score === undefined) {
    return {
      foreground: "#cbd5e1",
      background: "rgba(203, 213, 225, 0.12)",
      border: "rgba(203, 213, 225, 0.36)",
    };
  }
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
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechError, setSpeechError] = useState("");
  const utteranceRef = useRef(null);
  const safeAnswer = answer || {};
  const hasRiskScore = Number.isFinite(safeAnswer.riskScore);
  const riskColors = getRiskColors(safeAnswer.riskScore);
  const callableNumber = (safeAnswer.helpline || DEFAULT_HELPLINE).replace(/[^\d+]/g, "");
  const remedies = Array.isArray(safeAnswer.remedies) ? safeAnswer.remedies : [];
  const schemes = Array.isArray(safeAnswer.schemes) ? safeAnswer.schemes : [];
  const phoneHref = callableNumber
    ? `tel:${callableNumber}`
    : "tel:18001801551";

  useEffect(() => () => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel();
    }
  }, []);

  function toggleSpeech() {
    if (typeof window === "undefined" || !window.speechSynthesis || typeof window.SpeechSynthesisUtterance !== "function") {
      setSpeechError("Is browser mein awaaz sunane ki suvidha uplabdh nahi hai.");
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      utteranceRef.current = null;
      setSpeechError("");
      return;
    }

    const speechText = [
      safeAnswer.diagnosis,
      ...remedies,
    ].filter(Boolean).join(". ");

    if (!speechText) {
      setSpeechError("Sunane ke liye jawab uplabdh nahi hai.");
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new window.SpeechSynthesisUtterance(speechText);
    utterance.lang = "hi-IN";
    utterance.onend = () => {
      setIsSpeaking(false);
      utteranceRef.current = null;
    };
    utterance.onerror = (event) => {
      setIsSpeaking(false);
      utteranceRef.current = null;
      if (event.error !== "canceled" && event.error !== "interrupted") {
        setSpeechError("Awaaz nahi chal saki. Aap jawab padh sakte hain.");
      }
    };

    utteranceRef.current = utterance;
    setSpeechError("");
    setIsSpeaking(true);
    try {
      window.speechSynthesis.speak(utterance);
    } catch (synthesisError) {
      setIsSpeaking(false);
      utteranceRef.current = null;
      setSpeechError("Awaaz nahi chal saki. Aap jawab padh sakte hain.");
      console.warn("Speech synthesis could not be started.", synthesisError);
    }
  }

  return (
    <article className="solution-card" aria-labelledby="solution-title">
      <header className="solution-heading">
        <span className="solution-icon" aria-hidden="true">💡</span>
        <div>
          <p className="eyebrow">
            {safeAnswer.isFallback
              ? "LIVE AI JAWAB UPLABDH NAHI"
              : "Aapke liye taiyar kiya gaya"}
          </p>
          <h2 id="solution-title">
            {safeAnswer.isFallback
              ? "Surakshit agle kadam"
              : "Gramin-Mitra Salah &amp; Upchaar"}
          </h2>
        </div>
        <span className="answer-tag">
          {safeAnswer.isFallback ? "General safety" : "Kheti salah"}
        </span>
      </header>
      {safeAnswer.isFallback && (
        <div className="service-fallback-notice" role="status">
          <span aria-hidden="true">!</span>
          <div>
            <strong>Live AI salah abhi uplabdh nahi hai.</strong>{" "}
            Neeche di gayi jaankari general safety guidance hai, fasal ka diagnosis nahi.
            {safeAnswer.fallbackReason && (
              <div style={{ marginTop: 5, fontSize: 12 }}>
                Karan: {safeAnswer.fallbackReason}
              </div>
            )}
          </div>
        </div>
      )}
      <div className="speech-controls">
        <button
          className="speech-button"
          type="button"
          onClick={toggleSpeech}
          aria-pressed={isSpeaking}
        >
          {isSpeaking ? "⏹️ Band Karein" : "🔊 Awaaz Me Sunein"}
        </button>
        {speechError && <span className="speech-error" role="status">{speechError}</span>}
      </div>

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
              {safeAnswer.diseaseName || "Samasya ki pehchan"}
            </span>
          </h3>
          {safeAnswer.greeting && (
            <p style={{ ...cardStyles.body, marginBottom: 10 }}>
              {safeAnswer.greeting}
            </p>
          )}
          <p style={{ ...cardStyles.body, marginBottom: 8 }}>
            <strong style={{ color: "#fcd34d" }}>Fasal / sandarbh:</strong>{" "}
            {safeAnswer.crop || "Aapki fasal / query"}
          </p>
          <p style={cardStyles.body}>{safeAnswer.diagnosis || "Vistar se pehchan nahi di gayi."}</p>

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
                {hasRiskScore
                  ? `${safeAnswer.riskLevel || "Risk"} · ${safeAnswer.riskScore}%`
                  : "Risk score ke liye live jaanch zaroori"}
              </span>
            </div>
            <div
              role="progressbar"
              aria-label="Fasal risk score"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuetext={
                hasRiskScore
                  ? `${safeAnswer.riskScore}%`
                  : "Risk score uplabdh nahi; live diagnosis zaroori"
              }
              {...(hasRiskScore ? { "aria-valuenow": safeAnswer.riskScore } : {})}
              style={{
                height: 9,
                overflow: "hidden",
                borderRadius: 999,
                background: "rgba(167, 243, 208, 0.12)",
              }}
            >
              <div
                style={{
                  width: `${hasRiskScore ? safeAnswer.riskScore : 0}%`,
                  height: "100%",
                  borderRadius: "inherit",
                  backgroundColor: hasRiskScore ? riskColors.foreground : "transparent",
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
          {remedies.length ? (
            <ol
              style={{
                display: "grid",
                gap: 12,
                margin: 0,
                padding: 0,
                listStyle: "none",
              }}
            >
              {remedies?.map((remedy, index) => (
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
              )) || []}
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
          {schemes.length ? (
            <div style={{ display: "grid", gap: 13 }}>
              {schemes?.map((scheme, index) => (
                <div
                  key={`${scheme.name}-${index}`}
                  style={{
                    paddingBottom: 12,
                    borderBottom:
                      index < schemes.length - 1
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
              )) || []}
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
            📞 {safeAnswer.helpline || DEFAULT_HELPLINE}
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

function GraminMitraApp() {
  const [prompt, setPrompt] = useState("");
  const [apiKey, setApiKey] = useState(getInitialApiKey);
  const [showApiKey, setShowApiKey] = useState(false);
  const [responseLanguage, setResponseLanguage] = useState(RESPONSE_LANGUAGES[0]);
  const [answer, setAnswer] = useState(null);
  const [error, setError] = useState("");
  const [voiceError, setVoiceError] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [loading, setLoading] = useState(false);
  const recognitionRef = useRef(null);

  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      recognitionRef.current = null;
    };
  }, []);

  function toggleVoiceInput() {
    if (isListening) {
      recognitionRef.current?.stop();
      return;
    }

    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setVoiceError("Is browser mein voice typing supported nahi hai. Aap sawal type kar sakte hain.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = responseLanguage.startsWith("Bhojpuri")
        ? "hi-IN"
        : responseLanguage.startsWith("Hindi")
          ? "hi-IN"
          : "en-IN";
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.onresult = (event) => {
        const transcript = Array.from(event.results || [])
          .map((result) => result?.[0]?.transcript || "")
          .join(" ")
          .trim();

        if (transcript) {
          setPrompt((currentPrompt) =>
            `${currentPrompt.trim()}${currentPrompt.trim() ? " " : ""}${transcript}`.slice(0, 2000),
          );
        }
      };
      recognition.onerror = (event) => {
        setIsListening(false);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setVoiceError("Mic ki permission nahi mili. Browser settings mein mic allow karein, ya sawal type karein.");
        } else if (event.error === "no-speech") {
          setVoiceError("Awaaz sunai nahi di. Dobara koshish karein ya sawal type karein.");
        } else {
          setVoiceError("Voice typing nahi chal saki. Aap sawal type kar sakte hain.");
        }
        recognitionRef.current = null;
      };
      recognition.onend = () => {
        setIsListening(false);
        recognitionRef.current = null;
      };

      setVoiceError("");
      recognitionRef.current = recognition;
      recognition.start();
      setIsListening(true);
    } catch (recognitionError) {
      recognitionRef.current = null;
      setIsListening(false);
      setVoiceError("Mic shuru nahi ho saka. Browser permission jaanchein ya sawal type karein.");
      console.warn("Speech recognition could not be started.", recognitionError);
    }
  }

  function selectQuestion(question) {
    setPrompt(question);
    setError("");
    document.getElementById("ask-mitra")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
    window.setTimeout(() => {
      document.getElementById("farmer-question")?.focus({ preventScroll: true });
    }, 450);
  }

  async function handleAsk(event) {
    event.preventDefault();
    const query = prompt.trim();

    if (!query) {
      setError("Kripya kisan bhai apni samasya likhein ya koi preset chunein.");
      return;
    }

    setLoading(true);
    setError("");
    setAnswer(null);

    try {
      const result = await askGemma({
        prompt: query,
        language: responseLanguage,
        apiKey,
      });
      setAnswer(normalizeAnswer(result, query));
    } catch (err) {
      console.error(err);
      setError("");
      setAnswer(
        createSafeFallbackAnswer(
          query,
          err instanceof Error ? err.message : "Network ya API issue aaya hai.",
        ),
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
        <nav className="primary-nav" aria-label="Main navigation">
          <a href="#madad">Hamari madad</a>
          <a href="#kaise-kaam-karta-hai">Kaise kaam karta hai</a>
          <a href="#technology">Technology</a>
        </nav>
        <div className="header-badges">
          <span className="badge badge-model">
            <span className="status-dot" aria-hidden="true" />
            Google Gemma 4 Open Architecture
          </span>
          <a className="header-cta" href="#ask-mitra">Sawal poochhein <span aria-hidden="true">↗</span></a>
        </div>
      </header>

      <main className="main-content">
        <section className="hero">
          <div className="hero-copy">
            <span className="hero-kicker">
              <span className="status-dot" aria-hidden="true" />
              Kisanon ke liye AI · Google Gemma 4 Open Architecture
            </span>
            <h1>
              Kheti ki har baat,
              <br />
              <span>aapki bhasha mein.</span>
            </h1>
            <p>
              Fasal, kheti ke saste tareeke ya sarkari yojana—apni boli mein
              poochhiye aur agla kadam jaanein.
            </p>
            <div className="hero-trust-row" aria-label="Gramin-Mitra features">
              <span><i aria-hidden="true">✦</i> Saral Hinglish</span>
              <span><i aria-hidden="true">✦</i> Kheti ke kaam ke sujhav</span>
              <span><i aria-hidden="true">✦</i> Yojana ki jaankari</span>
            </div>
            <div className="hero-actions">
              <a className="hero-primary-action" href="#ask-mitra">
                Apna sawal likhein <span aria-hidden="true">↗</span>
              </a>
              <a className="hero-secondary-action" href="#kaise-kaam-karta-hai">
                Dekhein kaise madad milegi <span aria-hidden="true">↓</span>
              </a>
            </div>
          </div>
          <div className="hero-art">
            <img
              src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=85"
              alt="Subah ki roshni mein hari-bhari fasal ke khet"
              loading="eager"
            />
            <div className="hero-photo-shade" />
            <div className="hero-image-caption">
              <span className="hero-caption-icon" aria-hidden="true">🌱</span>
              <span>
                <strong>Kheti ki salah, apni bhasha mein</strong>
                <small>Fasal · Upchaar · Yojana</small>
              </span>
            </div>
            <span className="photo-credit-note">Gramin-Mitra AI · Kisan ke saath</span>
          </div>
        </section>

        <div className="workspace" id="ask-mitra">
          <section className="assistant-panel" aria-label="Kisan sawal form">
            <div className="assistant-intro">
              <div>
                <span className="assistant-eyebrow">GRAMIN-MITRA AAPKE SAATH</span>
                <h2>Kheti ka sawal? Yahin poochhein.</h2>
                <p>
                  Fasal, kheti ke tareeke ya sarkari yojana—saral jawab paayein.
                </p>
              </div>
              <span className="assistant-intro-icon" aria-hidden="true">✍️</span>
            </div>

            <div className="custom-key-field">
              <label htmlFor="custom-api-key">
                🔑 Evaluation / API Key Settings (For Judges &amp; Devs)
                <span>Optional · blank uses the secure server key</span>
              </label>
              <div className="custom-key-input-wrap">
                <input
                  id="custom-api-key"
                  type={showApiKey ? "text" : "password"}
                  autoComplete="off"
                  spellCheck="false"
                  value={apiKey}
                  onChange={(event) => {
                    const nextApiKey = event.target.value;
                    setApiKey(nextApiKey);
                    try {
                      if (nextApiKey) {
                        window.localStorage?.setItem("GEMINI_API_KEY", nextApiKey);
                      } else {
                        window.localStorage?.removeItem("GEMINI_API_KEY");
                      }
                    } catch (storageError) {
                      console.warn("Could not save the custom API key on this device.", storageError);
                    }
                  }}
                  placeholder="Apni custom Google AI Studio API Key enter karein ya default use hone dein..."
                  aria-describedby="custom-api-key-hint"
                  disabled={loading}
                />
                <button
                  type="button"
                  className="key-visibility-button"
                  onClick={() => setShowApiKey((visible) => !visible)}
                  aria-label={showApiKey ? "API key chhupayein" : "API key dikhayein"}
                >
                  {showApiKey ? "Chhupayein" : "Dikhayein"}
                </button>
              </div>
              {apiKey.trim() && (
                <button
                  type="button"
                  className="key-clear-button"
                  onClick={() => {
                    setApiKey("");
                    setError("");
                    try {
                      window.localStorage?.removeItem("GEMINI_API_KEY");
                    } catch (storageError) {
                      console.warn("Could not remove the saved custom API key.", storageError);
                    }
                  }}
                  disabled={loading}
                >
                  Is key ko hata kar server key use karein
                </button>
              )}
              <span id="custom-api-key-hint">
                Apni custom key yahan save hoti hai. Field khaali ho to server par configured key use hogi.
              </span>
            </div>

            <form className="query-form" onSubmit={handleAsk}>
              <label className="field-label" htmlFor="farmer-question">
                <span>Aapka sawal</span>
              </label>
              <div className="language-row">
                <label htmlFor="response-language">Jawab ki bhasha</label>
                <select
                  id="response-language"
                  value={responseLanguage}
                  onChange={(event) => setResponseLanguage(event.target.value)}
                  disabled={loading}
                >
                  {RESPONSE_LANGUAGES.map((language) => (
                    <option key={language} value={language}>{language}</option>
                  ))}
                </select>
              </div>
              <div className="textarea-wrap">
                <textarea
                  id="farmer-question"
                  rows={4}
                  maxLength={2000}
                  value={prompt}
                  aria-describedby="prompt-char-count"
                  onChange={(event) => setPrompt(event.target.value)}
                  placeholder="Jaise: Dhaan ke patte peele pad rahe hain—kya karun?"
                  disabled={loading}
                  required
                />
                <button
                  className={`mic-button${isListening ? " is-listening" : ""}`}
                  type="button"
                  onClick={toggleVoiceInput}
                  disabled={loading}
                  aria-label={isListening ? "Voice typing band karein" : "Boli se sawal likhein"}
                  aria-pressed={isListening}
                  title={isListening ? "Sun raha hai — band karne ke liye dabayein" : "Boli se sawal likhein"}
                >
                  {isListening ? "⏹️ Rokein" : "🎙️ Mic se bolein"}
                </button>
                <span className="character-count" id="prompt-char-count">{prompt.length}/2000</span>
              </div>
              {voiceError && <p className="voice-error" role="status">{voiceError}</p>}
              <div className="form-footer">
                <p className="form-note">
                  <span aria-hidden="true">🔒</span> Aapka sawal surakshit server se bheja jaata hai.
                </p>
                <button
                  className="submit-button"
                  type="submit"
                  disabled={loading || !prompt.trim()}
                >
                  {loading ? (
                    <>
                      <span className="spinner" aria-hidden="true" />
                      Aapke sawal par kaam ho raha hai...
                    </>
                  ) : (
                    <>Salah paayein <span aria-hidden="true">↗</span></>
                  )}
                </button>
              </div>
              <div className="presets">
                <span className="presets-label">Shuru karne ke liye vishay chunein</span>
                <div className="chip-list">
                  {PRESETS?.map((preset) => (
                    <button
                      className="preset-chip"
                      key={preset.label}
                      type="button"
                      onClick={() => {
                        setPrompt(preset.prompt);
                        setError("");
                        document.getElementById("farmer-question")?.focus({
                          preventScroll: true,
                        });
                      }}
                    >
                      {preset.label}
                    </button>
                  )) || []}
                </div>
              </div>
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
                <p>Aapka jawab yahan milega</p>
                <span>Apna sawal likhein ya koi topic chunein—AI aapke kehne par hi chalega.</span>
              </div>
            )
          )}

        </div>

        <section className="safety-section" aria-labelledby="safety-title">
          <div className="safety-icon" aria-hidden="true">🤝</div>
          <div>
            <span className="section-kicker">ZIMMEDAAR SALAH</span>
            <h2 id="safety-title">AI se madad lein, zaroori faisla jaanch kar karein.</h2>
            <p>AI ki salah galat ya adhuri ho sakti hai. Dawa, fasal ya yojana se juda kadam uthane se pehle krishi visheshagya ya adhikarik sarkari srot se tasdeek karein.</p>
          </div>
          <a href="tel:18001801551" aria-label="Kisan Call Center ko 1800-180-1551 par call karein">
            📞 Kisan Call Center <strong>1800-180-1551</strong>
          </a>
        </section>

        <section className="value-strip" aria-label="Gramin-Mitra ke fayde">
          <div><span className="value-strip-icon">🌾</span><span><strong>Kheti par kendrit</strong><small>Roz ke kheti sawalon ke liye</small></span></div>
          <div><span className="value-strip-icon">💬</span><span><strong>Saral Hinglish</strong><small>Samajhne aur apnane layak</small></span></div>
          <div><span className="value-strip-icon">🛡️</span><span><strong>Surakshit connection</strong><small>API key server par surakshit</small></span></div>
          <div><span className="value-strip-icon">🌍</span><span><strong>Open architecture</strong><small>Gemma-powered, adaptable design</small></span></div>
        </section>

        <section className="info-section help-section" id="madad">
          <div className="section-heading">
            <span className="section-kicker">JAMEEN SE JUDE SAWAL</span>
            <h2>Jab zaroorat ho, <em>kaam ki baat.</em></h2>
            <p>Gramin-Mitra kheti aur kisan sahayata ke aam sawalon ko seedhi Hinglish mein samjhane ke liye bana hai.</p>
          </div>
          <div className="help-grid">
            <article className="help-card help-card-crop">
              <div className="help-card-image">
                <img
                  src="https://images.unsplash.com/photo-1499529112087-3cb3b73cec95?auto=format&fit=crop&w=900&q=80"
                  alt="Fasal ke beech kheti ka manzar"
                  loading="lazy"
                />
                <span className="help-card-number">01</span>
              </div>
              <div className="help-card-copy">
                <span className="help-card-icon">🔍</span>
                <h3>Fasal ki pehchan</h3>
                <p>Patton ke rang, daag ya fasal ki badhotri ke baare mein batayein. AI mumkin samasya aur agle kadam saral shabdon mein samjhata hai.</p>
                <button type="button" onClick={() => selectQuestion(PRESETS[0]?.prompt || "")}>Fasal ka sawal poochhein <span aria-hidden="true">↗</span></button>
              </div>
            </article>
            <article className="help-card help-card-remedy">
              <div className="help-card-image">
                <img
                  src="https://images.unsplash.com/photo-1416879595882-3373a0480b5b?auto=format&fit=crop&w=900&q=80"
                  alt="Paudhon aur mitti ki dekhbhal"
                  loading="lazy"
                />
                <span className="help-card-number">02</span>
              </div>
              <div className="help-card-copy">
                <span className="help-card-icon">🌿</span>
                <h3>Saste desi upchaar</h3>
                <p>Kam kharch aur jaivik vikalpon ke baare mein poochhein. Salah mein suraksha aur zaroorat par sthaniya visheshagya se jaanch ko ahmiyat di jaati hai.</p>
                <button type="button" onClick={() => selectQuestion(PRESETS[2]?.prompt || "")}>Upchaar ke baare mein poochhein <span aria-hidden="true">↗</span></button>
              </div>
            </article>
            <article className="help-card help-card-scheme">
              <div className="help-card-image">
                <img
                  src="https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=900&q=80"
                  alt="Kisan apne khet mein kaam karte hue"
                  loading="lazy"
                />
                <span className="help-card-number">03</span>
              </div>
              <div className="help-card-copy">
                <span className="help-card-icon">🏛️</span>
                <h3>Yojana aur sahayata</h3>
                <p>PM-Kisan, KCC aur Fasal Bima jaise vishayon par aasan jaankari paayein—aur zaroori details adhikarik sroton se verify karein.</p>
                <button type="button" onClick={() => selectQuestion(PRESETS[1]?.prompt || "")}>Yojana ke baare mein poochhein <span aria-hidden="true">↗</span></button>
              </div>
            </article>
          </div>
        </section>

        <section className="how-section" id="kaise-kaam-karta-hai">
          <div className="how-copy how-heading">
            <span className="section-kicker">TEEN AASAN KADAM</span>
            <h2>Sawal se salah tak,<br /><em>bas teen seedhe kadam.</em></h2>
            <p>Apni boli mein batayein. Koi technical shabd ya khaas jaankari zaroori nahi.</p>
          </div>
          <div className="how-steps">
            <article>
              <div className="step-card-top"><span className="step-index">01</span><span className="step-icon" aria-hidden="true">✍️</span></div>
              <div><h3>Apni dikkat batayein</h3><p>Fasal, samasya ya yojana ka sawal apne shabdon mein likhein.</p></div>
            </article>
            <article>
              <div className="step-card-top"><span className="step-index">02</span><span className="step-icon" aria-hidden="true">👀</span></div>
              <div><h3>Sawal padh kar bhejein</h3><p>Jawab mangne se pehle sawal ko dekhein, zaroorat ho to badlein.</p></div>
            </article>
            <article>
              <div className="step-card-top"><span className="step-index">03</span><span className="step-icon" aria-hidden="true">🌱</span></div>
              <div><h3>Kaam ki salah paayein</h3><p>Pehchan, upchaar aur yojana ki jaankari saaf hisson mein dekhein.</p></div>
            </article>
          </div>
        </section>

        <section className="technology-section" id="technology">
          <div className="technology-photo">
            <img
              src="https://images.unsplash.com/photo-1523348837708-15d4a09cfac2?auto=format&fit=crop&w=1200&q=80"
              alt="Khet mein kheti ke liye technology ka upyog"
              loading="lazy"
            />
            <div className="technology-photo-overlay">
              <span className="technology-live-dot" />
              <span>OPEN AI · KISANON KE LIYE</span>
            </div>
          </div>
          <div className="technology-copy">
            <span className="section-kicker">TECHNOLOGY WITH A PURPOSE</span>
            <h2>Khuli AI soch.<br /><em>Asli zindagi ke sawal.</em></h2>
            <p>Gramin-Mitra Google Gemma open architecture se prerit hai. Aaj ka demo secure server ke through hosted Gemini/Gemma models se jawab leta hai.</p>
            <div className="technology-points">
              <div><span>01</span><p><strong>Gemma-first approach</strong><small>Open model ecosystem ko rural advisory ke saath jodne ka prayas.</small></p></div>
              <div><span>02</span><p><strong>Server-side API security</strong><small>Provider key browser bundle ya farmer ke device mein nahi rakhi jaati.</small></p></div>
              <div><span>03</span><p><strong>Local deployment ke liye bana adaptable design</strong><small>Ollama / llama.cpp integration future deployment ka raasta hai—offline mode abhi enabled nahi hai.</small></p></div>
            </div>
          </div>
        </section>

      </main>

      <footer className="site-footer">
        <span>Gramin-Mitra AI</span>
        <span className="footer-divider" aria-hidden="true">✦</span>
        Aapki mehnat, hamari madad.
      </footer>
    </div>
  );
}

class AppErrorBoundary extends React.Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    console.error("Gramin-Mitra UI render error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="app-shell"
          role="alert"
          style={{
            display: "grid",
            minHeight: "100vh",
            placeItems: "center",
            padding: 24,
          }}
        >
          <main
            style={{
              width: "min(100%, 560px)",
              padding: 24,
              border: "1px solid rgba(248, 113, 113, 0.35)",
              borderRadius: 16,
              background: "rgba(6, 55, 42, 0.9)",
              color: "#e7f5ed",
              textAlign: "center",
            }}
          >
            <div aria-hidden="true" style={{ fontSize: 32 }}>🌾</div>
            <h1 style={{ margin: "12px 0 8px", fontSize: 20 }}>
              Gramin-Mitra ko load karne mein dikkat hui
            </h1>
            <p style={{ margin: 0, color: "#a8c2b4", lineHeight: 1.6 }}>
              Aapka sawal ya jawab delete nahi hua. Page refresh karke dobara
              koshish karein.
            </p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              style={{
                marginTop: 18,
                padding: "11px 16px",
                border: 0,
                borderRadius: 9,
                background: "#10b981",
                color: "#022c22",
                cursor: "pointer",
                fontWeight: 800,
              }}
            >
              Page dobara kholein
            </button>
          </main>
        </div>
      );
    }

    return this.props.children;
  }
}

export default function App() {
  return (
    <AppErrorBoundary>
      <GraminMitraApp />
    </AppErrorBoundary>
  );
}
