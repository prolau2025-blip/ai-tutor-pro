import "./globals.css";
import Link from "next/link";

export const metadata = {
  title: "AI Tutor Pro | Guru Maya Pintar Berasaskan Gemini 3.8 & Model ASSURE",
  description: "Platform Guru Maya AI Siaran Langsung Berteraskan Model ASSURE, DSKP KPM, dan Pentaksiran Bilik Darjah (PBD) dengan Pemantauan e-KYC Guru Sebenar.",
};

export default function RootLayout({ children }) {
  return (
    <html lang="ms">
      <body>
        <div className="bg-ambient" />
        <div className="app-container">
          <header className="navbar">
            <Link href="/" className="brand-wrapper">
              <div className="brand-logo">
                <span style={{ fontSize: "1.25rem", color: "#fff" }}>🎓</span>
              </div>
              <div>
                <div className="brand-title">
                  AI Tutor Pro
                  <span className="brand-badge">Gemini 3.8 Live</span>
                </div>
                <div style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginTop: "-2px" }}>
                  KSSR Semakan · DSKP KPM · Model ASSURE
                </div>
              </div>
            </Link>

            <nav className="nav-links">
              <Link href="/" className="nav-link">
                <span>📹</span> Bilik Darjah (Meet)
              </Link>
              <Link href="/lesson-plan" className="nav-link">
                <span>📋</span> Perancang ASSURE
              </Link>
              <Link href="/kyc" className="nav-link">
                <span>🛡️</span> e-KYC Guru
              </Link>
              <Link href="/admin" className="nav-link">
                <span>📊</span> Dashboard Pentadbir
              </Link>
            </nav>

            <div className="nav-user">
              <div className="wallet-badge" title="Baki Kredit Dompet Prabayaran">
                <span>⚡</span>
                <span>RM 150.00</span>
                <span style={{ fontSize: "0.72rem", opacity: 0.8 }}>(187 min)</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <div style={{
                  width: "34px",
                  height: "34px",
                  borderRadius: "50%",
                  background: "linear-gradient(135deg, #10b981, #047857)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: "700",
                  fontSize: "0.85rem",
                  color: "#fff",
                  border: "2px solid rgba(16, 185, 129, 0.4)"
                }}>
                  SN
                </div>
                <div style={{ display: "flex", flexDirection: "column" }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: "600" }}>Pn. Siti Nurhaliza</span>
                  <span className="badge badge-verified" style={{ padding: "0.1rem 0.4rem", fontSize: "0.65rem" }}>
                    ✓ e-KYC Disahkan
                  </span>
                </div>
              </div>
            </div>
          </header>

          <main style={{ flex: 1 }}>{children}</main>
        </div>
      </body>
    </html>
  );
}
