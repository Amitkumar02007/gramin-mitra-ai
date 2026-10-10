import { useEffect } from "react";

const STORAGE_KEY = "gramin-mitra-google-ai-api-key";

export function getSavedApiKey() {
  return window.localStorage.getItem(STORAGE_KEY) || "";
}

export default function ApiKeyBar({ value, onChange }) {
  useEffect(() => {
    if (value.trim()) {
      window.localStorage.setItem(STORAGE_KEY, value.trim());
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }, [value]);

  return (
    <section className="api-key-panel" aria-labelledby="api-key-label">
      <div className="api-key-copy">
        <span className="api-key-icon" aria-hidden="true">
          ◈
        </span>
        <div>
          <label id="api-key-label" className="field-label" htmlFor="api-key">
            Google AI Studio API key
          </label>
          <p className="field-hint">Key sirf is browser mein save hoti hai.</p>
        </div>
      </div>
      <input
        id="api-key"
        className="api-key-input"
        type="password"
        autoComplete="off"
        spellCheck="false"
        placeholder="AIza..."
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby="api-key-help"
      />
      <span id="api-key-help" className="visually-hidden">
        API key aapke browser ke local storage mein save hoti hai.
      </span>
    </section>
  );
}
