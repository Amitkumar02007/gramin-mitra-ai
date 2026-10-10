const PRESETS = [
  {
    label: "🌾 Fasal Bimari (धान/गेहूँ)",
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

export default function PresetChips({ onSelect }) {
  return (
    <div style={{ marginBottom: 16 }}>
      <span
        style={{
          display: "block",
          marginBottom: 8,
          color: "#a7f3d0",
          fontSize: "0.88rem",
          fontWeight: 600,
        }}
      >
        ⚡ Turant Jankari (Click to try):
      </span>
      <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => onSelect?.(preset.prompt)}
            style={{
              padding: "8px 12px",
              border: "1px solid #34d399",
              borderRadius: 8,
              backgroundColor: "#065f46",
              color: "#ecfdf5",
              fontSize: "0.85rem",
              cursor: "pointer",
              transition: "background-color 0.2s ease",
            }}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
