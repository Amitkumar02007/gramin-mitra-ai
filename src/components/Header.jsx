export default function Header() {
  return (
    <header
      style={{
        textAlign: "center",
        marginBottom: 20,
        borderBottom: "1px solid #065f46",
        padding: "24px 16px 16px",
      }}
    >
      <span
        style={{
          display: "inline-block",
          backgroundColor: "#059669",
          color: "#fff",
          padding: "4px 12px",
          borderRadius: 20,
          fontSize: "0.8rem",
          fontWeight: 700,
        }}
      >
        Powered by Google Gemma Open Architecture
      </span>
      <h1
        style={{
          fontSize: "clamp(1.6rem, 5vw, 2.2rem)",
          margin: "12px 0 6px",
          color: "#34d399",
          fontWeight: 800,
        }}
      >
        🌾 ग्रामीण मित्र (Gramin-Mitra AI)
      </h1>
      <p style={{ margin: 0, color: "#a7f3d0", fontSize: "0.95rem" }}>
        Vernacular Agritech &amp; Rural Welfare Assistant | Hacktoberfest
        Ranchi 2026
      </p>
    </header>
  );
}
