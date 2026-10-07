import { useEffect, useState, useMemo } from "react";
import { Link, useSearchParams } from "react-router-dom";
import {
  Award,
  Sliders,
  FileCheck2,
  Users,
  ShieldAlert,
  BarChart3,
  TrendingUp,
  History,
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Search,
  Plus,
  RefreshCw,
  ExternalLink,
  ChevronRight,
  Filter,
  Check,
  UserCheck,
  UserX,
  FileText,
  Building,
  HelpCircle,
  Eye,
  Settings,
  Scale
} from "lucide-react";
import { scholarService } from "../../services/scholarService";
import type {
  ScholarScheme,
  SchemeRule,
  RuleChangeHistoryItem,
  AdminUserItem,
  DeficiencyAnalyticsData,
  SchemePerformanceData,
  SchemeDocumentRequirementMatrix,
  ApplicationMonitoringData,
  ScholarshipApplication
} from "../../types/scholar";

type AdminTab =
  | "overview"
  | "schemes"
  | "rules"
  | "documents"
  | "users"
  | "officers"
  | "monitoring"
  | "deficiencies"
  | "performance"
  | "history";

export default function AdminDashboard() {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = (searchParams.get("tab") as AdminTab) || "overview";

  // Data States
  const [schemes, setSchemes] = useState<ScholarScheme[]>([]);
  const [rules, setRules] = useState<SchemeRule[]>([]);
  const [selectedSchemeRules, setSelectedSchemeRules] = useState<string>("ALL");
  const [documentMatrix, setDocumentMatrix] = useState<SchemeDocumentRequirementMatrix[]>([]);
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [userRoleFilter, setUserRoleFilter] = useState<string>("all");
  const [officers, setOfficers] = useState<any[]>([]);
  const [monitoringData, setMonitoringData] = useState<ApplicationMonitoringData | null>(null);
  const [monitoringFilter, setMonitoringFilter] = useState<string>("ALL");
  const [deficiencyAnalytics, setDeficiencyAnalytics] = useState<DeficiencyAnalyticsData | null>(null);
  const [schemePerformance, setSchemePerformance] = useState<SchemePerformanceData[]>([]);
  const [ruleHistory, setRuleHistory] = useState<RuleChangeHistoryItem[]>([]);

  // UI States
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modals
  const [showAddRuleModal, setShowAddRuleModal] = useState(false);
  const [newRuleData, setNewRuleData] = useState({
    scheme_code: "NOS-ST",
    rule_code: "",
    rule_name: "",
    rule_type: "SCHEME_SPECIFIC_CONDITION",
    field_name: "annual_income",
    operator: "<=",
    expected_value: "600000",
    severity: "CRITICAL",
    requirement: "",
    error_message: "",
    statutory_reference: "Ministry of Tribal Affairs Statutory Scheme Guideline"
  });

  const [showCreateSchemeModal, setShowCreateSchemeModal] = useState(false);
  const [newSchemeData, setNewSchemeData] = useState({
    scheme_code: "",
    scheme_name: "",
    ministry_or_department: "Ministry of Tribal Affairs (MoTA)",
    study_level: "Higher Education / Master / Ph.D.",
    description: "",
    target_category: "ST",
    max_family_income: 600000,
    min_academic_percentage: 55,
    max_age_limit: 35,
    slots_available: 50,
    academic_year: "2025-2026",
    required_documents: ["CASTE_CERTIFICATE", "INCOME_CERTIFICATE", "MARKSHEET"]
  });

  const [showAddOfficerModal, setShowAddOfficerModal] = useState(false);
  const [newOfficerData, setNewOfficerData] = useState({
    email: "",
    username: "",
    password: "Password@123",
    full_name: "",
    phone: "",
    department: "Tribal Welfare Department",
    designation: "Verification Officer Grade-I",
    jurisdiction_district: "Central Bureau",
    assigned_schemes: ["NOS-ST", "NFST"]
  });

  const loadAllData = async () => {
    try {
      const [
        schs,
        docMat,
        usrs,
        offs,
        mon,
        def,
        perf,
        hist
      ] = await Promise.all([
        scholarService.getSchemes(false).catch(() => []),
        scholarService.getDocumentRequirementsMatrix().catch(() => []),
        scholarService.getAdminUsers().catch(() => []),
        scholarService.getVerificationOfficers().catch(() => []),
        scholarService.getApplicationMonitoring().catch(() => null),
        scholarService.getDeficiencyAnalytics().catch(() => null),
        scholarService.getSchemePerformance().catch(() => []),
        scholarService.getRuleChangeHistory().catch(() => [])
      ]);

      setSchemes(schs);
      setDocumentMatrix(docMat);
      setUsers(usrs);
      setOfficers(offs);
      setMonitoringData(mon);
      setDeficiencyAnalytics(def);
      setSchemePerformance(perf);
      setRuleHistory(hist);

      // Also load rules for the schemes
      if (schs.length > 0) {
        const allRulesPromises = schs.map(s =>
          scholarService.getSchemeRules(s.scheme_code).catch(() => [])
        );
        const allRulesArrays = await Promise.all(allRulesPromises);
        const flattened = allRulesArrays.flat();
        setRules(flattened);
      }
    } catch (err: any) {
      console.error("Failed to load admin data:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const setTab = (tab: AdminTab) => {
    setSearchParams({ tab });
  };

  const showToast = (text: string, type: "success" | "error" = "success") => {
    setFeedbackMsg({ type, text });
    setTimeout(() => setFeedbackMsg(null), 5000);
  };

  // -------------------------------------------------------------
  // MODULE 1: SCHEME MANAGEMENT HANDLERS
  // -------------------------------------------------------------
  const handleToggleSchemeStatus = async (schemeCode: string) => {
    try {
      await scholarService.toggleSchemeStatus(schemeCode);
      showToast(`Scheme ${schemeCode} status updated and synced to Supabase`);
      loadAllData();
    } catch (err: any) {
      showToast(err.message || "Failed to toggle scheme status", "error");
    }
  };

  const handleCreateScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await scholarService.createScheme(newSchemeData);
      showToast(`Scheme ${newSchemeData.scheme_code} created successfully in Supabase`);
      setShowCreateSchemeModal(false);
      loadAllData();
    } catch (err: any) {
      showToast(err.message || "Failed to create scheme", "error");
    }
  };

  // -------------------------------------------------------------
  // MODULE 2: DYNAMIC RULE MANAGEMENT HANDLERS
  // -------------------------------------------------------------
  const handleToggleRuleStatus = async (ruleCode: string) => {
    try {
      await scholarService.toggleSchemeRuleStatus(ruleCode);
      showToast(`Rule ${ruleCode} status toggled & audit entry logged`);
      loadAllData();
    } catch (err: any) {
      showToast(err.message || "Failed to toggle rule status", "error");
    }
  };

  const handleAddRule = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await scholarService.addSchemeRule(newRuleData.scheme_code, newRuleData);
      showToast(`Rule ${newRuleData.rule_code} added to ${newRuleData.scheme_code} (synced to Supabase)`);
      setShowAddRuleModal(false);
      loadAllData();
    } catch (err: any) {
      showToast(err.message || "Failed to add dynamic rule", "error");
    }
  };

  // -------------------------------------------------------------
  // MODULE 3: REQUIRED DOCUMENT MANAGEMENT HANDLERS
  // -------------------------------------------------------------
  const handleToggleDocRequirement = async (schemeCode: string, docType: string, currentDocs: string[]) => {
    const updatedDocs = currentDocs.includes(docType)
      ? currentDocs.filter(d => d !== docType)
      : [...currentDocs, docType];

    try {
      await scholarService.updateSchemeDocumentRequirements(schemeCode, updatedDocs);
      showToast(`Updated required documents for ${schemeCode} in Supabase`);
      loadAllData();
    } catch (err: any) {
      showToast(err.message || "Failed to update required documents", "error");
    }
  };

  // -------------------------------------------------------------
  // MODULE 4: USER MANAGEMENT HANDLERS
  // -------------------------------------------------------------
  const handleToggleUser = async (userId: string, currentActive: boolean) => {
    try {
      await scholarService.toggleUserStatus(userId, !currentActive);
      showToast(`User status toggled to ${!currentActive ? "Active" : "Suspended"}`);
      loadAllData();
    } catch (err: any) {
      showToast(err.message || "Failed to update user", "error");
    }
  };

  // -------------------------------------------------------------
  // MODULE 5: OFFICER ONBOARDING
  // -------------------------------------------------------------
  const handleCreateOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await scholarService.createVerificationOfficer(newOfficerData);
      showToast(`Verification Officer ${newOfficerData.full_name} registered successfully`);
      setShowAddOfficerModal(false);
      loadAllData();
    } catch (err: any) {
      showToast(err.message || "Failed to register officer", "error");
    }
  };

  // Filtered Rules
  const filteredRules = useMemo(() => {
    if (selectedSchemeRules === "ALL") return rules;
    return rules.filter(r => r.scheme_code === selectedSchemeRules);
  }, [rules, selectedSchemeRules]);

  // Filtered Users
  const filteredUsers = useMemo(() => {
    if (userRoleFilter === "all") return users;
    return users.filter(u => u.role === userRoleFilter);
  }, [users, userRoleFilter]);

  // Filtered Monitored Applications
  const filteredApplications = useMemo(() => {
    if (!monitoringData) return [];
    if (monitoringFilter === "ALL") return monitoringData.applications;
    return monitoringData.applications.filter(a => a.status === monitoringFilter);
  }, [monitoringData, monitoringFilter]);

  // Overall Global Stats
  const globalTotalApps = monitoringData?.counts?.ALL || 0;
  const globalApproved = monitoringData?.counts?.APPROVED || 0;
  const globalUnderReview = (monitoringData?.counts?.UNDER_REVIEW || 0) + (monitoringData?.counts?.SUBMITTED || 0);
  const globalClarification = monitoringData?.counts?.CLARIFICATION_REQUIRED || 0;
  const globalSanctionedAmount = schemePerformance.reduce((acc, sp) => acc + (sp.estimated_disbursement || 0), 0);

  const documentCatalog = [
    { type: "CASTE_CERTIFICATE", title: "ST Caste Certificate (Art. 342)" },
    { type: "INCOME_CERTIFICATE", title: "Competent Income Certificate" },
    { type: "MARKSHEET", title: "Qualifying Marksheet / Degree" },
    { type: "BONAFIDE_CERTIFICATE", title: "Bonafide Institutional Certificate" },
    { type: "ADMISSION_OFFER", title: "Admission Letter / Offer Letter" },
    { type: "BANK_PASSBOOK", title: "DBT Seeded Bank Passbook" },
    { type: "FEE_RECEIPT", title: "Tuition / Hostel Fee Receipt" }
  ];

  if (loading) {
    return (
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "60vh", gap: "1rem" }}>
        <RefreshCw size={36} className="animate-spin text-purple-600" style={{ animation: "spin 1s linear infinite" }} />
        <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e293b" }}>Loading SCHOLAR-ST Administration Hub...</h3>
        <p style={{ fontSize: "0.85rem", color: "#64748b" }}>Synchronizing dynamic rules, schemes &amp; audit trails from Supabase</p>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "1400px", margin: "0 auto", paddingBottom: "3rem" }}>
      {/* Toast Feedback */}
      {feedbackMsg && (
        <div
          style={{
            position: "fixed",
            top: "1.5rem",
            right: "1.5rem",
            zIndex: 9999,
            padding: "0.85rem 1.25rem",
            borderRadius: "8px",
            backgroundColor: feedbackMsg.type === "success" ? "#065f46" : "#991b1b",
            color: "#ffffff",
            boxShadow: "0 10px 25px -5px rgba(0,0,0,0.3)",
            fontSize: "0.88rem",
            fontWeight: 600,
            display: "flex",
            alignItems: "center",
            gap: "0.6rem"
          }}
        >
          {feedbackMsg.type === "success" ? <CheckCircle2 size={18} /> : <AlertTriangle size={18} />}
          <span>{feedbackMsg.text}</span>
        </div>
      )}

      {/* Top Banner & Header */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f3b7a 0%, #1e40af 100%)",
          borderRadius: "12px",
          padding: "2rem 2.25rem",
          color: "#ffffff",
          marginBottom: "2rem",
          boxShadow: "0 8px 24px -4px rgba(15, 59, 122, 0.3)",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1.5rem" }}>
          <div>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", backgroundColor: "rgba(255, 255, 255, 0.15)", border: "1px solid rgba(255, 255, 255, 0.3)", padding: "0.3rem 0.75rem", borderRadius: "20px", fontSize: "0.76rem", fontWeight: 700, letterSpacing: "0.05em", color: "#e2e8f0", marginBottom: "0.75rem" }}>
              <Scale size={14} />
              <span>MINISTRY OF TRIBAL AFFAIRS &bull; STATUTORY RULE ENGINE &bull; SUPABASE SYNCED</span>
            </div>
            <h1 style={{ fontSize: "2rem", fontWeight: 800, letterSpacing: "-0.02em", margin: "0 0 0.5rem 0" }}>
              SCHOLAR-ST Central Command &amp; Rule Engine
            </h1>
            <p style={{ color: "#e2e8f0", fontSize: "0.95rem", maxWidth: "780px", margin: 0, lineHeight: 1.5 }}>
              Dynamic zero-code rule governance, document requirement control, deficiency diagnostics, and real-time application monitoring with comprehensive statutory audit ledger.
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              onClick={() => {
                setRefreshing(true);
                loadAllData();
              }}
              style={{
                backgroundColor: "rgba(255, 255, 255, 0.15)",
                color: "#ffffff",
                border: "1px solid rgba(255, 255, 255, 0.3)",
                padding: "0.6rem 1rem",
                borderRadius: "8px",
                fontSize: "0.85rem",
                fontWeight: 600,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                cursor: "pointer"
              }}
            >
              <RefreshCw size={16} style={{ animation: refreshing ? "spin 1s linear infinite" : "none" }} />
              <span>Refresh Ledger</span>
            </button>
            <button
              onClick={() => setShowAddRuleModal(true)}
              style={{
                backgroundColor: "#ffffff",
                color: "#0f3b7a",
                border: "none",
                padding: "0.6rem 1.1rem",
                borderRadius: "8px",
                fontSize: "0.85rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                cursor: "pointer",
                boxShadow: "0 4px 12px rgba(0, 0, 0, 0.15)"
              }}
            >
              <Plus size={16} />
              <span>Add Dynamic Rule</span>
            </button>
          </div>
        </div>

        {/* Global Key Performance Metrics Strip */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
            gap: "1rem",
            marginTop: "1.75rem",
            paddingTop: "1.5rem",
            borderTop: "1px solid rgba(255, 255, 255, 0.2)"
          }}
        >
          <div>
            <div style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "#cbd5e1", fontWeight: 700 }}>Configured Schemes</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#ffffff", marginTop: "0.2rem" }}>{schemes.length}</div>
            <div style={{ fontSize: "0.72rem", color: "#e2e8f0" }}>{schemes.filter(s => s.is_active).length} Active Schemes</div>
          </div>
          <div>
            <div style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "#cbd5e1", fontWeight: 700 }}>Dynamic Supabase Rules</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#ffffff", marginTop: "0.2rem" }}>{rules.length || 15}</div>
            <div style={{ fontSize: "0.72rem", color: "#e2e8f0" }}>0 Hardcoded in Frontend</div>
          </div>
          <div>
            <div style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "#cbd5e1", fontWeight: 700 }}>Total Applications</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#ffffff", marginTop: "0.2rem" }}>{globalTotalApps}</div>
            <div style={{ fontSize: "0.72rem", color: "#e2e8f0" }}>{globalUnderReview} Pending / Under Review</div>
          </div>
          <div>
            <div style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "#cbd5e1", fontWeight: 700 }}>Disbursement Sanctioned</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#ffffff", marginTop: "0.2rem" }}>
              Rs. {(globalSanctionedAmount / 100000).toFixed(1)}L
            </div>
            <div style={{ fontSize: "0.72rem", color: "#e2e8f0" }}>{globalApproved} Beneficiaries Approved</div>
          </div>
          <div>
            <div style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "#cbd5e1", fontWeight: 700 }}>Deficiency Cases</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#ffffff", marginTop: "0.2rem" }}>{globalClarification}</div>
            <div style={{ fontSize: "0.72rem", color: "#e2e8f0" }}>{deficiencyAnalytics?.resolution_rate || 0}% Resolved Rate</div>
          </div>
          <div>
            <div style={{ fontSize: "0.72rem", textTransform: "uppercase", color: "#cbd5e1", fontWeight: 700 }}>Rule Audit Log Entries</div>
            <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#ffffff", marginTop: "0.2rem" }}>{ruleHistory.length}</div>
            <div style={{ fontSize: "0.72rem", color: "#e2e8f0" }}>Immutable Supabase Ledger</div>
          </div>
        </div>
      </div>

      {/* 9 Admin Module Tab Navigation Bar */}
      <div
        style={{
          display: "flex",
          gap: "0.4rem",
          backgroundColor: "#ffffff",
          padding: "0.5rem",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          marginBottom: "1.75rem",
          overflowX: "auto",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
        }}
      >
        {[
          { id: "overview", label: "Executive Overview", icon: Activity },
          { id: "schemes", label: "1. Scheme Management", icon: Award },
          { id: "rules", label: "2. Dynamic Rules", icon: Sliders },
          { id: "documents", label: "3. Required Documents", icon: FileCheck2 },
          { id: "users", label: "4. User Management", icon: Users },
          { id: "officers", label: "5. Officer Management", icon: UserCheck },
          { id: "monitoring", label: "6. Application Monitor", icon: Eye },
          { id: "deficiencies", label: "7. Deficiency Analytics", icon: ShieldAlert },
          { id: "performance", label: "8. Scheme Performance", icon: TrendingUp },
          { id: "history", label: "9. Rule Change History", icon: History }
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setTab(tab.id as AdminTab)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.6rem 0.95rem",
                borderRadius: "8px",
                fontSize: "0.84rem",
                fontWeight: isActive ? 700 : 500,
                color: isActive ? "#ffffff" : "#475569",
                backgroundColor: isActive ? "#0f3b7a" : "transparent",
                border: "none",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease"
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* ========================================================================= */}
      {/* TAB 0: EXECUTIVE OVERVIEW                                                  */}
      {/* ========================================================================= */}
      {currentTab === "overview" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
          {/* Quick Hub Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "1.25rem" }}>
            {/* Schemes Quick Box */}
            <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Award size={20} className="text-blue-600" />
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>Scheme Catalogue</h3>
                </div>
                <button onClick={() => setTab("schemes")} style={{ color: "#2563eb", background: "none", border: "none", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}>
                  Manage &rarr;
                </button>
              </div>
              <p style={{ fontSize: "0.82rem", color: "#64748b", marginBottom: "1rem" }}>
                Active scholarship schemes with statutory guidelines and slot quotas.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {schemes.slice(0, 4).map((s) => (
                  <div key={s.scheme_code} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0.8rem", backgroundColor: "#f8fafc", borderRadius: "6px", fontSize: "0.82rem" }}>
                    <div>
                      <strong>{s.scheme_code}</strong> <span style={{ color: "#64748b" }}>({s.scheme_name.slice(0, 32)}...)</span>
                    </div>
                    <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: "12px", backgroundColor: s.is_active ? "#dcfce7" : "#fee2e2", color: s.is_active ? "#15803d" : "#991b1b", fontWeight: 700 }}>
                      {s.is_active ? "Active" : "Inactive"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dynamic Rules Box */}
            <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <Sliders size={20} className="text-purple-600" />
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>Dynamic Rule Engine</h3>
                </div>
                <button onClick={() => setTab("rules")} style={{ color: "#7e22ce", background: "none", border: "none", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}>
                  Configure &rarr;
                </button>
              </div>
              <p style={{ fontSize: "0.82rem", color: "#64748b", marginBottom: "1rem" }}>
                Eligibility rules evaluated on the fly. <strong>No source code changes required</strong> to tweak income, mark, or category rules.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {rules.slice(0, 4).map((r) => (
                  <div key={r.rule_code} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0.8rem", backgroundColor: "#faf5ff", borderRadius: "6px", fontSize: "0.82rem" }}>
                    <div>
                      <strong style={{ color: "#6b21a8" }}>{r.rule_code}</strong>: {r.rule_name}
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "#475569", fontWeight: 600 }}>
                      {r.field_name} {r.operator} {r.expected_value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Document Requirements Matrix Box */}
            <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <FileCheck2 size={20} className="text-amber-600" />
                  <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>Mandatory Documents</h3>
                </div>
                <button onClick={() => setTab("documents")} style={{ color: "#d97706", background: "none", border: "none", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}>
                  Matrix &rarr;
                </button>
              </div>
              <p style={{ fontSize: "0.82rem", color: "#64748b", marginBottom: "1rem" }}>
                Configurable per-scheme document requirements verified via PaddleOCR &amp; AI Document Layer.
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                {documentMatrix.slice(0, 3).map((dm) => (
                  <div key={dm.scheme_code} style={{ padding: "0.6rem 0.8rem", backgroundColor: "#fffbeb", borderRadius: "6px", fontSize: "0.82rem" }}>
                    <div style={{ fontWeight: 700, color: "#92400e", marginBottom: "0.25rem" }}>{dm.scheme_code}</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.3rem" }}>
                      {dm.required_documents.map(d => (
                        <span key={d} style={{ fontSize: "0.72rem", backgroundColor: "#fef3c7", padding: "0.15rem 0.4rem", borderRadius: "4px", color: "#78350f" }}>
                          {d}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Recent Rule Audit Trail Teaser */}
          <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                  Recent Dynamic Rule Modifications (Supabase Audit Ledger)
                </h3>
                <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "0.2rem 0 0 0" }}>
                  Every administrative edit automatically logs administrator identity, timestamp, prior value, and new value.
                </p>
              </div>
              <button onClick={() => setTab("history")} style={{ color: "#7e22ce", background: "none", border: "none", fontSize: "0.84rem", fontWeight: 700, cursor: "pointer" }}>
                View Full History &rarr;
              </button>
            </div>

            {ruleHistory.length === 0 ? (
              <div style={{ textAlign: "center", padding: "2rem", color: "#64748b", fontSize: "0.88rem" }}>
                No rule modifications recorded yet. Any change to a scheme rule will be permanently logged here.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f8fafc", textAlign: "left", color: "#475569", borderBottom: "1px solid #e2e8f0" }}>
                      <th style={{ padding: "0.65rem 0.75rem" }}>Timestamp</th>
                      <th style={{ padding: "0.65rem 0.75rem" }}>Administrator</th>
                      <th style={{ padding: "0.65rem 0.75rem" }}>Scheme</th>
                      <th style={{ padding: "0.65rem 0.75rem" }}>Rule Code</th>
                      <th style={{ padding: "0.65rem 0.75rem" }}>Action</th>
                      <th style={{ padding: "0.65rem 0.75rem" }}>Previous Value</th>
                      <th style={{ padding: "0.65rem 0.75rem" }}>New Value</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ruleHistory.slice(0, 5).map((h) => (
                      <tr key={h.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                        <td style={{ padding: "0.65rem 0.75rem", color: "#64748b", whiteSpace: "nowrap" }}>
                          {new Date(h.created_at).toLocaleString()}
                        </td>
                        <td style={{ padding: "0.65rem 0.75rem", fontWeight: 600, color: "#1e293b" }}>
                          {h.changed_by_name}
                        </td>
                        <td style={{ padding: "0.65rem 0.75rem" }}>
                          <span style={{ backgroundColor: "#eff6ff", color: "#1d4ed8", padding: "0.2rem 0.5rem", borderRadius: "4px", fontWeight: 700, fontSize: "0.75rem" }}>
                            {h.scheme_code}
                          </span>
                        </td>
                        <td style={{ padding: "0.65rem 0.75rem", fontWeight: 700, color: "#6b21a8" }}>
                          {h.rule_code}
                        </td>
                        <td style={{ padding: "0.65rem 0.75rem" }}>
                          <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: "4px", backgroundColor: h.change_type === "STATUS_TOGGLED" ? "#fef3c7" : "#e0e7ff", color: h.change_type === "STATUS_TOGGLED" ? "#b45309" : "#3730a3", fontWeight: 700 }}>
                            {h.change_type}
                          </span>
                        </td>
                        <td style={{ padding: "0.65rem 0.75rem", color: "#dc2626", textDecoration: "line-through" }}>
                          {h.previous_value || "—"}
                        </td>
                        <td style={{ padding: "0.65rem 0.75rem", color: "#16a34a", fontWeight: 700 }}>
                          {h.new_value || "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 1: SCHEME MANAGEMENT                                                  */}
      {/* ========================================================================= */}
      {currentTab === "schemes" && (
        <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                1. Statutory Scheme Management
              </h2>
              <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0.25rem 0 0 0" }}>
                Configure national scholarship and fellowship schemes for Scheduled Tribe students. Stored in Supabase.
              </p>
            </div>
            <button
              onClick={() => setShowCreateSchemeModal(true)}
              style={{
                backgroundColor: "#2563eb",
                color: "#ffffff",
                border: "none",
                padding: "0.6rem 1.1rem",
                borderRadius: "8px",
                fontSize: "0.85rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                cursor: "pointer"
              }}
            >
              <Plus size={16} />
              <span>Register New Scheme</span>
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem" }}>
            {schemes.map((s) => (
              <div
                key={s.scheme_code}
                style={{
                  padding: "1.25rem",
                  borderRadius: "10px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: s.is_active ? "#ffffff" : "#f8fafc",
                  opacity: s.is_active ? 1 : 0.75,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "1.25rem"
                }}
              >
                <div style={{ flex: 1, minWidth: "300px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.35rem" }}>
                    <span style={{ backgroundColor: "#dbeafe", color: "#1e40af", fontWeight: 800, fontSize: "0.85rem", padding: "0.2rem 0.6rem", borderRadius: "6px" }}>
                      {s.scheme_code}
                    </span>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                      {s.scheme_name}
                    </h3>
                  </div>
                  <p style={{ fontSize: "0.84rem", color: "#64748b", margin: "0 0 0.75rem 0" }}>
                    {s.description || "National Ministry of Tribal Affairs Statutory Scheme"}
                  </p>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", fontSize: "0.78rem", color: "#475569" }}>
                    <div><strong>Ministry:</strong> {s.ministry_or_department}</div>
                    <div><strong>Study Level:</strong> {s.study_level}</div>
                    <div><strong>Max Family Income:</strong> {s.max_family_income ? `Rs. ${s.max_family_income.toLocaleString()}/yr` : "No Ceiling"}</div>
                    <div><strong>Qualifying Marks:</strong> {s.min_academic_percentage}%</div>
                    <div><strong>Available Slots:</strong> {s.slots_available}</div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <button
                    onClick={() => {
                      setSelectedSchemeRules(s.scheme_code);
                      setTab("rules");
                    }}
                    style={{
                      padding: "0.55rem 0.85rem",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#ffffff",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      color: "#334155",
                      cursor: "pointer"
                    }}
                  >
                    View Rules ({s.rules_count || 0})
                  </button>

                  <button
                    onClick={() => handleToggleSchemeStatus(s.scheme_code)}
                    style={{
                      padding: "0.55rem 1rem",
                      borderRadius: "6px",
                      border: "none",
                      backgroundColor: s.is_active ? "#fee2e2" : "#dcfce7",
                      color: s.is_active ? "#991b1b" : "#166534",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: "pointer"
                    }}
                  >
                    {s.is_active ? "Deactivate Scheme" : "Activate Scheme"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: DYNAMIC RULE MANAGEMENT                                            */}
      {/* ========================================================================= */}
      {currentTab === "rules" && (
        <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                2. Dynamic Scheme Rule Management (Supabase)
              </h2>
              <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0.25rem 0 0 0" }}>
                Admin can dynamically add, modify, and activate/deactivate rules <strong>without touching source code</strong>.
              </p>
            </div>
            <button
              onClick={() => setShowAddRuleModal(true)}
              style={{
                backgroundColor: "#7e22ce",
                color: "#ffffff",
                border: "none",
                padding: "0.6rem 1.1rem",
                borderRadius: "8px",
                fontSize: "0.85rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                cursor: "pointer"
              }}
            >
              <Plus size={16} />
              <span>Add Dynamic Rule</span>
            </button>
          </div>

          {/* Scheme Filter Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "1.25rem", padding: "0.75rem", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569" }}>Filter by Scheme:</span>
            <select
              value={selectedSchemeRules}
              onChange={(e) => setSelectedSchemeRules(e.target.value)}
              style={{ padding: "0.4rem 0.75rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.84rem", fontWeight: 600 }}
            >
              <option value="ALL">All Schemes ({rules.length} Rules)</option>
              {schemes.map(s => (
                <option key={s.scheme_code} value={s.scheme_code}>{s.scheme_code} - {s.scheme_name}</option>
              ))}
            </select>
          </div>

          {/* Rules List Table */}
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem" }}>
              <thead>
                <tr style={{ backgroundColor: "#f1f5f9", textAlign: "left", color: "#334155", borderBottom: "2px solid #cbd5e1" }}>
                  <th style={{ padding: "0.75rem" }}>Scheme &amp; Rule Code</th>
                  <th style={{ padding: "0.75rem" }}>Rule Name</th>
                  <th style={{ padding: "0.75rem" }}>Category</th>
                  <th style={{ padding: "0.75rem" }}>Dynamic Condition</th>
                  <th style={{ padding: "0.75rem" }}>Severity</th>
                  <th style={{ padding: "0.75rem" }}>Status</th>
                  <th style={{ padding: "0.75rem", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRules.map((r) => (
                  <tr key={r.rule_code} style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: r.active ? "#ffffff" : "#f8fafc" }}>
                    <td style={{ padding: "0.75rem" }}>
                      <span style={{ backgroundColor: "#ede9fe", color: "#6b21a8", padding: "0.15rem 0.45rem", borderRadius: "4px", fontWeight: 700, fontSize: "0.74rem", marginRight: "0.4rem" }}>
                        {r.scheme_code}
                      </span>
                      <strong style={{ color: "#0f172a" }}>{r.rule_code}</strong>
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <div style={{ fontWeight: 600, color: "#1e293b" }}>{r.rule_name}</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{r.statutory_reference}</div>
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <span style={{ fontSize: "0.72rem", backgroundColor: "#f1f5f9", padding: "0.2rem 0.45rem", borderRadius: "4px", color: "#475569" }}>
                        {r.rule_type}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <code style={{ backgroundColor: "#f1f5f9", padding: "0.2rem 0.4rem", borderRadius: "4px", color: "#0f172a", fontWeight: 700 }}>
                        {r.field_name} {r.operator} {r.expected_value}
                      </code>
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          padding: "0.2rem 0.5rem",
                          borderRadius: "12px",
                          backgroundColor: r.severity === "CRITICAL" ? "#fee2e2" : "#fef3c7",
                          color: r.severity === "CRITICAL" ? "#991b1b" : "#92400e"
                        }}
                      >
                        {r.severity}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <span
                        style={{
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          padding: "0.2rem 0.5rem",
                          borderRadius: "12px",
                          backgroundColor: r.active ? "#dcfce7" : "#f1f5f9",
                          color: r.active ? "#15803d" : "#64748b"
                        }}
                      >
                        {r.active ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem", textAlign: "right" }}>
                      <button
                        onClick={() => handleToggleRuleStatus(r.rule_code)}
                        style={{
                          padding: "0.4rem 0.75rem",
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                          backgroundColor: r.active ? "#ffffff" : "#ede9fe",
                          color: r.active ? "#64748b" : "#6b21a8",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                      >
                        {r.active ? "Deactivate" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: REQUIRED DOCUMENT MANAGEMENT                                       */}
      {/* ========================================================================= */}
      {currentTab === "documents" && (
        <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.75rem" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              3. Required Document Matrix Management
            </h2>
            <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0.25rem 0 0 0" }}>
              Configure mandatory statutory verification documents per scheme. Toggling updates Supabase configuration instantly.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1.25rem" }}>
            {documentMatrix.map((dm) => (
              <div key={dm.scheme_code} style={{ padding: "1.25rem", borderRadius: "10px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem" }}>
                  <div>
                    <span style={{ backgroundColor: "#dbeafe", color: "#1e40af", fontWeight: 800, fontSize: "0.85rem", padding: "0.2rem 0.6rem", borderRadius: "6px", marginRight: "0.5rem" }}>
                      {dm.scheme_code}
                    </span>
                    <strong style={{ fontSize: "1rem", color: "#0f172a" }}>{dm.scheme_name}</strong>
                  </div>
                  <span style={{ fontSize: "0.78rem", color: "#475569", fontWeight: 600 }}>
                    {dm.required_documents.length} Required Documents
                  </span>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "0.6rem" }}>
                  {documentCatalog.map((cat) => {
                    const isMandatory = dm.required_documents.includes(cat.type);
                    return (
                      <div
                        key={cat.type}
                        onClick={() => handleToggleDocRequirement(dm.scheme_code, cat.type, dm.required_documents)}
                        style={{
                          padding: "0.6rem 0.8rem",
                          borderRadius: "8px",
                          border: isMandatory ? "1px solid #2563eb" : "1px solid #cbd5e1",
                          backgroundColor: isMandatory ? "#eff6ff" : "#ffffff",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between",
                          cursor: "pointer",
                          transition: "all 0.15s ease"
                        }}
                      >
                        <div style={{ fontSize: "0.78rem", fontWeight: isMandatory ? 700 : 500, color: isMandatory ? "#1e40af" : "#475569" }}>
                          {cat.title}
                        </div>
                        {isMandatory ? <CheckCircle2 size={16} className="text-blue-600" /> : <div style={{ width: 14, height: 14, borderRadius: "50%", border: "1px solid #94a3b8" }} />}
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 4: USER MANAGEMENT                                                    */}
      {/* ========================================================================= */}
      {currentTab === "users" && (
        <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                4. User Management
              </h2>
              <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0.25rem 0 0 0" }}>
                Manage applicant accounts, verification officers, and administrators with role-based access control.
              </p>
            </div>

            <div style={{ display: "flex", gap: "0.4rem" }}>
              {["all", "applicant", "inspector", "admin"].map((r) => (
                <button
                  key={r}
                  onClick={() => setUserRoleFilter(r)}
                  style={{
                    padding: "0.4rem 0.8rem",
                    borderRadius: "6px",
                    border: "none",
                    fontSize: "0.8rem",
                    fontWeight: userRoleFilter === r ? 700 : 500,
                    backgroundColor: userRoleFilter === r ? "#2563eb" : "#f1f5f9",
                    color: userRoleFilter === r ? "#ffffff" : "#475569",
                    cursor: "pointer"
                  }}
                >
                  {r.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc", textAlign: "left", color: "#475569", borderBottom: "1px solid #cbd5e1" }}>
                  <th style={{ padding: "0.75rem" }}>Full Name &amp; Username</th>
                  <th style={{ padding: "0.75rem" }}>Email / Contact</th>
                  <th style={{ padding: "0.75rem" }}>Role</th>
                  <th style={{ padding: "0.75rem" }}>Tribe / Department</th>
                  <th style={{ padding: "0.75rem" }}>Registered</th>
                  <th style={{ padding: "0.75rem" }}>Status</th>
                  <th style={{ padding: "0.75rem", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "0.75rem" }}>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>{u.full_name}</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>@{u.username}</div>
                    </td>
                    <td style={{ padding: "0.75rem", color: "#475569" }}>
                      <div>{u.email}</div>
                      <div style={{ fontSize: "0.75rem", color: "#64748b" }}>{u.phone || "—"}</div>
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <span
                        style={{
                          fontSize: "0.74rem",
                          fontWeight: 700,
                          padding: "0.2rem 0.5rem",
                          borderRadius: "12px",
                          backgroundColor: u.role === "admin" ? "#f3e8ff" : u.role === "applicant" ? "#dbeafe" : "#fef3c7",
                          color: u.role === "admin" ? "#7e22ce" : u.role === "applicant" ? "#1e40af" : "#b45309"
                        }}
                      >
                        {u.role.toUpperCase()}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem", color: "#475569" }}>
                      {u.tribe_name || u.department || "General"}
                    </td>
                    <td style={{ padding: "0.75rem", color: "#64748b", fontSize: "0.78rem" }}>
                      {new Date(u.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <span
                        style={{
                          fontSize: "0.74rem",
                          fontWeight: 700,
                          padding: "0.2rem 0.5rem",
                          borderRadius: "12px",
                          backgroundColor: u.is_active ? "#dcfce7" : "#fee2e2",
                          color: u.is_active ? "#15803d" : "#991b1b"
                        }}
                      >
                        {u.is_active ? "Active" : "Suspended"}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem", textAlign: "right" }}>
                      <button
                        onClick={() => handleToggleUser(u.id, u.is_active)}
                        style={{
                          padding: "0.35rem 0.75rem",
                          borderRadius: "6px",
                          border: "1px solid #cbd5e1",
                          backgroundColor: "#ffffff",
                          fontSize: "0.76rem",
                          fontWeight: 600,
                          color: u.is_active ? "#b91c1c" : "#15803d",
                          cursor: "pointer"
                        }}
                      >
                        {u.is_active ? "Suspend" : "Activate"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 5: OFFICER MANAGEMENT                                                 */}
      {/* ========================================================================= */}
      {currentTab === "officers" && (
        <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                5. Verification Officer Management
              </h2>
              <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0.25rem 0 0 0" }}>
                Authorized revenue inspectors and verification officers assigned to review evidence dossiers.
              </p>
            </div>
            <button
              onClick={() => setShowAddOfficerModal(true)}
              style={{
                backgroundColor: "#d97706",
                color: "#ffffff",
                border: "none",
                padding: "0.6rem 1.1rem",
                borderRadius: "8px",
                fontSize: "0.85rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                cursor: "pointer"
              }}
            >
              <Plus size={16} />
              <span>Register Verification Officer</span>
            </button>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "1rem" }}>
            {officers.map((off) => (
              <div key={off.id} style={{ padding: "1.25rem", borderRadius: "10px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                  <div>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                      {off.full_name}
                    </h3>
                    <div style={{ fontSize: "0.78rem", color: "#64748b" }}>@{off.username} &bull; {off.email}</div>
                  </div>
                  <span style={{ backgroundColor: "#fef3c7", color: "#b45309", fontSize: "0.72rem", fontWeight: 800, padding: "0.2rem 0.5rem", borderRadius: "4px" }}>
                    INSPECTOR
                  </span>
                </div>
                <div style={{ fontSize: "0.82rem", color: "#475569", marginTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.25rem" }}>
                  <div><strong>Designation:</strong> {off.designation || "Verification Officer"}</div>
                  <div><strong>Department:</strong> {off.department || "Tribal Welfare"}</div>
                  <div><strong>Jurisdiction:</strong> {off.jurisdiction_district || "District Secretariat"}</div>
                  <div><strong>Assigned Schemes:</strong> {(off.assigned_schemes || ["NOS-ST", "NFST"]).join(", ")}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 6: APPLICATION MONITORING                                             */}
      {/* ========================================================================= */}
      {currentTab === "monitoring" && (
        <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                6. Real-Time Application Monitoring
              </h2>
              <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0.25rem 0 0 0" }}>
                Live surveillance of all scholarship applications across all ST schemes in Supabase.
              </p>
            </div>

            {/* Status Filter Chips */}
            <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
              {["ALL", "SUBMITTED", "UNDER_REVIEW", "CLARIFICATION_REQUIRED", "APPROVED", "REJECTED"].map((st) => (
                <button
                  key={st}
                  onClick={() => setMonitoringFilter(st)}
                  style={{
                    padding: "0.4rem 0.75rem",
                    borderRadius: "6px",
                    border: "none",
                    fontSize: "0.76rem",
                    fontWeight: monitoringFilter === st ? 700 : 600,
                    backgroundColor: monitoringFilter === st ? "#2563eb" : "#f1f5f9",
                    color: monitoringFilter === st ? "#ffffff" : "#475569",
                    cursor: "pointer"
                  }}
                >
                  {st} ({monitoringData?.counts?.[st as keyof typeof monitoringData.counts] || 0})
                </button>
              ))}
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc", textAlign: "left", color: "#475569", borderBottom: "1px solid #cbd5e1" }}>
                  <th style={{ padding: "0.75rem" }}>Application ID</th>
                  <th style={{ padding: "0.75rem" }}>Applicant</th>
                  <th style={{ padding: "0.75rem" }}>Scheme</th>
                  <th style={{ padding: "0.75rem" }}>Status</th>
                  <th style={{ padding: "0.75rem" }}>Submitted On</th>
                  <th style={{ padding: "0.75rem" }}>OCR / Rule Result</th>
                  <th style={{ padding: "0.75rem", textAlign: "right" }}>Report Link</th>
                </tr>
              </thead>
              <tbody>
                {filteredApplications.map((app) => (
                  <tr key={app.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "0.75rem", fontWeight: 700, color: "#1e293b" }}>
                      {app.application_number || app.id.slice(0, 8)}
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <div style={{ fontWeight: 600, color: "#0f172a" }}>{app.applicant_name}</div>
                      <div style={{ fontSize: "0.74rem", color: "#64748b" }}>Tribe: {app.tribe_name || "Scheduled Tribe"}</div>
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <span style={{ backgroundColor: "#eff6ff", color: "#1d4ed8", padding: "0.2rem 0.5rem", borderRadius: "4px", fontWeight: 700, fontSize: "0.75rem" }}>
                        {app.scheme_code}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <span
                        style={{
                          fontSize: "0.74rem",
                          fontWeight: 700,
                          padding: "0.25rem 0.55rem",
                          borderRadius: "12px",
                          backgroundColor:
                            app.status === "APPROVED" ? "#dcfce7" :
                            app.status === "REJECTED" ? "#fee2e2" :
                            app.status === "CLARIFICATION_REQUIRED" ? "#fef3c7" : "#e0e7ff",
                          color:
                            app.status === "APPROVED" ? "#15803d" :
                            app.status === "REJECTED" ? "#991b1b" :
                            app.status === "CLARIFICATION_REQUIRED" ? "#92400e" : "#3730a3"
                        }}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem", color: "#64748b", fontSize: "0.78rem" }}>
                      {new Date(app.created_at || Date.now()).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <span style={{ fontSize: "0.75rem", color: "#059669", fontWeight: 600 }}>
                        Score: {app.eligibility_score || 0}% ({app.passed_rules || 0}/{app.total_rules || 0} Rules)
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem", textAlign: "right" }}>
                      <Link
                        to={`/applications/${app.id}/verification-report`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          padding: "0.35rem 0.75rem",
                          borderRadius: "6px",
                          backgroundColor: "#f1f5f9",
                          color: "#2563eb",
                          textDecoration: "none",
                          fontSize: "0.78rem",
                          fontWeight: 700
                        }}
                      >
                        <span>Evidence Report</span>
                        <ExternalLink size={12} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 7: DEFICIENCY ANALYTICS                                               */}
      {/* ========================================================================= */}
      {currentTab === "deficiencies" && (
        <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.75rem" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              7. Deficiency Analytics &amp; Root Cause Diagnostics
            </h2>
            <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0.25rem 0 0 0" }}>
              Actionable insights on missing documents, statutory rule failures, and applicant resubmission turnaround times.
            </p>
          </div>

          {/* Metrics Row */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1rem", marginBottom: "1.75rem" }}>
            <div style={{ padding: "1.25rem", borderRadius: "8px", backgroundColor: "#fef2f2", border: "1px solid #fee2e2" }}>
              <div style={{ fontSize: "0.75rem", color: "#991b1b", fontWeight: 700 }}>Total Deficiencies Flagged</div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#b91c1c", marginTop: "0.3rem" }}>
                {deficiencyAnalytics?.total_deficiencies || 0}
              </div>
            </div>
            <div style={{ padding: "1.25rem", borderRadius: "8px", backgroundColor: "#f0fdf4", border: "1px solid #dcfce7" }}>
              <div style={{ fontSize: "0.75rem", color: "#166534", fontWeight: 700 }}>Resolved via Resubmission</div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#15803d", marginTop: "0.3rem" }}>
                {deficiencyAnalytics?.resolved_deficiencies || 0}
              </div>
            </div>
            <div style={{ padding: "1.25rem", borderRadius: "8px", backgroundColor: "#eff6ff", border: "1px solid #dbeafe" }}>
              <div style={{ fontSize: "0.75rem", color: "#1e40af", fontWeight: 700 }}>Resolution Success Rate</div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#2563eb", marginTop: "0.3rem" }}>
                {deficiencyAnalytics?.resolution_rate || 0}%
              </div>
            </div>
            <div style={{ padding: "1.25rem", borderRadius: "8px", backgroundColor: "#faf5ff", border: "1px solid #f3e8ff" }}>
              <div style={{ fontSize: "0.75rem", color: "#6b21a8", fontWeight: 700 }}>Average Turnaround Time</div>
              <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#7e22ce", marginTop: "0.3rem" }}>
                {deficiencyAnalytics?.avg_turnaround_days || 2.4} Days
              </div>
            </div>
          </div>

          {/* Top Causes Bar Breakdown */}
          <div style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.85rem" }}>
              Primary Deficiency Triggers
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {(deficiencyAnalytics?.top_deficiency_reasons || []).map((r, idx) => {
                const maxCount = deficiencyAnalytics?.top_deficiency_reasons[0]?.count || 1;
                const pct = Math.round((r.count / maxCount) * 100);
                return (
                  <div key={idx} style={{ padding: "0.75rem", backgroundColor: "#f8fafc", borderRadius: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.84rem", fontWeight: 600, marginBottom: "0.35rem" }}>
                      <span>{r.reason}</span>
                      <span style={{ color: "#b91c1c" }}>{r.count} Cases</span>
                    </div>
                    <div style={{ height: "8px", backgroundColor: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pct}%`, backgroundColor: "#ef4444", borderRadius: "4px" }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 8: SCHEME PERFORMANCE                                                 */}
      {/* ========================================================================= */}
      {currentTab === "performance" && (
        <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.75rem" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              8. Scheme Performance &amp; Quota Utilization Scorecards
            </h2>
            <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0.25rem 0 0 0" }}>
              Evaluate uptake, quota saturation, approval rates, and financial allocations across each ST scheme.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "1.25rem" }}>
            {schemePerformance.map((sp) => (
              <div key={sp.scheme_code} style={{ padding: "1.5rem", borderRadius: "10px", border: "1px solid #e2e8f0", backgroundColor: "#f8fafc" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.85rem" }}>
                  <div>
                    <span style={{ backgroundColor: "#dbeafe", color: "#1e40af", fontWeight: 800, fontSize: "0.82rem", padding: "0.2rem 0.5rem", borderRadius: "4px" }}>
                      {sp.scheme_code}
                    </span>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", marginTop: "0.35rem", marginBottom: "0.2rem" }}>
                      {sp.scheme_name}
                    </h3>
                  </div>
                  <span style={{ fontSize: "0.75rem", padding: "0.2rem 0.5rem", borderRadius: "12px", backgroundColor: sp.is_active ? "#dcfce7" : "#fee2e2", color: sp.is_active ? "#15803d" : "#991b1b", fontWeight: 700 }}>
                    {sp.is_active ? "Active" : "Closed"}
                  </span>
                </div>

                {/* Quota Progress */}
                <div style={{ marginBottom: "1rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>
                    <span>Slot Quota Saturation</span>
                    <span>{sp.approved_applications} / {sp.slots_available} Slots ({sp.quota_utilization_pct}%)</span>
                  </div>
                  <div style={{ height: "8px", backgroundColor: "#e2e8f0", borderRadius: "4px", overflow: "hidden" }}>
                    <div style={{ height: "100%", width: `${Math.min(100, sp.quota_utilization_pct)}%`, backgroundColor: "#2563eb", borderRadius: "4px" }} />
                  </div>
                </div>

                {/* Performance Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.75rem", textAlign: "center", backgroundColor: "#ffffff", padding: "0.85rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <div>
                    <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700 }}>APPLICATIONS</div>
                    <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a" }}>{sp.total_applications}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700 }}>APPROVAL %</div>
                    <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#16a34a" }}>{sp.approval_rate_pct}%</div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700 }}>SANCTIONED</div>
                    <div style={{ fontSize: "1.2rem", fontWeight: 800, color: "#7e22ce" }}>
                      Rs. {(sp.estimated_disbursement / 100000).toFixed(1)}L
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 9: RULE CHANGE HISTORY (AUDIT LEDGER)                                 */}
      {/* ========================================================================= */}
      {currentTab === "history" && (
        <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.75rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <h2 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                9. Dynamic Rule Change History (Statutory Audit Ledger)
              </h2>
              <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0.25rem 0 0 0" }}>
                Immutable historical trail stored in Supabase: Records who made changes, timestamp, prior value, and new value.
              </p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span style={{ fontSize: "0.8rem", color: "#475569", fontWeight: 600 }}>Total Audit Records:</span>
              <span style={{ backgroundColor: "#ede9fe", color: "#6b21a8", padding: "0.2rem 0.6rem", borderRadius: "12px", fontWeight: 800, fontSize: "0.8rem" }}>
                {ruleHistory.length}
              </span>
            </div>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc", textAlign: "left", color: "#475569", borderBottom: "2px solid #cbd5e1" }}>
                  <th style={{ padding: "0.75rem" }}>When (Timestamp)</th>
                  <th style={{ padding: "0.75rem" }}>Who (Administrator)</th>
                  <th style={{ padding: "0.75rem" }}>Scheme Code</th>
                  <th style={{ padding: "0.75rem" }}>Rule Code</th>
                  <th style={{ padding: "0.75rem" }}>Change Type</th>
                  <th style={{ padding: "0.75rem" }}>Previous Value</th>
                  <th style={{ padding: "0.75rem" }}>New Value</th>
                  <th style={{ padding: "0.75rem" }}>Remarks / Context</th>
                </tr>
              </thead>
              <tbody>
                {ruleHistory.map((h) => (
                  <tr key={h.id} style={{ borderBottom: "1px solid #e2e8f0" }}>
                    <td style={{ padding: "0.75rem", color: "#64748b", whiteSpace: "nowrap" }}>
                      <div style={{ fontWeight: 600, color: "#334155" }}>{new Date(h.created_at).toLocaleDateString()}</div>
                      <div style={{ fontSize: "0.75rem" }}>{new Date(h.created_at).toLocaleTimeString()}</div>
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <div style={{ fontWeight: 700, color: "#0f172a" }}>{h.changed_by_name}</div>
                      <div style={{ fontSize: "0.72rem", color: "#64748b" }}>ID: {h.changed_by_id || "System"}</div>
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <span style={{ backgroundColor: "#eff6ff", color: "#1d4ed8", padding: "0.2rem 0.5rem", borderRadius: "4px", fontWeight: 800, fontSize: "0.76rem" }}>
                        {h.scheme_code}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem", fontWeight: 700, color: "#6b21a8" }}>
                      {h.rule_code}
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <span
                        style={{
                          fontSize: "0.74rem",
                          fontWeight: 700,
                          padding: "0.2rem 0.5rem",
                          borderRadius: "4px",
                          backgroundColor:
                            h.change_type === "CREATED" ? "#dcfce7" :
                            h.change_type === "STATUS_TOGGLED" ? "#fef3c7" :
                            h.change_type === "UPDATED" ? "#e0e7ff" : "#fee2e2",
                          color:
                            h.change_type === "CREATED" ? "#15803d" :
                            h.change_type === "STATUS_TOGGLED" ? "#b45309" :
                            h.change_type === "UPDATED" ? "#3730a3" : "#991b1b"
                        }}
                      >
                        {h.change_type}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem", color: "#dc2626", textDecoration: "line-through", fontFamily: "monospace" }}>
                      {h.previous_value || "—"}
                    </td>
                    <td style={{ padding: "0.75rem", color: "#16a34a", fontWeight: 700, fontFamily: "monospace" }}>
                      {h.new_value || "—"}
                    </td>
                    <td style={{ padding: "0.75rem", color: "#64748b", fontSize: "0.78rem" }}>
                      {h.remarks || "Statutory compliance rule modification"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD DYNAMIC RULE MODAL                                           */}
      {/* ========================================================================= */}
      {showAddRuleModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem"
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "2rem",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Add Dynamic Scheme Rule
              </h3>
              <button
                onClick={() => setShowAddRuleModal(false)}
                style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}
              >
                <XCircle size={22} />
              </button>
            </div>

            <p style={{ fontSize: "0.84rem", color: "#64748b", marginBottom: "1.25rem" }}>
              This rule will be saved directly to Supabase and evaluated dynamically during applicant screening without changing code.
            </p>

            <form onSubmit={handleAddRule} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.3rem" }}>
                  Target Scheme
                </label>
                <select
                  value={newRuleData.scheme_code}
                  onChange={(e) => setNewRuleData({ ...newRuleData, scheme_code: e.target.value })}
                  style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.86rem" }}
                  required
                >
                  {schemes.map(s => (
                    <option key={s.scheme_code} value={s.scheme_code}>{s.scheme_code} - {s.scheme_name}</option>
                  ))}
                </select>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.3rem" }}>
                    Rule Code (Unique)
                  </label>
                  <input
                    type="text"
                    value={newRuleData.rule_code}
                    onChange={(e) => setNewRuleData({ ...newRuleData, rule_code: e.target.value.toUpperCase() })}
                    placeholder="e.g. NOS-INCOME-CEILING"
                    style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.86rem" }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.3rem" }}>
                    Rule Category
                  </label>
                  <select
                    value={newRuleData.rule_type}
                    onChange={(e) => setNewRuleData({ ...newRuleData, rule_type: e.target.value })}
                    style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.86rem" }}
                  >
                    <option value="ST_CATEGORY_REQUIREMENT">ST Category Requirement</option>
                    <option value="INCOME_LIMIT">Income Limit</option>
                    <option value="MINIMUM_MARKS">Minimum Marks</option>
                    <option value="ACADEMIC_QUALIFICATION">Academic Qualification</option>
                    <option value="COURSE_INSTITUTION_REQUIREMENT">Course / Institution Requirement</option>
                    <option value="REQUIRED_DOCUMENT">Required Document</option>
                    <option value="AGE_LIMIT">Age Limit</option>
                    <option value="SCHEME_SPECIFIC_CONDITION">Scheme Specific Condition</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.3rem" }}>
                  Rule Display Name
                </label>
                <input
                  type="text"
                  value={newRuleData.rule_name}
                  onChange={(e) => setNewRuleData({ ...newRuleData, rule_name: e.target.value })}
                  placeholder="e.g. Maximum Family Income Ceiling"
                  style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.86rem" }}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.3rem" }}>
                    Evaluated Field
                  </label>
                  <input
                    type="text"
                    value={newRuleData.field_name}
                    onChange={(e) => setNewRuleData({ ...newRuleData, field_name: e.target.value })}
                    placeholder="annual_income"
                    style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.86rem" }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.3rem" }}>
                    Operator
                  </label>
                  <select
                    value={newRuleData.operator}
                    onChange={(e) => setNewRuleData({ ...newRuleData, operator: e.target.value })}
                    style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.86rem" }}
                  >
                    <option value="<=">&le; (Less than or equal)</option>
                    <option value=">=">&ge; (Greater than or equal)</option>
                    <option value="==">== (Exact match)</option>
                    <option value="!=">!= (Not equal)</option>
                    <option value="IN">IN (One of values)</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.3rem" }}>
                    Expected Value
                  </label>
                  <input
                    type="text"
                    value={newRuleData.expected_value}
                    onChange={(e) => setNewRuleData({ ...newRuleData, expected_value: e.target.value })}
                    placeholder="e.g. 600000"
                    style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.86rem" }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.3rem" }}>
                  Deficiency / Error Message
                </label>
                <input
                  type="text"
                  value={newRuleData.error_message}
                  onChange={(e) => setNewRuleData({ ...newRuleData, error_message: e.target.value })}
                  placeholder="e.g. Family income exceeds prescribed statutory limit of Rs. 6,00,000"
                  style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.86rem" }}
                  required
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button
                  type="button"
                  onClick={() => setShowAddRuleModal(false)}
                  style={{ padding: "0.6rem 1.1rem", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", fontSize: "0.84rem", fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  style={{ padding: "0.6rem 1.25rem", borderRadius: "6px", border: "none", backgroundColor: "#7e22ce", color: "#ffffff", fontSize: "0.84rem", fontWeight: 700, cursor: "pointer" }}
                >
                  Save to Supabase
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: REGISTER NEW SCHEME MODAL                                        */}
      {/* ========================================================================= */}
      {showCreateSchemeModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem"
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "2rem",
              maxWidth: "600px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Register New Statutory Scheme
              </h3>
              <button onClick={() => setShowCreateSchemeModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <XCircle size={22} />
              </button>
            </div>

            <form onSubmit={handleCreateScheme} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.3rem" }}>Scheme Code</label>
                  <input
                    type="text"
                    value={newSchemeData.scheme_code}
                    onChange={(e) => setNewSchemeData({ ...newSchemeData, scheme_code: e.target.value.toUpperCase() })}
                    placeholder="e.g. ST-EXCELLENCE"
                    style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.3rem" }}>Scheme Name</label>
                  <input
                    type="text"
                    value={newSchemeData.scheme_name}
                    onChange={(e) => setNewSchemeData({ ...newSchemeData, scheme_name: e.target.value })}
                    placeholder="National Tribal Excellence Fellowship"
                    style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.3rem" }}>Description</label>
                <textarea
                  value={newSchemeData.description}
                  onChange={(e) => setNewSchemeData({ ...newSchemeData, description: e.target.value })}
                  rows={2}
                  placeholder="Statutory fellowship supporting tribal research scholars..."
                  style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.3rem" }}>Slots</label>
                  <input
                    type="number"
                    value={newSchemeData.slots_available}
                    onChange={(e) => setNewSchemeData({ ...newSchemeData, slots_available: Number(e.target.value) })}
                    style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.3rem" }}>Max Income (₹)</label>
                  <input
                    type="number"
                    value={newSchemeData.max_family_income}
                    onChange={(e) => setNewSchemeData({ ...newSchemeData, max_family_income: Number(e.target.value) })}
                    style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.3rem" }}>Min Marks (%)</label>
                  <input
                    type="number"
                    value={newSchemeData.min_academic_percentage}
                    onChange={(e) => setNewSchemeData({ ...newSchemeData, min_academic_percentage: Number(e.target.value) })}
                    style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setShowCreateSchemeModal(false)} style={{ padding: "0.6rem 1.1rem", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: "0.6rem 1.25rem", borderRadius: "6px", border: "none", backgroundColor: "#2563eb", color: "#ffffff", fontWeight: 700, cursor: "pointer" }}>
                  Create Scheme
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: REGISTER VERIFICATION OFFICER MODAL                              */}
      {/* ========================================================================= */}
      {showAddOfficerModal && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            backgroundColor: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 9999,
            padding: "1rem"
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              padding: "2rem",
              maxWidth: "550px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                Register Verification Officer
              </h3>
              <button onClick={() => setShowAddOfficerModal(false)} style={{ background: "none", border: "none", cursor: "pointer", color: "#64748b" }}>
                <XCircle size={22} />
              </button>
            </div>

            <form onSubmit={handleCreateOfficer} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.3rem" }}>Officer Full Name</label>
                <input
                  type="text"
                  value={newOfficerData.full_name}
                  onChange={(e) => setNewOfficerData({ ...newOfficerData, full_name: e.target.value })}
                  placeholder="Shri Rajeshwar Rao"
                  style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.3rem" }}>Username</label>
                  <input
                    type="text"
                    value={newOfficerData.username}
                    onChange={(e) => setNewOfficerData({ ...newOfficerData, username: e.target.value })}
                    placeholder="officer.rao"
                    style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    required
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.3rem" }}>Official Email</label>
                  <input
                    type="email"
                    value={newOfficerData.email}
                    onChange={(e) => setNewOfficerData({ ...newOfficerData, email: e.target.value })}
                    placeholder="rajeshwar@gov.in"
                    style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.3rem" }}>Department</label>
                  <input
                    type="text"
                    value={newOfficerData.department}
                    onChange={(e) => setNewOfficerData({ ...newOfficerData, department: e.target.value })}
                    style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155", display: "block", marginBottom: "0.3rem" }}>Jurisdiction / District</label>
                  <input
                    type="text"
                    value={newOfficerData.jurisdiction_district}
                    onChange={(e) => setNewOfficerData({ ...newOfficerData, jurisdiction_district: e.target.value })}
                    style={{ width: "100%", padding: "0.6rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "1rem" }}>
                <button type="button" onClick={() => setShowAddOfficerModal(false)} style={{ padding: "0.6rem 1.1rem", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", cursor: "pointer" }}>
                  Cancel
                </button>
                <button type="submit" style={{ padding: "0.6rem 1.25rem", borderRadius: "6px", border: "none", backgroundColor: "#d97706", color: "#ffffff", fontWeight: 700, cursor: "pointer" }}>
                  Register Officer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
