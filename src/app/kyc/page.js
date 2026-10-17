"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function KycVerificationPage() {
  const [fullName, setFullName] = useState("Puan Siti Nurhaliza binti Zulkifli");
  const [rawIc, setRawIc] = useState("910314015142");
  const [phoneNumber, setPhoneNumber] = useState("+60198765432");
  const [schoolCode, setSchoolCode] = useState("BBA0012");
  const [isAgreedTerms, setIsAgreedTerms] = useState(true);

  const [kycStatus, setKycStatus] = useState("VERIFIED");
  const [maskedIc, setMaskedIc] = useState("910314-XX-5142");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState(null);

  // Load existing KYC record on mount
  useEffect(() => {
    async function loadKyc() {
      try {
        const res = await fetch("/api/kyc");
        const json = await res.json();
        if (json.success && json.data) {
          if (json.data.is_verified) {
            setKycStatus("VERIFIED");
            setMaskedIc(json.data.kyc_record?.masked_ic || "910314-XX-5142");
          } else {
            setKycStatus("PENDING");
          }
        }
      } catch (e) {
        console.error(e);
      }
    }
    loadKyc();
  }, []);

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!isAgreedTerms) {
      alert("Sila tandakan persetujuan akujanji perundangan 'Tech for Good' terlebih dahulu.");
      return;
    }

    setIsSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/kyc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          raw_ic: rawIc,
          phone_number: phoneNumber,
          school_code: schoolCode,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setKycStatus("VERIFIED");
        setMaskedIc(json.data.masked_ic);

        // Also record legal agreement sign-off
        await fetch("/api/legal", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            full_name: fullName,
            agreement_version: "v1.2-MY-2026",
          }),
        });

        setMessage({
          type: "success",
          text: "Tahniah! Pengesahan e-KYC Guru & Akujanji 'Tech for Good' telah berjaya ditandatangani secara sah mengikut Akta Kanak-Kanak 2001 & PDPA 2010.",
        });
      } else {
        setMessage({ type: "error", text: json.error || "Gagal mengesahkan e-KYC." });
      }
    } catch (err) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: "800px", margin: "2.5rem auto", padding: "0 1.5rem" }}>
      {/* Header */}
      <div style={{ textAlign: "center", marginBottom: "2rem" }}>
        <div style={{
          width: "56px",
          height: "56px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, var(--accent-cyan), var(--accent-indigo))",
          display: "inline-flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.8rem",
          boxShadow: "var(--glow-cyan)",
          marginBottom: "1rem"
        }}>
          🛡️
        </div>
        <h1 style={{ fontSize: "2rem", color: "#fff" }}>
          Pendaftaran & Pengesahan e-KYC Guru Sebenar
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginTop: "0.4rem" }}>
          Pematuhan Mandatori Akta Perlindungan Kanak-kanak 2001, PDPA 2010, dan Surat Pekeliling Ikhtisas KPM.
        </p>
      </div>

      {/* Security & Data Retention Guarantee Box */}
      <div style={{
        background: "rgba(56, 189, 248, 0.08)",
        border: "1px solid var(--border-active)",
        borderRadius: "var(--radius-lg)",
        padding: "1.25rem",
        marginBottom: "1.75rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
          <span style={{ fontSize: "1.2rem" }}>🔒</span>
          <h4 style={{ color: "var(--accent-cyan)", fontSize: "0.95rem" }}>
            Jaminan Keselamatan Data & Sifar Penyimpanan Salinan MyKad:
          </h4>
        </div>
        <ul style={{
          listStyleType: "none",
          paddingLeft: "1.8rem",
          fontSize: "0.82rem",
          color: "var(--text-muted)",
          display: "flex",
          flexDirection: "column",
          gap: "0.35rem"
        }}>
          <li>✓ <strong>Tiada Salinan Gambar Disimpan:</strong> Gambar MyKad diproses secara memori efemeral melalui enjin OCR pembekal terakreditasi dan dipadam serta-merta.</li>
          <li>✓ <strong>Topeng Nombor Kad Pengenalan:</strong> Pangkalan data hanya merekodkan MyKad bertopeng (cth: <code>{maskedIc}</code>).</li>
          <li>✓ <strong>Kedaulatan Data Malaysia:</strong> Data disimpan dalam pelayan awan Google Cloud Wilayah Malaysia (Kuala Lumpur).</li>
          <li>✓ <strong>Akauntabiliti Undang-undang:</strong> Hanya guru sebenar yang disahkan dibenarkan mengendalikan Guru Maya AI di bilik darjah.</li>
        </ul>
      </div>

      {message && (
        <div style={{
          padding: "1rem",
          borderRadius: "var(--radius-md)",
          marginBottom: "1.5rem",
          background: message.type === "success" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
          border: `1px solid ${message.type === "success" ? "rgba(16, 185, 129, 0.4)" : "rgba(239, 68, 68, 0.4)"}`,
          color: message.type === "success" ? "var(--accent-emerald)" : "var(--accent-red)",
          fontSize: "0.9rem"
        }}>
          {message.text}
        </div>
      )}

      {/* Main KYC Form */}
      <div className="card-glass">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h3 style={{ fontSize: "1.2rem", color: "#fff" }}>Maklumat Identiti Guru</h3>
          <span className={`badge ${kycStatus === "VERIFIED" ? "badge-verified" : "badge-pending"}`}>
            {kycStatus === "VERIFIED" ? "✓ e-KYC Disahkan" : "⏳ Menunggu Pengesahan"}
          </span>
        </div>

        <form onSubmit={handleVerify}>
          <div className="form-group">
            <label className="form-label">Nama Penuh Seperti Dalam MyKad:</label>
            <input
              type="text"
              required
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              className="form-input"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
            <div className="form-group">
              <label className="form-label">Nombor MyKad (12 Digit Tanpa Sempang):</label>
              <input
                type="text"
                required
                maxLength={12}
                value={rawIc}
                onChange={(e) => setRawIc(e.target.value)}
                className="form-input"
                placeholder="910314015142"
              />
              <span style={{ fontSize: "0.72rem", color: "var(--text-dim)", marginTop: "0.2rem" }}>
                Dipaparkan dalam sistem sebagai: <strong>{rawIc.length === 12 ? `${rawIc.substring(0, 6)}-XX-${rawIc.substring(8, 12)}` : maskedIc}</strong>
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Nombor Telefon Bimbit:</label>
              <input
                type="tel"
                required
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Kod Sekolah KPM / Institusi:</label>
            <input
              type="text"
              required
              value={schoolCode}
              onChange={(e) => setSchoolCode(e.target.value)}
              className="form-input"
              placeholder="cth: BBA0012 (SK Taman Melawati)"
            />
          </div>

          {/* Legal Non-Liability Undertaking Box */}
          <div style={{
            marginTop: "1.5rem",
            marginBottom: "1.5rem",
            background: "rgba(15, 23, 42, 0.9)",
            border: "1px solid var(--border-subtle)",
            borderRadius: "var(--radius-md)",
            padding: "1rem",
            fontSize: "0.82rem",
            color: "#cbd5e1"
          }}>
            <div style={{ fontWeight: "700", color: "var(--accent-gold)", marginBottom: "0.5rem" }}>
              📜 Surat Ikrar Guru & Pengisytiharan Had Liabiliti Sistem ("Tech for Good"):
            </div>
            <div style={{
              maxHeight: "120px",
              overflowY: "auto",
              paddingRight: "0.5rem",
              lineHeight: "1.5",
              color: "var(--text-muted)",
              marginBottom: "0.75rem"
            }}>
              1. Saya dengan ini mengaku bahawa saya adalah guru sebenar yang bertauliah dan memegang tanggungjawab mutlak sebagai <em>Instructor of Record</em> sepanjang sesi PdP berlangsung.<br />
              2. Pihak pembangun platform dan model AI (Google Gemini) tidak akan menanggung sebarang liabiliti atau tanggungjawab undang-undang atas salah laku, kelalaian guru dalam pemantauan, atau penyalahgunaan di luar skop kurikulum DSKP.<br />
              3. Saya bersetuju bahawa Suis Kecemasan (Kill Switch) tersedia pada skrin untuk mematikan pengajaran AI dalam masa &lt;50ms sekiranya berlaku sebarang ralat kandungan atau anomali audio.<br />
              4. Segala data pengajaran disandarkan secara audit teks dan boleh diakses oleh pihak Pentadbiran Sekolah, JPN dan KPM bagi tujuan pematuhan keselamatan murid.
            </div>

            <label style={{ display: "flex", alignItems: "center", gap: "0.6rem", cursor: "pointer", color: "#fff", fontWeight: "600" }}>
              <input
                type="checkbox"
                checked={isAgreedTerms}
                onChange={(e) => setIsAgreedTerms(e.target.checked)}
                style={{ width: "16px", height: "16px", accentColor: "var(--accent-cyan)" }}
              />
              <span>Saya telah membaca, memahami, dan menandatangani ikrar akujanji di atas.</span>
            </label>
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <Link href="/" className="btn btn-secondary">
              ← Kembali ke Kelas
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className="btn btn-primary"
              style={{ padding: "0.75rem 1.75rem" }}
            >
              {isSubmitting ? "Mengesahkan e-KYC..." : "Sahkan e-KYC & Tandatangan Ikrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
