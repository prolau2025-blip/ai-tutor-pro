import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/db";
import crypto from "crypto";

export async function GET() {
  try {
    const db = getDatabase();
    const userId = "USR-TEACHER-001";
    const agreement = db.prepare("SELECT * FROM legal_agreements WHERE user_id = ? ORDER BY signed_at DESC LIMIT 1").get(userId);

    return NextResponse.json({ success: true, signed: Boolean(agreement), data: agreement || null });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { agreement_version = "v1.2-MY-2026", full_name, ip_address = "127.0.0.1" } = body;

    const termsPayload = `LEGAL_UNDERTAKING_TEACHER_OF_RECORD_${agreement_version}_${full_name}`;
    const termsHash = crypto.createHash("sha256").update(termsPayload).digest("hex");

    const db = getDatabase();
    const userId = "USR-TEACHER-001";
    const agreementId = `LGL-${Date.now().toString(36).toUpperCase()}`;

    db.prepare(`
      INSERT INTO legal_agreements (id, user_id, agreement_version, accepted_terms_hash, ip_address, user_agent)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(agreementId, userId, agreement_version, termsHash, ip_address, "AI-Tutor-Client/1.0");

    return NextResponse.json({
      success: true,
      message: "Akujanji Perundangan & Surat Ikrar Guru 'Tech for Good' telah ditandatangani secara sah.",
      data: {
        agreement_id: agreementId,
        terms_hash: termsHash,
        version: agreement_version
      }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
