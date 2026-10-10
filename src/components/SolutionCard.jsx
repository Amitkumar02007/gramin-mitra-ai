const SECTION_LABELS = [
  ["Nidan", "Nidan"],
  ["Upchar", "Upchar"],
  ["Sarkari Yojana", "Sarkari Yojana"],
  ["Agla Kadam", "Agla Kadam"],
];

function splitSections(answer) {
  const sections = [];
  let current = null;

  for (const line of answer.split(/\r?\n/)) {
    const normalizedLine = line
      .replace(/^\s*#{1,6}\s*/, "")
      .replace(/\*\*/g, "");
    const match = normalizedLine.match(
      /^\s*(Nidan|Upchar|Sarkari Yojana|Agla Kadam)\s*:\s*(.*)$/i,
    );
    if (match) {
      current = { title: match[1], content: match[2] ? [match[2]] : [] };
      sections.push(current);
    } else if (current) {
      current.content.push(line);
    }
  }

  if (sections.length === 0) {
    return [{ title: "Aapke liye salah", content: [answer] }];
  }

  return sections.map((section) => ({
    title:
      SECTION_LABELS.find(([key]) => key.toLowerCase() === section.title.toLowerCase())?.[1] ??
      section.title,
    content: section.content.join("\n").trim(),
  }));
}

export default function SolutionCard({ answer }) {
  const sections = splitSections(answer);

  return (
    <article className="solution-card" aria-labelledby="solution-title">
      <div className="solution-heading">
        <span className="solution-icon" aria-hidden="true">
          ✦
        </span>
        <div>
          <p className="eyebrow">Aapke liye jawab</p>
          <h2 id="solution-title">Gramin-Mitra ki salah</h2>
        </div>
        <span className="answer-tag">AI jawab</span>
      </div>
      <div className="solution-sections">
        {sections.map((section, index) => (
          <section
            className="solution-section"
            key={`${section.title}-${index}`}
          >
            <h3>{section.title}</h3>
            <p className="solution-text">{section.content}</p>
          </section>
        ))}
      </div>
      <p className="solution-disclaimer">
        Zaroori faisle se pehle apne local krishi adhikari ya adhikarik yojana
        portal se jankari pakki karein.
      </p>
    </article>
  );
}
