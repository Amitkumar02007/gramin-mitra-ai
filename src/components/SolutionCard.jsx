export default function SolutionCard({ answer, error }) {
  if (error) {
    return (
      <div
        role="alert"
        style={{
          marginTop: 20,
          backgroundColor: "#7f1d1d",
          border: "1px solid #f87171",
          borderRadius: 10,
          padding: 16,
          color: "#fee2e2",
        }}
      >
        ⚠️ <strong>Error:</strong> {error}
      </div>
    );
  }

  if (!answer) {
    return null;
  }

  return (
    <article
      aria-labelledby="solution-title"
      style={{
        marginTop: 24,
        backgroundColor: "#064e3b",
        border: "1px solid #34d399",
        borderRadius: 12,
        padding: 20,
        color: "#f0fdf4",
      }}
    >
      <h2
        id="solution-title"
        style={{
          margin: "0 0 12px",
          color: "#6ee7b7",
          fontSize: "1.15rem",
        }}
      >
        💡 Gramin-Mitra Salah &amp; Upchaar
      </h2>
      <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.7, fontSize: "0.98rem" }}>
        {answer}
      </div>
      <p
        style={{
          margin: "16px 0 0",
          paddingTop: 12,
          borderTop: "1px solid rgba(167, 243, 208, 0.2)",
          color: "#a7f3d0",
          fontSize: "0.82rem",
        }}
      >
        Zaroori faisle se pehle apne local krishi adhikari ya adhikarik yojana
        portal se jankari pakki karein.
      </p>
    </article>
  );
}
