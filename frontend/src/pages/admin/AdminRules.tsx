import React, { useEffect, useState } from "react";
import {
  Sliders,
  PlusCircle,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Database,
  Cloud,
  Edit3,
  Shield,
  Search,
  RefreshCw,
  Play,
  FileText,
  DollarSign,
  GraduationCap,
  Clock,
  Sparkles,
  ExternalLink,
  ChevronRight,
  X,
  Check,
  Layers,
  ShieldAlert
} from "lucide-react";
import { scholarService } from "../../services/scholarService";
import type { ScholarScheme, SchemeRule, RuleEvaluationItem, SchemeEvaluationReport, RuleImpactAnalysisResponse } from "../../types/scholar";
import { RuleImpactModal } from "../../components/scholar/RuleImpactModal";

const RULE_TYPES = [
  { value: "ST_CATEGORY_REQUIREMENT", label: "ST Category Requirement", icon: "🏛️" },
  { value: "ACADEMIC_QUALIFICATION", label: "Academic Qualification", icon: "🎓" },
  { value: "MINIMUM_MARKS", label: "Minimum Marks (%)", icon: "📊" },
  { value: "INCOME_LIMIT", label: "Income Limit (Ceiling)", icon: "💰" },
  { value: "AGE_LIMIT", label: "Age Limit (Bracket)", icon: "⏳" },
  { value: "COURSE_INSTITUTION_REQUIREMENT", label: "Course / Institution Requirement", icon: "🏫" },
  { value: "REQUIRED_DOCUMENT", label: "Required Document Evidence", icon: "📄" },
  { value: "ACADEMIC_YEAR", label: "Academic Year / Cycle", icon: "📅" },
  { value: "SCHEME_SPECIFIC_CONDITION", label: "Other Scheme-Specific Condition", icon: "⚖️" },
];

const TARGET_FIELDS = [
  { field: "caste_category", label: "caste_category (ST / NON_ST)" },
  { field: "annual_family_income", label: "annual_family_income (INR)" },
  { field: "aggregate_percentage", label: "aggregate_percentage (%)" },
  { field: "applicant_age", label: "applicant_age (Years)" },
  { field: "qualification_level", label: "qualification_level (MASTER / DEGREE)" },
  { field: "admission_confirmed", label: "admission_confirmed (Boolean)" },
  { field: "premier_institute_enrolled", label: "premier_institute_enrolled (Boolean)" },
  { field: "phd_registration_regular", label: "phd_registration_regular (Boolean)" },
  { field: "bank_aadhaar_seeded", label: "bank_aadhaar_seeded (Boolean)" },
  { field: "has_caste_certificate", label: "has_caste_certificate (Boolean)" },
  { field: "has_income_certificate", label: "has_income_certificate (Boolean)" },
  { field: "has_academic_marksheet", label: "has_academic_marksheet (Boolean)" },
  { field: "has_admission_offer", label: "has_admission_offer (Boolean)" },
  { field: "academic_year", label: "academic_year (e.g. 2026-2027)" },
  { field: "previous_fellowship_availed", label: "previous_fellowship_availed (Boolean)" },
  { field: "employed_full_time", label: "employed_full_time (Boolean)" },
];

export function AdminRules() {
  const [schemes, setSchemes] = useState<ScholarScheme[]>([]);
  const [selectedSchemeCode, setSelectedSchemeCode] = useState<string>("NOS-ST");
  const [rules, setRules] = useState<SchemeRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<string>("ALL");
  const [togglingRuleCode, setTogglingRuleCode] = useState<string | null>(null);

  // Modal State (Add / Edit)
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState<SchemeRule | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [bannerMessage, setBannerMessage] = useState<string | null>(null);

  // Form Fields
  const [ruleCode, setRuleCode] = useState("");
  const [ruleName, setRuleName] = useState("");
  const [ruleType, setRuleType] = useState("ST_CATEGORY_REQUIREMENT");
  const [fieldName, setFieldName] = useState("caste_category");
  const [operator, setOperator] = useState("==");
  const [expectedValue, setExpectedValue] = useState("ST");
  const [severity, setSeverity] = useState("CRITICAL");
  const [requirement, setRequirement] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [statutoryRef, setStatutoryRef] = useState("MoTA Guidelines");
  const [mandatory, setMandatory] = useState(true);
  const [active, setActive] = useState(true);

  // Rule Impact Analysis State
  const [impactData, setImpactData] = useState<RuleImpactAnalysisResponse | null>(null);
  const [showImpactModal, setShowImpactModal] = useState<boolean>(false);
  const [impactLoading, setImpactLoading] = useState<boolean>(false);
  const [impactConfirming, setImpactConfirming] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<{
    type: "SAVE_EDIT" | "TOGGLE_STATUS";
    ruleCode?: string;
    payload?: Partial<SchemeRule>;
  } | null>(null);

  // Simulation State
  const [showSimModal, setShowSimModal] = useState(false);
  const [simLoading, setSimLoading] = useState(false);
  const [simReport, setSimReport] = useState<SchemeEvaluationReport | null>(null);

  // Sample simulation applicant state
  const [simProfile, setSimProfile] = useState({
    applicant_name: "Karan Birhor",
    caste_category: "ST",
    tribe_name: "Birhor",
    annual_family_income: 680000,
    aggregate_percentage: 64.5,
    applicant_age: 26,
    qualification_level: "MASTER",
    admission_confirmed: true,
    premier_institute_enrolled: true,
    phd_registration_regular: true,
    bank_aadhaar_seeded: true,
    academic_year: "2026-2027",
    has_caste_certificate: true,
    has_income_certificate: true,
    has_academic_marksheet: true,
    has_admission_offer: true,
    previous_fellowship_availed: false,
    employed_full_time: false
  });

  const loadSchemes = async () => {
    try {
      const data = await scholarService.getSchemes(false);
      setSchemes(data);
      if (data.length > 0 && !selectedSchemeCode) {
        setSelectedSchemeCode(data[0].scheme_code);
      }
    } catch (err) {
      console.error("Error loading schemes:", err);
    }
  };

  const loadRules = async (schemeCode: string) => {
    setLoading(true);
    try {
      // Fetch dynamic rules from Supabase for this scheme
      const r = await scholarService.getSchemeRules(schemeCode);
      setRules(r);
    } catch (err) {
      console.error("Error loading rules:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchemes();
  }, []);

  useEffect(() => {
    if (selectedSchemeCode) {
      loadRules(selectedSchemeCode);
    }
  }, [selectedSchemeCode]);

  const openAddModal = () => {
    setEditingRule(null);
    setRuleCode(`${selectedSchemeCode}-RULE-${rules.length + 1}`);
    setRuleName("");
    setRuleType("ST_CATEGORY_REQUIREMENT");
    setFieldName("caste_category");
    setOperator("==");
    setExpectedValue("ST");
    setSeverity("CRITICAL");
    setRequirement("Candidate must belong to a notified Scheduled Tribe recognized under Article 342.");
    setErrorMessage("Deficiency: Candidate does not hold recognized Scheduled Tribe status under Article 342.");
    setStatutoryRef("Ministry of Tribal Affairs Guidelines (tribal.nic.in)");
    setMandatory(true);
    setActive(true);
    setModalError(null);
    setShowModal(true);
  };

  const openEditModal = (rule: SchemeRule) => {
    setEditingRule(rule);
    setRuleCode(rule.rule_code);
    setRuleName(rule.rule_name);
    setRuleType(rule.rule_type || "SCHEME_SPECIFIC_CONDITION");
    setFieldName(rule.field_name);
    setOperator(rule.operator);
    setExpectedValue(rule.expected_value);
    setSeverity(rule.severity || "CRITICAL");
    setRequirement(rule.requirement || "");
    setErrorMessage(rule.error_message || rule.requirement || "");
    setStatutoryRef(rule.statutory_reference || "Ministry of Tribal Affairs Guidelines");
    setMandatory(rule.mandatory !== false);
    setActive(rule.active !== false);
    setModalError(null);
    setShowModal(true);
  };

  const handlePreviewCurrentFormImpact = async () => {
    if (!ruleCode.trim() || !fieldName.trim()) {
      setModalError("Rule Code and Target Field are required to preview impact.");
      return;
    }
    setSaving(true);
    setModalError(null);
    const payload: Partial<SchemeRule> = {
      scheme_code: selectedSchemeCode,
      rule_code: ruleCode.trim().toUpperCase(),
      rule_name: ruleName.trim(),
      category: selectedSchemeCode,
      rule_type: ruleType,
      field_name: fieldName.trim(),
      operator: operator.trim(),
      expected_value: expectedValue.trim(),
      severity: severity,
      requirement: requirement.trim() || ruleName.trim(),
      error_message: errorMessage.trim() || requirement.trim(),
      statutory_reference: statutoryRef.trim(),
      mandatory: mandatory,
      active: active
    };
    try {
      const impact = await scholarService.analyzeRuleImpact(
        ruleCode.trim().toUpperCase(),
        payload,
        selectedSchemeCode
      );
      setImpactData(impact);
      setPendingAction(
        editingRule
          ? { type: "SAVE_EDIT", ruleCode: editingRule.rule_code, payload }
          : null
      );
      setShowImpactModal(true);
    } catch (err: any) {
      setModalError(`Rule impact analysis notice: ${err?.message || "Failed to preview impact"}`);
    } finally {
      setSaving(false);
    }
  };

  const handleSaveRule = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ruleCode.trim() || !ruleName.trim() || !fieldName.trim()) {
      setModalError("Rule Code, Title, and Target Field are required.");
      return;
    }

    setSaving(true);
    setModalError(null);

    const payload: Partial<SchemeRule> = {
      scheme_code: selectedSchemeCode,
      rule_code: ruleCode.trim().toUpperCase(),
      rule_name: ruleName.trim(),
      category: selectedSchemeCode,
      rule_type: ruleType,
      field_name: fieldName.trim(),
      operator: operator.trim(),
      expected_value: expectedValue.trim(),
      severity: severity,
      requirement: requirement.trim() || ruleName.trim(),
      error_message: errorMessage.trim() || requirement.trim(),
      statutory_reference: statutoryRef.trim(),
      mandatory: mandatory,
      active: active
    };

    try {
      if (editingRule) {
        // Intercept with Rule Impact Analysis preview before activating changed rule
        const impact = await scholarService.analyzeRuleImpact(
          editingRule.rule_code,
          payload,
          selectedSchemeCode
        );
        setImpactData(impact);
        setPendingAction({
          type: "SAVE_EDIT",
          ruleCode: editingRule.rule_code,
          payload
        });
        setShowImpactModal(true);
      } else {
        const created = await scholarService.addSchemeRule(selectedSchemeCode, payload);
        setRules((prev) => [created, ...prev]);
        setBannerMessage(`Rule ${ruleCode} created and synchronized into Supabase compliance_rules!`);
        setShowModal(false);
        setTimeout(() => setBannerMessage(null), 4000);
      }
    } catch (err: any) {
      setModalError(err?.message || "Failed to process rule update in Supabase.");
    } finally {
      setSaving(false);
    }
  };

  const handleToggleStatus = async (rule: SchemeRule) => {
    setTogglingRuleCode(rule.rule_code);
    try {
      const targetActive = !rule.active;
      // Pre-evaluate rule impact before activating/deactivating
      const impact = await scholarService.analyzeRuleImpact(
        rule.rule_code,
        { active: targetActive },
        rule.scheme_code || selectedSchemeCode
      );
      setImpactData(impact);
      setPendingAction({
        type: "TOGGLE_STATUS",
        ruleCode: rule.rule_code,
        payload: { active: targetActive }
      });
      setShowImpactModal(true);
    } catch (err: any) {
      // Direct toggle fallback if impact preview has connection issue
      try {
        const updated = await scholarService.toggleSchemeRuleStatus(rule.rule_code);
        setRules((prev) =>
          prev.map((r) => (r.rule_code === rule.rule_code ? { ...r, active: updated.active } : r))
        );
        setBannerMessage(`Rule ${rule.rule_code} is now ${updated.active ? "ACTIVE" : "INACTIVE"}.`);
        setTimeout(() => setBannerMessage(null), 3000);
      } catch (directErr: any) {
        alert(directErr?.message || "Failed to toggle rule status.");
      }
    } finally {
      setTogglingRuleCode(null);
    }
  };

  const handleDirectPreviewImpact = async (rule: SchemeRule) => {
    setImpactLoading(true);
    try {
      const impact = await scholarService.analyzeRuleImpact(
        rule.rule_code,
        {
          operator: rule.operator,
          expected_value: rule.expected_value,
          active: rule.active !== false
        },
        rule.scheme_code || selectedSchemeCode
      );
      setImpactData(impact);
      setPendingAction(null); // Direct inspection mode
      setShowImpactModal(true);
    } catch (err: any) {
      alert(`Could not load impact analysis: ${err?.message || "Internal error"}`);
    } finally {
      setImpactLoading(false);
    }
  };

  const handleConfirmImpactAction = async () => {
    if (!pendingAction) {
      setShowImpactModal(false);
      return;
    }
    setImpactConfirming(true);
    try {
      if (pendingAction.type === "SAVE_EDIT" && pendingAction.ruleCode && pendingAction.payload) {
        const updated = await scholarService.updateSchemeRule(
          pendingAction.ruleCode,
          pendingAction.payload
        );
        setRules((prev) =>
          prev.map((r) => (r.rule_code === pendingAction.ruleCode ? { ...r, ...updated } : r))
        );
        setBannerMessage(
          `Rule ${pendingAction.ruleCode} updated successfully with audit trail and impact preview logged!`
        );
        setShowModal(false);
      } else if (pendingAction.type === "TOGGLE_STATUS" && pendingAction.ruleCode) {
        const updated = await scholarService.toggleSchemeRuleStatus(pendingAction.ruleCode);
        setRules((prev) =>
          prev.map((r) => (r.rule_code === pendingAction.ruleCode ? { ...r, active: updated.active } : r))
        );
        setBannerMessage(
          `Rule ${pendingAction.ruleCode} is now ${updated.active ? "ACTIVE" : "INACTIVE"} (logged to history)!`
        );
      }
      setShowImpactModal(false);
      setPendingAction(null);
      setTimeout(() => setBannerMessage(null), 4000);
    } catch (err: any) {
      alert(`Failed to commit rule modification: ${err?.message || "Unknown error"}`);
    } finally {
      setImpactConfirming(false);
    }
  };

  const handleDeleteRule = async (ruleCode: string) => {
    if (!window.confirm(`Delete rule '${ruleCode}' from Supabase and validation engine?`)) return;
    try {
      await scholarService.deleteSchemeRule(ruleCode);
      setRules((prev) => prev.filter((r) => r.rule_code !== ruleCode));
      setBannerMessage(`Rule ${ruleCode} removed from Supabase and engine.`);
      setTimeout(() => setBannerMessage(null), 3000);
    } catch (err: any) {
      alert(err?.message || "Failed to delete rule.");
    }
  };

  const handleRunSimulation = async () => {
    setSimLoading(true);
    setSimReport(null);
    try {
      const result = await scholarService.evaluateScheme(selectedSchemeCode, simProfile, {
        caste_certificate: {
          certificate_number: "JH/ST/2024/99182",
          tribe_community_name: simProfile.tribe_name,
          is_scheduled_tribe: simProfile.caste_category === "ST",
          issuing_authority: "Tehsildar & Sub-Divisional Magistrate, Ranchi",
          verification_status: "VERIFIED_ST"
        },
        income_certificate: {
          certificate_number: "INC/2026/41029",
          annual_income_inr: simProfile.annual_family_income,
          issuing_authority: "Revenue Officer, Ranchi"
        },
        marksheet: {
          examination_degree: "M.Sc. Computer Science",
          aggregate_percentage: simProfile.aggregate_percentage,
          board_or_university: "Central University of Jharkhand"
        },
        admission_offer: {
          institution_name: "Indian Institute of Science / Oxford University",
          course_enrolled: "Ph.D. Advanced Computing",
          offer_status: simProfile.admission_confirmed ? "UNCONDITIONAL" : "CONDITIONAL"
        }
      });
      setSimReport(result);
    } catch (err: any) {
      alert(err?.message || "Simulation failed.");
    } finally {
      setSimLoading(false);
    }
  };

  const filteredRules = rules.filter((r) => {
    if (filterType !== "ALL" && r.rule_type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        r.rule_code.toLowerCase().includes(q) ||
        r.rule_name.toLowerCase().includes(q) ||
        r.field_name.toLowerCase().includes(q) ||
        (r.requirement && r.requirement.toLowerCase().includes(q)) ||
        (r.error_message && r.error_message.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const activeRulesCount = rules.filter((r) => r.active !== false).length;

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "3rem" }}>
      {/* Top Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "1.75rem",
          flexWrap: "wrap",
          gap: "1rem"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              SCHOLAR-ST Dynamic Scheme Rule Engine
            </h1>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.22rem 0.65rem",
                borderRadius: "9999px",
                backgroundColor: "#f5f3ff",
                border: "1px solid #ddd6fe",
                color: "#6d28d9",
                fontSize: "0.72rem",
                fontWeight: 700
              }}
            >
              <Cloud size={13} color="#7c3aed" />
              <span>Supabase Cloud Rules</span>
            </div>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.22rem 0.65rem",
                borderRadius: "9999px",
                backgroundColor: "#ecfdf5",
                border: "1px solid #a7f3d0",
                color: "#065f46",
                fontSize: "0.72rem",
                fontWeight: 700
              }}
              title="Final decisions are strictly deterministic and reproducible. Gemini AI is never used for final eligibility determination."
            >
              <Shield size={13} color="#059669" />
              <span>Deterministic Execution (Zero AI Decisions)</span>
            </div>
          </div>
          <p style={{ color: "#64748b", fontSize: "0.92rem", margin: 0 }}>
            Configure statutory scheme eligibility rules, document checkpoints, conditions, and error messages.
            Fetched live from Supabase by the Python rule engine.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <button
            onClick={() => {
              setShowSimModal(true);
              handleRunSimulation();
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.6rem 1.15rem",
              borderRadius: "8px",
              backgroundColor: "#f8fafc",
              border: "1px solid #cbd5e1",
              color: "#1e293b",
              fontSize: "0.84rem",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            <Play size={16} color="#2563eb" />
            <span>Test / Dry-Run Engine</span>
          </button>

          <button
            onClick={openAddModal}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.6rem 1.25rem",
              borderRadius: "8px",
              backgroundColor: "#7e22ce",
              color: "#ffffff",
              fontSize: "0.86rem",
              fontWeight: 700,
              border: "none",
              cursor: "pointer",
              boxShadow: "0 2px 6px rgba(126, 34, 206, 0.25)"
            }}
          >
            <PlusCircle size={17} />
            <span>Add Dynamic Rule</span>
          </button>
        </div>
      </div>

      {bannerMessage && (
        <div
          style={{
            padding: "0.75rem 1.25rem",
            borderRadius: "8px",
            backgroundColor: "#fdf4ff",
            border: "1px solid #f5d0fe",
            color: "#86198f",
            fontSize: "0.84rem",
            fontWeight: 600,
            marginBottom: "1.25rem",
            display: "flex",
            alignItems: "center",
            gap: "0.5rem"
          }}
        >
          <CheckCircle2 size={16} />
          <span>{bannerMessage}</span>
        </div>
      )}

      {/* Scheme Selector Tabs */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          overflowX: "auto",
          borderBottom: "1px solid #e2e8f0",
          paddingBottom: "0.75rem",
          marginBottom: "1.5rem"
        }}
      >
        {schemes.map((s) => {
          const isSelected = selectedSchemeCode === s.scheme_code;
          return (
            <button
              key={s.scheme_code}
              onClick={() => setSelectedSchemeCode(s.scheme_code)}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.5rem 1rem",
                borderRadius: "8px",
                border: "none",
                backgroundColor: isSelected ? "#0f172a" : "#f1f5f9",
                color: isSelected ? "#ffffff" : "#475569",
                fontSize: "0.82rem",
                fontWeight: 700,
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s"
              }}
            >
              <span>{s.scheme_code}</span>
              <span
                style={{
                  fontSize: "0.7rem",
                  padding: "0.1rem 0.4rem",
                  borderRadius: "9999px",
                  backgroundColor: isSelected ? "#334155" : "#e2e8f0",
                  color: isSelected ? "#e2e8f0" : "#64748b"
                }}
              >
                {isSelected ? rules.length : ""}
              </span>
            </button>
          );
        })}
      </div>

      {/* Search and Filter Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          padding: "0.85rem 1.25rem",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          gap: "1rem"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            style={{
              padding: "0.45rem 0.75rem",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              fontSize: "0.8rem",
              backgroundColor: "#f8fafc",
              color: "#1e293b",
              fontWeight: 600
            }}
          >
            <option value="ALL">All Rule Categories</option>
            {RULE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.icon} {t.label}
              </option>
            ))}
          </select>
          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
            Showing {filteredRules.length} of {rules.length} rules ({activeRulesCount} active)
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: "260px" }}>
          <div style={{ position: "relative", width: "100%" }}>
            <Search size={15} style={{ position: "absolute", left: "10px", top: "10px", color: "#94a3b8" }} />
            <input
              type="text"
              placeholder="Search rule code, field, requirement..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "0.45rem 0.75rem 0.45rem 2rem",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "0.8rem",
                outline: "none"
              }}
            />
          </div>

          <button
            onClick={() => loadRules(selectedSchemeCode)}
            title="Reload Rules from Supabase"
            style={{
              padding: "0.45rem",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
              backgroundColor: "#f8fafc",
              color: "#64748b",
              cursor: "pointer"
            }}
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Rules Table */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "14px",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
          boxShadow: "0 2px 6px rgba(0,0,0,0.03)"
        }}
      >
        <div
          style={{
            padding: "1rem 1.5rem",
            borderBottom: "1px solid #f1f5f9",
            backgroundColor: "#f8fafc",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div>
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
              Dynamic Rules for {selectedSchemeCode}
            </h3>
            <span style={{ fontSize: "0.75rem", color: "#64748b" }}>
              Stored in Supabase <code>compliance_rules</code> &bull; Verified deterministically
            </span>
          </div>

          <a
            href="https://tribal.nic.in/ScholarshiP.aspx"
            target="_blank"
            rel="noreferrer"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              fontSize: "0.75rem",
              color: "#2563eb",
              textDecoration: "none",
              fontWeight: 600
            }}
          >
            <span>MoTA Guidelines Reference</span>
            <ExternalLink size={12} />
          </a>
        </div>

        {loading ? (
          <div style={{ textAlign: "center", padding: "4rem 0", color: "#64748b" }}>
            <RefreshCw size={24} className="animate-spin" style={{ margin: "0 auto 0.75rem auto", color: "#7e22ce" }} />
            <div>Fetching dynamic rules from Supabase Cloud...</div>
          </div>
        ) : filteredRules.length === 0 ? (
          <div style={{ textAlign: "center", padding: "3.5rem 1rem", color: "#64748b" }}>
            <Sliders size={36} style={{ color: "#94a3b8", margin: "0 auto 0.75rem auto" }} />
            <h4 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e293b", margin: "0 0 0.35rem 0" }}>
              No Rules Found
            </h4>
            <p style={{ fontSize: "0.84rem", margin: "0 0 1rem 0" }}>
              No rules matched your query. Click below to add a dynamic rule.
            </p>
            <button
              onClick={openAddModal}
              style={{
                padding: "0.45rem 1rem",
                borderRadius: "6px",
                border: "none",
                backgroundColor: "#7e22ce",
                color: "#fff",
                fontWeight: 600,
                fontSize: "0.82rem",
                cursor: "pointer"
              }}
            >
              Add Dynamic Rule
            </button>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e2e8f0", backgroundColor: "#f8fafc", color: "#64748b", textAlign: "left" }}>
                  <th style={{ padding: "0.75rem 1rem", width: "130px" }}>Rule Code</th>
                  <th style={{ padding: "0.75rem 0.75rem", width: "160px" }}>Rule Category</th>
                  <th style={{ padding: "0.75rem 0.75rem" }}>Title &amp; Statutory Requirement</th>
                  <th style={{ padding: "0.75rem 0.75rem", width: "180px" }}>Evaluation Condition</th>
                  <th style={{ padding: "0.75rem 0.75rem", width: "90px" }}>Severity</th>
                  <th style={{ padding: "0.75rem 0.75rem", width: "90px" }}>Status</th>
                  <th style={{ padding: "0.75rem 1rem", textAlign: "right", width: "110px" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRules.map((rule) => {
                  const isToggling = togglingRuleCode === rule.rule_code;
                  const ruleTypeObj = RULE_TYPES.find((t) => t.value === rule.rule_type);
                  return (
                    <tr
                      key={rule.rule_code}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        backgroundColor: rule.active === false ? "#fafafa" : "#ffffff",
                        opacity: rule.active === false ? 0.75 : 1
                      }}
                    >
                      {/* Rule Code */}
                      <td style={{ padding: "0.85rem 1rem", verticalAlign: "top" }}>
                        <code style={{ fontSize: "0.78rem", fontWeight: 800, color: "#0f172a", backgroundColor: "#f1f5f9", padding: "0.15rem 0.45rem", borderRadius: "4px" }}>
                          {rule.rule_code}
                        </code>
                      </td>

                      {/* Rule Category */}
                      <td style={{ padding: "0.85rem 0.75rem", verticalAlign: "top" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            padding: "0.2rem 0.5rem",
                            borderRadius: "4px",
                            backgroundColor: "#f3f4f6",
                            color: "#374151"
                          }}
                        >
                          <span>{ruleTypeObj?.icon || "⚖️"}</span>
                          <span>{ruleTypeObj?.label || rule.rule_type}</span>
                        </span>
                      </td>

                      {/* Title & Requirement */}
                      <td style={{ padding: "0.85rem 0.75rem", verticalAlign: "top" }}>
                        <div style={{ fontWeight: 700, color: "#0f172a", marginBottom: "0.2rem" }}>
                          {rule.rule_name}
                        </div>
                        <div style={{ fontSize: "0.76rem", color: "#475569", lineHeight: 1.4, marginBottom: "0.25rem" }}>
                          {rule.requirement}
                        </div>
                        {rule.error_message && (
                          <div style={{ fontSize: "0.72rem", color: "#b91c1c", backgroundColor: "#fef2f2", padding: "0.2rem 0.45rem", borderRadius: "4px", display: "inline-block", marginBottom: "0.2rem" }}>
                            <strong>Deficiency:</strong> {rule.error_message}
                          </div>
                        )}
                        {rule.statutory_reference && (
                          <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                            Ref: {rule.statutory_reference}
                          </div>
                        )}
                      </td>

                      {/* Evaluation Condition */}
                      <td style={{ padding: "0.85rem 0.75rem", verticalAlign: "top" }}>
                        <div style={{ fontSize: "0.74rem", color: "#64748b", marginBottom: "0.15rem" }}>
                          Field: <code>{rule.field_name}</code>
                        </div>
                        <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", backgroundColor: "#eff6ff", padding: "0.2rem 0.45rem", borderRadius: "4px", display: "inline-block" }}>
                          {rule.operator} {rule.expected_value}
                        </div>
                      </td>

                      {/* Severity */}
                      <td style={{ padding: "0.85rem 0.75rem", verticalAlign: "top" }}>
                        <span
                          style={{
                            fontSize: "0.68rem",
                            fontWeight: 800,
                            padding: "0.15rem 0.45rem",
                            borderRadius: "4px",
                            backgroundColor: rule.severity === "CRITICAL" ? "#fee2e2" : "#fef3c7",
                            color: rule.severity === "CRITICAL" ? "#991b1b" : "#92400e"
                          }}
                        >
                          {rule.severity}
                        </span>
                      </td>

                      {/* Status Toggle */}
                      <td style={{ padding: "0.85rem 0.75rem", verticalAlign: "top" }}>
                        <button
                          onClick={() => handleToggleStatus(rule)}
                          disabled={isToggling}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            padding: "0.2rem 0.5rem",
                            borderRadius: "9999px",
                            border: rule.active !== false ? "1px solid #bbf7d0" : "1px solid #cbd5e1",
                            backgroundColor: rule.active !== false ? "#f0fdf4" : "#f1f5f9",
                            color: rule.active !== false ? "#15803d" : "#64748b",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            cursor: isToggling ? "wait" : "pointer"
                          }}
                          title={rule.active !== false ? "Click to deactivate rule" : "Click to activate rule"}
                        >
                          {rule.active !== false ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                          <span>{rule.active !== false ? "ACTIVE" : "INACTIVE"}</span>
                        </button>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "0.85rem 1rem", verticalAlign: "top", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "0.35rem" }}>
                          <button
                            onClick={() => handleDirectPreviewImpact(rule)}
                            disabled={impactLoading}
                            style={{
                              padding: "0.3rem 0.5rem",
                              borderRadius: "4px",
                              border: "1px solid #e9d5ff",
                              backgroundColor: "#faf5ff",
                              color: "#7e22ce",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.25rem",
                              fontSize: "0.72rem",
                              fontWeight: 700
                            }}
                            title="Preview Rule Impact Analysis on Existing Applications"
                          >
                            <Layers size={12} />
                            <span>Impact</span>
                          </button>
                          <button
                            onClick={() => openEditModal(rule)}
                            style={{
                              padding: "0.3rem",
                              borderRadius: "4px",
                              border: "1px solid #cbd5e1",
                              backgroundColor: "#ffffff",
                              color: "#475569",
                              cursor: "pointer"
                            }}
                            title="Edit Rule"
                          >
                            <Edit3 size={13} />
                          </button>
                          <button
                            onClick={() => handleDeleteRule(rule.rule_code)}
                            style={{
                              padding: "0.3rem",
                              borderRadius: "4px",
                              border: "1px solid #fecaca",
                              backgroundColor: "#ffffff",
                              color: "#dc2626",
                              cursor: "pointer"
                            }}
                            title="Delete Rule"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD / EDIT DYNAMIC RULE MODAL */}
      {showModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem"
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              padding: "1.75rem",
              width: "100%",
              maxWidth: "680px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1)",
              border: "1px solid #e2e8f0"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  {editingRule ? `Edit Rule: ${editingRule.rule_code}` : `Add Rule to ${selectedSchemeCode}`}
                </h3>
                <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "0.2rem 0 0 0" }}>
                  Stored dynamically in Supabase <code>compliance_rules</code> &bull; Zero hardcoded constraints
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            {modalError && (
              <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#b91c1c", padding: "0.65rem 0.85rem", borderRadius: "6px", fontSize: "0.8rem", marginBottom: "1rem" }}>
                {modalError}
              </div>
            )}

            <form onSubmit={handleSaveRule} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1.5fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#334155", marginBottom: "0.25rem" }}>
                    Rule Code *
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!!editingRule}
                    placeholder="e.g. NOS-ST-CASTE-01"
                    value={ruleCode}
                    onChange={(e) => setRuleCode(e.target.value.toUpperCase())}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", fontWeight: 700, backgroundColor: editingRule ? "#f1f5f9" : "#ffffff" }}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#334155", marginBottom: "0.25rem" }}>
                    Rule Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Total Family Annual Income Ceiling"
                    value={ruleName}
                    onChange={(e) => setRuleName(e.target.value)}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#334155", marginBottom: "0.25rem" }}>
                    Rule Category / Type *
                  </label>
                  <select
                    value={ruleType}
                    onChange={(e) => setRuleType(e.target.value)}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", backgroundColor: "#ffffff" }}
                  >
                    {RULE_TYPES.map((t) => (
                      <option key={t.value} value={t.value}>
                        {t.icon} {t.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#334155", marginBottom: "0.25rem" }}>
                    Severity
                  </label>
                  <select
                    value={severity}
                    onChange={(e) => setSeverity(e.target.value)}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", backgroundColor: "#ffffff" }}
                  >
                    <option value="CRITICAL">CRITICAL (Disqualifying)</option>
                    <option value="HIGH">HIGH (Merit Rank)</option>
                    <option value="MEDIUM">MEDIUM (Advisory)</option>
                  </select>
                </div>
              </div>

              {/* Target Field, Operator, Expected Value */}
              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr 1.2fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#334155", marginBottom: "0.25rem" }}>
                    Target Context Field *
                  </label>
                  <select
                    value={fieldName}
                    onChange={(e) => setFieldName(e.target.value)}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", backgroundColor: "#ffffff" }}
                  >
                    {TARGET_FIELDS.map((f) => (
                      <option key={f.field} value={f.field}>
                        {f.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#334155", marginBottom: "0.25rem" }}>
                    Operator
                  </label>
                  <select
                    value={operator}
                    onChange={(e) => setOperator(e.target.value)}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", backgroundColor: "#ffffff" }}
                  >
                    <option value="<=">&le; Less than or equal</option>
                    <option value=">=">&ge; Greater than or equal</option>
                    <option value="==">== Exact Match</option>
                    <option value="!=">!= Not Equal</option>
                    <option value="in">in Contained in List</option>
                    <option value="contains">contains Text</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#334155", marginBottom: "0.25rem" }}>
                    Expected Value *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. 800000 or ST"
                    value={expectedValue}
                    onChange={(e) => setExpectedValue(e.target.value)}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                  />
                </div>
              </div>

              {/* Requirement & Error Message */}
              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#334155", marginBottom: "0.25rem" }}>
                  Statutory Requirement Explanation
                </label>
                <textarea
                  rows={2}
                  placeholder="Official condition as defined in scheme guidelines..."
                  value={requirement}
                  onChange={(e) => setRequirement(e.target.value)}
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem", fontFamily: "inherit" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#b91c1c", marginBottom: "0.25rem" }}>
                  Deficiency / Error Message (Shown upon failure) *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Deficiency: Annual family income exceeds statutory ceiling of Rs. 8,00,000."
                  value={errorMessage}
                  onChange={(e) => setErrorMessage(e.target.value)}
                  style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "0.75rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#334155", marginBottom: "0.25rem" }}>
                    Statutory Reference
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. MoTA NOS Guidelines Clause 4.2 (tribal.nic.in)"
                    value={statutoryRef}
                    onChange={(e) => setStatutoryRef(e.target.value)}
                    style={{ width: "100%", padding: "0.5rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.82rem" }}
                  />
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "1rem", paddingTop: "1.2rem" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.8rem", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={active}
                      onChange={(e) => setActive(e.target.checked)}
                      style={{ accentColor: "#7e22ce" }}
                    />
                    <span>Active in Engine</span>
                  </label>
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", borderTop: "1px solid #e2e8f0", paddingTop: "1rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: "0.5rem 1rem", borderRadius: "6px", border: "1px solid #cbd5e1", background: "none", color: "#475569", fontSize: "0.82rem", fontWeight: 600, cursor: "pointer" }}
                >
                  Cancel
                </button>
                {editingRule && (
                  <button
                    type="button"
                    onClick={handlePreviewCurrentFormImpact}
                    disabled={saving}
                    style={{
                      padding: "0.5rem 1rem",
                      borderRadius: "6px",
                      border: "1px solid #c084fc",
                      backgroundColor: "#faf5ff",
                      color: "#7e22ce",
                      fontSize: "0.82rem",
                      fontWeight: 700,
                      cursor: saving ? "wait" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem"
                    }}
                  >
                    <Layers size={14} />
                    Preview Impact
                  </button>
                )}
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: "0.5rem 1.35rem", borderRadius: "6px", border: "none", backgroundColor: "#7e22ce", color: "#ffffff", fontSize: "0.82rem", fontWeight: 700, cursor: saving ? "wait" : "pointer" }}
                >
                  {saving
                    ? "Evaluating Impact..."
                    : editingRule
                    ? "Preview Impact & Activate"
                    : "Create Rule in Supabase"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* RULE IMPACT ANALYSIS MODAL */}
      <RuleImpactModal
        isOpen={showImpactModal}
        impact={impactData}
        onClose={() => {
          setShowImpactModal(false);
          setPendingAction(null);
        }}
        onConfirm={handleConfirmImpactAction}
        isConfirming={impactConfirming}
        confirmButtonText={
          pendingAction?.type === "SAVE_EDIT"
            ? "Confirm & Activate Changed Rule"
            : pendingAction?.type === "TOGGLE_STATUS"
            ? `Confirm & ${pendingAction.payload?.active ? "Activate" : "Deactivate"} Rule`
            : "Acknowledge Impact"
        }
      />

      {/* ENGINE SIMULATION DRAWER */}
      {showSimModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(15, 23, 42, 0.7)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem"
          }}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "16px",
              padding: "1.75rem",
              width: "100%",
              maxWidth: "880px",
              maxHeight: "92vh",
              overflowY: "auto",
              boxShadow: "0 25px 50px -12px rgba(0,0,0,0.25)",
              border: "1px solid #e2e8f0"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
              <div>
                <h3 style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  Rule Engine Deterministic Test Simulation
                </h3>
                <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "0.2rem 0 0 0" }}>
                  Scheme: <strong>{selectedSchemeCode}</strong> &bull; Rules fetched dynamically from Supabase &bull; Output conforms strictly to statutory format
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowSimModal(false)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Simulated Candidate Controls */}
            <div
              style={{
                backgroundColor: "#f8fafc",
                padding: "1rem",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                marginBottom: "1.25rem",
                fontSize: "0.78rem"
              }}
            >
              <div style={{ fontWeight: 700, color: "#1e293b", marginBottom: "0.5rem" }}>
                Test Candidate Profile Parameters:
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.6rem" }}>
                <div>
                  <span style={{ color: "#64748b" }}>Caste Category:</span>
                  <select
                    value={simProfile.caste_category}
                    onChange={(e) => setSimProfile({ ...simProfile, caste_category: e.target.value })}
                    style={{ width: "100%", padding: "0.3rem", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                  >
                    <option value="ST">ST (Scheduled Tribe)</option>
                    <option value="NON_ST">NON_ST (Ineligible)</option>
                  </select>
                </div>

                <div>
                  <span style={{ color: "#64748b" }}>Annual Family Income:</span>
                  <input
                    type="number"
                    value={simProfile.annual_family_income}
                    onChange={(e) => setSimProfile({ ...simProfile, annual_family_income: Number(e.target.value) })}
                    style={{ width: "100%", padding: "0.3rem", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                  />
                </div>

                <div>
                  <span style={{ color: "#64748b" }}>Marks (%):</span>
                  <input
                    type="number"
                    value={simProfile.aggregate_percentage}
                    onChange={(e) => setSimProfile({ ...simProfile, aggregate_percentage: Number(e.target.value) })}
                    style={{ width: "100%", padding: "0.3rem", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                  />
                </div>

                <div>
                  <span style={{ color: "#64748b" }}>Applicant Age:</span>
                  <input
                    type="number"
                    value={simProfile.applicant_age}
                    onChange={(e) => setSimProfile({ ...simProfile, applicant_age: Number(e.target.value) })}
                    style={{ width: "100%", padding: "0.3rem", borderRadius: "4px", border: "1px solid #cbd5e1" }}
                  />
                </div>
              </div>

              <div style={{ marginTop: "0.75rem", display: "flex", justifyContent: "flex-end" }}>
                <button
                  onClick={handleRunSimulation}
                  disabled={simLoading}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.35rem",
                    padding: "0.4rem 0.95rem",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    fontWeight: 700,
                    cursor: simLoading ? "wait" : "pointer"
                  }}
                >
                  <RefreshCw size={13} className={simLoading ? "animate-spin" : ""} />
                  <span>Re-Evaluate Engine</span>
                </button>
              </div>
            </div>

            {/* Simulation Results Table */}
            {simReport && (
              <div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "0.85rem 1.25rem",
                    borderRadius: "10px",
                    backgroundColor:
                      simReport.system_recommendation === "RECOMMENDED_FOR_APPROVAL"
                        ? "#f0fdf4"
                        : simReport.system_recommendation === "ELIGIBLE_PENDING_OFFICER_REVIEW"
                        ? "#eff6ff"
                        : "#fef2f2",
                    border:
                      simReport.system_recommendation === "RECOMMENDED_FOR_APPROVAL"
                        ? "1px solid #bbf7d0"
                        : simReport.system_recommendation === "ELIGIBLE_PENDING_OFFICER_REVIEW"
                        ? "1px solid #bfdbfe"
                        : "1px solid #fecaca",
                    marginBottom: "1rem"
                  }}
                >
                  <div>
                    <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>Deterministic Engine Verdict:</div>
                    <div style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a" }}>
                      {simReport.system_recommendation} &bull; Score: {simReport.eligibility_score}%
                    </div>
                    <div style={{ fontSize: "0.76rem", color: "#475569", marginTop: "0.2rem" }}>
                      {simReport.recommendation_text}
                    </div>
                  </div>

                  <div style={{ display: "flex", gap: "0.75rem", textAlign: "center" }}>
                    <div>
                      <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#059669" }}>{simReport.passed_rules}</div>
                      <div style={{ fontSize: "0.68rem", color: "#64748b" }}>Passed</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#dc2626" }}>{simReport.failed_rules}</div>
                      <div style={{ fontSize: "0.68rem", color: "#64748b" }}>Failed</div>
                    </div>
                    <div>
                      <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#d97706" }}>{simReport.review_rules}</div>
                      <div style={{ fontSize: "0.68rem", color: "#64748b" }}>Review</div>
                    </div>
                  </div>
                </div>

                <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.5rem" }}>
                  Detailed Rule-by-Rule Output:
                </div>

                <div style={{ overflowX: "auto", border: "1px solid #e2e8f0", borderRadius: "8px" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                    <thead>
                      <tr style={{ backgroundColor: "#f8fafc", borderBottom: "1px solid #e2e8f0", color: "#64748b", textAlign: "left" }}>
                        <th style={{ padding: "0.6rem 0.75rem" }}>Rule Evaluated</th>
                        <th style={{ padding: "0.6rem 0.75rem" }}>Applicant Value</th>
                        <th style={{ padding: "0.6rem 0.75rem" }}>Required Condition</th>
                        <th style={{ padding: "0.6rem 0.75rem" }}>Result</th>
                        <th style={{ padding: "0.6rem 0.75rem" }}>Evidence / Document Reference</th>
                        <th style={{ padding: "0.6rem 0.75rem" }}>Explanation</th>
                      </tr>
                    </thead>
                    <tbody>
                      {simReport.rule_results.map((res: any, idx: number) => {
                        const isPass = res.result === "PASS";
                        const isFail = res.result === "FAIL";
                        return (
                          <tr key={idx} style={{ borderBottom: "1px solid #f1f5f9" }}>
                            <td style={{ padding: "0.6rem 0.75rem", fontWeight: 700, color: "#0f172a" }}>
                              <div>{res.rule_evaluated.rule_name}</div>
                              <code style={{ fontSize: "0.7rem", color: "#64748b" }}>{res.rule_evaluated.rule_code}</code>
                            </td>
                            <td style={{ padding: "0.6rem 0.75rem" }}>
                              <strong>{String(res.applicant_value)}</strong>
                            </td>
                            <td style={{ padding: "0.6rem 0.75rem" }}>
                              <code>{res.required_condition}</code>
                            </td>
                            <td style={{ padding: "0.6rem 0.75rem" }}>
                              <span
                                style={{
                                  fontSize: "0.7rem",
                                  fontWeight: 800,
                                  padding: "0.15rem 0.45rem",
                                  borderRadius: "4px",
                                  backgroundColor: isPass ? "#dcfce7" : isFail ? "#fee2e2" : "#fef3c7",
                                  color: isPass ? "#15803d" : isFail ? "#b91c1c" : "#b45309"
                                }}
                              >
                                {res.result}
                              </span>
                            </td>
                            <td style={{ padding: "0.6rem 0.75rem", fontSize: "0.72rem", color: "#475569", maxWidth: "200px" }}>
                              {res.evidence_reference}
                            </td>
                            <td style={{ padding: "0.6rem 0.75rem", fontSize: "0.72rem", color: isFail ? "#b91c1c" : "#334155", maxWidth: "220px" }}>
                              {res.explanation}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
