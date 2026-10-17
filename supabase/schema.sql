-- =============================================================================
-- AI TUTOR PRO - SUPABASE (POSTGRESQL) SCHEMA
-- Compliant with Malaysian PDPA 2010, Child Act 2001, and KPM Circulars.
-- =============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Organizations (Schools, Tuition Centers, JPN Districts)
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY DEFAULT ('ORG-' || substr(md5(random()::text), 1, 8)),
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  type TEXT DEFAULT 'GOVERNMENT_SCHOOL', -- GOVERNMENT_SCHOOL, PRIVATE_SCHOOL, TUITION_CENTER, INDEPENDENT
  credit_balance_myr NUMERIC(10, 2) DEFAULT 50.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Users (Teachers, Admins, Facilitators)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY DEFAULT ('USR-' || substr(md5(random()::text), 1, 8)),
  org_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone_number TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'TEACHER', -- TEACHER, HEADMASTER, JPN_OFFICER, ADMIN
  is_verified BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. e-KYC Verifications (Zero raw MyKad image storage - tokenized & masked)
CREATE TABLE IF NOT EXISTS kyc_verifications (
  id TEXT PRIMARY KEY DEFAULT ('KYC-' || substr(md5(random()::text), 1, 8)),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  masked_ic TEXT NOT NULL, -- e.g. 910314-XX-5142
  id_hash_sha256 TEXT NOT NULL, -- Salted hash for deduplication
  provider TEXT DEFAULT 'CTOS_INNOV8TIF_ACCREDITED',
  status TEXT DEFAULT 'VERIFIED',
  verified_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Legal Undertakings ("Tech for Good" and Strict Non-Liability Agreement)
CREATE TABLE IF NOT EXISTS legal_agreements (
  id TEXT PRIMARY KEY DEFAULT ('LGL-' || substr(md5(random()::text), 1, 8)),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  agreement_version TEXT NOT NULL, -- e.g. 'v1.2-MY-2026'
  accepted_terms_hash TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  signed_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. DSKP Curriculum Repository (KPM Standards)
CREATE TABLE IF NOT EXISTS dskp_standards (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  level TEXT NOT NULL,
  theme TEXT NOT NULL,
  topic TEXT NOT NULL,
  code_standard TEXT NOT NULL,
  content_standard TEXT NOT NULL,
  learning_standards_json JSONB NOT NULL DEFAULT '[]'::jsonb,
  pbd_rubrics_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  suggested_activities_json JSONB DEFAULT '[]'::jsonb
);

-- 6. ASSURE Model Lesson Plans
CREATE TABLE IF NOT EXISTS lesson_plans (
  id TEXT PRIMARY KEY DEFAULT ('LP-' || substr(md5(random()::text), 1, 8)),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  dskp_id TEXT REFERENCES dskp_standards(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  target_duration_minutes INTEGER DEFAULT 30,
  
  -- ASSURE 6-Step JSON Structure
  analyze_learners_json JSONB NOT NULL,
  state_objectives_json JSONB NOT NULL,
  select_media_json JSONB NOT NULL,
  utilize_materials_json JSONB NOT NULL,
  require_participation_json JSONB NOT NULL,
  evaluate_revise_json JSONB NOT NULL,
  
  rph_format_status TEXT DEFAULT 'READY',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Live Classroom Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY DEFAULT ('SES-' || substr(md5(random()::text), 1, 8)),
  lesson_plan_id TEXT REFERENCES lesson_plans(id) ON DELETE SET NULL,
  teacher_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  mode TEXT DEFAULT 'CLASSROOM', -- CLASSROOM (Mode B), INDIVIDUAL_TUITION (Mode A)
  gemini_voice TEXT DEFAULT 'Puck', -- Puck, Aoede, Charon, Fenrir, Kore
  status TEXT DEFAULT 'ACTIVE', -- ACTIVE, PAUSED, ENDED, EMERGENCY_STOPPED
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  stars_awarded INTEGER DEFAULT 0,
  active_student_count INTEGER DEFAULT 1
);

-- 8. Session Audit & Transcripts (No raw audio stored, text log only for safety backup)
CREATE TABLE IF NOT EXISTS session_transcripts (
  id TEXT PRIMARY KEY DEFAULT ('TR-' || substr(md5(random()::text), 1, 8)),
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  speaker TEXT NOT NULL, -- 'TEACHER', 'STUDENT', 'AI_TUTOR', 'SYSTEM'
  message TEXT NOT NULL,
  timestamp_offset_ms INTEGER NOT NULL,
  flagged_safety BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. PBD (Pentaksiran Bilik Darjah) Student Outcomes
CREATE TABLE IF NOT EXISTS pbd_evaluations (
  id TEXT PRIMARY KEY DEFAULT ('PBD-' || substr(md5(random()::text), 1, 8)),
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  student_identifier TEXT NOT NULL,
  mastery_level TEXT NOT NULL, -- TP1, TP2, TP3, TP4, TP5, TP6
  rubric_justification TEXT NOT NULL,
  recommended_next_steps TEXT,
  evaluated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. Prepaid Wallet Transactions
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id TEXT PRIMARY KEY DEFAULT ('WAL-' || substr(md5(random()::text), 1, 8)),
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  org_id TEXT REFERENCES organizations(id) ON DELETE SET NULL,
  type TEXT NOT NULL, -- 'TOPUP', 'SESSION_DEDUCTION', 'REFUND'
  amount_myr NUMERIC(10, 2) NOT NULL,
  description TEXT NOT NULL,
  reference_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. Session Billing Detailed Invoices (RM 0.80 / minute)
CREATE TABLE IF NOT EXISTS session_billing (
  id TEXT PRIMARY KEY DEFAULT ('BILL-' || substr(md5(random()::text), 1, 8)),
  session_id TEXT NOT NULL REFERENCES sessions(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  billable_seconds INTEGER NOT NULL,
  rate_per_minute NUMERIC(5, 2) DEFAULT 0.80,
  total_charged_myr NUMERIC(10, 2) NOT NULL,
  status TEXT DEFAULT 'PAID',
  billed_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================================================
-- SEED DATA (Malaysian KPM Schools, Teacher, DSKP Standards)
-- =============================================================================

INSERT INTO organizations (id, name, code, type, credit_balance_myr)
VALUES 
  ('ORG-SK-TAMAN-MELAWATI', 'SK Taman Melawati (KPM)', 'BBA0012', 'GOVERNMENT_SCHOOL', 250.00),
  ('ORG-PUSAT-TUKS-PERDANA', 'Pusat Tuisyen Bintang Perdana', 'PT-88321', 'TUITION_CENTER', 100.00)
ON CONFLICT (id) DO NOTHING;

INSERT INTO users (id, org_id, full_name, email, phone_number, password_hash, role, is_verified)
VALUES
  ('USR-ADMIN-001', 'ORG-SK-TAMAN-MELAWATI', 'Cikgu Ahmad Farhan (Guru Penolong Kanan)', 'admin@aitutor.edu.my', '+60123456789', '$2a$10$w09aV8y3oHhU6u9k8M2b8Oq8j5T8v9F0k3J2L1M0N9P8Q7R6S5T4U', 'ADMIN', TRUE),
  ('USR-TEACHER-001', 'ORG-SK-TAMAN-MELAWATI', 'Puan Siti Nurhaliza binti Zulkifli', 'siti.zulkifli@moe-dl.edu.my', '+60198765432', '$2a$10$w09aV8y3oHhU6u9k8M2b8Oq8j5T8v9F0k3J2L1M0N9P8Q7R6S5T4U', 'TEACHER', TRUE)
ON CONFLICT (id) DO NOTHING;

INSERT INTO kyc_verifications (id, user_id, full_name, masked_ic, id_hash_sha256, status)
VALUES
  ('KYC-001', 'USR-TEACHER-001', 'Puan Siti Nurhaliza binti Zulkifli', '910314-XX-5142', 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', 'VERIFIED')
ON CONFLICT (id) DO NOTHING;

INSERT INTO dskp_standards (id, subject, level, theme, topic, code_standard, content_standard, learning_standards_json, pbd_rubrics_json)
VALUES
(
  'DSKP-SCI-T4-01',
  'Sains',
  'Tahun 4',
  'Sains Hayat',
  'Organ Pernafasan Haiwan',
  'SK 3.1 / SP 3.1.1 - 3.1.4',
  '3.1 Organ Pernafasan Haiwan',
  '["3.1.1 Mengenal pasti organ pernafasan bagi haiwan (Peparu, Insang, Kulit lembap, Spirakel).", "3.1.2 Mengelaskan haiwan berdasarkan organ pernafasan.", "3.1.3 Memberi contoh haiwan lebih daripada satu organ.", "3.1.4 Menjelaskan pemerhatian kreatif."]'::jsonb,
  '{"TP1": "Menyatakan organ pernafasan bagi haiwan.", "TP2": "Menyenaraikan contoh haiwan dan organ.", "TP3": "Mengelaskan haiwan mengikut organ.", "TP4": "Mengitlak haiwan lebih daripada satu organ.", "TP5": "Menjana idea kesan pencemaran.", "TP6": "Berkomunikasi secara kreatif dan inovatif."}'::jsonb
),
(
  'DSKP-MAT-T5-01',
  'Matematik',
  'Tahun 5',
  'Nombor dan Operasi',
  'Pecahan: Penambahan Pecahan Wajar & Nombor Bercampur',
  'SK 2.1 / SP 2.1.1',
  '2.1 Pecahan',
  '["2.1.1 Menambah hingga tiga nombor melibatkan nombor bulat, pecahan wajar dan nombor bercampur yang penyebutnya hingga 10."]'::jsonb,
  '{"TP1": "Membaca ayat matematik pecahan.", "TP2": "Menyatakan langkah penambahan berbeza penyebut.", "TP3": "Menyelesaikan penambahan pecahan.", "TP4": "Menyelesaikan masalah rutin.", "TP5": "Menyelesaikan masalah pelbagai strategi.", "TP6": "Menyelesaikan masalah bukan rutin secara kreatif."}'::jsonb
)
ON CONFLICT (id) DO NOTHING;
