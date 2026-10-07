export type UserRole = "applicant" | "inspector" | "officer" | "admin" | "APPLICANT" | "OFFICER" | "ADMIN";

export interface UserProfile {
  id: string;
  username: string;
  full_name: string;
  email: string;
  role: string;
  phone?: string | null;
  designation?: string | null;
  department?: string | null;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface ScholarScheme {
  id: string;
  scheme_code: string;
  scheme_name: string;
  ministry_or_department: string;
  study_level: string;
  description: string;
  target_category?: string;
  max_family_income?: number | null;
  min_academic_percentage?: number | null;
  max_age_limit?: number | null;
  min_age_limit?: number | null;
  slots_available?: number;
  academic_year?: string;
  application_deadline?: string | null;
  required_documents?: string[];
  other_conditions?: string[];
  eligibility_summary?: string;
  eligibility_criteria?: {
    category?: string;
    income_limit?: string;
    academic_min?: string;
    age_limit?: string;
    other_conditions?: string[];
  };
  user_application_status?: string | null;
  user_application_id?: string | null;
  user_application_number?: string | null;
  is_active: boolean;
  rules_count?: number;
  rules?: SchemeRule[];
  created_at?: string;
  updated_at?: string;
}

export interface SchemeRule {
  id?: string;
  scheme_code: string;
  rule_code: string;
  rule_name: string;
  category: string;
  rule_type?:
    | "ST_CATEGORY_REQUIREMENT"
    | "ACADEMIC_QUALIFICATION"
    | "MINIMUM_MARKS"
    | "INCOME_LIMIT"
    | "AGE_LIMIT"
    | "COURSE_INSTITUTION_REQUIREMENT"
    | "REQUIRED_DOCUMENT"
    | "ACADEMIC_YEAR"
    | "SCHEME_SPECIFIC_CONDITION"
    | string;
  field_name: string;
  operator: string;
  expected_value: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "MANDATORY" | string;
  requirement: string;
  error_message?: string;
  statutory_reference?: string;
  mandatory?: boolean;
  active?: boolean;
}

export interface RuleEvaluationItem {
  rule_evaluated: {
    rule_code: string;
    rule_name: string;
    category: string;
    rule_type: string;
    field_name: string;
    severity: string;
    mandatory: boolean;
    statutory_reference?: string;
  };
  applicant_value: any;
  required_condition: string;
  result: "PASS" | "FAIL" | "REVIEW";
  evidence_reference: string;
  explanation: string;
}

export interface SchemeEvaluationReport {
  scheme_code: string;
  total_rules: number;
  passed_rules: number;
  failed_rules: number;
  review_rules: number;
  eligibility_score: number;
  system_recommendation: string;
  recommendation_text: string;
  rule_results: RuleEvaluationItem[];
  evaluated_context: Record<string, any>;
}

export interface CasteVerificationResult {
  caste_verified: boolean;
  verification_status: "VERIFIED_ST" | "PARTIAL_REVIEW_REQUIRED" | "DEFICIENCY_DETECTED" | "NOT_VERIFIED" | string;
  tribe_name?: string | null;
  tribe_recognized_under_art342: boolean;
  certificate_number?: string | null;
  category?: string | null;
  issuing_authority?: string | null;
  document_applicant_name?: string | null;
  applicant_name?: string | null;
  name_match: boolean;
  issue_date?: string | null;
  state?: string | null;
  district?: string | null;
  has_official_seal?: boolean;
  verification_notes?: string;
  disclaimer?: string;
  can_confirm?: boolean;
  completeness?: {
    score_pct: number;
    present_count: number;
    total_count: number;
    is_complete: boolean;
    missing_fields: string[];
  };
  consistency_checks?: {
    score: number;
    statutory_art342_reference: boolean;
    tribe_recognized_under_art342: boolean;
    cert_no_pattern_valid: boolean;
    has_official_seal: boolean;
  };
  profile_matching?: {
    name_match: boolean;
    name_similarity: number;
    tribe_match: boolean;
    declared_name?: string;
    declared_tribe?: string;
  };
  deficiencies?: Array<{
    code: string;
    title: string;
    detail: string;
    severity: "CRITICAL" | "HIGH" | "MEDIUM" | string;
    remedy: string;
  }>;
}

export interface RuleEvaluationResult {
  rule_code: string;
  rule_name: string;
  category: string;
  field_name: string;
  requirement: string;
  expected_criterion: string;
  actual_value?: string | null;
  extracted_evidence: string;
  status: "PASS" | "FAIL" | "REVIEW";
  severity: string;
  statutory_reference?: string;
  notes?: string;
}

export interface ApplicationEvaluation {
  scheme_code: string;
  total_rules: number;
  passed_rules: number;
  failed_rules: number;
  review_rules: number;
  eligibility_score: number;
  system_recommendation: "RECOMMENDED_FOR_APPROVAL" | "ELIGIBLE_PENDING_OFFICER_REVIEW" | "NOT_ELIGIBLE_CRITERIA_UNMET" | string;
  recommendation_text: string;
  rule_results: RuleEvaluationResult[];
  evaluated_context: Record<string, any>;
}

export interface ApplicationDocument {
  id: string;
  application_id: string;
  document_type: "CASTE_CERTIFICATE" | "INCOME_CERTIFICATE" | "MARKSHEET" | "ADMISSION_OFFER" | "OTHER" | string;
  file_name: string;
  file_path: string;
  file_type?: string;
  ocr_raw_text?: string;
  extracted_fields?: Record<string, any>;
  verification_status?: string;
  created_at: string;
}

export interface ScholarshipApplication {
  id: string;
  application_number: string;
  applicant_id?: string;
  scheme_code: string;
  scheme_name: string;
  applicant_name: string;
  applicant_email?: string;
  applicant_phone?: string;
  tribe_name?: string;
  caste_certificate_no?: string;
  caste_verified: boolean;
  annual_family_income?: number;
  aggregate_percentage?: number;
  applicant_age?: number;
  institution_name?: string;
  course_enrolled?: string;
  admission_status?: string;
  status: "SUBMITTED" | "UNDER_REVIEW" | "APPROVED" | "REJECTED" | "CLARIFICATION_REQUIRED" | string;
  eligibility_score: number;
  ai_confidence?: number;
  total_rules: number;
  passed_rules: number;
  failed_rules: number;
  review_rules: number;
  evidence_payload?: string;
  evaluation?: ApplicationEvaluation;
  extracted_data?: Record<string, any>;
  documents?: ApplicationDocument[];
  officer_id?: string;
  officer_decision?: "APPROVED" | "REJECTED" | "CLARIFICATION_REQUIRED" | string;
  officer_remarks?: string;
  decision_date?: string;
  created_at: string;
  updated_at?: string;
}

export interface ScholarNotification {
  id: string;
  recipient_id: string;
  title: string;
  message: string;
  notification_type: "STATUS_UPDATE" | "ACTION_REQUIRED" | "DECISION" | "SCHEME_ALERT" | string;
  application_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface ProfileDocument {
  id: string;
  user_id: string;
  document_type: "CASTE_CERTIFICATE" | "INCOME_CERTIFICATE" | "MARKSHEET" | "ADMISSION_OFFER" | "IDENTITY_CARD" | "PHOTO" | string;
  document_name: string;
  file_name: string;
  file_path: string;
  file_type?: string;
  file_size?: number;
  ocr_raw_text?: string;
  extracted_fields?: Record<string, any>;
  verification_status?: "UPLOADED" | "VERIFIED" | "PENDING_REVIEW" | string;
  created_at: string;
  updated_at?: string;
}

export interface ProfileChecklistItem {
  key: string;
  title: string;
  completed: boolean;
  score: number;
  max_score: number;
  detail?: string;
}

export interface ProfileCompletionStatus {
  completion_percentage: number;
  readiness_status: "FULLY_VERIFIED_100" | "HIGH_READINESS" | "MODERATE_READINESS" | "INCOMPLETE" | string;
  readiness_label: string;
  readiness_color: "emerald" | "blue" | "amber" | "slate" | string;
  checklist: ProfileChecklistItem[];
  missing_items: string[];
  reusable_schemes: string[];
  has_caste_doc: boolean;
  has_income_doc: boolean;
  has_academic_doc: boolean;
}

export interface ApplicantProfileData {
  id?: string;
  username?: string;
  role?: string;
  full_name: string;
  email?: string;
  phone?: string;
  dob?: string;
  gender?: string;
  address?: string;
  pincode?: string;
  state_of_domicile?: string;
  district?: string;
  category?: string;
  tribe_name?: string;
  caste_certificate_no?: string;
  caste_verified: boolean;
  caste_verification_details?: CasteVerificationResult;
  caste_issuing_authority?: string;
  caste_issue_date?: string;
  education_qualification?: string;
  academic_level?: string;
  institution_name?: string;
  course_name?: string;
  academic_year?: string;
  aggregate_percentage?: number;
  admission_status?: string;
  father_or_guardian_name?: string;
  guardian_occupation?: string;
  annual_income?: number;
  income_certificate_no?: string;
  income_issuing_authority?: string;
  income_issue_date?: string;
  bank_name?: string;
  bank_account_no?: string;
  bank_ifsc?: string;
  profile_completion_percentage?: number;
  completion_stats?: ProfileCompletionStatus;
  documents?: ProfileDocument[];
}

export interface AdminAnalyticsData {
  total_applications: number;
  approved: number;
  rejected: number;
  pending_review: number;
  approval_rate: number;
  schemes_distribution: Array<{
    scheme_code: string;
    scheme_name: string;
    app_count: number;
  }>;
  tribe_distribution: Array<{
    tribe_name: string;
    count: number;
  }>;
}

export type DocumentVerificationResultType = "VALID" | "INVALID" | "INCOMPLETE" | "REQUIRES REVIEW" | "NOT_UPLOADED";

export interface SchemeDocumentVerification {
  id?: string;
  verification_id?: string;
  verification_result: DocumentVerificationResultType;
  scheme_code: string;
  document_type: string;
  document_title?: string;
  file_info?: {
    file_name: string;
    file_size?: number;
    processed_image_url?: string;
    is_pdf?: boolean;
    total_pages?: number;
    blur_score?: number;
    is_sharp?: boolean;
  };
  ocr_summary?: {
    lines_extracted: number;
    confidence_avg: number;
  };
  completeness?: {
    completeness_score: number;
    total_mandatory_fields?: number;
    present_fields?: string[];
    missing_fields?: string[];
    is_fully_complete: boolean;
  };
  profile_comparison?: {
    profile_name?: string;
    document_name?: string;
    name_match_percentage: number;
    name_match_status: string;
    name_notes?: string;
    field_comparisons?: Record<string, any>;
  };
  extracted_fields?: Record<string, any>;
  ai_understanding?: {
    layer_role?: string;
    classification?: {
      classified_type: string;
      confidence: number;
      rationale: string;
    };
    document_explanation?: string;
    unclear_information_flags?: string[];
    inconsistencies_detected?: string[];
    disclaimer?: string;
  };
  evidence_summary?: string;
  deficiency_reasons?: string[];
  remedy_suggestions?: string[];
  allow_resubmission?: boolean;
  resubmission_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface DocumentRequirementItem {
  document_type: string;
  title: string;
  category: string;
  description: string;
  issuing_authority_hint: string;
  mandatory: boolean;
  key_fields_checked: string[];
  allowed_extensions: string[];
  max_size_mb: number;
  verification_status: DocumentVerificationResultType;
  existing_verification?: SchemeDocumentVerification | null;
}

export interface SchemeRequirementsResponse {
  success: boolean;
  scheme_code: string;
  scheme_name: string;
  target_category: string;
  max_family_income?: number | null;
  min_academic_percentage?: number | null;
  total_required_documents: number;
  mandatory_documents_count: number;
  verified_valid_count: number;
  readiness_percentage: number;
  is_scheme_ready_for_submission: boolean;
  required_documents: DocumentRequirementItem[];
}

export type OverallScreeningResultType =
  | "Eligible"
  | "Not Eligible"
  | "Deficiency Found"
  | "Requires Officer Review";

export interface PipelineLineageItem {
  document_source: string;
  extracted_data: string;
  rule_code: string;
  rule_name: string;
  rule_type: string;
  required_condition: string;
  rule_result: "PASS" | "FAIL" | "REVIEW" | string;
  supporting_evidence: string;
  explanation: string;
}

export interface VerificationReportDeficiency {
  rule_code: string;
  title: string;
  detail: string;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | string;
  remedy: string;
}

export interface EvidenceVerificationReport {
  application_id: string;
  application_number: string;
  created_at: string;
  applicant_information: {
    full_name: string;
    email?: string;
    phone?: string;
    scheduled_tribe: string;
    caste_certificate_number?: string;
    annual_family_income?: number;
    aggregate_percentage?: number;
    applicant_age?: number;
    institution_name?: string;
    course_enrolled?: string;
    admission_status?: string;
    caste_verified: boolean;
  };
  selected_scheme: {
    scheme_code: string;
    scheme_name: string;
    statutory_authority: string;
    guidelines_reference: string;
  };
  documents_checked: Array<{
    id?: string;
    document_type: string;
    document_title: string;
    file_name: string;
    file_type: string;
    verification_status: string;
    ocr_lines_extracted: number;
    ai_classification?: string;
    ai_confidence?: number;
    document_explanation?: string;
    unclear_flags?: string[];
    inconsistencies?: string[];
  }>;
  extracted_information: Record<string, any>;
  lineage_matrix: PipelineLineageItem[];
  rules_evaluated: any[];
  deficiencies: VerificationReportDeficiency[];
  overall_screening_result: OverallScreeningResultType;
  screening_rationale: string;
  eligibility_score: number;
  passed_rules: number;
  total_rules: number;
  officer_review: {
    officer_decision?: string;
    officer_remarks?: string;
    officer_id?: string;
    decision_date?: string;
    is_finalized: boolean;
  };
  statutory_guardrail: {
    title: string;
    notice: string;
  };
}

export interface ApplicationHistoryItem {
  id: string;
  application_id: string;
  action: "SUBMITTED" | "APPROVED" | "REJECTED" | "REQUEST_RESUBMISSION" | "UNDER_REVIEW" | string;
  previous_status?: string | null;
  new_status?: string | null;
  officer_id?: string | null;
  officer_name?: string | null;
  remarks?: string | null;
  metadata_payload?: Record<string, any>;
  created_at: string;
}

export interface RuleChangeHistoryItem {
  id: string;
  scheme_code: string;
  rule_code: string;
  change_type: "CREATED" | "UPDATED" | "STATUS_TOGGLED" | "DELETED" | string;
  changed_by_id?: string | null;
  changed_by_name: string;
  field_changed?: string | null;
  previous_value?: string | null;
  new_value?: string | null;
  full_previous_state?: Record<string, any> | null;
  full_new_state?: Record<string, any> | null;
  remarks?: string | null;
  created_at: string;
}

export interface AdminUserItem {
  id: string;
  username: string;
  email: string;
  full_name: string;
  role: "applicant" | "inspector" | "officer" | "admin" | string;
  is_active: boolean;
  phone?: string | null;
  designation?: string | null;
  department?: string | null;
  tribe_name?: string | null;
  state_of_domicile?: string | null;
  profile_completion?: number;
  applications_submitted?: number;
  created_at: string;
}

export interface DeficiencyAnalyticsData {
  total_deficiencies: number;
  resolved_deficiencies: number;
  resolution_rate: number;
  avg_turnaround_days: number;
  top_deficiency_reasons: Array<{ reason: string; count: number }>;
  scheme_deficiency_breakdown: Array<{ scheme_code: string; scheme_name: string; deficiency_count: number }>;
}

export interface SchemePerformanceData {
  scheme_code: string;
  scheme_name: string;
  ministry?: string;
  slots_available: number;
  total_applications: number;
  approved_applications: number;
  rejected_applications: number;
  pending_applications: number;
  deficiency_applications: number;
  quota_utilization_pct: number;
  approval_rate_pct: number;
  estimated_disbursement: number;
  is_active: boolean;
}

export interface SchemeDocumentRequirementMatrix {
  scheme_code: string;
  scheme_name: string;
  is_active: boolean;
  required_documents: string[];
  document_details: Array<{ type: string; title: string; mandatory: boolean }>;
}

export interface ApplicationMonitoringData {
  counts: {
    ALL: number;
    SUBMITTED: number;
    UNDER_REVIEW: number;
    CLARIFICATION_REQUIRED: number;
    APPROVED: number;
    REJECTED: number;
  };
  applications: ScholarshipApplication[];
}

export type ApplicationState =
  | "DRAFT"
  | "SUBMITTED"
  | "DOCUMENT_VERIFICATION"
  | "DEFICIENCY"
  | "RESUBMITTED"
  | "RULE_VALIDATION"
  | "OFFICER_REVIEW"
  | "APPROVED"
  | "REJECTED";

export interface ApplicationTimelineMilestone {
  state: ApplicationState | string;
  label: string;
  description: string;
  status: "COMPLETED" | "CURRENT" | "DEFICIENCY" | "UPCOMING" | "SKIPPED";
  timestamp?: string | null;
  actor_name?: string | null;
  remarks?: string | null;
}

export interface ApplicationDeficiencyItem {
  id: string;
  rule_code?: string;
  title: string;
  reason: string;
  required_action: string;
  is_resolved: boolean;
  resolution_date?: string | null;
}

export interface ApplicationRequiredAction {
  action_needed: boolean;
  title: string;
  description: string;
  action_type: "UPLOAD_DOCUMENT" | "SUBMIT_APPLICATION" | "AWAIT_DECISION" | "NONE" | string;
}

export interface OfficerReviewStatus {
  is_assigned: boolean;
  officer_name: string;
  department: string;
  remarks?: string | null;
  decision?: string | null;
  decision_date?: string | null;
}

export interface TrackingNotificationItem {
  id: string;
  title: string;
  message: string;
  type?: string;
  created_at: string;
  read?: boolean;
  email_dispatched?: boolean;
  email_recipient?: string | null;
  email_status?: string | null;
}

export interface ApplicationTrackingData {
  application: ScholarshipApplication;
  current_status: ApplicationState | string;
  status_metadata: {
    label: string;
    description: string;
    badge_color: string;
    step_number: number;
    is_terminal: boolean;
  };
  timeline: ApplicationTimelineMilestone[];
  deficiencies: ApplicationDeficiencyItem[];
  required_action: ApplicationRequiredAction;
  officer_review_status: OfficerReviewStatus;
  history: ApplicationHistoryItem[];
  notifications: TrackingNotificationItem[];
}

export interface SchemeIntelligenceItem {
  scheme_code: string;
  scheme_name: string;
  study_level: string;
  ministry_or_department: string;
  description: string;
  slots_available: number;
  academic_year: string;
  eligibility_tier: "ELIGIBLE" | "POTENTIALLY_ELIGIBLE" | "NOT_ELIGIBLE";
  tier_label: string;
  tier_badge_color: string;
  match_score: number;
  summary_explanation: string;
  total_rules_evaluated: number;
  passed_rules_count: number;
  failed_rules_count: number;
  review_rules_count: number;
  passed_requirements: Array<{
    rule_code: string;
    rule_name: string;
    category?: string;
    required_condition: string;
    applicant_value: any;
    result: string;
    evidence: string;
    explanation?: string;
    severity?: string;
  }>;
  missing_requirements: Array<{
    type: "CRITERIA_UNMET" | "MISSING_DOCUMENT" | "REVIEW_PENDING" | "DOCUMENT_EVIDENCE_REQUIRED" | string;
    rule_code: string;
    title: string;
    requirement: string;
    applicant_value: any;
    reason: string;
    resolution_action: string;
    severity: string;
    is_disqualifying: boolean;
  }>;
  missing_requirements_count: number;
  required_documents: Array<{
    document_type: string;
    title: string;
    is_uploaded: boolean;
    is_verified: boolean;
    status: "VERIFIED" | "UPLOADED_PENDING_REVIEW" | "MISSING" | string;
    file_name?: string | null;
    document_id?: string | null;
  }>;
  missing_documents_count: number;
  gap_analysis?: SchemeGapIntelligence;
  gaps?: SchemeGapItem[];
  user_application_status?: string | null;
  user_application_id?: string | null;
  user_application_number?: string | null;
  can_apply: boolean;
  action_button: {
    type: "APPLY_NOW" | "COMPLETE_AND_APPLY" | "VIEW_APPLICATION" | "INELIGIBLE" | string;
    label: string;
    link?: string | null;
  };
}

export interface SchemeGapItem {
  gap_id: string;
  rule_code: string;
  rule_name: string;
  category: string;
  gap_type:
    | "MISSING_DOCUMENT"
    | "ACADEMIC_REQUIREMENT_UNMET"
    | "INCOME_REQUIREMENT_UNMET"
    | "QUALIFICATION_MISSING"
    | "CERTIFICATE_INCOMPLETE"
    | "AGE_LIMIT_UNMET"
    | "GENERAL_DEFICIENCY"
    | string;
  requirement: string;
  applicant_status: string;
  gap: string;
  suggested_action: string;
  statutory_reference?: string;
  severity: "CRITICAL" | "MANDATORY" | "HIGH" | "MEDIUM" | string;
  is_disqualifying: boolean;
}

export interface SchemeGapIntelligence {
  scheme_code: string;
  scheme_name?: string;
  study_level?: string;
  ministry_or_department?: string;
  is_eligible: boolean;
  overall_status: "ELIGIBLE" | "ACTIONABLE_GAPS_IDENTIFIED" | "STATUTORY_CRITERIA_UNMET" | string;
  total_gaps_count: number;
  disqualifying_gaps_count: number;
  resolvable_gaps_count: number;
  summary_narrative: string;
  gaps: SchemeGapItem[];
  evaluation_metrics?: {
    total_rules: number;
    passed_rules: number;
    failed_rules: number;
    review_rules: number;
    eligibility_score: number;
  };
  application_id?: string;
  application_number?: string;
  application_status?: string;
}

export interface CrossSchemeIntelligenceData {
  profile_summary: {
    user_id: string;
    full_name: string;
    category: string;
    tribe_name: string;
    caste_verified: boolean;
    annual_income?: number | null;
    aggregate_percentage?: number | null;
    education_qualification?: string | null;
    academic_level?: string | null;
    institution_name?: string | null;
    course_name?: string | null;
    admission_status?: string | null;
    profile_completion_percentage: number;
    documents_uploaded_count: number;
  };
  counts: {
    total_active_schemes: number;
    eligible: number;
    potentially_eligible: number;
    not_eligible: number;
  };
  eligible_opportunities: SchemeIntelligenceItem[];
  potentially_eligible: SchemeIntelligenceItem[];
  not_eligible: SchemeIntelligenceItem[];
  all_schemes: SchemeIntelligenceItem[];
  guardrail_notice: string;
}

// -------------------------------------------------------------
// RULE IMPACT ANALYSIS (ADMIN PREVIEW BEFORE ACTIVATION)
// -------------------------------------------------------------
export interface RuleImpactCondition {
  active: boolean;
  operator: string;
  expected_value: string;
  requirement: string;
  display: string;
}

export interface RuleImpactMetrics {
  total_applications_evaluated: number;
  total_affected_applications: number;
  newly_eligible_count: number;
  newly_deficient_count: number;
  review_changed_count: number;
  unaffected_count: number;
  requires_reevaluation_count: number;
}

export interface AffectedApplicationItem {
  application_id: string;
  application_number: string;
  applicant_name: string;
  current_status: string;
  applicant_value: any;
  previous_result: "PASS" | "FAIL" | "REVIEW" | string;
  new_result: "PASS" | "FAIL" | "REVIEW" | string;
  previous_explanation?: string;
  new_explanation?: string;
  impact_effect: string;
  effect_label: string;
  effect_color: string;
  requires_reevaluation: boolean;
}

export interface RuleImpactAnalysisResponse {
  scheme_code: string;
  scheme_name: string;
  rule_code: string;
  rule_name: string;
  field_name: string;
  is_status_toggle: boolean;
  is_simulated_cohort: boolean;
  previous_condition: RuleImpactCondition;
  new_condition: RuleImpactCondition;
  impact_metrics: RuleImpactMetrics;
  impact_narrative: string;
  affected_applications: AffectedApplicationItem[];
  guardrail_notice: string;
}
