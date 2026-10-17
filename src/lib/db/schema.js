/**
 * AI Tutor Pro - SQLite Database Schema Initialization
 * Compliant with Malaysian PDPA 2010, Child Act 2001, and KPM Circulars.
 */

export const SCHEMA_SQL = `
-- Organizations (Schools, Tuition Centers, JPN Districts)
CREATE TABLE IF NOT EXISTS organizations (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT UNIQUE,
  type TEXT DEFAULT 'GOVERNMENT_SCHOOL', -- GOVERNMENT_SCHOOL, PRIVATE_SCHOOL, TUITION_CENTER, INDEPENDENT
  credit_balance_myr REAL DEFAULT 50.00,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Users (Teachers, Admins, Facilitators)
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  org_id TEXT,
  full_name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  phone_number TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'TEACHER', -- TEACHER, HEADMASTER, JPN_OFFICER, ADMIN
  is_verified INTEGER DEFAULT 0, -- 0: Pending e-KYC, 1: Verified
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (org_id) REFERENCES organizations(id)
);

-- e-KYC Verifications (Zero raw MyKad image storage - tokenized & masked)
CREATE TABLE IF NOT EXISTS kyc_verifications (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  full_name TEXT NOT NULL,
  masked_ic TEXT NOT NULL, -- e.g. 881024-XX-1234
  id_hash_sha256 TEXT NOT NULL, -- Deterministic salted one-way hash for uniqueness
  provider TEXT DEFAULT 'CTOS_INNOV8TIF_SIMULATOR',
  status TEXT DEFAULT 'VERIFIED', -- PENDING, VERIFIED, REJECTED
  verified_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Legal Undertakings ("Tech for Good" and Strict Non-Liability Agreement)
CREATE TABLE IF NOT EXISTS legal_agreements (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  agreement_version TEXT NOT NULL, -- e.g. 'v1.2-MY-2026'
  accepted_terms_hash TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  signed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- DSKP Curriculum Repository (KPM Standards)
CREATE TABLE IF NOT EXISTS dskp_standards (
  id TEXT PRIMARY KEY,
  subject TEXT NOT NULL,
  level TEXT NOT NULL,
  theme TEXT NOT NULL,
  topic TEXT NOT NULL,
  code_standard TEXT NOT NULL,
  content_standard TEXT NOT NULL,
  learning_standards_json TEXT NOT NULL,
  pbd_rubrics_json TEXT NOT NULL,
  suggested_activities_json TEXT
);

-- ASSURE Model Lesson Plans
CREATE TABLE IF NOT EXISTS lesson_plans (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  dskp_id TEXT,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  grade_level TEXT NOT NULL,
  target_duration_minutes INTEGER DEFAULT 30,
  
  -- ASSURE 6-Step JSON Structure
  analyze_learners_json TEXT NOT NULL,
  state_objectives_json TEXT NOT NULL,
  select_media_json TEXT NOT NULL,
  utilize_materials_json TEXT NOT NULL,
  require_participation_json TEXT NOT NULL,
  evaluate_revise_json TEXT NOT NULL,
  
  rph_format_status TEXT DEFAULT 'DRAFT', -- DRAFT, APPROVED, READY
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (dskp_id) REFERENCES dskp_standards(id)
);

-- Live Classroom Sessions
CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  lesson_plan_id TEXT,
  teacher_id TEXT NOT NULL,
  title TEXT NOT NULL,
  subject TEXT NOT NULL,
  mode TEXT DEFAULT 'CLASSROOM', -- CLASSROOM (Mode B), INDIVIDUAL_TUITION (Mode A)
  gemini_voice TEXT DEFAULT 'Puck', -- Aoede, Charon, Fenrir, Kore, Puck
  status TEXT DEFAULT 'SCHEDULED', -- SCHEDULED, ACTIVE, PAUSED, ENDED, EMERGENCY_STOPPED
  started_at DATETIME,
  ended_at DATETIME,
  duration_seconds INTEGER DEFAULT 0,
  stars_awarded INTEGER DEFAULT 0,
  active_student_count INTEGER DEFAULT 1,
  FOREIGN KEY (lesson_plan_id) REFERENCES lesson_plans(id),
  FOREIGN KEY (teacher_id) REFERENCES users(id)
);

-- Session Audit & Transcripts (No raw audio stored, text log only for safety backup)
CREATE TABLE IF NOT EXISTS session_transcripts (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  speaker TEXT NOT NULL, -- 'TEACHER', 'STUDENT', 'AI_TUTOR', 'SYSTEM'
  message TEXT NOT NULL,
  timestamp_offset_ms INTEGER NOT NULL,
  flagged_safety INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- PBD (Pentaksiran Bilik Darjah) Student Outcomes
CREATE TABLE IF NOT EXISTS pbd_evaluations (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  student_identifier TEXT NOT NULL, -- Alias or ID to protect minor's true identity
  mastery_level TEXT NOT NULL, -- TP1, TP2, TP3, TP4, TP5, TP6
  rubric_justification TEXT NOT NULL,
  recommended_next_steps TEXT,
  evaluated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id)
);

-- Prepaid Wallet Transactions & Time-Based Usage Billing
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  org_id TEXT,
  type TEXT NOT NULL, -- 'TOPUP', 'SESSION_DEDUCTION', 'REFUND'
  amount_myr REAL NOT NULL,
  description TEXT NOT NULL,
  reference_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (org_id) REFERENCES organizations(id)
);

-- Session Billing Detailed Invoices (RM 0.80 / minute)
CREATE TABLE IF NOT EXISTS session_billing (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL,
  billable_seconds INTEGER NOT NULL,
  rate_per_minute REAL DEFAULT 0.80,
  total_charged_myr REAL NOT NULL,
  status TEXT DEFAULT 'PAID', -- PAID, PENDING, EXEMPT
  billed_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (session_id) REFERENCES sessions(id),
  FOREIGN KEY (user_id) REFERENCES users(id)
);
`;
