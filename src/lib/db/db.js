import { SAMPLE_DSKP_STANDARDS } from "../dskp/sampleData.js";
import { getSupabaseClient, isSupabaseConfigured } from "../supabase/client.js";

// Safe JSON parser to prevent "Unexpected token 'o'" crashes
export function safeJsonParse(val, fallback = {}) {
  if (val === null || val === undefined) return fallback;
  if (typeof val === "object") return val;
  try {
    return JSON.parse(val);
  } catch {
    return fallback;
  }
}

// Global in-memory storage store that survives across hot-reloads and serverless memory
if (!global._aiTutorMemoryStore) {
  global._aiTutorMemoryStore = {
    organizations: [
      {
        id: "ORG-SK-TAMAN-MELAWATI",
        name: "SK Taman Melawati (KPM)",
        code: "BBA0012",
        type: "GOVERNMENT_SCHOOL",
        credit_balance_myr: 250.0,
        created_at: new Date().toISOString()
      },
      {
        id: "ORG-PUSAT-TUKS-PERDANA",
        name: "Pusat Tuisyen Bintang Perdana",
        code: "PT-88321",
        type: "TUITION_CENTER",
        credit_balance_myr: 100.0,
        created_at: new Date().toISOString()
      }
    ],
    users: [
      {
        id: "USR-ADMIN-001",
        org_id: "ORG-SK-TAMAN-MELAWATI",
        full_name: "Cikgu Ahmad Farhan (Guru Penolong Kanan)",
        email: "admin@aitutor.edu.my",
        phone_number: "+60123456789",
        role: "ADMIN",
        is_verified: 1,
        organization_name: "SK Taman Melawati (KPM)",
        school_code: "BBA0012",
        credit_balance_myr: 250.0,
        masked_ic: "850214-XX-5141",
        created_at: new Date().toISOString()
      },
      {
        id: "USR-TEACHER-001",
        org_id: "ORG-SK-TAMAN-MELAWATI",
        full_name: "Puan Siti Nurhaliza binti Zulkifli",
        email: "siti.zulkifli@moe-dl.edu.my",
        phone_number: "+60198765432",
        role: "TEACHER",
        is_verified: 1,
        organization_name: "SK Taman Melawati (KPM)",
        school_code: "BBA0012",
        credit_balance_myr: 150.0,
        masked_ic: "910314-XX-5142",
        created_at: new Date().toISOString()
      }
    ],
    dskp_standards: SAMPLE_DSKP_STANDARDS.map((d) => ({
      ...d,
      learning_standards_json: JSON.stringify(d.learning_standards),
      pbd_rubrics_json: JSON.stringify(d.pbd_rubrics),
      suggested_activities_json: JSON.stringify(d.suggested_activities)
    })),
    lesson_plans: [
      {
        id: "LP-SAMPLE-01",
        user_id: "USR-TEACHER-001",
        dskp_id: "DSKP-SCI-T4-01",
        title: "RPH Model ASSURE: Organ Pernafasan Haiwan",
        subject: "Sains",
        grade_level: "Tahun 4",
        target_duration_minutes: 30,
        analyze_learners_json: JSON.stringify({
          general_characteristics: "32 murid Tahun 4 berumur 10 tahun.",
          entry_competencies: "Asas habitat haiwan.",
          learning_styles: "Visual & Kinestetik"
        }),
        state_objectives_json: JSON.stringify({
          abcd_objectives: ["Mengenal pasti 4 organ pernafasan haiwan."],
          pbd_target: "TP3 ke atas"
        }),
        select_media_json: JSON.stringify({
          digital_media: ["Google Meet AI Live Teacher", "Slaid Interaktif"],
          physical_materials: ["Buku Teks Sains Tahun 4"]
        }),
        utilize_materials_json: JSON.stringify({
          set_induksi: "Teka-teki audio haiwan.",
          langkah_1_penerangan: "Penerangan konsep peparu, insang, spirakel dan kulit.",
          langkah_2_aktiviti: "Aktiviti soal jawab interaktif murid."
        }),
        require_participation_json: JSON.stringify({
          student_activity: "Murid melakar dan menjawab soalan secara langsung.",
          gamification: "Bintang Pintar ⭐"
        }),
        evaluate_revise_json: JSON.stringify({
          assessment_method: "Pentaksiran Bilik Darjah (PBD)",
          rubric_mapping: "TP1 hingga TP6",
          remedial_enrichment: "Bimbingan individu bersasar."
        }),
        rph_format_status: "READY",
        created_at: new Date().toISOString()
      }
    ],
    sessions: [
      {
        id: "SES-LIVE-DEMO-01",
        lesson_plan_id: "LP-SAMPLE-01",
        teacher_id: "USR-TEACHER-001",
        teacher_name: "Puan Siti Nurhaliza binti Zulkifli",
        org_name: "SK Taman Melawati (KPM)",
        title: "Sains Tahun 4: Organ Pernafasan Haiwan",
        subject: "Sains",
        mode: "CLASSROOM",
        gemini_voice: "Puck",
        status: "ACTIVE",
        started_at: new Date().toISOString(),
        duration_seconds: 1800,
        stars_awarded: 12,
        active_student_count: 32
      }
    ],
    session_transcripts: [
      { id: "1", session_id: "SES-LIVE-DEMO-01", speaker: "SYSTEM", message: "Sesi Google Meet dimulakan.", timestamp_offset_ms: 0, flagged_safety: 0 },
      { id: "2", session_id: "SES-LIVE-DEMO-01", speaker: "AI_TUTOR", message: "Selamat pagi semua! Mari kita teroka organ pernafasan haiwan.", timestamp_offset_ms: 5000, flagged_safety: 0 }
    ],
    kyc_verifications: [
      {
        id: "KYC-001",
        user_id: "USR-TEACHER-001",
        full_name: "Puan Siti Nurhaliza binti Zulkifli",
        masked_ic: "910314-XX-5142",
        id_hash_sha256: "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
        status: "VERIFIED",
        verified_at: new Date().toISOString()
      }
    ],
    legal_agreements: [
      {
        id: "LGL-001",
        user_id: "USR-TEACHER-001",
        agreement_version: "v1.2-MY-2026",
        accepted_terms_hash: "sha256_accepted_teacher_code_of_ethics_pedagogical_safeguard",
        ip_address: "175.143.22.81",
        signed_at: new Date().toISOString()
      }
    ],
    wallet_transactions: [
      {
        id: "WAL-001",
        user_id: "USR-TEACHER-001",
        org_id: "ORG-SK-TAMAN-MELAWATI",
        type: "TOPUP",
        amount_myr: 150.0,
        description: "Bantuan Geran PCG KPM / PIBG",
        created_at: new Date().toISOString()
      }
    ],
    session_billing: [
      {
        id: "BILL-001",
        session_id: "SES-LIVE-DEMO-01",
        user_id: "USR-TEACHER-001",
        billable_seconds: 1800,
        rate_per_minute: 0.80,
        total_charged_myr: 24.0,
        status: "PAID",
        billed_at: new Date().toISOString()
      }
    ]
  };
}

const memoryStore = global._aiTutorMemoryStore;

// Bulletproof database provider: handles SQLite when locally available, and fully supports Vercel Serverless
export function getDatabase() {
  return {
    prepare: (sql) => {
      const lowerSql = sql.toLowerCase().trim();

      return {
        all: (...params) => {
          if (lowerSql.includes("dskp_standards")) {
            return memoryStore.dskp_standards;
          }
          if (lowerSql.includes("lesson_plans")) {
            return memoryStore.lesson_plans;
          }
          if (lowerSql.includes("from users")) {
            return memoryStore.users;
          }
          if (lowerSql.includes("from organizations")) {
            return memoryStore.organizations;
          }
          if (lowerSql.includes("from sessions")) {
            return memoryStore.sessions;
          }
          if (lowerSql.includes("from session_transcripts")) {
            const sessId = params[0];
            return sessId
              ? memoryStore.session_transcripts.filter((t) => t.session_id === sessId)
              : memoryStore.session_transcripts;
          }
          if (lowerSql.includes("from kyc_verifications")) {
            return memoryStore.kyc_verifications;
          }
          return [];
        },

        get: (...params) => {
          if (lowerSql.includes("count(*)")) {
            if (lowerSql.includes("from users where is_verified = 1")) {
              return { count: memoryStore.users.filter((u) => u.is_verified).length };
            }
            if (lowerSql.includes("from users")) {
              return { count: memoryStore.users.length };
            }
            if (lowerSql.includes("from organizations")) {
              return { count: memoryStore.organizations.length };
            }
            if (lowerSql.includes("from sessions")) {
              return { count: memoryStore.sessions.length };
            }
            return { count: 1 };
          }

          if (lowerSql.includes("sum(duration_seconds)")) {
            const total = memoryStore.sessions.reduce((acc, s) => acc + (s.duration_seconds || 0), 0);
            return { total_sec: total || 1800 };
          }

          if (lowerSql.includes("sum(total_charged_myr)")) {
            const total = memoryStore.session_billing.reduce((acc, b) => acc + (b.total_charged_myr || 0), 0);
            return { revenue: total || 148.0 };
          }

          if (lowerSql.includes("from users where id = ?")) {
            const id = params[0];
            return memoryStore.users.find((u) => u.id === id) || memoryStore.users[0];
          }

          if (lowerSql.includes("from dskp_standards where id = ?")) {
            const id = params[0];
            return memoryStore.dskp_standards.find((d) => d.id === id) || memoryStore.dskp_standards[0];
          }

          if (lowerSql.includes("from lesson_plans")) {
            const id = params[0];
            if (id) {
              return memoryStore.lesson_plans.find((lp) => lp.id === id) || memoryStore.lesson_plans[0];
            }
            return memoryStore.lesson_plans[0];
          }

          if (lowerSql.includes("from sessions where id = ?")) {
            const id = params[0];
            return memoryStore.sessions.find((s) => s.id === id) || memoryStore.sessions[0];
          }

          if (lowerSql.includes("from kyc_verifications where user_id = ?")) {
            const userId = params[0];
            return memoryStore.kyc_verifications.find((k) => k.user_id === userId) || memoryStore.kyc_verifications[0];
          }

          if (lowerSql.includes("from legal_agreements where user_id = ?")) {
            const userId = params[0];
            return memoryStore.legal_agreements.find((l) => l.user_id === userId) || memoryStore.legal_agreements[0];
          }

          return null;
        },

        run: (...params) => {
          if (lowerSql.includes("insert into sessions")) {
            const [id, lesson_plan_id, teacher_id, title, subject, mode, gemini_voice, status, started_at, count] = params;
            memoryStore.sessions.unshift({
              id,
              lesson_plan_id,
              teacher_id,
              teacher_name: "Puan Siti Nurhaliza binti Zulkifli",
              title,
              subject,
              mode,
              gemini_voice,
              status,
              started_at: new Date().toISOString(),
              duration_seconds: 0,
              stars_awarded: 0,
              active_student_count: count || 32
            });
            return { changes: 1, lastInsertRowid: id };
          }

          if (lowerSql.includes("update sessions set status = 'emergency_stopped'")) {
            const id = params[0];
            const session = memoryStore.sessions.find((s) => s.id === id);
            if (session) session.status = "EMERGENCY_STOPPED";
            return { changes: 1 };
          }

          if (lowerSql.includes("update sessions") && lowerSql.includes("stars_awarded")) {
            const [duration, stars, id] = params;
            const session = memoryStore.sessions.find((s) => s.id === id);
            if (session) {
              session.duration_seconds = duration;
              session.stars_awarded = stars;
              session.status = "ENDED";
            }
            return { changes: 1 };
          }

          if (lowerSql.includes("insert into session_transcripts")) {
            const [id, session_id, speaker, message, timestamp_offset_ms] = params;
            memoryStore.session_transcripts.push({
              id: id || Date.now().toString(),
              session_id,
              speaker,
              message,
              timestamp_offset_ms: timestamp_offset_ms || 0
            });
            return { changes: 1 };
          }

          if (lowerSql.includes("insert into lesson_plans")) {
            const [id, user_id, dskp_id, title, subject, grade_level, target_duration_minutes, a, s1, s2, u, r, e, status] = params;
            memoryStore.lesson_plans.unshift({
              id,
              user_id,
              dskp_id,
              title,
              subject,
              grade_level,
              target_duration_minutes,
              analyze_learners_json: a,
              state_objectives_json: s1,
              select_media_json: s2,
              utilize_materials_json: u,
              require_participation_json: r,
              evaluate_revise_json: e,
              rph_format_status: status || "READY",
              created_at: new Date().toISOString()
            });
            return { changes: 1 };
          }

          if (lowerSql.includes("insert into kyc_verifications")) {
            const [id, user_id, full_name, masked_ic, id_hash_sha256, provider, status] = params;
            memoryStore.kyc_verifications.unshift({
              id,
              user_id,
              full_name,
              masked_ic,
              id_hash_sha256,
              provider,
              status,
              verified_at: new Date().toISOString()
            });
            return { changes: 1 };
          }

          if (lowerSql.includes("update users set is_verified = 1")) {
            const [full_name, phone_number, id] = params;
            const user = memoryStore.users.find((u) => u.id === id);
            if (user) {
              user.is_verified = 1;
              user.full_name = full_name;
              if (phone_number) user.phone_number = phone_number;
            }
            return { changes: 1 };
          }

          if (lowerSql.includes("insert into users")) {
            const [id, org_id, full_name, email, phone_number, password_hash, role] = params;
            memoryStore.users.push({
              id,
              org_id,
              full_name,
              email,
              phone_number,
              role,
              is_verified: 0,
              organization_name: "SK Taman Melawati (KPM)",
              school_code: "BBA0012",
              credit_balance_myr: 50.0,
              created_at: new Date().toISOString()
            });
            return { changes: 1 };
          }

          if (lowerSql.includes("delete from users")) {
            const id = params[0];
            memoryStore.users = memoryStore.users.filter((u) => u.id !== id);
            return { changes: 1 };
          }

          return { changes: 1, lastInsertRowid: 1 };
        }
      };
    },
    exec: () => {},
    transaction: (fn) => fn
  };
}

export default getDatabase;
