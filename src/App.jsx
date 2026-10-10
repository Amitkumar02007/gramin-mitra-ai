import { useState } from "react";
import Header from "./components/Header.jsx";
import ApiKeyBar, { getSavedApiKey } from "./components/ApiKeyBar.jsx";
import PresetChips from "./components/PresetChips.jsx";
import QueryForm from "./components/QueryForm.jsx";
import SolutionCard from "./components/SolutionCard.jsx";
import { askGemma } from "./services/gemmaService.js";

function readInitialApiKey() {
  if (typeof window === "undefined") {
    return "";
  }
  return getSavedApiKey();
}

export default function App() {
  const [apiKey, setApiKey] = useState(readInitialApiKey);
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    setError("");
    setAnswer("");

    try {
      const result = await askGemma({ prompt, apiKey });
      setAnswer(result);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Jawab laane mein dikkat hui. Kripya dobara koshish karein.",
      );
    } finally {
      setLoading(false);
    }
  }

  function handlePresetSelect(selectedPrompt) {
    setPrompt(selectedPrompt);
    setError("");
  }

  return (
    <div className="app-shell">
      <Header />
      <main className="main-content">
        <section className="hero" aria-labelledby="hero-title">
          <div className="hero-copy">
            <span className="hero-kicker">
              <span className="status-dot" aria-hidden="true" />
              Aapke khet ka digital saathi
            </span>
            <h1 id="hero-title">
              Kheti ki har mushkil ka
              <br />
              <span>apna saathi.</span>
            </h1>
            <p>
              Fasal ke rog hon ya sarkari yojana — apni bhasha mein poochhein,
              seedhi aur kaam ki salah paayein.
            </p>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="sun" />
            <div className="field field-back" />
            <div className="field field-front" />
            <span className="art-leaf leaf-one">✳</span>
            <span className="art-leaf leaf-two">✳</span>
          </div>
        </section>

        <div className="workspace">
          <ApiKeyBar value={apiKey} onChange={setApiKey} />
          <section className="assistant-panel" aria-label="Kisan sahayak">
            <PresetChips onSelect={handlePresetSelect} />
            <QueryForm
              value={prompt}
              onChange={setPrompt}
              onSubmit={handleSubmit}
              loading={loading}
              disabled={!apiKey.trim()}
            />
            {!apiKey.trim() && (
              <p className="inline-hint">
                <span aria-hidden="true">↑</span> Pehle upar apni Google AI
                Studio key daalein.
              </p>
            )}
            {error && (
              <div className="error-message" role="alert">
                <span aria-hidden="true">!</span>
                {error}
              </div>
            )}
          </section>
          {answer ? (
            <SolutionCard answer={answer} />
          ) : (
            !loading && (
              <div className="empty-state">
                <span className="empty-icon" aria-hidden="true">
                  🌱
                </span>
                <p>Aapka jawab yahan dikhega</p>
                <span>Upar koi topic chunein ya apna sawal likhein.</span>
              </div>
            )
          )}
        </div>

        <footer className="site-footer">
          <span>Gramin-Mitra AI</span>
          <span className="footer-divider">·</span>
          <span>Gaon ki samajh, AI ki madad.</span>
        </footer>
      </main>
    </div>
  );
}
