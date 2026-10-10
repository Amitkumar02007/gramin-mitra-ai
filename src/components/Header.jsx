export default function Header() {
  return (
    <header className="site-header">
      <a className="brand" href="/" aria-label="Gramin-Mitra AI home">
        <span className="brand-mark" aria-hidden="true">
          🌾
        </span>
        <span className="brand-name">
          <span className="brand-hindi">ग्रामीण मित्र</span>
          <span className="brand-subtitle">(Gramin-Mitra AI)</span>
        </span>
      </a>

      <div className="header-badges">
        <span className="badge badge-event">Hacktoberfest Ranchi 2026</span>
        <span className="badge badge-model">
          <span className="status-dot" aria-hidden="true" />
          Google Gemma
        </span>
      </div>
    </header>
  );
}
