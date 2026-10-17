import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/db";

export async function GET() {
  try {
    const db = getDatabase();

    const usersCount = db.prepare("SELECT COUNT(*) as count FROM users").get().count;
    const verifiedKycCount = db.prepare("SELECT COUNT(*) as count FROM users WHERE is_verified = 1").get().count;
    const orgsCount = db.prepare("SELECT COUNT(*) as count FROM organizations").get().count;
    const sessionsCount = db.prepare("SELECT COUNT(*) as count FROM sessions").get().count;
    const totalMinutesResult = db.prepare("SELECT COALESCE(SUM(duration_seconds), 0) as total_sec FROM sessions").get();
    const totalMinutes = Math.round(totalMinutesResult.total_sec / 60);

    const totalRevenueResult = db.prepare("SELECT COALESCE(SUM(total_charged_myr), 0) as revenue FROM session_billing").get();
    const totalRevenue = totalRevenueResult.revenue;

    const recentSessions = db.prepare(`
      SELECT s.*, u.full_name as teacher_name, o.name as org_name
      FROM sessions s
      LEFT JOIN users u ON s.teacher_id = u.id
      LEFT JOIN organizations o ON u.org_id = o.id
      ORDER BY s.started_at DESC LIMIT 5
    `).all();

    const kycAudit = db.prepare(`
      SELECT k.*, u.email, u.phone_number
      FROM kyc_verifications k
      LEFT JOIN users u ON k.user_id = u.id
      ORDER BY k.verified_at DESC LIMIT 5
    `).all();

    return NextResponse.json({
      success: true,
      stats: {
        total_teachers: usersCount,
        verified_kyc_rate: usersCount > 0 ? Math.round((verifiedKycCount / usersCount) * 100) : 100,
        total_schools: orgsCount,
        total_sessions: sessionsCount,
        total_teaching_minutes: totalMinutes,
        platform_revenue_myr: totalRevenue,
        rate_per_minute_myr: 0.80,
      },
      recent_sessions: recentSessions,
      recent_kyc_audits: kycAudit
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
