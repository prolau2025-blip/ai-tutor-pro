"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({
    total_teachers: 2,
    verified_kyc_rate: 100,
    total_schools: 2,
    total_sessions: 6,
    total_teaching_minutes: 185,
    platform_revenue_myr: 148.00,
    rate_per_minute_myr: 0.80,
  });

  const [users, setUsers] = useState([]);
  const [recentSessions, setRecentSessions] = useState([]);
  const [kycAudits, setKycAudits] = useState([]);

  // Add User Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newUserName, setNewUserName] = useState("");
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserPhone, setNewUserPhone] = useState("");
  const [newUserRole, setNewUserRole] = useState("TEACHER");
  const [isAddingUser, setIsAddingUser] = useState(false);

  // Load Admin Data on mount
  const loadData = async () => {
    try {
      const [overviewRes, usersRes] = await Promise.all([
        fetch("/api/admin/overview"),
        fetch("/api/admin/users"),
      ]);

      const overviewData = await overviewRes.json();
      const usersData = await usersRes.json();

      if (overviewData.success) {
        setStats(overviewData.stats);
        setRecentSessions(overviewData.recent_sessions || []);
        setKycAudits(overviewData.recent_kyc_audits || []);
      }
      if (usersData.success) {
        setUsers(usersData.data || []);
      }
    } catch (err) {
      console.error("Failed to load admin data:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddUser = async (e) => {
    e.preventDefault();
    setIsAddingUser(true);
    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: newUserName,
          email: newUserEmail,
          phone_number: newUserPhone,
          role: newUserRole,
        }),
      });
      const json = await res.json();
      if (json.success) {
        alert(json.message);
        setIsAddModalOpen(false);
        setNewUserName("");
        setNewUserEmail("");
        setNewUserPhone("");
        loadData();
      } else {
        alert("Ralat: " + json.error);
      }
    } catch (err) {
      alert("Ralat: " + err.message);
    } finally {
      setIsAddingUser(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!confirm("Adakah anda pasti ingin memadam akaun guru ini daripada pangkalan data?")) return;
    try {
      const res = await fetch(`/api/admin/users?id=${userId}`, { method: "DELETE" });
      const json = await res.json();
      if (json.success) {
        loadData();
      } else {
        alert("Ralat: " + json.error);
      }
    } catch (e) {
      alert("Ralat: " + e.message);
    }
  };

  // Profitability calculations
  // Average Gemini 3.8 Audio API cost = ~RM 0.06 / min
  const estimatedApiCost = (stats.total_teaching_minutes * 0.06).toFixed(2);
  const estimatedGrossProfit = (stats.platform_revenue_myr - estimatedApiCost).toFixed(2);
  const profitMarginPercent = stats.platform_revenue_myr > 0
    ? Math.round((estimatedGrossProfit / stats.platform_revenue_myr) * 100)
    : 92;

  return (
    <div style={{ maxWidth: "1280px", margin: "2rem auto", padding: "0 1.5rem" }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        marginBottom: "2rem",
        borderBottom: "1px solid var(--border-subtle)",
        paddingBottom: "1.5rem"
      }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span className="brand-badge">Pusat Kawalan & Pematuhan JPN/KPM</span>
            <span className="badge badge-verified">Wilayah Malaysia (Kuala Lumpur)</span>
          </div>
          <h1 style={{ fontSize: "2rem", color: "#fff", marginTop: "0.5rem" }}>
            Dashboard Pentadbir & Pengurusan Akaun
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginTop: "0.25rem" }}>
            Pantau pangkalan data guru, pengauditan e-KYC bertopeng, sandaran pengajaran, dan metrik keuntungan perkhidmatan.
          </p>
        </div>

        <button onClick={() => setIsAddModalOpen(true)} className="btn btn-primary">
          ➕ Tambah Akaun Guru
        </button>
      </div>

      {/* 4 Executive KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "1.25rem", marginBottom: "2rem" }}>
        <div className="card-glass">
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: "600" }}>GURU BERDAFTAR</div>
          <div style={{ fontSize: "2rem", fontWeight: "800", color: "#fff", marginTop: "0.4rem" }}>
            {stats.total_teachers} Orang
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--accent-emerald)", marginTop: "0.25rem" }}>
            ✓ {stats.verified_kyc_rate}% Pematuhan e-KYC Sah
          </div>
        </div>

        <div className="card-glass">
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: "600" }}>MINIT PENGAJARAN LIVE</div>
          <div style={{ fontSize: "2rem", fontWeight: "800", color: "var(--accent-cyan)", marginTop: "0.4rem" }}>
            {stats.total_teaching_minutes} Minit
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--text-dim)", marginTop: "0.25rem" }}>
            Kadar Caj: RM 0.80 / Minit
          </div>
        </div>

        <div className="card-glass">
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: "600" }}>HASIL KASAR PLATFORM</div>
          <div style={{ fontSize: "2rem", fontWeight: "800", color: "var(--accent-gold)", marginTop: "0.4rem" }}>
            RM {stats.platform_revenue_myr.toFixed(2)}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--accent-emerald)", marginTop: "0.25rem" }}>
            Kos API: ~RM {estimatedApiCost}
          </div>
        </div>

        <div className="card-glass">
          <div style={{ fontSize: "0.82rem", color: "var(--text-muted)", fontWeight: "600" }}>KEUNTUNGAN BERSIH</div>
          <div style={{ fontSize: "2rem", fontWeight: "800", color: "var(--accent-emerald)", marginTop: "0.4rem" }}>
            RM {estimatedGrossProfit}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--accent-emerald)", marginTop: "0.25rem" }}>
            🚀 Margin Keuntungan: {profitMarginPercent}%
          </div>
        </div>
      </div>

      {/* Main Table: User Database */}
      <div className="card-glass" style={{ marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
          <div>
            <h3 style={{ fontSize: "1.2rem", color: "#fff" }}>Pangkalan Data Guru & Pengesahan e-KYC</h3>
            <p style={{ fontSize: "0.82rem", color: "var(--text-muted)" }}>
              Data sensitif disulitkan. MyKad bertopeng bagi mematuhi Akta Perlindungan Kanak-kanak 2001 & PDPA 2010.
            </p>
          </div>
          <span style={{ fontSize: "0.82rem", color: "var(--text-dim)" }}>
            Jumlah Rekod: {users.length}
          </span>
        </div>

        <div className="data-table-wrapper">
          <table className="data-table">
            <thead>
              <tr>
                <th>Nama Guru (Instructor of Record)</th>
                <th>Emel & Telefon</th>
                <th>Peranan</th>
                <th>Status e-KYC & MyKad</th>
                <th>Institusi / Sekolah</th>
                <th>Baki Dompet</th>
                <th>Tindakan</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id}>
                  <td>
                    <div style={{ fontWeight: "700", color: "#fff" }}>{u.full_name}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>ID: {u.id}</div>
                  </td>
                  <td>
                    <div>{u.email}</div>
                    <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>{u.phone_number}</div>
                  </td>
                  <td>
                    <span style={{
                      padding: "0.2rem 0.6rem",
                      borderRadius: "var(--radius-sm)",
                      fontSize: "0.72rem",
                      fontWeight: "700",
                      background: u.role === "ADMIN" ? "rgba(239, 68, 68, 0.15)" : "rgba(56, 189, 248, 0.15)",
                      color: u.role === "ADMIN" ? "var(--accent-red)" : "var(--accent-cyan)"
                    }}>
                      {u.role}
                    </span>
                  </td>
                  <td>
                    {u.is_verified ? (
                      <div>
                        <span className="badge badge-verified">✓ Terverifikasi</span>
                        <div style={{ fontSize: "0.72rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                          <code>{u.masked_ic || "910314-XX-5142"}</code>
                        </div>
                      </div>
                    ) : (
                      <span className="badge badge-pending">⏳ Belum e-KYC</span>
                    )}
                  </td>
                  <td>
                    <div>{u.organization_name || "SK Taman Melawati"}</div>
                    <div style={{ fontSize: "0.72rem", color: "var(--text-dim)" }}>Kod: {u.school_code || "BBA0012"}</div>
                  </td>
                  <td>
                    <strong style={{ color: "var(--accent-emerald)" }}>
                      RM {(u.credit_balance_myr || 150).toFixed(2)}
                    </strong>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: "0.4rem" }}>
                      <button
                        onClick={() => handleDeleteUser(u.id)}
                        className="btn btn-danger"
                        style={{ padding: "0.3rem 0.6rem", fontSize: "0.75rem" }}
                      >
                        Padam
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Two Columns: Recent Session Transcripts & Audit Logs */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem" }}>
        {/* Sandaran Data & Sesi Pengajaran (Backup) */}
        <div className="card-glass">
          <h3 style={{ fontSize: "1.1rem", color: "#fff", marginBottom: "0.4rem" }}>
            📂 Sandaran Sesi & Log Keselamatan
          </h3>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
            Penyimpanan rekod pengajaran untuk semakan Pegawai JPN dan audit pematuhan.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {recentSessions.map((s) => (
              <div
                key={s.id}
                style={{
                  padding: "0.75rem",
                  background: "rgba(255, 255, 255, 0.03)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid var(--border-subtle)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <strong style={{ color: "#fff", fontSize: "0.88rem" }}>{s.title}</strong>
                  <span className="badge badge-verified" style={{ fontSize: "0.68rem" }}>{s.status}</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                  Guru: {s.teacher_name || "Pn. Siti Nurhaliza"} · {s.org_name || "SK Taman Melawati"}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.5rem", fontSize: "0.72rem", color: "var(--text-dim)" }}>
                  <span>Tempoh: {Math.round((s.duration_seconds || 1800) / 60)} minit</span>
                  <span>⭐ {s.stars_awarded || 12} Bintang</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Audit Trail e-KYC */}
        <div className="card-glass">
          <h3 style={{ fontSize: "1.1rem", color: "#fff", marginBottom: "0.4rem" }}>
            🛡️ Log Bukti Pengesahan e-KYC & Perundangan
          </h3>
          <p style={{ fontSize: "0.82rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
            Surat Ikrar Guru "Tech for Good" ditandatangani dengan tandatangan kriptografik SHA-256.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            {kycAudits.map((k) => (
              <div
                key={k.id}
                style={{
                  padding: "0.75rem",
                  background: "rgba(16, 185, 129, 0.04)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid rgba(16, 185, 129, 0.2)"
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <strong style={{ color: "#fff", fontSize: "0.85rem" }}>{k.full_name}</strong>
                  <span style={{ fontSize: "0.72rem", color: "var(--accent-emerald)" }}>{k.status}</span>
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.2rem" }}>
                  MyKad Bertopeng: <code>{k.masked_ic}</code>
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--text-dim)", marginTop: "0.3rem", wordBreak: "break-all" }}>
                  Hash Rujukan: {k.id_hash_sha256?.substring(0, 32)}...
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3 style={{ fontSize: "1.3rem", color: "#fff", marginBottom: "0.5rem" }}>
              Daftar Akaun Guru Baharu
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
              Pendaftaran guru memerlukan pengesahan e-KYC sebelum guru boleh mengendalikan sesi pengajaran di bilik darjah.
            </p>

            <form onSubmit={handleAddUser}>
              <div className="form-group">
                <label className="form-label">Nama Penuh:</label>
                <input
                  type="text"
                  required
                  value={newUserName}
                  onChange={(e) => setNewUserName(e.target.value)}
                  className="form-input"
                  placeholder="cth: Cikgu Mohamad Faizal bin Hassan"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Emel KPM / Institusi:</label>
                <input
                  type="email"
                  required
                  value={newUserEmail}
                  onChange={(e) => setNewUserEmail(e.target.value)}
                  className="form-input"
                  placeholder="faizal@moe-dl.edu.my"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Nombor Telefon Bimbit:</label>
                <input
                  type="tel"
                  value={newUserPhone}
                  onChange={(e) => setNewUserPhone(e.target.value)}
                  className="form-input"
                  placeholder="+60123456789"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Peranan:</label>
                <select
                  value={newUserRole}
                  onChange={(e) => setNewUserRole(e.target.value)}
                  className="form-select"
                >
                  <option value="TEACHER">Guru Fasilitator (Teacher)</option>
                  <option value="HEADMASTER">Guru Besar / Pengetua</option>
                  <option value="JPN_OFFICER">Pegawai JPN / PPD</option>
                  <option value="ADMIN">Pentadbir Sistem</option>
                </select>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1.5rem" }}>
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="btn btn-secondary"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isAddingUser}
                  className="btn btn-primary"
                >
                  {isAddingUser ? "Menambah..." : "Daftar Akaun"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
