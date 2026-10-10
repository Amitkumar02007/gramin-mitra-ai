export default function QueryForm({
  prompt,
  setPrompt,
  value,
  onChange,
  onSubmit,
  loading = false,
  disabled = false,
}) {
  const currentPrompt = prompt ?? value ?? "";
  const updatePrompt = setPrompt ?? onChange;

  function handleSubmit(event) {
    event.preventDefault();
    onSubmit?.();
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: 20 }}>
      <label
        htmlFor="farmer-question"
        style={{
          display: "block",
          marginBottom: 7,
          color: "#a7f3d0",
          fontWeight: 600,
        }}
      >
        Aapki kya madad karun?
      </label>
      <textarea
        id="farmer-question"
        rows={4}
        maxLength={2000}
        value={currentPrompt}
        onChange={(event) => updatePrompt?.(event.target.value)}
        placeholder="Apni fasal rog, kisan yojana ya sinchai ki pareshani yahan likhein..."
        disabled={loading}
        required
        style={{
          display: "block",
          width: "100%",
          padding: 12,
          borderRadius: 8,
          border: "1px solid #10b981",
          backgroundColor: "#064e3b",
          color: "#fff",
          fontSize: "1rem",
          lineHeight: 1.5,
          boxSizing: "border-box",
          outline: "none",
          resize: "vertical",
        }}
      />
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 12,
          marginTop: 10,
        }}
      >
        <span style={{ color: "#a7f3d0", fontSize: "0.8rem" }}>
          {currentPrompt.length}/2000
        </span>
        <button
          type="submit"
          disabled={loading || disabled || !currentPrompt.trim()}
          style={{
            width: "100%",
            maxWidth: 320,
            padding: "12px 16px",
            backgroundColor: loading ? "#047857" : "#10b981",
            color: "#022c22",
            fontWeight: 800,
            fontSize: "1rem",
            border: "none",
            borderRadius: 8,
            cursor:
              loading || disabled || !currentPrompt.trim()
                ? "not-allowed"
                : "pointer",
            opacity: disabled || !currentPrompt.trim() ? 0.7 : 1,
          }}
        >
          {loading
            ? "Gemma Samadhan Dhoondh Raha Hai..."
            : "Samadhan Prapt Karein (Ask AI) 🚜"}
        </button>
      </div>
    </form>
  );
}
