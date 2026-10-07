-- ============================================================
-- SCHOLAR-ST: AI-Powered Scholarship Eligibility & Verification
-- Supabase PostgreSQL Schema Migration
-- Migration: 08_scholar_st_schema.sql
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ------------------------------------------------------------
-- 1. EXTEND OR UPDATE PROFILES TABLE FOR ROLES
-- Role: 'applicant', 'inspector' (Verification Officer), 'admin'
-- ------------------------------------------------------------
DO $$ 
BEGIN
    ALTER TABLE public.profiles DROP CONSTRAINT IF EXISTS profiles_role_check;
    ALTER TABLE public.profiles ADD CONSTRAINT profiles_role_check 
        CHECK (role IN ('admin', 'inspector', 'officer', 'applicant'));
EXCEPTION
    WHEN OTHERS THEN NULL;
END $$;

ALTER TABLE public.profiles
    ADD COLUMN IF NOT EXISTS tribe_name TEXT,
    ADD COLUMN IF NOT EXISTS caste_certificate_no TEXT,
    ADD COLUMN IF NOT EXISTS annual_income NUMERIC,
    ADD COLUMN IF NOT EXISTS state_of_domicile TEXT,
    ADD COLUMN IF NOT EXISTS district TEXT,
    ADD COLUMN IF NOT EXISTS aadhaar_hash TEXT,
    ADD COLUMN IF NOT EXISTS academic_level TEXT,
    ADD COLUMN IF NOT EXISTS bank_account_no TEXT,
    ADD COLUMN IF NOT EXISTS bank_ifsc TEXT;

-- ------------------------------------------------------------
-- 2. SCHOLARSHIP SCHEMES TABLE
-- Dynamic schemes managed by Admin
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.scholarship_schemes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheme_code TEXT UNIQUE NOT NULL,
    scheme_name TEXT NOT NULL,
    ministry_or_department TEXT NOT NULL DEFAULT 'Ministry of Tribal Affairs',
    description TEXT NOT NULL,
    target_category TEXT NOT NULL DEFAULT 'Scheduled Tribe (ST)',
    study_level TEXT NOT NULL,
    max_family_income NUMERIC,
    min_academic_percentage NUMERIC,
    max_age_limit INTEGER,
    slots_available INTEGER DEFAULT 100,
    academic_year TEXT NOT NULL DEFAULT '2026-2027',
    application_deadline TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schemes_code ON public.scholarship_schemes(scheme_code);
CREATE INDEX IF NOT EXISTS idx_schemes_active ON public.scholarship_schemes(is_active);

-- ------------------------------------------------------------
-- 3. DYNAMIC SCHEME RULES TABLE
-- Stored in Supabase, evaluated dynamically by Python engine
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.scheme_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheme_code TEXT NOT NULL,
    rule_code TEXT UNIQUE NOT NULL,
    rule_name TEXT NOT NULL,
    category TEXT NOT NULL,
    field_name TEXT NOT NULL,
    operator TEXT NOT NULL DEFAULT '==',
    expected_value TEXT NOT NULL,
    condition_type TEXT NOT NULL DEFAULT 'NUMERIC_OR_TEXT',
    severity TEXT NOT NULL DEFAULT 'MANDATORY',
    requirement TEXT NOT NULL,
    statutory_reference TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheme_rules_code ON public.scheme_rules(scheme_code);
CREATE INDEX IF NOT EXISTS idx_scheme_rules_active ON public.scheme_rules(is_active);

-- ------------------------------------------------------------
-- 4. SCHOLARSHIP APPLICATIONS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.scholarship_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_number TEXT UNIQUE NOT NULL,
    applicant_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    scheme_code TEXT NOT NULL,
    scheme_name TEXT NOT NULL,
    applicant_name TEXT NOT NULL,
    applicant_email TEXT,
    applicant_phone TEXT,
    tribe_name TEXT,
    caste_certificate_no TEXT,
    caste_verified BOOLEAN DEFAULT FALSE,
    annual_family_income NUMERIC,
    aggregate_percentage NUMERIC,
    applicant_age INTEGER,
    institution_name TEXT,
    course_enrolled TEXT,
    admission_status TEXT,
    status TEXT NOT NULL DEFAULT 'SUBMITTED',
    eligibility_score NUMERIC(5,2) DEFAULT 0.0,
    ai_confidence NUMERIC(5,2) DEFAULT 0.0,
    total_rules INTEGER DEFAULT 0,
    passed_rules INTEGER DEFAULT 0,
    failed_rules INTEGER DEFAULT 0,
    review_rules INTEGER DEFAULT 0,
    evidence_payload JSONB DEFAULT '{}'::jsonb,
    extracted_data JSONB DEFAULT '{}'::jsonb,
    officer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    officer_decision TEXT,
    officer_remarks TEXT,
    decision_date TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applications_applicant ON public.scholarship_applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applications_scheme ON public.scholarship_applications(scheme_code);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.scholarship_applications(status);

-- ------------------------------------------------------------
-- 5. APPLICATION DOCUMENTS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.application_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES public.scholarship_applications(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_path TEXT NOT NULL,
    file_type TEXT NOT NULL,
    file_size INTEGER,
    ocr_raw_text TEXT,
    ocr_confidence NUMERIC(5,2),
    extracted_fields JSONB DEFAULT '{}'::jsonb,
    verification_status TEXT DEFAULT 'VERIFIED',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 6. APPLICATION RULE EVALUATION RESULTS
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.application_rule_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID REFERENCES public.scholarship_applications(id) ON DELETE CASCADE,
    rule_code TEXT NOT NULL,
    rule_name TEXT NOT NULL,
    category TEXT NOT NULL,
    requirement TEXT NOT NULL,
    expected_criterion TEXT NOT NULL,
    extracted_evidence TEXT,
    actual_value TEXT,
    status TEXT NOT NULL,
    severity TEXT NOT NULL,
    statutory_reference TEXT,
    officer_notes TEXT,
    officer_override BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ------------------------------------------------------------
-- 7. NOTIFICATIONS TABLE
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.scholar_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type TEXT NOT NULL DEFAULT 'STATUS_UPDATE',
    application_id UUID REFERENCES public.scholarship_applications(id) ON DELETE SET NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.scholar_notifications(recipient_id);
