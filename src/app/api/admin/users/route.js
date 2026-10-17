import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/db";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const db = getDatabase();
    const users = db.prepare(`
      SELECT u.id, u.full_name, u.email, u.phone_number, u.role, u.is_verified, u.created_at,
             o.name as organization_name, o.code as school_code, o.credit_balance_myr,
             k.masked_ic, k.verified_at
      FROM users u
      LEFT JOIN organizations o ON u.org_id = o.id
      LEFT JOIN kyc_verifications k ON u.id = k.user_id
      ORDER BY u.created_at DESC
    `).all();

    return NextResponse.json({ success: true, data: users });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { full_name, email, phone_number, role = "TEACHER", org_id = "ORG-SK-TAMAN-MELAWATI", password = "password123" } = body;

    if (!full_name || !email) {
      return NextResponse.json({ success: false, error: "Nama dan Emel diwajibkan." }, { status: 400 });
    }

    const db = getDatabase();
    const userId = `USR-${Date.now().toString(36).toUpperCase()}`;
    const hash = bcrypt.hashSync(password, 10);

    db.prepare(`
      INSERT INTO users (id, org_id, full_name, email, phone_number, password_hash, role, is_verified)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0)
    `).run(userId, org_id, full_name, email, phone_number || "+60100000000", hash, role);

    return NextResponse.json({
      success: true,
      message: "Akaun guru berjaya ditambah. Guru perlu melengkapkan e-KYC sebelum memulakan sesi PdP.",
      data: { id: userId, full_name, email }
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("id");

    if (!userId) {
      return NextResponse.json({ success: false, error: "User ID diwajibkan" }, { status: 400 });
    }

    const db = getDatabase();
    db.prepare("DELETE FROM users WHERE id = ?").run(userId);

    return NextResponse.json({ success: true, message: "Akaun berjaya dipadam daripada pangkalan data." });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
