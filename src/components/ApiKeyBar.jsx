import { useEffect } from "react";

const STORAGE_KEY = "GEMINI_API_KEY";
const LEGACY_STORAGE_KEY = "gramin-mitra-google-ai-api-key";

export function getSavedApiKey() {
  if (typeof window === "undefined") {
    return "";
  }

  try {
    return (
      window.localStorage.getItem(STORAGE_KEY) ||
      window.localStorage.getItem(LEGACY_STORAGE_KEY) ||
      ""
    );
  } catch (error) {
    console.warn("Could not read the saved Google AI Studio API key.", error);
    return "";
  }
}

export default function ApiKeyBar({
  apiKey,
  setApiKey,
  value,
  onChange,
}) {
  const currentKey = apiKey ?? value ?? "";
  const updateKey = setApiKey ?? onChange;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      if (currentKey.trim()) {
        window.localStorage.setItem(STORAGE_KEY, currentKey.trim());
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
        window.localStorage.removeItem(LEGACY_STORAGE_KEY);
      }
    } catch (error) {
      console.warn("Could not save the Google AI Studio API key.", error);
    }
  }, [currentKey]);

  return (
    <section
      aria-labelledby="api-key-label"
      style={{
        backgroundColor: "#064e3b",
        padding: 16,
        border: "1px solid #065f46",
        borderRadius: 10,
        marginBottom: 18,
      }}
    >
      <label
        id="api-key-label"
        htmlFor="api-key"
        style={{
          display: "block",
          marginBottom: 7,
          color: "#a7f3d0",
          fontSize: "0.9rem",
          fontWeight: 600,
        }}
      >
        🔑 Google AI Studio API Key
      </label>
      <input
        id="api-key"
        type="password"
        autoComplete="off"
        spellCheck="false"
        value={currentKey}
        onChange={(event) => updateKey?.(event.target.value)}
        placeholder="Paste your Google AI Studio API key here..."
        style={{
          width: "100%",
          padding: "10px 12px",
          borderRadius: 7,
          border: "1px solid #10b981",
          backgroundColor: "#022c22",
          color: "#fff",
          outline: "none",
          boxSizing: "border-box",
        }}
      />
      <span
        style={{
          display: "block",
          marginTop: 6,
          color: "#a7f3d0",
          fontSize: "0.78rem",
        }}
      >
        Key sirf is browser mein save hoti hai.
      </span>
    </section>
  );
}
