-- ==============================================================================
-- SCHOLAR-ST: AI-POWERED SCHOLARSHIP ELIGIBILITY & VERIFICATION SYSTEM
-- SUPABASE POSTGRESQL PRODUCTION DATABASE SCHEMA
-- Migration: 09_scholar_st_complete_schema.sql
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- EXTENSIONS & UTILITIES
-- ------------------------------------------------------------------------------
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================================================
-- 1. ROLES TABLE
-- Lookup table defining authorized system roles
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT UNIQUE NOT NULL CHECK (name IN ('applicant', 'officer', 'admin')),
    display_name TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed baseline roles
INSERT INTO public.roles (name, display_name, description)
VALUES 
    ('applicant', 'ST Scholarship Applicant', 'Scheduled Tribe student/fellow applying for scholarship schemes'),
    ('officer', 'Verification Officer', 'Authorized officer reviewing documents, deficiencies, and statutory compliance'),
    ('admin', 'Portal Administrator', 'Ministry and portal administrator managing schemes, dynamic rules, and system governance')
ON CONFLICT (name) DO NOTHING;

-- ==============================================================================
-- 2. USERS & PROFILES TABLE
-- Extends Supabase auth.users.
-- DATA MINIMIZATION: Never stores raw unmasked 12-digit Aadhaar or sensitive bank keys.
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE,
    full_name TEXT NOT NULL,
    email TEXT,
    phone TEXT,
    role TEXT NOT NULL DEFAULT 'applicant' CHECK (role IN ('applicant', 'officer', 'admin', 'inspector')),
    role_id UUID REFERENCES public.roles(id) ON DELETE SET NULL,
    designation TEXT,
    department TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- ST Community & Profile Verification
    tribe_name TEXT,
    caste_certificate_no TEXT,
    caste_verified BOOLEAN NOT NULL DEFAULT FALSE,
    caste_verification_date TIMESTAMPTZ,
    state_of_domicile TEXT,
    district TEXT,
    annual_income NUMERIC(12, 2),
    academic_level TEXT,
    dob DATE,
    gender TEXT,
    
    -- Sensitive Data Protection (Masked / Tokenized Only)
    aadhaar_hash TEXT,             -- SHA-256 salted hash for verification; never raw 12 digits
    aadhaar_last_four VARCHAR(4),  -- Masked display (e.g. XXXX-XXXX-1234)
    bank_name TEXT,
    bank_account_masked TEXT,      -- Masked account (e.g. XXXXXXXX4521)
    bank_ifsc TEXT,
    profile_completed BOOLEAN NOT NULL DEFAULT FALSE,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Backward compatibility & profile indexes
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_active ON public.profiles(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_tribe ON public.profiles(tribe_name);

-- ==============================================================================
-- 3. SCHEMES TABLE
-- Scholarship & Fellowship schemes managed by Portal Administrators
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.schemes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheme_code TEXT UNIQUE NOT NULL,
    scheme_name TEXT NOT NULL,
    ministry_or_department TEXT NOT NULL DEFAULT 'Ministry of Tribal Affairs',
    study_level TEXT NOT NULL,
    description TEXT NOT NULL,
    target_category TEXT NOT NULL DEFAULT 'Scheduled Tribe (ST)',
    max_family_income NUMERIC(12, 2),
    min_academic_percentage NUMERIC(5, 2),
    min_age_limit INTEGER,
    max_age_limit INTEGER,
    slots_available INTEGER DEFAULT 100,
    academic_year TEXT NOT NULL DEFAULT '2026-2027',
    application_deadline TIMESTAMPTZ,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_schemes_code ON public.schemes(scheme_code);
CREATE INDEX IF NOT EXISTS idx_schemes_active ON public.schemes(is_active);
CREATE INDEX IF NOT EXISTS idx_schemes_academic_year ON public.schemes(academic_year);

-- ==============================================================================
-- 4. SCHEME_RULES TABLE
-- Dynamic eligibility and statutory rules evaluated by the deterministic engine
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.scheme_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheme_id UUID REFERENCES public.schemes(id) ON DELETE CASCADE,
    scheme_code TEXT NOT NULL,
    rule_code TEXT UNIQUE NOT NULL,
    rule_name TEXT NOT NULL,
    category TEXT NOT NULL,
    rule_type TEXT NOT NULL,
    field_name TEXT NOT NULL,
    operator TEXT NOT NULL DEFAULT '==' CHECK (operator IN ('==', '!=', '<=', '>=', '<', '>', 'in', 'contains')),
    expected_value TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'CRITICAL' CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM')),
    requirement TEXT NOT NULL,
    error_message TEXT,
    statutory_reference TEXT,
    mandatory BOOLEAN NOT NULL DEFAULT TRUE,
    active BOOLEAN NOT NULL DEFAULT TRUE,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scheme_rules_scheme_code ON public.scheme_rules(scheme_code);
CREATE INDEX IF NOT EXISTS idx_scheme_rules_field ON public.scheme_rules(field_name);
CREATE INDEX IF NOT EXISTS idx_scheme_rules_active ON public.scheme_rules(active);
CREATE INDEX IF NOT EXISTS idx_scheme_rules_severity ON public.scheme_rules(severity);

-- ==============================================================================
-- 5. SCHEME_DOCUMENTS TABLE
-- Mandatory and optional document evidence requirements for each scheme
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.scheme_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheme_id UUID REFERENCES public.schemes(id) ON DELETE CASCADE,
    scheme_code TEXT NOT NULL,
    document_type TEXT NOT NULL,
    document_name TEXT NOT NULL,
    description TEXT,
    is_mandatory BOOLEAN NOT NULL DEFAULT TRUE,
    guidelines TEXT,
    max_size_bytes BIGINT NOT NULL DEFAULT 5242880, -- 5 MB default
    allowed_mime_types TEXT[] NOT NULL DEFAULT '{"application/pdf", "image/jpeg", "image/png"}'::TEXT[],
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_scheme_doc_type UNIQUE (scheme_code, document_type)
);

CREATE INDEX IF NOT EXISTS idx_scheme_documents_code ON public.scheme_documents(scheme_code);
CREATE INDEX IF NOT EXISTS idx_scheme_documents_type ON public.scheme_documents(document_type);

-- ==============================================================================
-- 6. APPLICATIONS TABLE
-- Scholarship applications with canonical 9 workflow states
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_number TEXT UNIQUE NOT NULL,
    applicant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE RESTRICT,
    scheme_id UUID REFERENCES public.schemes(id) ON DELETE RESTRICT,
    scheme_code TEXT NOT NULL,
    scheme_name TEXT NOT NULL,
    
    -- Canonical 9 Application Workflow States
    status TEXT NOT NULL DEFAULT 'SUBMITTED' 
        CHECK (status IN (
            'DRAFT',
            'SUBMITTED',
            'DOCUMENT_VERIFICATION',
            'DEFICIENCY',
            'RESUBMITTED',
            'RULE_VALIDATION',
            'OFFICER_REVIEW',
            'APPROVED',
            'REJECTED'
        )),
    academic_year TEXT NOT NULL DEFAULT '2026-2027',
    
    -- Evaluation & Intelligence Scores
    eligibility_score NUMERIC(5, 2) DEFAULT 0.0,
    ai_confidence NUMERIC(5, 2) DEFAULT 0.0,
    total_rules INTEGER DEFAULT 0,
    passed_rules INTEGER DEFAULT 0,
    failed_rules INTEGER DEFAULT 0,
    review_rules INTEGER DEFAULT 0,
    
    -- Applicant Snapshot at Time of Application
    applicant_name TEXT NOT NULL,
    applicant_email TEXT,
    applicant_phone TEXT,
    tribe_name TEXT,
    caste_certificate_no TEXT,
    caste_verified BOOLEAN NOT NULL DEFAULT FALSE,
    annual_family_income NUMERIC(12, 2),
    aggregate_percentage NUMERIC(5, 2),
    applicant_age INTEGER,
    institution_name TEXT,
    course_enrolled TEXT,
    admission_status TEXT,
    
    -- Verification Officer Assignment & Adjudication
    assigned_officer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    officer_decision TEXT,
    officer_remarks TEXT,
    decided_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_applications_applicant_id ON public.applications(applicant_id);
CREATE INDEX IF NOT EXISTS idx_applications_scheme_code ON public.applications(scheme_code);
CREATE INDEX IF NOT EXISTS idx_applications_status ON public.applications(status);
CREATE INDEX IF NOT EXISTS idx_applications_officer ON public.applications(assigned_officer_id);
CREATE INDEX IF NOT EXISTS idx_applications_created ON public.applications(created_at DESC);

-- ==============================================================================
-- 7. APPLICATION_DOCUMENTS TABLE
-- Files uploaded as evidence for an application with integrity checksums
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.application_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    document_type TEXT NOT NULL,
    document_name TEXT NOT NULL,
    file_name TEXT NOT NULL,
    storage_path TEXT NOT NULL,
    file_size_bytes BIGINT,
    mime_type TEXT,
    sha256_hash TEXT, -- Cryptographic hash to verify document integrity
    verification_status TEXT NOT NULL DEFAULT 'PENDING' 
        CHECK (verification_status IN ('PENDING', 'VERIFIED', 'DEFICIENT', 'REJECTED')),
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_docs_application ON public.application_documents(application_id);
CREATE INDEX IF NOT EXISTS idx_app_docs_applicant ON public.application_documents(applicant_id);
CREATE INDEX IF NOT EXISTS idx_app_docs_type ON public.application_documents(document_type);
CREATE INDEX IF NOT EXISTS idx_app_docs_status ON public.application_documents(verification_status);

-- ==============================================================================
-- 8. DOCUMENT_EXTRACTIONS TABLE
-- Deterministic PaddleOCR + Gemini structured feature extractions
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.document_extractions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.application_documents(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    extractor_model TEXT NOT NULL DEFAULT 'PaddleOCR-v4 + Gemini-1.5-Pro',
    ocr_confidence NUMERIC(5, 2) DEFAULT 0.0,
    raw_text_content TEXT,
    extracted_fields JSONB NOT NULL DEFAULT '{}'::jsonb,
    extraction_metadata JSONB DEFAULT '{}'::jsonb,
    extracted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_doc_extractions_doc_id ON public.document_extractions(document_id);
CREATE INDEX IF NOT EXISTS idx_doc_extractions_app_id ON public.document_extractions(application_id);
CREATE INDEX IF NOT EXISTS idx_doc_extractions_fields ON public.document_extractions USING GIN (extracted_fields);

-- ==============================================================================
-- 9. VERIFICATION_RESULTS TABLE
-- Statutory multi-dimensional certificate validation (Article 342, State Authority, Seal)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.verification_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES public.application_documents(id) ON DELETE CASCADE,
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    verification_type TEXT NOT NULL,
    is_valid BOOLEAN NOT NULL DEFAULT FALSE,
    confidence_score NUMERIC(5, 2) NOT NULL DEFAULT 0.0,
    name_matched BOOLEAN DEFAULT FALSE,
    tribe_recognized_art342 BOOLEAN DEFAULT FALSE,
    statutory_authority_verified BOOLEAN DEFAULT FALSE,
    seal_and_signature_detected BOOLEAN DEFAULT FALSE,
    tamper_check_passed BOOLEAN DEFAULT TRUE,
    disclaimer TEXT,
    verification_notes TEXT,
    verification_details JSONB NOT NULL DEFAULT '{}'::jsonb,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verif_results_doc ON public.verification_results(document_id);
CREATE INDEX IF NOT EXISTS idx_verif_results_app ON public.verification_results(application_id);
CREATE INDEX IF NOT EXISTS idx_verif_results_valid ON public.verification_results(is_valid);
CREATE INDEX IF NOT EXISTS idx_verif_results_type ON public.verification_results(verification_type);

-- ==============================================================================
-- 10. RULE_RESULTS TABLE
-- Execution results for each scheme rule evaluated against an application
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.rule_results (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    rule_id UUID REFERENCES public.scheme_rules(id) ON DELETE SET NULL,
    rule_code TEXT NOT NULL,
    rule_name TEXT NOT NULL,
    category TEXT NOT NULL,
    field_name TEXT NOT NULL,
    requirement TEXT NOT NULL,
    expected_criterion TEXT NOT NULL,
    applicant_value TEXT,
    extracted_evidence TEXT,
    status TEXT NOT NULL CHECK (status IN ('PASS', 'FAIL', 'REVIEW')),
    severity TEXT NOT NULL DEFAULT 'CRITICAL' CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM')),
    statutory_reference TEXT,
    officer_override BOOLEAN NOT NULL DEFAULT FALSE,
    officer_override_reason TEXT,
    officer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    evaluated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rule_results_app ON public.rule_results(application_id);
CREATE INDEX IF NOT EXISTS idx_rule_results_code ON public.rule_results(rule_code);
CREATE INDEX IF NOT EXISTS idx_rule_results_status ON public.rule_results(status);

-- ==============================================================================
-- 11. EVIDENCE TABLE
-- Granular document proof snippets with provenance coordinates and bounding boxes
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.evidence (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    document_id UUID REFERENCES public.application_documents(id) ON DELETE SET NULL,
    rule_result_id UUID REFERENCES public.rule_results(id) ON DELETE SET NULL,
    evidence_type TEXT NOT NULL,
    field_name TEXT NOT NULL,
    extracted_value TEXT NOT NULL,
    bounding_box JSONB, -- Coordinates: {"x": 100, "y": 200, "w": 400, "h": 50}
    source_page_number INTEGER DEFAULT 1,
    snippet_text TEXT,
    confidence NUMERIC(5, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_evidence_app ON public.evidence(application_id);
CREATE INDEX IF NOT EXISTS idx_evidence_doc ON public.evidence(document_id);
CREATE INDEX IF NOT EXISTS idx_evidence_rule ON public.evidence(rule_result_id);

-- ==============================================================================
-- 12. DEFICIENCIES TABLE
-- Identifies specific non-conformances, missing documents, or unfulfilled criteria
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.deficiencies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    applicant_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    document_id UUID REFERENCES public.application_documents(id) ON DELETE SET NULL,
    rule_result_id UUID REFERENCES public.rule_results(id) ON DELETE SET NULL,
    deficiency_code TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT NOT NULL DEFAULT 'CRITICAL' CHECK (severity IN ('CRITICAL', 'HIGH', 'MEDIUM')),
    suggested_action TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'RESOLVED', 'WAIVED')),
    resolution_notes TEXT,
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deficiencies_app ON public.deficiencies(application_id);
CREATE INDEX IF NOT EXISTS idx_deficiencies_applicant ON public.deficiencies(applicant_id);
CREATE INDEX IF NOT EXISTS idx_deficiencies_status ON public.deficiencies(status);
CREATE INDEX IF NOT EXISTS idx_deficiencies_code ON public.deficiencies(deficiency_code);

-- ==============================================================================
-- 13. APPLICATION_HISTORY TABLE
-- Immutable timeline recording every state transition and officer action
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.application_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id UUID NOT NULL REFERENCES public.applications(id) ON DELETE CASCADE,
    previous_status TEXT,
    new_status TEXT NOT NULL,
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    actor_role TEXT NOT NULL CHECK (actor_role IN ('APPLICANT', 'OFFICER', 'ADMIN', 'SYSTEM')),
    action_type TEXT NOT NULL,
    remarks TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_app_history_app ON public.application_history(application_id);
CREATE INDEX IF NOT EXISTS idx_app_history_created ON public.application_history(created_at DESC);

-- ==============================================================================
-- 14. NOTIFICATIONS TABLE
-- Multi-channel applicant notifications (In-app, Email)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    application_id UUID REFERENCES public.applications(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type TEXT NOT NULL DEFAULT 'STATUS_CHANGE',
    channel TEXT NOT NULL DEFAULT 'IN_APP' CHECK (channel IN ('IN_APP', 'EMAIL', 'BOTH')),
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    action_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON public.notifications(recipient_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(recipient_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON public.notifications(created_at DESC);

-- ==============================================================================
-- 15. RULE_CHANGE_HISTORY TABLE
-- Immutable audit log for every rule modification with impact preview notes
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.rule_change_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheme_code TEXT NOT NULL,
    rule_code TEXT NOT NULL,
    rule_id UUID REFERENCES public.scheme_rules(id) ON DELETE SET NULL,
    change_type TEXT NOT NULL CHECK (change_type IN ('CREATED', 'UPDATED', 'STATUS_TOGGLED', 'DELETED')),
    changed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    field_changed TEXT,
    previous_value TEXT,
    new_value TEXT,
    full_previous_state JSONB,
    full_new_state JSONB,
    impact_summary TEXT,
    remarks TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_rule_history_code ON public.rule_change_history(rule_code);
CREATE INDEX IF NOT EXISTS idx_rule_history_scheme ON public.rule_change_history(scheme_code);
CREATE INDEX IF NOT EXISTS idx_rule_history_created ON public.rule_change_history(created_at DESC);

-- ==============================================================================
-- 16. HELPER FUNCTIONS FOR ROW LEVEL SECURITY (RLS)
-- SECURITY DEFINER and STABLE to optimize query planning and avoid recursion
-- ==============================================================================

-- Helper: Get current authenticated user's role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT role
    FROM public.profiles
    WHERE id = auth.uid()
    AND is_active = TRUE
    LIMIT 1;
$$;

-- Helper: Check if caller is Portal Administrator
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT (public.current_user_role() = 'admin');
$$;

-- Helper: Check if caller is Verification Officer or Administrator
CREATE OR REPLACE FUNCTION public.is_officer_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT (public.current_user_role() IN ('officer', 'inspector', 'admin'));
$$;

-- Helper: Check if caller is assigned officer or administrator
CREATE OR REPLACE FUNCTION public.is_assigned_officer_or_admin(app_officer_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
    SELECT (
        public.is_admin() OR 
        (public.current_user_role() IN ('officer', 'inspector') AND (app_officer_id IS NULL OR app_officer_id = auth.uid()))
    );
$$;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

-- Enable RLS across all SCHOLAR-ST tables
ALTER TABLE public.roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheme_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheme_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.document_extractions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.verification_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rule_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evidence ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deficiencies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.application_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.rule_change_history ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- RLS: ROLES
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone authenticated can view roles" ON public.roles;
CREATE POLICY "Anyone authenticated can view roles"
    ON public.roles FOR SELECT TO authenticated
    USING (TRUE);

-- ------------------------------------------------------------------------------
-- RLS: PROFILES
-- Applicants can read/update their own profile.
-- Officers can read applicant profiles for verification.
-- Admins have full access.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
    ON public.profiles FOR SELECT TO authenticated
    USING (id = auth.uid());

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
    ON public.profiles FOR UPDATE TO authenticated
    USING (id = auth.uid())
    WITH CHECK (id = auth.uid());

DROP POLICY IF EXISTS "Officers and Admins can view profiles" ON public.profiles;
CREATE POLICY "Officers and Admins can view profiles"
    ON public.profiles FOR SELECT TO authenticated
    USING (public.is_officer_or_admin());

DROP POLICY IF EXISTS "Admins can manage all profiles" ON public.profiles;
CREATE POLICY "Admins can manage all profiles"
    ON public.profiles FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- RLS: SCHEMES
-- Authenticated users can read active schemes.
-- Admins can create, update, and manage schemes.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone authenticated can read active schemes" ON public.schemes;
CREATE POLICY "Anyone authenticated can read active schemes"
    ON public.schemes FOR SELECT TO authenticated
    USING (is_active = TRUE OR public.is_officer_or_admin());

DROP POLICY IF EXISTS "Admins can insert schemes" ON public.schemes;
CREATE POLICY "Admins can insert schemes"
    ON public.schemes FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update schemes" ON public.schemes;
CREATE POLICY "Admins can update schemes"
    ON public.schemes FOR UPDATE TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete schemes" ON public.schemes;
CREATE POLICY "Admins can delete schemes"
    ON public.schemes FOR DELETE TO authenticated
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- RLS: SCHEME_RULES
-- Authenticated users can read active rules.
-- Admins manage dynamic scheme rules.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Authenticated users can read active rules" ON public.scheme_rules;
CREATE POLICY "Authenticated users can read active rules"
    ON public.scheme_rules FOR SELECT TO authenticated
    USING (active = TRUE OR public.is_officer_or_admin());

DROP POLICY IF EXISTS "Admins can insert scheme rules" ON public.scheme_rules;
CREATE POLICY "Admins can insert scheme rules"
    ON public.scheme_rules FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can update scheme rules" ON public.scheme_rules;
CREATE POLICY "Admins can update scheme rules"
    ON public.scheme_rules FOR UPDATE TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Admins can delete scheme rules" ON public.scheme_rules;
CREATE POLICY "Admins can delete scheme rules"
    ON public.scheme_rules FOR DELETE TO authenticated
    USING (public.is_admin());

-- ------------------------------------------------------------------------------
-- RLS: SCHEME_DOCUMENTS
-- Read access for authenticated users; admin management.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Anyone authenticated can read scheme documents" ON public.scheme_documents;
CREATE POLICY "Anyone authenticated can read scheme documents"
    ON public.scheme_documents FOR SELECT TO authenticated
    USING (TRUE);

DROP POLICY IF EXISTS "Admins can manage scheme documents" ON public.scheme_documents;
CREATE POLICY "Admins can manage scheme documents"
    ON public.scheme_documents FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- RLS: APPLICATIONS
-- Applicants access ONLY their own applications.
-- Officers access assigned or pending review applications.
-- Admins access all applications.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Applicants can view own applications" ON public.applications;
CREATE POLICY "Applicants can view own applications"
    ON public.applications FOR SELECT TO authenticated
    USING (applicant_id = auth.uid());

DROP POLICY IF EXISTS "Applicants can create own applications" ON public.applications;
CREATE POLICY "Applicants can create own applications"
    ON public.applications FOR INSERT TO authenticated
    WITH CHECK (applicant_id = auth.uid());

DROP POLICY IF EXISTS "Applicants can update draft applications" ON public.applications;
CREATE POLICY "Applicants can update draft applications"
    ON public.applications FOR UPDATE TO authenticated
    USING (applicant_id = auth.uid() AND status IN ('DRAFT', 'DEFICIENCY'))
    WITH CHECK (applicant_id = auth.uid());

DROP POLICY IF EXISTS "Officers and Admins can view applications" ON public.applications;
CREATE POLICY "Officers and Admins can view applications"
    ON public.applications FOR SELECT TO authenticated
    USING (public.is_officer_or_admin());

DROP POLICY IF EXISTS "Officers can update assigned applications" ON public.applications;
CREATE POLICY "Officers can update assigned applications"
    ON public.applications FOR UPDATE TO authenticated
    USING (public.is_assigned_officer_or_admin(assigned_officer_id))
    WITH CHECK (public.is_assigned_officer_or_admin(assigned_officer_id));

DROP POLICY IF EXISTS "Admins can manage all applications" ON public.applications;
CREATE POLICY "Admins can manage all applications"
    ON public.applications FOR ALL TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ------------------------------------------------------------------------------
-- RLS: APPLICATION_DOCUMENTS
-- Applicants access ONLY documents belonging to their own applications.
-- Officers and Admins can view all submitted documents for verification.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Applicants can view own documents" ON public.application_documents;
CREATE POLICY "Applicants can view own documents"
    ON public.application_documents FOR SELECT TO authenticated
    USING (applicant_id = auth.uid());

DROP POLICY IF EXISTS "Applicants can insert own documents" ON public.application_documents;
CREATE POLICY "Applicants can insert own documents"
    ON public.application_documents FOR INSERT TO authenticated
    WITH CHECK (applicant_id = auth.uid());

DROP POLICY IF EXISTS "Applicants can delete unverified documents" ON public.application_documents;
CREATE POLICY "Applicants can delete unverified documents"
    ON public.application_documents FOR DELETE TO authenticated
    USING (applicant_id = auth.uid() AND verification_status IN ('PENDING', 'DEFICIENT'));

DROP POLICY IF EXISTS "Officers and Admins can view all application documents" ON public.application_documents;
CREATE POLICY "Officers and Admins can view all application documents"
    ON public.application_documents FOR SELECT TO authenticated
    USING (public.is_officer_or_admin());

DROP POLICY IF EXISTS "Officers and Admins can update document verification status" ON public.application_documents;
CREATE POLICY "Officers and Admins can update document verification status"
    ON public.application_documents FOR UPDATE TO authenticated
    USING (public.is_officer_or_admin())
    WITH CHECK (public.is_officer_or_admin());

-- ------------------------------------------------------------------------------
-- RLS: DOCUMENT_EXTRACTIONS
-- Applicants can read extractions for their own applications.
-- Officers and Admins can read all extractions.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Applicants can view own extractions" ON public.document_extractions;
CREATE POLICY "Applicants can view own extractions"
    ON public.document_extractions FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.applications a 
            WHERE a.id = document_extractions.application_id 
            AND a.applicant_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Officers and Admins can view all extractions" ON public.document_extractions;
CREATE POLICY "Officers and Admins can view all extractions"
    ON public.document_extractions FOR SELECT TO authenticated
    USING (public.is_officer_or_admin());

DROP POLICY IF EXISTS "System and Admins can manage extractions" ON public.document_extractions;
CREATE POLICY "System and Admins can manage extractions"
    ON public.document_extractions FOR ALL TO authenticated
    USING (public.is_officer_or_admin())
    WITH CHECK (public.is_officer_or_admin());

-- ------------------------------------------------------------------------------
-- RLS: VERIFICATION_RESULTS
-- Applicants can view verification outcomes on their applications.
-- Officers and Admins can view and write verification results.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Applicants can view own verification results" ON public.verification_results;
CREATE POLICY "Applicants can view own verification results"
    ON public.verification_results FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.applications a 
            WHERE a.id = verification_results.application_id 
            AND a.applicant_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Officers and Admins can view all verification results" ON public.verification_results;
CREATE POLICY "Officers and Admins can view all verification results"
    ON public.verification_results FOR SELECT TO authenticated
    USING (public.is_officer_or_admin());

DROP POLICY IF EXISTS "Officers and Admins can insert and update verification results" ON public.verification_results;
CREATE POLICY "Officers and Admins can insert and update verification results"
    ON public.verification_results FOR ALL TO authenticated
    USING (public.is_officer_or_admin())
    WITH CHECK (public.is_officer_or_admin());

-- ------------------------------------------------------------------------------
-- RLS: RULE_RESULTS
-- Applicants can view rule results for their applications.
-- Officers and Admins can view and override rule evaluations.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Applicants can view own rule results" ON public.rule_results;
CREATE POLICY "Applicants can view own rule results"
    ON public.rule_results FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.applications a 
            WHERE a.id = rule_results.application_id 
            AND a.applicant_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Officers and Admins can view all rule results" ON public.rule_results;
CREATE POLICY "Officers and Admins can view all rule results"
    ON public.rule_results FOR SELECT TO authenticated
    USING (public.is_officer_or_admin());

DROP POLICY IF EXISTS "Officers and Admins can manage rule results" ON public.rule_results;
CREATE POLICY "Officers and Admins can manage rule results"
    ON public.rule_results FOR ALL TO authenticated
    USING (public.is_officer_or_admin())
    WITH CHECK (public.is_officer_or_admin());

-- ------------------------------------------------------------------------------
-- RLS: EVIDENCE
-- Applicants view evidence for their applications; Officers and Admins view all.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Applicants can view own evidence" ON public.evidence;
CREATE POLICY "Applicants can view own evidence"
    ON public.evidence FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.applications a 
            WHERE a.id = evidence.application_id 
            AND a.applicant_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Officers and Admins can view all evidence" ON public.evidence;
CREATE POLICY "Officers and Admins can view all evidence"
    ON public.evidence FOR SELECT TO authenticated
    USING (public.is_officer_or_admin());

DROP POLICY IF EXISTS "Officers and Admins can manage evidence" ON public.evidence;
CREATE POLICY "Officers and Admins can manage evidence"
    ON public.evidence FOR ALL TO authenticated
    USING (public.is_officer_or_admin())
    WITH CHECK (public.is_officer_or_admin());

-- ------------------------------------------------------------------------------
-- RLS: DEFICIENCIES
-- Applicants view deficiencies on their applications; Officers and Admins manage.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Applicants can view own deficiencies" ON public.deficiencies;
CREATE POLICY "Applicants can view own deficiencies"
    ON public.deficiencies FOR SELECT TO authenticated
    USING (applicant_id = auth.uid());

DROP POLICY IF EXISTS "Officers and Admins can view all deficiencies" ON public.deficiencies;
CREATE POLICY "Officers and Admins can view all deficiencies"
    ON public.deficiencies FOR SELECT TO authenticated
    USING (public.is_officer_or_admin());

DROP POLICY IF EXISTS "Officers and Admins can manage deficiencies" ON public.deficiencies;
CREATE POLICY "Officers and Admins can manage deficiencies"
    ON public.deficiencies FOR ALL TO authenticated
    USING (public.is_officer_or_admin())
    WITH CHECK (public.is_officer_or_admin());

-- ------------------------------------------------------------------------------
-- RLS: APPLICATION_HISTORY
-- Applicants view history for their applications; Officers and Admins view all.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Applicants can view own application history" ON public.application_history;
CREATE POLICY "Applicants can view own application history"
    ON public.application_history FOR SELECT TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.applications a 
            WHERE a.id = application_history.application_id 
            AND a.applicant_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Officers and Admins can view all application history" ON public.application_history;
CREATE POLICY "Officers and Admins can view all application history"
    ON public.application_history FOR SELECT TO authenticated
    USING (public.is_officer_or_admin());

DROP POLICY IF EXISTS "Authenticated users can record application history" ON public.application_history;
CREATE POLICY "Authenticated users can record application history"
    ON public.application_history FOR INSERT TO authenticated
    WITH CHECK (
        changed_by = auth.uid() OR public.is_officer_or_admin()
    );

-- ------------------------------------------------------------------------------
-- RLS: NOTIFICATIONS
-- Users access ONLY their own notifications.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Users view own notifications" ON public.notifications;
CREATE POLICY "Users view own notifications"
    ON public.notifications FOR SELECT TO authenticated
    USING (recipient_id = auth.uid());

DROP POLICY IF EXISTS "Users update own notifications" ON public.notifications;
CREATE POLICY "Users update own notifications"
    ON public.notifications FOR UPDATE TO authenticated
    USING (recipient_id = auth.uid())
    WITH CHECK (recipient_id = auth.uid());

DROP POLICY IF EXISTS "System and Officers can insert notifications" ON public.notifications;
CREATE POLICY "System and Officers can insert notifications"
    ON public.notifications FOR INSERT TO authenticated
    WITH CHECK (TRUE);

-- ------------------------------------------------------------------------------
-- RLS: RULE_CHANGE_HISTORY
-- Immutable audit log: Admins and Officers can view; Admins can record.
-- ------------------------------------------------------------------------------
DROP POLICY IF EXISTS "Officers and Admins can view rule history" ON public.rule_change_history;
CREATE POLICY "Officers and Admins can view rule history"
    ON public.rule_change_history FOR SELECT TO authenticated
    USING (public.is_officer_or_admin());

DROP POLICY IF EXISTS "Admins can insert rule change history" ON public.rule_change_history;
CREATE POLICY "Admins can insert rule change history"
    ON public.rule_change_history FOR INSERT TO authenticated
    WITH CHECK (public.is_admin());

-- ==============================================================================
-- AUTOMATIC TIMESTAMP TRIGGERS
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_schemes_updated_at ON public.schemes;
CREATE TRIGGER trg_schemes_updated_at
    BEFORE UPDATE ON public.schemes
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_scheme_rules_updated_at ON public.scheme_rules;
CREATE TRIGGER trg_scheme_rules_updated_at
    BEFORE UPDATE ON public.scheme_rules
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_applications_updated_at ON public.applications;
CREATE TRIGGER trg_applications_updated_at
    BEFORE UPDATE ON public.applications
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS trg_application_documents_updated_at ON public.application_documents;
CREATE TRIGGER trg_application_documents_updated_at
    BEFORE UPDATE ON public.application_documents
    FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ==============================================================================
-- PROFILE AUTO-CREATION TRIGGER ON AUTH SIGNUP
-- Automatically provisions a profile when a new user registers in auth.users
-- ==============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user_profile()
RETURNS TRIGGER AS $$
DECLARE
    user_role TEXT;
    r_id UUID;
BEGIN
    user_role := COALESCE(NEW.raw_user_meta_data->>'role', 'applicant');
    
    -- Lookup role ID
    SELECT id INTO r_id FROM public.roles WHERE name = user_role LIMIT 1;

    INSERT INTO public.profiles (
        id,
        username,
        full_name,
        email,
        phone,
        role,
        role_id,
        designation,
        department,
        is_active,
        created_at,
        updated_at
    ) VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email),
        NEW.email,
        NEW.raw_user_meta_data->>'phone',
        user_role,
        r_id,
        NEW.raw_user_meta_data->>'designation',
        NEW.raw_user_meta_data->>'department',
        TRUE,
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        updated_at = NOW();

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_profile();

-- ==============================================================================
-- END OF SCHOLAR-ST SUPABASE POSTGRESQL SCHEMA
-- ==============================================================================
