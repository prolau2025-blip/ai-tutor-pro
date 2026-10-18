import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/db";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const sessionId = searchParams.get("id");
    const db = getDatabase();

    if (sessionId) {
      const session = db.prepare(`
        SELECT s.*, lp.title as plan_title, lp.dskp_id, lp.target_duration_minutes,
               ds.topic as dskp_topic, ds.content_standard, ds.pbd_rubrics_json
        FROM sessions s
        LEFT JOIN lesson_plans lp ON s.lesson_plan_id = lp.id
        LEFT JOIN dskp_standards ds ON lp.dskp_id = ds.id
        WHERE s.id = ?
      `).get(sessionId);

      const transcripts = db.prepare("SELECT * FROM session_transcripts WHERE session_id = ? ORDER BY timestamp_offset_ms ASC").all(sessionId);

      return NextResponse.json({ success: true, data: { session, transcripts } });
    }

    const sessions = db.prepare(`
      SELECT s.*, lp.title as plan_title
      FROM sessions s
      LEFT JOIN lesson_plans lp ON s.lesson_plan_id = lp.id
      ORDER BY s.started_at DESC LIMIT 20
    `).all();

    return NextResponse.json({ success: true, data: sessions });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      lesson_plan_id,
      title = "Sesi PdP Google Meet Bersama Gemini 3.8",
      subject = "Sains",
      mode = "CLASSROOM",
      gemini_voice = "Puck"
    } = body;

    const db = getDatabase();
    const sessionId = `SES-${Date.now().toString(36).toUpperCase()}`;
    const teacherId = "USR-TEACHER-001";

    db.prepare(`
      INSERT INTO sessions (
        id, lesson_plan_id, teacher_id, title, subject, mode, gemini_voice,
        status, started_at, active_student_count
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)
    `).run(sessionId, lesson_plan_id || null, teacherId, title, subject, mode, gemini_voice, "ACTIVE", mode === "CLASSROOM" ? 35 : 1);

    return NextResponse.json({
      success: true,
      data: {
        session_id: sessionId,
        title,
        status: "ACTIVE",
        mode,
        gemini_voice
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PATCH(req) {
  try {
    const body = await req.json();
    const { session_id, action, stars_awarded, duration_seconds } = body;

    if (!session_id) {
      return NextResponse.json({ success: false, error: "Session ID required" }, { status: 400 });
    }

    const db = getDatabase();
    const session = db.prepare("SELECT * FROM sessions WHERE id = ?").get(session_id);

    if (!session) {
      return NextResponse.json({ success: false, error: "Session not found" }, { status: 404 });
    }

    if (action === "KILL_SWITCH") {
      // Emergency teacher takeover - freeze AI immediately (<50ms)
      db.prepare("UPDATE sessions SET status = 'EMERGENCY_STOPPED' WHERE id = ?").run(session_id);
      db.prepare(`
        INSERT INTO session_transcripts (id, session_id, speaker, message, timestamp_offset_ms, flagged_safety)
        VALUES (?, ?, 'SYSTEM', '🚨 SUIS KECEMASAN DIJALANKAN OLEH GURU. Pengajaran AI dihentikan serta-merta.', ?, 1)
      `).run(`TR-${Date.now()}`, session_id, (duration_seconds || 0) * 1000);

      return NextResponse.json({ success: true, message: "Emergency kill switch engaged. AI muted and halted." });
    }

    if (action === "END_SESSION") {
      const finalDuration = duration_seconds || 1800; // default 30 min in seconds
      const billableMinutes = Math.ceil(finalDuration / 60);
      const totalCharged = Number((billableMinutes * 0.80).toFixed(2)); // RM 0.80 / min

      const tx = db.transaction(() => {
        db.prepare(`
          UPDATE sessions
          SET status = 'ENDED', ended_at = datetime('now'), duration_seconds = ?, stars_awarded = COALESCE(?, stars_awarded)
          WHERE id = ?
        `).run(finalDuration, stars_awarded, session_id);

        // Record billing record
        db.prepare(`
          INSERT INTO session_billing (id, session_id, user_id, billable_seconds, rate_per_minute, total_charged_myr, status)
          VALUES (?, ?, ?, ?, 0.80, ?, 'PAID')
        `).run(`BILL-${session_id}`, session_id, session.teacher_id, finalDuration, totalCharged);

        // Deduct from organization prepaid wallet
        db.prepare(`
          UPDATE organizations
          SET credit_balance_myr = MAX(0, credit_balance_myr - ?)
          WHERE id = 'ORG-SK-TAMAN-MELAWATI'
        `).run(totalCharged);

        // Record wallet ledger
        db.prepare(`
          INSERT INTO wallet_transactions (id, user_id, org_id, type, amount_myr, description, reference_id)
          VALUES (?, ?, 'ORG-SK-TAMAN-MELAWATI', 'SESSION_DEDUCTION', ?, ?, ?)
        `).run(`WAL-DED-${Date.now()}`, session.teacher_id, -totalCharged, `Caj Sesi PdP Google Meet (${billableMinutes} minit @ RM0.80/min)`, session_id);
      });

      tx();

      return NextResponse.json({
        success: true,
        message: "Sesi selesai. Pengebilan masa telah direkodkan.",
        billing: {
          billable_minutes: billableMinutes,
          rate_per_min: 0.80,
          total_charged_myr: totalCharged
        }
      });
    }

    if (action === "UPDATE_STARS") {
      db.prepare("UPDATE sessions SET stars_awarded = ? WHERE id = ?").run(stars_awarded, session_id);
      return NextResponse.json({ success: true, stars_awarded });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Session update error:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
