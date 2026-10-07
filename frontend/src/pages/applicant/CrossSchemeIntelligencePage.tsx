import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileText,
  UploadCloud,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Award,
  ArrowRight,
  GraduationCap,
  Building2,
  HelpCircle,
  Check,
  Info,
  Layers,
  FileCheck2,
  Lock,
  ExternalLink
} from "lucide-react";
import { scholarService } from "../../services/scholarService";
import type { CrossSchemeIntelligenceData, SchemeIntelligenceItem } from "../../types/scholar";
import { SchemeGapViewer } from "../../components/scholar/SchemeGapViewer";

export default function CrossSchemeIntelligencePage() {
  const navigate = useNavigate();
  const [intelligence, setIntelligence] = useState<CrossSchemeIntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filterTier, setFilterTier] = useState<"ALL" | "ELIGIBLE" | "POTENTIALLY_ELIGIBLE" | "NOT_ELIGIBLE">("ALL");
  const [expandedScheme, setExpandedScheme] = useState<string | null>(null);

  const fetchIntelligence = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const data = await scholarService.getCrossSchemeIntelligence();
      setIntelligence(data);
    } catch (err) {
      console.error("Failed to load cross-scheme intelligence:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchIntelligence();
  }, []);

  const toggleExpand = (code: string) => {
    setExpandedScheme(expandedScheme === code ? null : code);
  };

  if (loading) {
    return (
      <div style={{ maxWidth: "1150px", margin: "3rem auto", textAlign: "center", color: "#64748b" }}>
        <RefreshCw size={36} className="spin" style={{ margin: "0 auto 1rem", animation: "spin 1s linear infinite", color: "#2563eb" }} />
        <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0f172a" }}>
          Evaluating Cross-Scheme Intelligence...
        </h3>
        <p style={{ fontSize: "0.86rem", color: "#64748b" }}>
          Cross-referencing verified applicant profile facts against active dynamic scheme rules from Supabase...
        </p>
      </div>
    );
  }

  if (!intelligence) {
    return (
      <div style={{ maxWidth: "1150px", margin: "2rem auto", padding: "2.5rem", background: "#ffffff", borderRadius: "12px", textAlign: "center", border: "1px solid #e2e8f0" }}>
        <AlertTriangle size={42} color="#dc2626" style={{ margin: "0 auto 0.75rem" }} />
        <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a" }}>Unable to Load Intelligence Data</h3>
        <p style={{ color: "#64748b", fontSize: "0.88rem", marginTop: "0.5rem" }}>
          Please make sure your applicant profile is created and verified.
        </p>
        <Link
          to="/applicant/profile"
          style={{ display: "inline-block", marginTop: "1rem", padding: "0.55rem 1.25rem", borderRadius: "6px", backgroundColor: "#2563eb", color: "#ffffff", textDecoration: "none", fontWeight: 600, fontSize: "0.85rem" }}
        >
          Build Applicant Profile
        </Link>
      </div>
    );
  }

  const { profile_summary, counts, eligible_opportunities, potentially_eligible, not_eligible, all_schemes, guardrail_notice } = intelligence;

  const displayedSchemes = all_schemes.filter((item) => {
    if (filterTier === "ALL") return true;
    return item.eligibility_tier === filterTier;
  });

  return (
    <div style={{ maxWidth: "1180px", margin: "0 auto", paddingBottom: "3rem" }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.35rem" }}>
            <span style={{ fontSize: "0.72rem", fontWeight: 800, padding: "0.2rem 0.55rem", borderRadius: "4px", backgroundColor: "#eff6ff", color: "#2563eb", textTransform: "uppercase", letterSpacing: "0.04em" }}>
              Automated Statutory Adjudication Engine
            </span>
          </div>
          <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.35rem 0", letterSpacing: "-0.01em" }}>
            Cross-Scheme Intelligence
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.9rem", margin: 0 }}>
            Real-time multi-scheme eligibility evaluation comparing your verified profile facts against statutory criteria.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.6rem" }}>
          <button
            onClick={() => fetchIntelligence(true)}
            disabled={refreshing}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.55rem 1rem",
              borderRadius: "8px",
              backgroundColor: "#ffffff",
              border: "1px solid #cbd5e1",
              color: "#334155",
              fontSize: "0.84rem",
              fontWeight: 600,
              cursor: refreshing ? "not-allowed" : "pointer"
            }}
          >
            <RefreshCw size={15} className={refreshing ? "spin" : ""} />
            <span>{refreshing ? "Re-Evaluating..." : "Refresh Intelligence"}</span>
          </button>

          <Link
            to="/applicant/documents"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.55rem 1.15rem",
              borderRadius: "8px",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              fontSize: "0.84rem",
              fontWeight: 700,
              textDecoration: "none"
            }}
          >
            <UploadCloud size={16} />
            <span>Manage Documents</span>
          </Link>
        </div>
      </div>

      {/* Visual Architectural Workflow Pipeline */}
      <div
        style={{
          background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)",
          borderRadius: "14px",
          padding: "1.35rem 1.75rem",
          color: "#ffffff",
          marginBottom: "1.5rem",
          boxShadow: "0 4px 12px rgba(15, 23, 42, 0.15)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flexWrap: "wrap", fontSize: "0.82rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.75rem", borderRadius: "6px", backgroundColor: "rgba(255,255,255,0.1)" }}>
              <ShieldCheck size={16} color="#60a5fa" />
              <span><strong>1. Applicant Profile</strong> ({profile_summary.caste_verified ? "ST Verified" : "Self-Declared"})</span>
            </div>
            <ArrowRight size={14} color="#94a3b8" />
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.75rem", borderRadius: "6px", backgroundColor: "rgba(255,255,255,0.1)" }}>
              <Award size={16} color="#fbbf24" />
              <span><strong>2. Active MoTA Schemes</strong> ({counts.total_active_schemes})</span>
            </div>
            <ArrowRight size={14} color="#94a3b8" />
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.75rem", borderRadius: "6px", backgroundColor: "rgba(255,255,255,0.1)" }}>
              <Layers size={16} color="#c084fc" />
              <span><strong>3. Dynamic Rule Engine</strong> (Supabase)</span>
            </div>
            <ArrowRight size={14} color="#94a3b8" />
            <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", padding: "0.4rem 0.75rem", borderRadius: "6px", backgroundColor: "#10b981", color: "#ffffff", fontWeight: 700 }}>
              <CheckCircle2 size={16} />
              <span><strong>4. Eligible Opportunities</strong></span>
            </div>
          </div>
        </div>

        {/* Profile Snapshot Sub-strip */}
        <div style={{ marginTop: "1rem", paddingTop: "0.85rem", borderTop: "1px solid rgba(255,255,255,0.15)", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem", fontSize: "0.8rem", color: "#cbd5e1" }}>
          <div>
            <span>Candidate: <strong>{profile_summary.full_name}</strong></span>
            &bull; <span>Community: <strong>{profile_summary.tribe_name || "Scheduled Tribe"}</strong></span>
            &bull; <span>Income: <strong>{profile_summary.annual_income ? `₹${profile_summary.annual_income.toLocaleString()}/yr` : "Declared"}</strong></span>
            &bull; <span>Academic: <strong>{profile_summary.aggregate_percentage ? `${profile_summary.aggregate_percentage}%` : "Provided"}</strong></span>
          </div>
          <div style={{ color: "#93c5fd" }}>
            <span>Profile Documents: <strong>{profile_summary.documents_uploaded_count} attached</strong></span>
          </div>
        </div>
      </div>

      {/* Critical Statutory Guardrail Alert */}
      <div
        style={{
          borderRadius: "10px",
          border: "1.5px solid #bfdbfe",
          backgroundColor: "#eff6ff",
          padding: "0.9rem 1.25rem",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          gap: "0.75rem"
        }}
      >
        <Lock size={18} color="#2563eb" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: "0.84rem", color: "#1e40af", lineHeight: 1.45 }}>
          <strong>Statutory Governance Constraint: </strong>
          {guardrail_notice} The system surfaces transparency and recommendation scores; final selection and submission remains strictly candidate-controlled.
        </div>
      </div>

      {/* Filter Tabs / Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.5rem" }}>
        <button
          onClick={() => setFilterTier("ALL")}
          style={{
            padding: "1rem 1.25rem",
            borderRadius: "10px",
            backgroundColor: "#ffffff",
            border: `2px solid ${filterTier === "ALL" ? "#2563eb" : "#e2e8f0"}`,
            textAlign: "left",
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
        >
          <div style={{ fontSize: "0.74rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>All Active Schemes</div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f172a", marginTop: "0.2rem" }}>
            {counts.total_active_schemes}
          </div>
          <div style={{ fontSize: "0.76rem", color: "#64748b", marginTop: "0.15rem" }}>Total Schemes Evaluated</div>
        </button>

        <button
          onClick={() => setFilterTier("ELIGIBLE")}
          style={{
            padding: "1rem 1.25rem",
            borderRadius: "10px",
            backgroundColor: filterTier === "ELIGIBLE" ? "#f0fdf4" : "#ffffff",
            border: `2px solid ${filterTier === "ELIGIBLE" ? "#16a34a" : "#bbf7d0"}`,
            textAlign: "left",
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#166534", textTransform: "uppercase" }}>Eligible Opportunities</span>
            <CheckCircle2 size={16} color="#16a34a" />
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#16a34a", marginTop: "0.2rem" }}>
            {counts.eligible}
          </div>
          <div style={{ fontSize: "0.76rem", color: "#166534", marginTop: "0.15rem" }}>100% Ready to Apply</div>
        </button>

        <button
          onClick={() => setFilterTier("POTENTIALLY_ELIGIBLE")}
          style={{
            padding: "1rem 1.25rem",
            borderRadius: "10px",
            backgroundColor: filterTier === "POTENTIALLY_ELIGIBLE" ? "#fffbeb" : "#ffffff",
            border: `2px solid ${filterTier === "POTENTIALLY_ELIGIBLE" ? "#d97706" : "#fde68a"}`,
            textAlign: "left",
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#92400e", textTransform: "uppercase" }}>Potentially Eligible</span>
            <Sparkles size={16} color="#d97706" />
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#d97706", marginTop: "0.2rem" }}>
            {counts.potentially_eligible}
          </div>
          <div style={{ fontSize: "0.76rem", color: "#92400e", marginTop: "0.15rem" }}>Upload docs to qualify</div>
        </button>

        <button
          onClick={() => setFilterTier("NOT_ELIGIBLE")}
          style={{
            padding: "1rem 1.25rem",
            borderRadius: "10px",
            backgroundColor: filterTier === "NOT_ELIGIBLE" ? "#fef2f2" : "#ffffff",
            border: `2px solid ${filterTier === "NOT_ELIGIBLE" ? "#dc2626" : "#fecaca"}`,
            textAlign: "left",
            cursor: "pointer",
            transition: "all 0.15s ease"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#991b1b", textTransform: "uppercase" }}>Criteria Unmet</span>
            <XCircle size={16} color="#dc2626" />
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: 800, color: "#dc2626", marginTop: "0.2rem" }}>
            {counts.not_eligible}
          </div>
          <div style={{ fontSize: "0.76rem", color: "#991b1b", marginTop: "0.15rem" }}>Incompatible criteria</div>
        </button>
      </div>

      {/* Scheme Cards Stream */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {displayedSchemes.length === 0 ? (
          <div style={{ padding: "3rem", backgroundColor: "#ffffff", borderRadius: "12px", textAlign: "center", border: "1px solid #e2e8f0" }}>
            <Info size={36} color="#94a3b8" style={{ margin: "0 auto 0.75rem" }} />
            <h4 style={{ margin: 0, fontSize: "1rem", color: "#0f172a" }}>No schemes in this tier category</h4>
            <p style={{ margin: "0.25rem 0 0 0", color: "#64748b", fontSize: "0.85rem" }}>
              Switch to "All Active Schemes" to inspect full evaluation breakdown.
            </p>
          </div>
        ) : (
          displayedSchemes.map((item) => {
            const isEligible = item.eligibility_tier === "ELIGIBLE";
            const isPotential = item.eligibility_tier === "POTENTIALLY_ELIGIBLE";
            const isUnmet = item.eligibility_tier === "NOT_ELIGIBLE";
            const isExpanded = expandedScheme === item.scheme_code;

            return (
              <div
                key={item.scheme_code}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "14px",
                  border: `1.5px solid ${isEligible ? "#86efac" : isPotential ? "#fde68a" : "#fecaca"}`,
                  padding: "1.5rem",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
                }}
              >
                {/* Header row */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap", marginBottom: "0.35rem" }}>
                      <span style={{ fontSize: "0.72rem", fontWeight: 800, padding: "0.15rem 0.5rem", borderRadius: "4px", backgroundColor: "#0f172a", color: "#ffffff" }}>
                        {item.scheme_code}
                      </span>
                      <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                        {item.ministry_or_department}
                      </span>
                      <span style={{ fontSize: "0.72rem", color: "#64748b" }}>&bull; {item.study_level}</span>
                      <span style={{ fontSize: "0.72rem", color: "#64748b" }}>&bull; {item.slots_available} Slots</span>
                    </div>

                    <h2 style={{ margin: "0 0 0.35rem 0", fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>
                      {item.scheme_name}
                    </h2>
                    <p style={{ margin: 0, fontSize: "0.84rem", color: "#475569", lineHeight: 1.45, maxWidth: "780px" }}>
                      {item.description}
                    </p>
                  </div>

                  <div style={{ textAlign: "right" }}>
                    <div
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.4rem",
                        padding: "0.4rem 0.85rem",
                        borderRadius: "8px",
                        backgroundColor: isEligible ? "#ecfdf5" : isPotential ? "#fffbeb" : "#fef2f2",
                        border: `1px solid ${isEligible ? "#a7f3d0" : isPotential ? "#fde68a" : "#fecaca"}`,
                        color: item.tier_badge_color,
                        fontSize: "0.82rem",
                        fontWeight: 800
                      }}
                    >
                      {isEligible ? <CheckCircle2 size={16} /> : isPotential ? <Sparkles size={16} /> : <XCircle size={16} />}
                      <span>{item.tier_label.toUpperCase()}</span>
                    </div>

                    <div style={{ marginTop: "0.45rem", display: "flex", alignItems: "center", gap: "0.5rem", justifyContent: "flex-end" }}>
                      <span style={{ fontSize: "0.76rem", color: "#64748b" }}>Match Score:</span>
                      <strong style={{ fontSize: "0.95rem", color: item.tier_badge_color }}>{item.match_score}%</strong>
                    </div>
                  </div>
                </div>

                {/* Statutory summary explanation */}
                <div
                  style={{
                    marginTop: "1rem",
                    padding: "0.75rem 1rem",
                    borderRadius: "8px",
                    backgroundColor: isEligible ? "#f0fdf4" : isPotential ? "#fefce8" : "#fff5f5",
                    fontSize: "0.82rem",
                    color: isEligible ? "#166534" : isPotential ? "#854d0e" : "#991b1b",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}
                >
                  <Info size={16} style={{ flexShrink: 0 }} />
                  <span>{item.summary_explanation}</span>
                </div>

                {/* Required Documents Analysis Bar */}
                <div style={{ marginTop: "1rem", paddingTop: "0.85rem", borderTop: "1px solid #f1f5f9" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                    <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#334155", textTransform: "uppercase" }}>
                      Required Statutory Documents ({item.required_documents.length}):
                    </span>
                    <span style={{ fontSize: "0.72rem", color: item.missing_documents_count === 0 ? "#16a34a" : "#d97706", fontWeight: 600 }}>
                      {item.missing_documents_count === 0 ? "✓ All Documents Attached" : `⚠ ${item.missing_documents_count} Document(s) Missing`}
                    </span>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
                    {item.required_documents.map((doc) => {
                      const isAttached = doc.is_uploaded;
                      const isVerified = doc.is_verified;
                      return (
                        <div
                          key={doc.document_type}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.35rem",
                            padding: "0.3rem 0.65rem",
                            borderRadius: "6px",
                            backgroundColor: isAttached ? "#f0fdf4" : "#fef2f2",
                            border: `1px solid ${isAttached ? "#bbf7d0" : "#fecaca"}`,
                            fontSize: "0.74rem",
                            color: isAttached ? "#166534" : "#991b1b"
                          }}
                        >
                          {isAttached ? <Check size={13} strokeWidth={3} /> : <AlertTriangle size={13} />}
                          <span style={{ fontWeight: 600 }}>{doc.title}</span>
                          <span style={{ fontSize: "0.68rem", opacity: 0.85 }}>
                            ({isVerified ? "Verified" : isAttached ? "Uploaded" : "Missing"})
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Scheme Gap Intelligence: Requirement → Applicant Status → Gap → Suggested Action */}
                {((item.gaps && item.gaps.length > 0) || item.missing_requirements.length > 0) && (
                  <div style={{ marginTop: "1.25rem" }}>
                    <SchemeGapViewer
                      schemeCode={item.scheme_code}
                      schemeName={item.scheme_name}
                      gapIntelligence={item.gap_analysis}
                      gaps={item.gaps}
                      title={`Scheme Gap Intelligence (${(item.gaps?.length || item.missing_requirements.length)} Identified)`}
                      showFilterTabs={true}
                    />
                  </div>
                )}


                {/* Action Buttons & Expand Toggle */}
                <div style={{ marginTop: "1.25rem", paddingTop: "0.85rem", borderTop: "1px solid #f1f5f9", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                  <button
                    onClick={() => toggleExpand(item.scheme_code)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      backgroundColor: "transparent",
                      border: "none",
                      color: "#2563eb",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      padding: 0
                    }}
                  >
                    <span>{isExpanded ? "Hide Dynamic Rules Details" : `Inspect All Evaluated Rules (${item.total_rules_evaluated})`}</span>
                    {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                  </button>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                    {/* View existing application link if already submitted */}
                    {item.user_application_status ? (
                      <Link
                        to={`/applicant/applications/${item.user_application_id}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          padding: "0.55rem 1.15rem",
                          borderRadius: "6px",
                          backgroundColor: "#0f172a",
                          color: "#ffffff",
                          fontSize: "0.82rem",
                          fontWeight: 700,
                          textDecoration: "none"
                        }}
                      >
                        <FileText size={15} />
                        <span>View Application ({item.user_application_status.replace(/_/g, " ")})</span>
                      </Link>
                    ) : isEligible ? (
                      <Link
                        to={`/applicant/apply?scheme=${item.scheme_code}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          padding: "0.55rem 1.25rem",
                          borderRadius: "6px",
                          backgroundColor: "#16a34a",
                          color: "#ffffff",
                          fontSize: "0.84rem",
                          fontWeight: 700,
                          textDecoration: "none",
                          boxShadow: "0 2px 6px rgba(22, 163, 74, 0.25)"
                        }}
                      >
                        <span>Apply for Scheme Now</span>
                        <ArrowRight size={15} />
                      </Link>
                    ) : isPotential ? (
                      <div style={{ display: "flex", gap: "0.5rem" }}>
                        <Link
                          to="/applicant/documents"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            padding: "0.55rem 1rem",
                            borderRadius: "6px",
                            backgroundColor: "#2563eb",
                            color: "#ffffff",
                            fontSize: "0.82rem",
                            fontWeight: 700,
                            textDecoration: "none"
                          }}
                        >
                          <UploadCloud size={15} />
                          <span>Upload Missing Docs</span>
                        </Link>
                        <Link
                          to={`/applicant/apply?scheme=${item.scheme_code}`}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            padding: "0.55rem 1rem",
                            borderRadius: "6px",
                            backgroundColor: "#f8fafc",
                            border: "1px solid #cbd5e1",
                            color: "#334155",
                            fontSize: "0.82rem",
                            fontWeight: 600,
                            textDecoration: "none"
                          }}
                        >
                          <span>Save as Draft</span>
                        </Link>
                      </div>
                    ) : (
                      <span style={{ fontSize: "0.8rem", color: "#94a3b8", fontStyle: "italic" }}>
                        Statutory threshold conditions not met
                      </span>
                    )}
                  </div>
                </div>

                {/* Collapsible Rules Evaluation Drawer */}
                {isExpanded && (
                  <div style={{ marginTop: "1.25rem", paddingTop: "1rem", borderTop: "1px dashed #cbd5e1" }}>
                    <h4 style={{ margin: "0 0 0.6rem 0", fontSize: "0.88rem", fontWeight: 700, color: "#0f172a" }}>
                      Dynamic Supabase Rule Validation Results:
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                      {item.passed_requirements.map((r) => (
                        <div
                          key={r.rule_code}
                          style={{
                            padding: "0.6rem 0.75rem",
                            borderRadius: "6px",
                            backgroundColor: "#fafffd",
                            border: "1px solid #bbf7d0",
                            fontSize: "0.78rem",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: "0.75rem"
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: 700, color: "#0f172a" }}>{r.rule_code}: {r.rule_name}</span>
                            <div style={{ color: "#64748b", marginTop: "0.15rem" }}>
                              Condition: <code>{r.required_condition}</code> | Applicant Fact: <strong>{String(r.applicant_value)}</strong>
                            </div>
                            {r.evidence && <div style={{ color: "#166534", marginTop: "0.15rem" }}>Evidence: {r.evidence}</div>}
                          </div>
                          <span style={{ fontSize: "0.7rem", fontWeight: 800, padding: "0.15rem 0.45rem", borderRadius: "4px", backgroundColor: "#ecfdf5", color: "#065f46" }}>
                            ✓ PASS
                          </span>
                        </div>
                      ))}

                      {item.failed_rules_count > 0 && item.missing_requirements.filter(m => m.type !== "MISSING_DOCUMENT").map((f) => (
                        <div
                          key={f.rule_code}
                          style={{
                            padding: "0.6rem 0.75rem",
                            borderRadius: "6px",
                            backgroundColor: "#fff5f5",
                            border: "1px solid #fecaca",
                            fontSize: "0.78rem",
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "flex-start",
                            gap: "0.75rem"
                          }}
                        >
                          <div>
                            <span style={{ fontWeight: 700, color: "#991b1b" }}>{f.rule_code}: {f.title}</span>
                            <div style={{ color: "#64748b", marginTop: "0.15rem" }}>
                              Condition: <code>{f.requirement}</code>
                            </div>
                            <div style={{ color: "#b91c1c", marginTop: "0.15rem" }}>{f.reason}</div>
                          </div>
                          <span style={{ fontSize: "0.7rem", fontWeight: 800, padding: "0.15rem 0.45rem", borderRadius: "4px", backgroundColor: "#fee2e2", color: "#991b1b" }}>
                            ✗ {f.is_disqualifying ? "FAIL (DISQUALIFYING)" : "FAIL"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
