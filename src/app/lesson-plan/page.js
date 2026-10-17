"use client";

import { useState, useEffect } from "react";
import Link from "next/link";

export default function LessonPlanPlanner() {
  const [dskpList, setDskpList] = useState([]);
  const [selectedDskpId, setSelectedDskpId] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [activeTab, setActiveTab] = useState("A");

  // Form State
  const [title, setTitle] = useState("RPH Model ASSURE: Organ Pernafasan Haiwan");
  const [subject, setSubject] = useState("Sains");
  const [gradeLevel, setGradeLevel] = useState("Tahun 4");
  const [duration, setDuration] = useState(30);

  // ASSURE Steps State
  const [assure, setAssure] = useState({
    analyze_learners: {
      general_characteristics: "32 murid Tahun 4 berumur 10 tahun (18 lelaki, 14 perempuan). Murid aktif dan responsif terhadap visual.",
      entry_competencies: "Murid tahu haiwan hidup di air dan darat, namun belum jelas perbezaan organ seperti spirakel dan insang.",
      learning_styles: "70% Visual & Kinestetik (memerlukan gambarajah 3D dan lakaran), 30% Auditori."
    },
    state_objectives: {
      abcd_objectives: [
        "Pada akhir PdP, sekurang-kurangnya 85% murid dapat menamakan 4 organ pernafasan haiwan dengan tepat.",
        "Murid dapat mengelaskan 6 contoh haiwan mengikut organ pernafasannya.",
        "Murid dapat menjelaskan bagaimana katak bernafas di darat dan di dalam air."
      ],
      pbd_target: "Sasaran Tahap Penguasaan Minimum: TP3 (Mengelaskan haiwan) hingga TP4 (Mengitlak keunikan organ)"
    },
    select_media: {
      digital_media: [
        "Google Meet AI Live Teacher (Gemini 3.8 Live)",
        "Slaid Pembentangan Visual Interaktif",
        "Klip Animasi Pembedahan Maya Organ Haiwan"
      ],
      physical_materials: [
        "Buku Teks Sains KSSR Semakan Tahun 4 (Muka Surat 54-58)",
        "Lembaran Kerja Pentaksiran Bilik Darjah (PBD)",
        "Buku Catatan Sains Murid"
      ]
    },
    utilize_materials: {
      set_induksi: "5 Minit: Cikgu AI memperdengarkan bunyi katak dan desiran air, mencabar murid meneka cara katak bernafas.",
      langkah_1_penerangan: "10 Minit: Cikgu AI membentangkan gambarajah insang ikan, peparu mamalia, spirakel serangga, dan kulit lembap.",
      langkah_2_aktiviti: "10 Minit: Aktiviti bersoal jawab murid melalui kamera ('Snap & Teach') dan semakan lembaran kerja."
    },
    require_participation: {
      student_activity: "Murid melakar organ pernafasan belalang dan mengangkat lakaran ke lensa kamera untuk dianalisis oleh AI.",
      gamification: "Ganjaran 'Bintang Pintar' (1 hingga 5 bintang) bagi murid yang aktif menjawab soalan kuiz."
    },
    evaluate_revise: {
      assessment_method: "Pentaksiran Bilik Darjah (PBD) berterusan secara formatif semasa sesi siaran langsung.",
      rubric_mapping: "Pemetaan automatik ke tahap TP1 (Tahu) hingga TP6 (Kreatif & Inovatif).",
      remedial_enrichment: "Bimbingan individu oleh Guru Sebenar (Fasilitator) bagi murid TP1-TP2; kuiz lanjutan untuk TP5-TP6."
    }
  });

  const [savedPlanId, setSavedPlanId] = useState("LP-DEFAULT-01");

  // Load DSKP on mount
  useEffect(() => {
    async function loadDskp() {
      try {
        const res = await fetch("/api/dskp");
        const json = await res.json();
        if (json.success && json.data.length > 0) {
          setDskpList(json.data);
          setSelectedDskpId(json.data[0].id);
        }
      } catch (err) {
        console.error("Failed to fetch DSKP:", err);
      }
    }
    loadDskp();
  }, []);

  // When DSKP is selected, update fields
  const handleDskpChange = (id) => {
    setSelectedDskpId(id);
    const item = dskpList.find((d) => d.id === id);
    if (item) {
      setTitle(`RPH Model ASSURE: ${item.topic}`);
      setSubject(item.subject);
      setGradeLevel(item.level);
    }
  };

  // Generate ASSURE using Gemini 3.8
  const handleAutoGenerate = async () => {
    setIsGenerating(true);
    try {
      const res = await fetch("/api/lesson-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dskp_id: selectedDskpId,
          title,
          subject,
          grade_level: gradeLevel,
          target_duration_minutes: duration,
          auto_generate: true,
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setAssure(json.data.assure);
        setSavedPlanId(json.plan_id);
        alert("Perancangan Pengajaran 6-Langkah ASSURE berjaya dijana oleh Gemini 3.8!");
      }
    } catch (err) {
      console.error(err);
      alert("Ralat semasa menjana RPH: " + err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div style={{ maxWidth: "1200px", margin: "2rem auto", padding: "0 1.5rem" }}>
      {/* Page Header */}
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
            <span className="brand-badge">Pedagogi Abad Ke-21</span>
            <span className="badge badge-verified">Pematuhan DSKP KSSR Semakan</span>
          </div>
          <h1 style={{ fontSize: "2rem", color: "#fff", marginTop: "0.5rem" }}>
            Perancang Rancangan Pengajaran Harian (e-RPH) Model ASSURE
          </h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginTop: "0.25rem" }}>
            Bina dan suaikan 6-Langkah Model ASSURE dengan bantuan Gemini 3.8, sedia dimuat turun dalam Microsoft Word atau PDF rasmi.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <a
            href={`/api/lesson-plan/export?id=${savedPlanId}&format=docx`}
            className="btn btn-secondary"
            target="_blank"
            rel="noreferrer"
          >
            📄 Muat Turun Word (.docx)
          </a>
          <a
            href={`/api/lesson-plan/export?id=${savedPlanId}&format=pdf`}
            className="btn btn-primary"
            target="_blank"
            rel="noreferrer"
          >
            📕 Muat Turun PDF (e-RPH)
          </a>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "350px 1fr", gap: "1.5rem" }}>
        {/* Left Form: DSKP & Metadata Selector */}
        <div className="card-glass" style={{ height: "fit-content" }}>
          <h3 style={{ fontSize: "1.1rem", color: "#fff", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span>🎯</span> Tetapan Kurikulum & DSKP
          </h3>

          <div className="form-group">
            <label className="form-label">Pilih Standard Kurikulum DSKP:</label>
            <select
              value={selectedDskpId}
              onChange={(e) => handleDskpChange(e.target.value)}
              className="form-select"
            >
              {dskpList.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.subject} ({d.level}) - {d.topic}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Tajuk e-RPH:</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="form-input"
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
            <div className="form-group">
              <label className="form-label">Mata Pelajaran:</label>
              <input
                type="text"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="form-input"
              />
            </div>
            <div className="form-group">
              <label className="form-label">Tahun / Tingkatan:</label>
              <input
                type="text"
                value={gradeLevel}
                onChange={(e) => setGradeLevel(e.target.value)}
                className="form-input"
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Tempoh Pengajaran (Minit):</label>
            <select
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="form-select"
            >
              <option value={30}>30 Minit (1 Waktu)</option>
              <option value={60}>60 Minit (2 Waktu)</option>
            </select>
          </div>

          <button
            onClick={handleAutoGenerate}
            disabled={isGenerating}
            className="btn btn-emerald"
            style={{ width: "100%", marginTop: "0.5rem", padding: "0.85rem" }}
          >
            {isGenerating ? "⚡ Sedang Menjana dengan Gemini 3.8..." : "✨ Jana ASSURE dengan Gemini 3.8"}
          </button>

          <div style={{ marginTop: "1.25rem", borderTop: "1px solid var(--border-subtle)", paddingTop: "1rem" }}>
            <Link href="/" className="btn btn-secondary" style={{ width: "100%", textAlign: "center" }}>
              📹 Mulakan Bilik Darjah Google Meet
            </Link>
          </div>
        </div>

        {/* Right Tabbed Panel: ASSURE 6-Step Editor */}
        <div className="card-glass">
          {/* Tabs for A, S, S, U, R, E */}
          <div style={{
            display: "flex",
            borderBottom: "1px solid var(--border-subtle)",
            marginBottom: "1.5rem",
            overflowX: "auto"
          }}>
            {[
              { id: "A", label: "A - Analyze Learners" },
              { id: "S1", label: "S - State Objectives" },
              { id: "S2", label: "S - Select Media" },
              { id: "U", label: "U - Utilize Materials" },
              { id: "R", label: "R - Require Participation" },
              { id: "E", label: "E - Evaluate & Revise" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  background: "transparent",
                  border: "none",
                  borderBottom: activeTab === tab.id ? "3px solid var(--accent-cyan)" : "3px solid transparent",
                  color: activeTab === tab.id ? "var(--accent-cyan)" : "var(--text-muted)",
                  padding: "0.75rem 1rem",
                  fontWeight: "700",
                  fontSize: "0.88rem",
                  cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab A Content */}
          {activeTab === "A" && (
            <div>
              <h3 style={{ color: "#fff", marginBottom: "0.5rem" }}>A - Analyze Learners (Analisis Murid)</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
                Kaji ciri-ciri umum murid, pengetahuan sedia ada, dan gaya pembelajaran bilik darjah.
              </p>

              <div className="form-group">
                <label className="form-label">Ciri-ciri Umum (General Characteristics):</label>
                <textarea
                  rows={3}
                  value={assure.analyze_learners.general_characteristics}
                  onChange={(e) => setAssure({
                    ...assure,
                    analyze_learners: { ...assure.analyze_learners, general_characteristics: e.target.value }
                  })}
                  className="form-textarea"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Pengetahuan Sedia Ada (Entry Competencies):</label>
                <textarea
                  rows={3}
                  value={assure.analyze_learners.entry_competencies}
                  onChange={(e) => setAssure({
                    ...assure,
                    analyze_learners: { ...assure.analyze_learners, entry_competencies: e.target.value }
                  })}
                  className="form-textarea"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Gaya Pembelajaran (Learning Styles):</label>
                <input
                  type="text"
                  value={assure.analyze_learners.learning_styles}
                  onChange={(e) => setAssure({
                    ...assure,
                    analyze_learners: { ...assure.analyze_learners, learning_styles: e.target.value }
                  })}
                  className="form-input"
                />
              </div>
            </div>
          )}

          {/* Tab S1: State Objectives */}
          {activeTab === "S1" && (
            <div>
              <h3 style={{ color: "#fff", marginBottom: "0.5rem" }}>S - State Objectives (Nyatakan Objektif)</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
                Objektif pembelajaran mengikut formula ABCD (Audience, Behavior, Condition, Degree) dan sasaran PBD.
              </p>

              <div className="form-group">
                <label className="form-label">Objektif Pembelajaran Khusus (ABCD):</label>
                {assure.state_objectives.abcd_objectives.map((obj, i) => (
                  <div key={i} style={{ marginBottom: "0.5rem" }}>
                    <input
                      type="text"
                      value={obj}
                      onChange={(e) => {
                        const newObjs = [...assure.state_objectives.abcd_objectives];
                        newObjs[i] = e.target.value;
                        setAssure({
                          ...assure,
                          state_objectives: { ...assure.state_objectives, abcd_objectives: newObjs }
                        });
                      }}
                      className="form-input"
                    />
                  </div>
                ))}
              </div>

              <div className="form-group">
                <label className="form-label">Sasaran Pentaksiran Bilik Darjah (PBD):</label>
                <input
                  type="text"
                  value={assure.state_objectives.pbd_target}
                  onChange={(e) => setAssure({
                    ...assure,
                    state_objectives: { ...assure.state_objectives, pbd_target: e.target.value }
                  })}
                  className="form-input"
                />
              </div>
            </div>
          )}

          {/* Tab S2: Select Media */}
          {activeTab === "S2" && (
            <div>
              <h3 style={{ color: "#fff", marginBottom: "0.5rem" }}>S - Select Media & Materials (Pilih Media & Bahan)</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
                Pemilihan media digital Gemini Live, slaid interaktif, dan bahan fizikal KPM.
              </p>

              <div className="form-group">
                <label className="form-label">Media Digital:</label>
                <textarea
                  rows={3}
                  value={assure.select_media.digital_media.join("\n")}
                  onChange={(e) => setAssure({
                    ...assure,
                    select_media: { ...assure.select_media, digital_media: e.target.value.split("\n") }
                  })}
                  className="form-textarea"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Bahan Fizikal & Lembaran KPM:</label>
                <textarea
                  rows={3}
                  value={assure.select_media.physical_materials.join("\n")}
                  onChange={(e) => setAssure({
                    ...assure,
                    select_media: { ...assure.select_media, physical_materials: e.target.value.split("\n") }
                  })}
                  className="form-textarea"
                />
              </div>
            </div>
          )}

          {/* Tab U: Utilize Materials */}
          {activeTab === "U" && (
            <div>
              <h3 style={{ color: "#fff", marginBottom: "0.5rem" }}>U - Utilize Materials (Gunakan Media & Bahan)</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
                Langkah pengajaran kronologi: Set induksi, langkah isi kandungan, dan aktiviti amali.
              </p>

              <div className="form-group">
                <label className="form-label">Set Induksi (5 Minit):</label>
                <textarea
                  rows={2}
                  value={assure.utilize_materials.set_induksi}
                  onChange={(e) => setAssure({
                    ...assure,
                    utilize_materials: { ...assure.utilize_materials, set_induksi: e.target.value }
                  })}
                  className="form-textarea"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Langkah 1: Penerangan Guru AI (10 Minit):</label>
                <textarea
                  rows={3}
                  value={assure.utilize_materials.langkah_1_penerangan}
                  onChange={(e) => setAssure({
                    ...assure,
                    utilize_materials: { ...assure.utilize_materials, langkah_1_penerangan: e.target.value }
                  })}
                  className="form-textarea"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Langkah 2: Aktiviti Bersoal Jawab / Latihan (10 Minit):</label>
                <textarea
                  rows={3}
                  value={assure.utilize_materials.langkah_2_aktiviti}
                  onChange={(e) => setAssure({
                    ...assure,
                    utilize_materials: { ...assure.utilize_materials, langkah_2_aktiviti: e.target.value }
                  })}
                  className="form-textarea"
                />
              </div>
            </div>
          )}

          {/* Tab R: Require Learner Participation */}
          {activeTab === "R" && (
            <div>
              <h3 style={{ color: "#fff", marginBottom: "0.5rem" }}>R - Require Learner Participation (Penglibatan Murid)</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
                Penglibatan murid secara aktif melalui respons lisan ke kamera, Snap & Teach, dan gamifikasi Bintang Pintar.
              </p>

              <div className="form-group">
                <label className="form-label">Aktiviti Aktif Murid:</label>
                <textarea
                  rows={3}
                  value={assure.require_participation.student_activity}
                  onChange={(e) => setAssure({
                    ...assure,
                    require_participation: { ...assure.require_participation, student_activity: e.target.value }
                  })}
                  className="form-textarea"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Gamifikasi & Ganjaran (Bintang Pintar ⭐):</label>
                <input
                  type="text"
                  value={assure.require_participation.gamification}
                  onChange={(e) => setAssure({
                    ...assure,
                    require_participation: { ...assure.require_participation, gamification: e.target.value }
                  })}
                  className="form-input"
                />
              </div>
            </div>
          )}

          {/* Tab E: Evaluate & Revise */}
          {activeTab === "E" && (
            <div>
              <h3 style={{ color: "#fff", marginBottom: "0.5rem" }}>E - Evaluate & Revise (Penilaian & Semakan PBD)</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
                Pentaksiran Bilik Darjah (PBD TP1 - TP6), maklum balas pembelajaran, dan intervensi pemulihan/pengayaan.
              </p>

              <div className="form-group">
                <label className="form-label">Kaedah Pentaksiran Formatif:</label>
                <textarea
                  rows={2}
                  value={assure.evaluate_revise.assessment_method}
                  onChange={(e) => setAssure({
                    ...assure,
                    evaluate_revise: { ...assure.evaluate_revise, assessment_method: e.target.value }
                  })}
                  className="form-textarea"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Pemetaan Rubrik Tahap Penguasaan (TP1-TP6):</label>
                <input
                  type="text"
                  value={assure.evaluate_revise.rubric_mapping}
                  onChange={(e) => setAssure({
                    ...assure,
                    evaluate_revise: { ...assure.evaluate_revise, rubric_mapping: e.target.value }
                  })}
                  className="form-input"
                />
              </div>

              <div className="form-group">
                <label className="form-label">Program Pemulihan & Pengayaan:</label>
                <textarea
                  rows={2}
                  value={assure.evaluate_revise.remedial_enrichment}
                  onChange={(e) => setAssure({
                    ...assure,
                    evaluate_revise: { ...assure.evaluate_revise, remedial_enrichment: e.target.value }
                  })}
                  className="form-textarea"
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
