import type {
  ScholarScheme,
  SchemeRule,
  CasteVerificationResult,
  ScholarshipApplication,
  ApplicantProfileData,
  ProfileDocument,
  ScholarNotification,
  AdminAnalyticsData,
  ApplicationEvaluation,
  SchemeRequirementsResponse,
  SchemeDocumentVerification,
  EvidenceVerificationReport,
  RuleChangeHistoryItem,
  AdminUserItem,
  DeficiencyAnalyticsData,
  SchemePerformanceData,
  SchemeDocumentRequirementMatrix,
  ApplicationMonitoringData,
  ApplicationTrackingData,
  TrackingNotificationItem,
  CrossSchemeIntelligenceData,
  SchemeIntelligenceItem,
  SchemeGapIntelligence,
  SchemeGapItem,
  RuleImpactAnalysisResponse
} from "../types/scholar";
import { authService } from "./authService";

const BACKEND_URL = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function getHeaders(isFormData = false): Record<string, string> {
  const headers: Record<string, string> = {};
  if (!isFormData) {
    headers["Content-Type"] = "application/json";
  }
  const token = authService.getToken();
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }
  return headers;
}

export const scholarService = {
  // ---------------------------------------------------------
  // HEALTH
  // ---------------------------------------------------------
  async checkHealth(): Promise<{ online: boolean; status: string }> {
    try {
      const res = await fetch(`${BACKEND_URL}/api/health`);
      if (res.ok) {
        return { online: true, status: "healthy" };
      }
      return { online: false, status: "offline" };
    } catch {
      return { online: false, status: "offline" };
    }
  },

  // ---------------------------------------------------------
  // SCHEMES
  // ---------------------------------------------------------
  async getSchemes(activeOnly = true): Promise<ScholarScheme[]> {
    const res = await fetch(`${BACKEND_URL}/api/schemes/?active_only=${activeOnly}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch scholarship schemes");
    const data = await res.json();
    return data.schemes || [];
  },

  async getScheme(code: string): Promise<ScholarScheme> {
    const res = await fetch(`${BACKEND_URL}/api/schemes/${code}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error(`Failed to fetch scheme ${code}`);
    const data = await res.json();
    return data.scheme;
  },

  async createScheme(schemeData: Partial<ScholarScheme>): Promise<ScholarScheme> {
    const res = await fetch(`${BACKEND_URL}/api/schemes/`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(schemeData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to create scheme");
    }
    const data = await res.json();
    return data.scheme;
  },

  async updateScheme(code: string, schemeData: Partial<ScholarScheme>): Promise<ScholarScheme> {
    const res = await fetch(`${BACKEND_URL}/api/schemes/${code}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(schemeData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to update scheme");
    }
    const data = await res.json();
    return data.scheme;
  },

  async toggleSchemeStatus(code: string): Promise<ScholarScheme> {
    const res = await fetch(`${BACKEND_URL}/api/schemes/${code}/toggle-status`, {
      method: "PATCH",
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to toggle scheme status");
    }
    const data = await res.json();
    return data.scheme;
  },

  // ---------------------------------------------------------
  // DYNAMIC RULES (SUPABASE)
  // ---------------------------------------------------------
  async getSchemeRules(schemeCode: string): Promise<SchemeRule[]> {
    const res = await fetch(`${BACKEND_URL}/api/schemes/${schemeCode}/rules`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error(`Failed to fetch rules for ${schemeCode}`);
    const data = await res.json();
    return data.rules || [];
  },

  async addSchemeRule(schemeCode: string, ruleData: Partial<SchemeRule>): Promise<SchemeRule> {
    const res = await fetch(`${BACKEND_URL}/api/schemes/${schemeCode}/rules`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(ruleData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to add dynamic rule");
    }
    const data = await res.json();
    return data.rule;
  },

  async updateSchemeRule(ruleCode: string, ruleData: Partial<SchemeRule>): Promise<SchemeRule> {
    const res = await fetch(`${BACKEND_URL}/api/schemes/rules/${ruleCode}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify(ruleData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to update dynamic rule");
    }
    const data = await res.json();
    return data.rule;
  },

  async toggleSchemeRuleStatus(ruleCode: string): Promise<SchemeRule> {
    const res = await fetch(`${BACKEND_URL}/api/schemes/rules/${ruleCode}/toggle-status`, {
      method: "PATCH",
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to toggle rule status");
    }
    const data = await res.json();
    return data.rule;
  },

  async analyzeRuleImpact(
    ruleCode: string,
    proposedChanges: Partial<SchemeRule>,
    schemeCode?: string
  ): Promise<RuleImpactAnalysisResponse> {
    const payload = {
      rule_code: ruleCode,
      scheme_code: schemeCode,
      ...proposedChanges
    };
    const res = await fetch(`${BACKEND_URL}/api/schemes/rules/${ruleCode}/impact-analysis`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(payload)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to analyze rule impact");
    }
    const data = await res.json();
    return data.impact_analysis;
  },

  async deleteSchemeRule(ruleCode: string): Promise<boolean> {
    const res = await fetch(`${BACKEND_URL}/api/schemes/rules/${ruleCode}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to delete rule");
    }
    return true;
  },

  async evaluateScheme(
    schemeCode: string,
    applicantData: Record<string, any>,
    extractedDocumentsData?: Record<string, any>
  ): Promise<any> {
    const res = await fetch(`${BACKEND_URL}/api/schemes/${schemeCode}/evaluate`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        applicant_data: applicantData,
        extracted_documents_data: extractedDocumentsData || {}
      })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to evaluate scheme rules");
    }
    const data = await res.json();
    return data.evaluation;
  },

  // ---------------------------------------------------------
  // CASTE VERIFICATION (PADDLEOCR + GEMINI + DETERMINISTIC ENGINE)
  // ---------------------------------------------------------
  async getRecognizedTribes(): Promise<string[]> {
    try {
      const res = await fetch(`${BACKEND_URL}/api/caste/tribes`);
      if (!res.ok) return [];
      const data = await res.json();
      return data.tribes || [];
    } catch {
      return [];
    }
  },

  async validateCasteCertificate(
    file: File,
    applicantName?: string,
    declaredTribe?: string
  ): Promise<{
    file_info: Record<string, any>;
    ocr_summary: Record<string, any>;
    extracted_fields: Record<string, any>;
    st_verification: CasteVerificationResult;
  }> {
    const formData = new FormData();
    formData.append("file", file);
    if (applicantName) formData.append("applicant_name", applicantName);
    if (declaredTribe) formData.append("declared_tribe", declaredTribe);

    const res = await fetch(`${BACKEND_URL}/api/caste/validate`, {
      method: "POST",
      headers: getHeaders(true),
      body: formData
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Caste certificate validation failed");
    }
    return res.json();
  },

  async confirmCasteCertificate(data: {
    file_path: string;
    file_name: string;
    applicant_name: string;
    certificate_number: string;
    category?: string;
    tribe_name?: string;
    issuing_authority?: string;
    issue_date?: string;
    state?: string;
    district?: string;
    verification_details?: any;
  }): Promise<{ success: boolean; message: string; document: ProfileDocument; profile: ApplicantProfileData }> {
    const res = await fetch(`${BACKEND_URL}/api/caste/confirm`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(data)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to confirm caste certificate");
    }
    return res.json();
  },

  // ---------------------------------------------------------
  // APPLICATIONS & DECISIONS
  // ---------------------------------------------------------
  async submitApplication(formData: FormData): Promise<ScholarshipApplication> {
    const res = await fetch(`${BACKEND_URL}/api/applications/submit`, {
      method: "POST",
      headers: getHeaders(true),
      body: formData
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to submit application");
    }
    const data = await res.json();
    return data.application;
  },

  async evaluateSandbox(formData: FormData): Promise<{
    scheme: ScholarScheme;
    evaluation: ApplicationEvaluation;
    extracted_documents: Record<string, any>;
  }> {
    const res = await fetch(`${BACKEND_URL}/api/applications/evaluate-sandbox`, {
      method: "POST",
      headers: getHeaders(true),
      body: formData
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Sandbox evaluation failed");
    }
    return res.json();
  },

  async getApplications(status?: string): Promise<ScholarshipApplication[]> {
    let url = `${BACKEND_URL}/api/applications/`;
    if (status) url += `?status=${status}`;

    const res = await fetch(url, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch applications");
    const data = await res.json();
    return data.applications || [];
  },

  async getApplication(appId: string): Promise<ScholarshipApplication> {
    const res = await fetch(`${BACKEND_URL}/api/applications/${appId}`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("Application not found");
    const data = await res.json();
    return data.application;
  },

  async recordOfficerDecision(
    appId: string,
    decision: "APPROVED" | "REJECTED" | "CLARIFICATION_REQUIRED" | "REQUEST_RESUBMISSION" | "UNDER_REVIEW" | string,
    remarks: string,
    ruleOverrides?: Record<string, any>
  ): Promise<ScholarshipApplication> {
    const res = await fetch(`${BACKEND_URL}/api/applications/${appId}/decision`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        decision,
        remarks,
        rule_overrides: ruleOverrides
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to record officer determination");
    }
    const data = await res.json();
    return data.application;
  },

  async getApplicationHistory(appId: string): Promise<any[]> {
    try {
      const res = await fetch(`${BACKEND_URL}/api/applications/${appId}/history`, {
        headers: getHeaders()
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.history || [];
    } catch {
      return [];
    }
  },

  async getApplicationTracking(appId: string): Promise<ApplicationTrackingData> {
    const res = await fetch(`${BACKEND_URL}/api/applications/${appId}/tracking`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to fetch application tracking data");
    }
    const data = await res.json();
    return data.tracking;
  },

  async resubmitDeficiency(appId: string, formData: FormData): Promise<any> {
    const headers = getHeaders(true); // Don't set Content-Type so browser sets boundary
    const res = await fetch(`${BACKEND_URL}/api/applications/${appId}/resubmit-deficiency`, {
      method: "POST",
      headers,
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to resubmit deficiency document");
    }
    return res.json();
  },

  async saveApplicationDraft(draftData: any): Promise<any> {
    const res = await fetch(`${BACKEND_URL}/api/applications/draft`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(draftData)
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to save application draft");
    }
    return res.json();
  },

  async getApplicationNotifications(appId: string): Promise<TrackingNotificationItem[]> {
    const res = await fetch(`${BACKEND_URL}/api/applications/${appId}/notifications`, {
      headers: getHeaders()
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.notifications || [];
  },

  getApplicationPdfUrl(appId: string): string {
    return `${BACKEND_URL}/api/applications/${appId}/pdf`;
  },

  // ---------------------------------------------------------
  // APPLICANT PROFILE & NOTIFICATIONS
  // ---------------------------------------------------------
  async getApplicantProfile(): Promise<ApplicantProfileData> {
    const res = await fetch(`${BACKEND_URL}/api/applicant/profile`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch profile");
    const data = await res.json();
    return data.profile;
  },

  async getCrossSchemeIntelligence(): Promise<CrossSchemeIntelligenceData> {
    const res = await fetch(`${BACKEND_URL}/api/applicant/cross-scheme-intelligence`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to load cross-scheme intelligence");
    }
    const data = await res.json();
    return data.intelligence;
  },

  async updateApplicantProfile(profileData: Partial<ApplicantProfileData>): Promise<ApplicantProfileData> {
    const res = await fetch(`${BACKEND_URL}/api/applicant/profile`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(profileData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to update profile");
    }
    const data = await res.json();
    return data.profile;
  },

  async getProfileDocuments(): Promise<ProfileDocument[]> {
    const res = await fetch(`${BACKEND_URL}/api/applicant/documents`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch profile documents");
    const data = await res.json();
    return data.documents || [];
  },

  async uploadProfileDocument(formData: FormData): Promise<{ success?: boolean; message?: string; document: ProfileDocument; profile: ApplicantProfileData }> {
    const res = await fetch(`${BACKEND_URL}/api/applicant/documents/upload`, {
      method: "POST",
      headers: getHeaders(true),
      body: formData
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to upload document to profile");
    }
    return res.json();
  },

  async deleteProfileDocument(docId: string): Promise<ApplicantProfileData> {
    const res = await fetch(`${BACKEND_URL}/api/applicant/documents/${docId}`, {
      method: "DELETE",
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || "Failed to delete document");
    }
    const data = await res.json();
    return data.profile;
  },

  getProfileDocumentFileUrl(docId: string): string {
    return `${BACKEND_URL}/api/applicant/documents/${docId}/file`;
  },

  async getNotifications(): Promise<ScholarNotification[]> {
    try {
      const res = await fetch(`${BACKEND_URL}/api/applicant/notifications`, {
        headers: getHeaders()
      });
      if (!res.ok) return [];
      const data = await res.json();
      return data.notifications || [];
    } catch {
      return [];
    }
  },

  async markNotificationsRead(): Promise<void> {
    try {
      await fetch(`${BACKEND_URL}/api/applicant/notifications/read`, {
        method: "POST",
        headers: getHeaders()
      });
    } catch {
      // ignore
    }
  },

  // ---------------------------------------------------------
  // ADMIN ANALYTICS & OFFICERS
  // ---------------------------------------------------------
  async getAdminAnalytics(): Promise<AdminAnalyticsData> {
    const res = await fetch(`${BACKEND_URL}/api/admin/analytics`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch admin analytics");
    const data = await res.json();
    return data.analytics;
  },

  async getVerificationOfficers(): Promise<any[]> {
    const res = await fetch(`${BACKEND_URL}/api/admin/officers`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch officers");
    const data = await res.json();
    return data.officers || [];
  },

  async createVerificationOfficer(officerData: {
    username: string;
    password: string;
    full_name: string;
    phone?: string;
    designation?: string;
    department?: string;
  }): Promise<any> {
    const res = await fetch(`${BACKEND_URL}/api/admin/officers`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify(officerData)
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to create officer");
    }
    const data = await res.json();
    return data.officer;
  },

  async getAuditLogs(limit = 50): Promise<any[]> {
    const res = await fetch(`${BACKEND_URL}/api/admin/logs?limit=${limit}`, {
      headers: getHeaders()
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.logs || [];
  },

  async getRuleChangeHistory(schemeCode?: string, ruleCode?: string): Promise<RuleChangeHistoryItem[]> {
    let url = `${BACKEND_URL}/api/admin/rule-history`;
    const params = new URLSearchParams();
    if (schemeCode) params.append("scheme_code", schemeCode);
    if (ruleCode) params.append("rule_code", ruleCode);
    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return data.history || [];
  },

  async getAdminUsers(role?: string): Promise<AdminUserItem[]> {
    let url = `${BACKEND_URL}/api/admin/users`;
    if (role && role !== "all") url += `?role=${role}`;

    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) return [];
    const data = await res.json();
    return data.users || [];
  },

  async toggleUserStatus(userId: string, isActive?: boolean): Promise<{ user_id: string; is_active: boolean }> {
    const res = await fetch(`${BACKEND_URL}/api/admin/users/${userId}/toggle-active`, {
      method: "PATCH",
      headers: getHeaders(),
      body: JSON.stringify({ is_active: isActive })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to toggle user status");
    }
    const data = await res.json();
    return data.user;
  },

  async updateUserStatus(userId: string, isActive?: boolean): Promise<{ user_id: string; is_active: boolean }> {
    return this.toggleUserStatus(userId, isActive);
  },

  async getApplicationMonitoring(status?: string, schemeCode?: string, search?: string): Promise<ApplicationMonitoringData> {
    let url = `${BACKEND_URL}/api/admin/applications/monitoring`;
    const params = new URLSearchParams();
    if (status) params.append("status", status);
    if (schemeCode) params.append("scheme_code", schemeCode);
    if (search) params.append("search", search);
    if (params.toString()) url += `?${params.toString()}`;

    const res = await fetch(url, { headers: getHeaders() });
    if (!res.ok) throw new Error("Failed to fetch application monitoring data");
    return await res.json();
  },

  async getDeficiencyAnalytics(): Promise<DeficiencyAnalyticsData> {
    const res = await fetch(`${BACKEND_URL}/api/admin/deficiency-analytics`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch deficiency analytics");
    const data = await res.json();
    return data.analytics;
  },

  async getSchemePerformance(): Promise<SchemePerformanceData[]> {
    const res = await fetch(`${BACKEND_URL}/api/admin/scheme-performance`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch scheme performance scorecards");
    const data = await res.json();
    return data.schemes || [];
  },

  async getDocumentRequirementsMatrix(): Promise<SchemeDocumentRequirementMatrix[]> {
    const res = await fetch(`${BACKEND_URL}/api/admin/document-requirements`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch document requirements matrix");
    const data = await res.json();
    return data.matrix || [];
  },

  async updateSchemeDocumentRequirements(schemeCode: string, requiredDocuments: string[]): Promise<any> {
    const res = await fetch(`${BACKEND_URL}/api/admin/document-requirements/${schemeCode}`, {
      method: "PUT",
      headers: getHeaders(),
      body: JSON.stringify({ required_documents: requiredDocuments })
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to update document requirements");
    }
    const data = await res.json();
    return data.scheme;
  },

  // ---------------------------------------------------------
  // SCHOLARSHIP DOCUMENT VERIFICATION MODULE
  // ---------------------------------------------------------
  async getSchemeDocumentRequirements(schemeCode: string): Promise<SchemeRequirementsResponse> {
    const res = await fetch(`${BACKEND_URL}/api/documents/schemes/${schemeCode}/requirements`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to fetch scheme document requirements");
    }
    return await res.json();
  },

  async verifySchemeDocument(formData: FormData): Promise<SchemeDocumentVerification> {
    const res = await fetch(`${BACKEND_URL}/api/documents/verify`, {
      method: "POST",
      headers: getHeaders(true),
      body: formData
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Document verification pipeline failed");
    }
    return await res.json();
  },

  async resubmitSchemeDocument(verificationId: string, formData: FormData): Promise<SchemeDocumentVerification> {
    const res = await fetch(`${BACKEND_URL}/api/documents/${verificationId}/resubmit`, {
      method: "POST",
      headers: getHeaders(true),
      body: formData
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Document resubmission failed");
    }
    return await res.json();
  },

  async getApplicantDocumentVerifications(schemeCode: string): Promise<{ verifications: SchemeDocumentVerification[] }> {
    const res = await fetch(`${BACKEND_URL}/api/documents/verifications/${schemeCode}`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      throw new Error("Failed to fetch applicant document verifications");
    }
    return await res.json();
  },

  async getSupportedDocumentTypes(): Promise<any> {
    const res = await fetch(`${BACKEND_URL}/api/documents/types`, {
      headers: getHeaders()
    });
    if (!res.ok) throw new Error("Failed to fetch supported document types");
    return await res.json();
  },

  async getVerificationReport(applicationId: string): Promise<EvidenceVerificationReport> {
    const res = await fetch(`${BACKEND_URL}/api/applications/${applicationId}/verification-report`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.detail || "Failed to fetch verification report");
    }
    const data = await res.json();
    return data.report;
  },

  // ---------------------------------------------------------
  // SCHEME GAP INTELLIGENCE
  // ---------------------------------------------------------
  async getSchemeGapIntelligence(schemeCode: string): Promise<SchemeGapIntelligence> {
    const res = await fetch(`${BACKEND_URL}/api/schemes/${encodeURIComponent(schemeCode)}/gaps`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to fetch gap intelligence for scheme ${schemeCode}`);
    }
    const data = await res.json();
    return data.gap_intelligence;
  },

  async getApplicationGapIntelligence(applicationId: string): Promise<SchemeGapIntelligence> {
    const res = await fetch(`${BACKEND_URL}/api/applications/${encodeURIComponent(applicationId)}/gaps`, {
      headers: getHeaders()
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to fetch gap intelligence for application ${applicationId}`);
    }
    const data = await res.json();
    return data.gap_intelligence;
  },

  async evaluateCustomSchemeGaps(schemeCode: string, applicantData: any, extractedDocsData?: any): Promise<SchemeGapIntelligence> {
    const res = await fetch(`${BACKEND_URL}/api/schemes/${encodeURIComponent(schemeCode)}/evaluate-gaps`, {
      method: "POST",
      headers: getHeaders(),
      body: JSON.stringify({
        applicant_data: applicantData,
        extracted_documents_data: extractedDocsData || {}
      })
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.detail || `Failed to evaluate custom scheme gaps for ${schemeCode}`);
    }
    const data = await res.json();
    return data.gap_intelligence;
  }
};

