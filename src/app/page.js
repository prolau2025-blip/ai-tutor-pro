"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function GoogleMeetClassroom() {
  // Session & Classroom State
  const [sessionId, setSessionId] = useState("SES-LIVE-DEMO-01");
  const [sessionMode, setSessionMode] = useState("CLASSROOM"); // 'CLASSROOM' (Mode B) or 'TUITION' (Mode A)
  const [selectedVoice, setSelectedVoice] = useState("Puck"); // Puck, Aoede, Charon, Fenrir, Kore
  const [isMicOn, setIsMicOn] = useState(true);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeTab, setActiveTab] = useState("assure"); // 'assure', 'transcripts', 'pbd', 'facilitator'
  
  // Teaching & Gemini State
  const [currentStepIndex, setCurrentStepIndex] = useState(1);
  const [starsAwarded, setStarsAwarded] = useState(12);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [latestSubtitle, setLatestSubtitle] = useState("Selamat pagi semua! Hari ini kita akan meneroka keunikan Organ Pernafasan Haiwan bersama Cikgu AI.");
  const [transcripts, setTranscripts] = useState([
    { id: "1", speaker: "SYSTEM", message: "Sesi bilik darjah dimulakan. Gemini 3.8 Live bersedia.", time: "10:00 AM" },
    { id: "2", speaker: "AI_TUTOR", message: "Selamat pagi murid-murid! Siapa di sini tahu bagaimana ikan bernafas di dalam air?", time: "10:01 AM" },
    { id: "3", speaker: "STUDENT", message: "Ikan guna insang cikgu!", time: "10:01 AM" },
    { id: "4", speaker: "AI_TUTOR", message: "Tepat sekali Adam! Insang menyerap oksigen daripada air. 1 Bintang Pintar untuk kelas kita! ⭐", time: "10:02 AM" },
  ]);

  // Billing & Timer
  const [elapsedSeconds, setElapsedSeconds] = useState(185); // 3 mins 5 sec
  const [walletBalance, setWalletBalance] = useState(150.0);
  const [isKillSwitched, setIsKillSwitched] = useState(false);
  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const [endSessionSummary, setEndSessionSummary] = useState(null);

  // Vision OCR "Snap & Teach"
  const [isSnapModalOpen, setIsSnapModalOpen] = useState(false);
  const [snapPreview, setSnapPreview] = useState(null);
  const [isAnalyzingSnap, setIsAnalyzingSnap] = useState(false);

  // User input message
  const [inputQuery, setInputQuery] = useState("");
  const [isLoadingAi, setIsLoadingAi] = useState(false);

  // Video refs for webcam
  const videoRef = useRef(null);
  const mediaStreamRef = useRef(null);

  // ASSURE Steps data
  const assureSteps = [
    { code: "A", title: "Analyze Learners", desc: "32 Murid Tahun 4 (Visual & Kinestetik)", status: "completed" },
    { code: "S", title: "State Objectives", desc: "85% Murid kuasai 4 organ pernafasan", status: "completed" },
    { code: "S", title: "Select Media", desc: "Simulasi 3D Google Meet & Buku Teks KPM", status: "active" },
    { code: "U", title: "Utilize Materials", desc: "Slaid interaktif & eksperimen insang", status: "pending" },
    { code: "R", title: "Require Participation", desc: "Soal jawab lisan & Bintang Pintar", status: "pending" },
    { code: "E", title: "Evaluate & Revise", desc: "Penilaian PBD Format: Sasaran TP3-TP5", status: "pending" },
  ];

  // PBD Rubric levels
  const pbdLevels = [
    { level: "TP1", label: "Menyatakan organ pernafasan haiwan", achieved: 32 },
    { level: "TP2", label: "Menyenaraikan contoh haiwan & organ", achieved: 29 },
    { level: "TP3", label: "Mengelaskan haiwan mengikut organ", achieved: 25 },
    { level: "TP4", label: "Mengitlak haiwan lebih 1 organ (cth: Katak)", achieved: 18 },
    { level: "TP5", label: "Menjana idea kesan pencemaran air/udara", achieved: 8 },
    { level: "TP6", label: "Berkomunikasi secara kreatif & inovatif", achieved: 3 },
  ];

  // Start webcam simulation / real media stream
  useEffect(() => {
    let stream = null;
    async function startCam() {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && isCameraOn) {
          stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
          mediaStreamRef.current = stream;
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
          }
        }
      } catch (err) {
        console.warn("Webcam access optional or preview simulator engaged:", err.message);
      }
    }
    startCam();

    return () => {
      if (stream) {
        stream.getTracks().forEach((t) => t.stop());
      }
    };
  }, [isCameraOn]);

  // Session timer tick
  useEffect(() => {
    if (isKillSwitched || isEndModalOpen) return;
    const interval = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isKillSwitched, isEndModalOpen]);

  // Format MM:SS
  const formatTime = (secs) => {
    const mins = Math.floor(secs / 60);
    const rem = secs % 60;
    return `${mins.toString().padStart(2, "0")}:${rem.toString().padStart(2, "0")}`;
  };

  // Calculated billable cost (RM 0.80 / min)
  const currentCost = (Math.ceil(elapsedSeconds / 60) * 0.80).toFixed(2);

  // Send message to Gemini 3.8 AI Teacher
  const handleSendPrompt = async (customText, customImage = null) => {
    const query = customText || inputQuery;
    if (!query && !customImage) return;

    setInputQuery("");
    setIsLoadingAi(true);
    setIsAiSpeaking(true);

    const now = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

    // Append to transcript
    if (query) {
      setTranscripts((prev) => [
        ...prev,
        { id: Date.now().toString(), speaker: "STUDENT", message: query, time: now },
      ]);
    }

    try {
      const res = await fetch("/api/live/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          message: query,
          image_base64: customImage,
          current_step: assureSteps[currentStepIndex]?.title || "Penerangan",
          voice_persona: selectedVoice,
          topic: "Organ Pernafasan Haiwan (Sains Tahun 4)",
        }),
      });

      const json = await res.json();
      if (json.success && json.data) {
        setLatestSubtitle(json.data.spoken_response);
        if (json.data.star_delta > 0) {
          setStarsAwarded((prev) => prev + json.data.star_delta);
        }

        setTranscripts((prev) => [
          ...prev,
          {
            id: (Date.now() + 1).toString(),
            speaker: "AI_TUTOR",
            message: json.data.spoken_response,
            time: now,
          },
        ]);

        // Synthesize simulated audio or browser speech
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance(json.data.spoken_response);
          utterance.lang = "ms-MY";
          utterance.rate = 1.05;
          utterance.onend = () => setIsAiSpeaking(false);
          window.speechSynthesis.speak(utterance);
        } else {
          setTimeout(() => setIsAiSpeaking(false), 4000);
        }
      }
    } catch (err) {
      console.error("Chat error:", err);
      setIsAiSpeaking(false);
    } finally {
      setIsLoadingAi(false);
    }
  };

  // Emergency Kill Switch
  const triggerKillSwitch = async () => {
    const confirmed = window.confirm("PENGESAHAN KECEMASAN: Anda sebagai Guru Fasilitator ingin mengambil alih kelas dan mematikan pengajaran AI serta-merta?");
    if (!confirmed) return;

    setIsKillSwitched(true);
    setIsAiSpeaking(false);
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    try {
      await fetch("/api/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          action: "KILL_SWITCH",
          duration_seconds: elapsedSeconds,
        }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  // End Session & Generate PBD Report
  const handleEndSession = async () => {
    try {
      const res = await fetch("/api/sessions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          action: "END_SESSION",
          duration_seconds: elapsedSeconds,
          stars_awarded: starsAwarded,
        }),
      });
      const data = await res.json();
      setEndSessionSummary(data.billing || { billable_minutes: Math.ceil(elapsedSeconds / 60), total_charged_myr: currentCost });
      setIsEndModalOpen(true);
    } catch (err) {
      console.error(err);
    }
  };

  // Handle Mock "Snap & Teach"
  const handleTriggerSnap = () => {
    setIsSnapModalOpen(true);
  };

  const processSnapUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setSnapPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const confirmSnapToAi = () => {
    setIsAnalyzingSnap(true);
    setTimeout(() => {
      setIsAnalyzingSnap(false);
      setIsSnapModalOpen(false);
      handleSendPrompt("Cikgu, saya sedang menunjukkan gambar rajah haiwan pada muka surat 42 buku teks sains. Boleh cikgu jelaskan?", snapPreview);
      setSnapPreview(null);
    }, 1200);
  };

  return (
    <div className="meet-container">
      {/* Top Session Status Bar */}
      <div style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0.5rem 1.5rem",
        background: "rgba(15, 23, 42, 0.95)",
        borderBottom: "1px solid var(--border-subtle)",
        fontSize: "0.85rem",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span style={{
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              background: isKillSwitched ? "#ef4444" : "#10b981",
              boxShadow: isKillSwitched ? "0 0 10px #ef4444" : "0 0 10px #10b981",
              display: "inline-block"
            }} />
            <span style={{ fontWeight: "700", color: "#fff" }}>
              {isKillSwitched ? "SUIS KECEMASAN DIAKTIFKAN (GURU AMBIL ALIH)" : "SESI SIARAN LANGSUNG AKTIF"}
            </span>
          </div>

          <div style={{
            background: "rgba(255, 255, 255, 0.06)",
            padding: "0.2rem 0.6rem",
            borderRadius: "var(--radius-sm)",
            color: "var(--text-muted)"
          }}>
            Masa: <strong style={{ color: "#fff" }}>{formatTime(elapsedSeconds)}</strong>
          </div>

          <div style={{
            background: "rgba(245, 158, 11, 0.12)",
            border: "1px solid rgba(245, 158, 11, 0.3)",
            padding: "0.2rem 0.6rem",
            borderRadius: "var(--radius-sm)",
            color: "var(--accent-amber)"
          }}>
            Kadar Caj: <strong>RM 0.80 / min</strong> (Terkumpul: RM {currentCost})
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          {/* Mode Selector */}
          <div style={{
            display: "flex",
            background: "rgba(0, 0, 0, 0.4)",
            borderRadius: "var(--radius-md)",
            padding: "0.15rem",
            border: "1px solid var(--border-subtle)"
          }}>
            <button
              onClick={() => setSessionMode("CLASSROOM")}
              style={{
                background: sessionMode === "CLASSROOM" ? "var(--accent-cyan)" : "transparent",
                color: sessionMode === "CLASSROOM" ? "#0b0f19" : "var(--text-muted)",
                border: "none",
                padding: "0.25rem 0.75rem",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.75rem",
                fontWeight: "700",
                cursor: "pointer"
              }}
            >
              📺 Mod B: Kelas Pintar (Projektor)
            </button>
            <button
              onClick={() => setSessionMode("TUITION")}
              style={{
                background: sessionMode === "TUITION" ? "var(--accent-cyan)" : "transparent",
                color: sessionMode === "TUITION" ? "#0b0f19" : "var(--text-muted)",
                border: "none",
                padding: "0.25rem 0.75rem",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.75rem",
                fontWeight: "700",
                cursor: "pointer"
              }}
            >
              🧑‍🎓 Mod A: Tuisyen 1-ke-1
            </button>
          </div>

          {/* Voice Persona Picker */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
            <span style={{ color: "var(--text-dim)", fontSize: "0.75rem" }}>Suara AI:</span>
            <select
              value={selectedVoice}
              onChange={(e) => setSelectedVoice(e.target.value)}
              className="form-select"
              style={{ padding: "0.2rem 0.5rem", fontSize: "0.78rem", width: "auto" }}
            >
              <option value="Puck">Puck (Ceria & Dinamik)</option>
              <option value="Aoede">Aoede (Lemah-lembut & Jelas)</option>
              <option value="Charon">Charon (Tegas & Matang)</option>
              <option value="Fenrir">Fenrir (Bersemangat Tinggi)</option>
              <option value="Kore">Kore (Penyayang & Mesra Kanak-kanak)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Google Meet Workspace */}
      <div className="meet-workspace">
        {/* Left Side: Video & Avatar Stage */}
        <div className="meet-video-stage">
          {/* Tile 1: AI Live Teacher Tile */}
          <div className="meet-tile" style={{
            borderColor: isAiSpeaking ? "var(--accent-cyan)" : "var(--border-subtle)",
            boxShadow: isAiSpeaking ? "0 0 30px rgba(56, 189, 248, 0.35)" : "none"
          }}>
            <div className="tile-overlay-top">
              <div className="speaker-pill">
                <span style={{
                  width: "8px",
                  height: "8px",
                  borderRadius: "50%",
                  background: isAiSpeaking ? "#38bdf8" : "#94a3b8"
                }} />
                <span>Guru Maya Pintar (Gemini 3.8 Live)</span>
                <span className="badge badge-tp" style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem" }}>
                  Suara: {selectedVoice}
                </span>
              </div>

              <div style={{
                background: "rgba(16, 185, 129, 0.2)",
                border: "1px solid rgba(16, 185, 129, 0.4)",
                padding: "0.25rem 0.65rem",
                borderRadius: "var(--radius-full)",
                fontSize: "0.75rem",
                color: "var(--accent-emerald)",
                fontWeight: "700"
              }}>
                ⭐ {starsAwarded} Bintang Terkumpul
              </div>
            </div>

            {/* AI Avatar Visualizer Waves */}
            <div className="ai-avatar-wrapper">
              {isAiSpeaking && (
                <>
                  <div className="ai-pulse-wave" />
                  <div className="ai-pulse-wave" />
                  <div className="ai-pulse-wave" />
                </>
              )}
              <div className="ai-avatar-circle">
                <span style={{ fontSize: "3rem" }}>👩‍🏫</span>
              </div>
            </div>

            <div style={{ textAlign: "center", marginTop: "1rem" }}>
              <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "#fff" }}>
                Cikgu Maya AI
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                {isKillSwitched ? "🔴 Ditunda Sementara oleh Guru" : isAiSpeaking ? "🎙️ Sedang Berbicara..." : "Mendengar Respon Murid..."}
              </div>
            </div>

            {/* Real-time Subtitle / Closed Caption Bar */}
            <div className="tile-overlay-bottom" style={{
              background: "rgba(15, 23, 42, 0.85)",
              backdropFilter: "blur(10px)",
              padding: "0.6rem 1rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              bottom: "0.75rem",
              left: "0.75rem",
              right: "0.75rem",
              display: "flex",
              alignItems: "center",
              gap: "0.75rem"
            }}>
              <span style={{ fontSize: "1.1rem" }}>💬</span>
              <p style={{
                fontSize: "0.88rem",
                color: "#e2e8f0",
                lineHeight: "1.4",
                flex: 1,
                fontStyle: "italic"
              }}>
                &ldquo;{latestSubtitle}&rdquo;
              </p>
            </div>
          </div>

          {/* Tile 2: Student Camera / Classroom Projector */}
          <div className="meet-tile">
            <div className="tile-overlay-top">
              <div className="speaker-pill">
                <span>📹</span>
                <span>
                  {sessionMode === "CLASSROOM" ? "Dewan / Bilik Darjah Tahun 4 Gemilang (32 Murid)" : "Murid: Adam Haris (Tahun 4)"}
                </span>
              </div>

              <div style={{
                background: "rgba(0, 0, 0, 0.6)",
                padding: "0.25rem 0.6rem",
                borderRadius: "var(--radius-sm)",
                fontSize: "0.72rem",
                color: "var(--text-muted)"
              }}>
                Kamera Aktif: 1 FPS (Privasi Terpelihara)
              </div>
            </div>

            {isCameraOn ? (
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  transform: "scaleX(-1)"
                }}
              />
            ) : (
              <div style={{ textAlign: "center", color: "var(--text-dim)" }}>
                <span style={{ fontSize: "3rem" }}>📷</span>
                <p style={{ marginTop: "0.5rem", fontSize: "0.85rem" }}>Kamera Dimatikan</p>
              </div>
            )}

            {/* Visual indicator for Snap & Teach */}
            <div className="tile-overlay-bottom">
              <div style={{
                background: "rgba(0, 0, 0, 0.7)",
                backdropFilter: "blur(6px)",
                padding: "0.3rem 0.75rem",
                borderRadius: "var(--radius-full)",
                fontSize: "0.75rem",
                display: "flex",
                alignItems: "center",
                gap: "0.4rem"
              }}>
                <span style={{ color: "var(--accent-emerald)" }}>●</span>
                <span>Pengecaman Lembaran Kerja Aktif</span>
              </div>

              <button
                onClick={handleTriggerSnap}
                className="btn btn-primary"
                style={{ padding: "0.35rem 0.85rem", fontSize: "0.78rem" }}
              >
                📸 Snap & Teach (OCR)
              </button>
            </div>
          </div>
        </div>

        {/* Right Side: Interactive Sidebar Panels */}
        <div className="meet-sidebar">
          <div className="sidebar-tabs">
            <button
              onClick={() => setActiveTab("assure")}
              className={`sidebar-tab ${activeTab === "assure" ? "active" : ""}`}
            >
              📋 Model ASSURE
            </button>
            <button
              onClick={() => setActiveTab("transcripts")}
              className={`sidebar-tab ${activeTab === "transcripts" ? "active" : ""}`}
            >
              💬 Transkrip Log
            </button>
            <button
              onClick={() => setActiveTab("pbd")}
              className={`sidebar-tab ${activeTab === "pbd" ? "active" : ""}`}
            >
              📊 Rubrik PBD
            </button>
            <button
              onClick={() => setActiveTab("facilitator")}
              className={`sidebar-tab ${activeTab === "facilitator" ? "active" : ""}`}
            >
              🎛️ Mod Guru
            </button>
          </div>

          <div className="sidebar-content">
            {/* Tab 1: ASSURE Model Step Tracker */}
            {activeTab === "assure" && (
              <div>
                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "0.75rem"
                }}>
                  <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--accent-cyan)" }}>
                    KEMAJUAN 6-LANGKAH ASSURE
                  </span>
                  <Link href="/lesson-plan" style={{ fontSize: "0.75rem", color: "var(--text-muted)", textDecoration: "underline" }}>
                    Ubah Suai RPH ↗
                  </Link>
                </div>

                <div className="assure-tracker">
                  {assureSteps.map((step, idx) => (
                    <div
                      key={step.code + idx}
                      className={`assure-step-item ${idx === currentStepIndex ? "active" : idx < currentStepIndex ? "completed" : ""}`}
                      onClick={() => setCurrentStepIndex(idx)}
                      style={{ cursor: "pointer" }}
                    >
                      <div className="assure-badge">{step.code}</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "#fff" }}>
                          {step.title}
                        </div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {step.desc}
                        </div>
                      </div>
                      {idx === currentStepIndex && (
                        <span style={{ fontSize: "0.68rem", color: "var(--accent-cyan)", fontWeight: "700" }}>
                          SEMASA
                        </span>
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: "1rem", padding: "0.75rem", background: "rgba(56, 189, 248, 0.05)", borderRadius: "var(--radius-md)", border: "1px dashed var(--border-active)" }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--accent-cyan)", marginBottom: "0.25rem" }}>
                    Panduan Sesi Langkah Semasa:
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
                    Guru Maya sedang mempersembahkan bahan media interaktif organ pernafasan haiwan. Murid diajak membezakan antara insang dan spirakel.
                  </p>
                </div>
              </div>
            )}

            {/* Tab 2: Transcripts Log */}
            {activeTab === "transcripts" && (
              <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                  {transcripts.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        padding: "0.6rem 0.75rem",
                        borderRadius: "var(--radius-md)",
                        background: t.speaker === "AI_TUTOR" ? "rgba(56, 189, 248, 0.08)" : t.speaker === "SYSTEM" ? "rgba(239, 68, 68, 0.1)" : "rgba(255, 255, 255, 0.04)",
                        borderLeft: `3px solid ${t.speaker === "AI_TUTOR" ? "var(--accent-cyan)" : t.speaker === "SYSTEM" ? "var(--accent-red)" : "var(--accent-emerald)"}`
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", color: "var(--text-dim)", marginBottom: "0.2rem" }}>
                        <strong>{t.speaker === "AI_TUTOR" ? "🤖 Guru Maya AI" : t.speaker === "SYSTEM" ? "⚙️ Sistem" : "🧒 Murid"}</strong>
                        <span>{t.time}</span>
                      </div>
                      <div style={{ fontSize: "0.82rem", color: "#e2e8f0" }}>{t.message}</div>
                    </div>
                  ))}
                </div>

                {/* Quick Chat Input */}
                <div style={{ marginTop: "0.75rem", display: "flex", gap: "0.5rem" }}>
                  <input
                    type="text"
                    value={inputQuery}
                    onChange={(e) => setInputQuery(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSendPrompt()}
                    placeholder="Tanya Guru Maya atau masukkan respons..."
                    className="form-input"
                    style={{ fontSize: "0.82rem", padding: "0.5rem 0.75rem" }}
                  />
                  <button
                    onClick={() => handleSendPrompt()}
                    disabled={isLoadingAi}
                    className="btn btn-primary"
                    style={{ padding: "0.5rem 0.85rem", fontSize: "0.82rem" }}
                  >
                    Hantar
                  </button>
                </div>
              </div>
            )}

            {/* Tab 3: PBD Rubrics */}
            {activeTab === "pbd" && (
              <div>
                <div style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--accent-cyan)", marginBottom: "0.75rem" }}>
                  TABURAN PENTAKSIRAN BILIK DARJAH (PBD)
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {pbdLevels.map((pbd) => (
                    <div
                      key={pbd.level}
                      style={{
                        padding: "0.6rem 0.75rem",
                        background: "rgba(255, 255, 255, 0.03)",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--border-subtle)"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.25rem" }}>
                        <span className="badge badge-tp">{pbd.level}</span>
                        <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--accent-emerald)" }}>
                          {pbd.achieved} / 32 Murid
                        </span>
                      </div>
                      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {pbd.label}
                      </div>
                      {/* Mini progress bar */}
                      <div style={{
                        marginTop: "0.4rem",
                        height: "4px",
                        background: "rgba(255, 255, 255, 0.1)",
                        borderRadius: "var(--radius-full)",
                        overflow: "hidden"
                      }}>
                        <div style={{
                          height: "100%",
                          width: `${(pbd.achieved / 32) * 100}%`,
                          background: "linear-gradient(90deg, var(--accent-cyan), var(--accent-emerald))"
                        }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Tab 4: Facilitator Teacher Controls */}
            {activeTab === "facilitator" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                <div style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--accent-cyan)" }}>
                  PANEL KAWALAN GURU FASILITATOR (SEBENAR)
                </div>

                <div style={{ padding: "0.75rem", background: "rgba(255, 255, 255, 0.03)", borderRadius: "var(--radius-md)" }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: "600", marginBottom: "0.5rem" }}>
                    Bisikkan Arahan Pantas kepada Cikgu AI:
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                    <button
                      onClick={() => handleSendPrompt("Cikgu, cuba uji murid dengan teka-teki tentang katak.")}
                      className="btn btn-secondary"
                      style={{ fontSize: "0.72rem", padding: "0.4rem" }}
                    >
                      🐸 Teka-teki Katak
                    </button>
                    <button
                      onClick={() => handleSendPrompt("Cikgu, minta murid tunjukkan lakaran insang ikan ke kamera.")}
                      className="btn btn-secondary"
                      style={{ fontSize: "0.72rem", padding: "0.4rem" }}
                    >
                      🐟 Minta Lakaran
                    </button>
                    <button
                      onClick={() => handleSendPrompt("Cikgu, buat rumusan ringkas perbezaan 4 organ pernafasan.")}
                      className="btn btn-secondary"
                      style={{ fontSize: "0.72rem", padding: "0.4rem" }}
                    >
                      📝 Buat Rumusan
                    </button>
                    <button
                      onClick={() => setStarsAwarded((prev) => prev + 5)}
                      className="btn btn-emerald"
                      style={{ fontSize: "0.72rem", padding: "0.4rem" }}
                    >
                      ⭐ +5 Bintang Kelas
                    </button>
                  </div>
                </div>

                <div style={{
                  padding: "0.75rem",
                  background: "rgba(239, 68, 68, 0.08)",
                  borderRadius: "var(--radius-md)",
                  border: "1px solid rgba(239, 68, 68, 0.3)"
                }}>
                  <div style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--accent-red)", marginBottom: "0.3rem" }}>
                    Tanggungjawab Guru Diperakui:
                  </div>
                  <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", lineHeight: "1.4" }}>
                    Anda bertindak sebagai <em>Instructor of Record</em>. Sila gunakan Suis Kecemasan serta-merta sekiranya AI menghasilkan sebarang maklumat yang tidak tepat atau bertentangan dengan etika PdP.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Google Meet Bottom Controls Bar */}
      <footer className="meet-controls-bar">
        {/* Left: Session Info */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div>
            <div style={{ fontSize: "0.92rem", fontWeight: "700", color: "#fff" }}>
              Sains Tahun 4: Organ Pernafasan Haiwan
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--text-dim)" }}>
              Bilik: gemini-live-pdp-t4 · Model ASSURE DSKP 3.1
            </div>
          </div>
        </div>

        {/* Center: Meet Controls Buttons */}
        <div className="meet-controls-center">
          <button
            onClick={() => setIsMicOn(!isMicOn)}
            className={`btn-meet-round ${!isMicOn ? "danger" : ""}`}
            title={isMicOn ? "Matikan Mikrofon" : "Hidupkan Mikrofon"}
          >
            {isMicOn ? "🎙️" : "🔇"}
          </button>

          <button
            onClick={() => setIsCameraOn(!isCameraOn)}
            className={`btn-meet-round ${!isCameraOn ? "danger" : ""}`}
            title={isCameraOn ? "Matikan Kamera" : "Hidupkan Kamera"}
          >
            {isCameraOn ? "📹" : "🚫"}
          </button>

          <button
            onClick={() => setIsScreenSharing(!isScreenSharing)}
            className={`btn-meet-round ${isScreenSharing ? "active" : ""}`}
            title="Kongsi Skrin"
          >
            💻
          </button>

          <button
            onClick={handleTriggerSnap}
            className="btn-meet-round"
            title="Snap & Teach (Pengecaman Lembaran Kerja OCR)"
            style={{ background: "rgba(56, 189, 248, 0.2)", borderColor: "var(--accent-cyan)" }}
          >
            📸
          </button>

          <button
            onClick={() => setStarsAwarded((prev) => prev + 1)}
            className="btn-meet-round"
            title="Beri 1 Bintang Pintar kepada Murid"
            style={{ background: "rgba(251, 191, 36, 0.2)", borderColor: "var(--accent-gold)" }}
          >
            ⭐
          </button>

          {/* Emergency Kill Switch */}
          <button
            onClick={triggerKillSwitch}
            className="btn btn-killswitch"
            title="SUIS KECEMASAN: Ambil alih kelas daripada AI serta-merta"
          >
            🚨 SUIS KECEMASAN
          </button>

          {/* End Call Button */}
          <button
            onClick={handleEndSession}
            className="btn-meet-round danger"
            title="Tamatkan Sesi Pengajaran"
          >
            📞
          </button>
        </div>

        {/* Right: Wallet & Download Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <a
            href="/api/lesson-plan/export?format=docx"
            className="btn btn-secondary"
            style={{ fontSize: "0.78rem", padding: "0.45rem 0.8rem" }}
          >
            📄 e-RPH Word
          </a>
          <a
            href="/api/lesson-plan/export?format=pdf"
            className="btn btn-secondary"
            style={{ fontSize: "0.78rem", padding: "0.45rem 0.8rem" }}
          >
            📕 e-RPH PDF
          </a>
        </div>
      </footer>

      {/* Snap & Teach OCR Modal */}
      {isSnapModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <h3 style={{ fontSize: "1.25rem", color: "#fff", marginBottom: "0.5rem" }}>
              📸 Snap & Teach: Pengecaman Visual Buku Teks & Lembaran
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--text-muted)", marginBottom: "1.25rem" }}>
              Muat naik gambar buku teks KPM atau lembaran kerja murid. Gemini 3.8 Vision akan mengecam teks dan memulakan pengajaran interaktif secara langsung.
            </p>

            <div style={{ marginBottom: "1.5rem" }}>
              <input
                type="file"
                accept="image/*"
                onChange={processSnapUpload}
                className="form-input"
              />
            </div>

            {snapPreview && (
              <div style={{ marginBottom: "1.5rem", textAlign: "center" }}>
                <img
                  src={snapPreview}
                  alt="Preview"
                  style={{ maxHeight: "220px", maxWidth: "100%", borderRadius: "var(--radius-md)", border: "1px solid var(--border-glow)" }}
                />
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                onClick={() => { setIsSnapModalOpen(false); setSnapPreview(null); }}
                className="btn btn-secondary"
              >
                Batal
              </button>
              <button
                onClick={confirmSnapToAi}
                disabled={isAnalyzingSnap || !snapPreview}
                className="btn btn-primary"
              >
                {isAnalyzingSnap ? "Menganalisis Visual..." : "Ajar Lembaran Ini"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* End Session & Automated PBD WhatsApp Micro-Report Modal */}
      {isEndModalOpen && (
        <div className="modal-backdrop">
          <div className="modal-card">
            <div style={{ textAlign: "center", marginBottom: "1rem" }}>
              <span style={{ fontSize: "3rem" }}>🎉</span>
              <h3 style={{ fontSize: "1.4rem", color: "#fff", marginTop: "0.5rem" }}>
                Sesi PdP Selesai dengan Cemerlang!
              </h3>
              <p style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>
                Ringkasan PBD dan Invois Penggunaan Masa Berasaskan RM0.80/minit
              </p>
            </div>

            <div style={{
              background: "rgba(16, 185, 129, 0.08)",
              border: "1px solid rgba(16, 185, 129, 0.3)",
              borderRadius: "var(--radius-md)",
              padding: "1rem",
              marginBottom: "1rem"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Tempoh Pengajaran:</span>
                <strong style={{ color: "#fff" }}>{endSessionSummary?.billable_minutes || 4} Minit</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>Kadar Per Minit:</span>
                <strong style={{ color: "var(--accent-emerald)" }}>RM 0.80</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid var(--border-subtle)", paddingTop: "0.5rem" }}>
                <span style={{ fontSize: "0.95rem", fontWeight: "700", color: "#fff" }}>Jumlah Dituntaskan (Dompet):</span>
                <strong style={{ fontSize: "1.1rem", color: "var(--accent-emerald)" }}>
                  RM {endSessionSummary?.total_charged_myr || "3.20"}
                </strong>
              </div>
            </div>

            {/* Micro-report preview for WhatsApp to parents */}
            <div style={{
              background: "rgba(15, 23, 42, 0.8)",
              padding: "0.85rem",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              marginBottom: "1.5rem"
            }}>
              <div style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--accent-cyan)", marginBottom: "0.4rem" }}>
                📱 Draf Laporan Mikro WhatsApp Untuk Ibu Bapa:
              </div>
              <div style={{
                fontSize: "0.78rem",
                color: "#cbd5e1",
                background: "rgba(0, 0, 0, 0.3)",
                padding: "0.6rem",
                borderRadius: "var(--radius-sm)",
                whiteSpace: "pre-wrap",
                fontFamily: "monospace"
              }}>
{`Salam Sejahtera Ibu Bapa Tahun 4 Gemilang,

Anak tuan/puan telah selesai mengikuti sesi Sains: Organ Pernafasan Haiwan (Model ASSURE).
⭐ Pencapaian Kelas: ${starsAwarded} Bintang Pintar
📊 Tahap Penguasaan PBD Keseluruhan: TP3 - TP4 (Menguasai konsep peparu, insang, spirakel & kulit lembap).
👨‍🏫 Guru Fasilitator: Pn. Siti Nurhaliza (Diperakui Sah)`}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(`Salam Sejahtera Ibu Bapa Tahun 4 Gemilang, anak tuan/puan telah selesai mengikuti sesi Sains.`);
                  alert("Teks Laporan WhatsApp telah disalin ke papan klip!");
                }}
                className="btn btn-secondary"
              >
                📋 Salin Teks WhatsApp
              </button>
              <button
                onClick={() => { setIsEndModalOpen(false); window.location.reload(); }}
                className="btn btn-primary"
              >
                Kembali ke Bilik Guru
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
