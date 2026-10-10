const PRESETS = [
  {
    label: "Fasal Rog",
    prompt:
      "Mere dhan ke patton par bhure dhabbe aa rahe hain aur paudhe murjha rahe hain. Kam kharch mein main kya jaanch aur upay karun?",
  },
  {
    label: "Sarkari Yojana",
    prompt:
      "Main chhota kisan hoon. PM-Kisan, KCC aur Fasal Bima ke liye kaise pata karun ki main eligible hoon aur kahan apply karna hai?",
  },
  {
    label: "Jaivik Khad",
    prompt:
      "Ghar aur gaushala mein milne wali cheezon se kam kharch ki jaivik khad kaise banaun aur khet mein kab daalun?",
  },
];

export default function PresetChips({ onSelect }) {
  return (
    <div className="presets" aria-label="Jaldi poochhein">
      <span className="presets-label">Jaldi poochhein</span>
      <div className="chip-list">
        {PRESETS.map((preset) => (
          <button
            className="preset-chip"
            key={preset.label}
            type="button"
            onClick={() => onSelect(preset.prompt)}
          >
            <span aria-hidden="true">↗</span>
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
