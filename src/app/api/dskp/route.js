import { NextResponse } from "next/server";
import { getDatabase } from "@/lib/db/db";

export async function GET() {
  try {
    const db = getDatabase();
    const rows = db.prepare("SELECT * FROM dskp_standards ORDER BY subject ASC, level ASC").all();
    
    // Parse JSON columns
    const parsedRows = rows.map((row) => ({
      ...row,
      learning_standards: JSON.parse(row.learning_standards_json || "[]"),
      pbd_rubrics: JSON.parse(row.pbd_rubrics_json || "{}"),
      suggested_activities: JSON.parse(row.suggested_activities_json || "[]"),
    }));

    return NextResponse.json({ success: true, data: parsedRows });
  } catch (error) {
    console.error("Error fetching DSKP:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
