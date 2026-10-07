import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Award,
  ArrowRight,
  CheckCircle2,
  Sliders,
  Info,
  Shield,
  Filter,
  FileText,
  DollarSign,
  GraduationCap,
  Calendar,
  Users,
  Search,
  Check,
  Clock,
  Sparkles,
  AlertTriangle,
  Eye
} from "lucide-react";
import { scholarService } from "../../services/scholarService";
import { authService } from "../../services/authService";
import type { ScholarScheme, SchemeGapIntelligence } from "../../types/scholar";
import { SchemeGapViewer } from "../../components/scholar/SchemeGapViewer";

const STUDY_LEVEL_FILTERS = [
  { id: "ALL", label: "All Active Schemes" },
  { id: "OVERSEAS", label: "Overseas (NOS-ST)" },
  { id: "PHD", label: "Ph.D. Fellowships (NFST)" },
  { id: "PREMIER", label: "Premier Institutes (Top Class)" },
  { id: "POST_MATRIC", label: "Post-Matric Degree" },
  { id: "PRE_MATRIC", label: "Pre-Matric School" },
];

const DOCUMENT_LABELS: Record<string, string> = {
  CASTE_CERTIFICATE: "ST Certificate (Art. 342)",
  INCOME_CERTIFICATE: "Income Certificate",
  MARKSHEET: "Academic Marksheets / Degree",
  ADMISSION_OFFER: "Admission / Offer Letter",
  BANK_PASSBOOK: "Aadhaar Bank Passbook",
  DOMICILE_CERTIFICATE: "Domicile Proof",
  DISABILITY_CERTIFICATE: "Disability Certificate",
  RESEARCH_PROPOSAL: "Research Proposal"
};

export default function SchemeCataloguePage() {
  const [schemes, setSchemes] = useState<ScholarScheme[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Scheme Gap Intelligence Modal State
  const [gapModalScheme, setGapModalScheme] = useState<ScholarScheme | null>(null);
  const [gapModalData, setGapModalData] = useState<SchemeGapIntelligence | null>(null);
  const [loadingGaps, setLoadingGaps] = useState<boolean>(false);

  const handleCheckGaps = async (scheme: ScholarScheme) => {
    setGapModalScheme(scheme);
    setLoadingGaps(true);
    setGapModalData(null);
    try {
      const gaps = await scholarService.getSchemeGapIntelligence(scheme.scheme_code);
      setGapModalData(gaps);
    } catch (err) {
      console.error("Failed to load gap intelligence for scheme:", err);
    } finally {
      setLoadingGaps(false);
    }
  };


  useEffect(() => {
    authService.getCurrentUser().then((user) => setCurrentUser(user));

    // Guaranteed: active_only = true so applicants only see active schemes
    scholarService
      .getSchemes(true)
      .then((data) => {
        setSchemes(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to load schemes:", err);
        setLoading(false);
      });
  }, []);

  const filteredSchemes = schemes.filter((s) => {
    // Only active schemes (defensive client check in addition to backend filter)
    if (!s.is_active) return false;

    // Filter by Study Level
    if (selectedFilter !== "ALL") {
      const level = (s.study_level || "").toUpperCase();
      if (!level.includes(selectedFilter)) {
        return false;
      }
    }

    // Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const codeMatch = s.scheme_code.toLowerCase().includes(q);
      const nameMatch = s.scheme_name.toLowerCase().includes(q);
      const descMatch = (s.description || "").toLowerCase().includes(q);
      const docMatch = (s.required_documents || []).some((doc) => doc.toLowerCase().includes(q));
      return codeMatch || nameMatch || descMatch || docMatch;
    }

    return true;
  });

  const getStatusBadge = (status: string | null | undefined, appNumber: string | null | undefined) => {
    if (!status) {
      return (
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.3rem",
            fontSize: "0.74rem",
            fontWeight: 700,
            color: "#059669",
            backgroundColor: "#ecfdf5",
            border: "1px solid #a7f3d0",
            padding: "0.25rem 0.65rem",
            borderRadius: "9999px"
          }}
        >
          <CheckCircle2 size={13} />
          <span>Applications Open</span>
        </span>
      );
    }

    const s = status.toUpperCase();
    if (s === "SUBMITTED") {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.2rem" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              fontSize: "0.74rem",
              fontWeight: 700,
              color: "#1d4ed8",
              backgroundColor: "#eff6ff",
              border: "1px solid #bfdbfe",
              padding: "0.25rem 0.65rem",
              borderRadius: "9999px"
            }}
          >
            <Clock size={13} />
            <span>Applied &bull; Under Review</span>
          </span>
          {appNumber && (
            <span style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: 600 }}>
              Ref: {appNumber}
            </span>
          )}
        </div>
      );
    }

    if (s.includes("APPROVED") || s.includes("VERIFIED")) {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.2rem" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              fontSize: "0.74rem",
              fontWeight: 700,
              color: "#047857",
              backgroundColor: "#d1fae5",
              border: "1px solid #6ee7b7",
              padding: "0.25rem 0.65rem",
              borderRadius: "9999px"
            }}
          >
            <CheckCircle2 size={13} />
            <span>Eligible &amp; Verified</span>
          </span>
          {appNumber && (
            <span style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: 600 }}>
              Ref: {appNumber}
            </span>
          )}
        </div>
      );
    }

    if (s.includes("DEFICIENT") || s.includes("REJECTED")) {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "0.2rem" }}>
          <span
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.3rem",
              fontSize: "0.74rem",
              fontWeight: 700,
              color: "#b91c1c",
              backgroundColor: "#fef2f2",
              border: "1px solid #fecaca",
              padding: "0.25rem 0.65rem",
              borderRadius: "9999px"
            }}
          >
            <AlertTriangle size={13} />
            <span>Action Required: Deficiency</span>
          </span>
          {appNumber && (
            <span style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: 600 }}>
              Ref: {appNumber}
            </span>
          )}
        </div>
      );
    }

    return (
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "0.3rem",
          fontSize: "0.74rem",
          fontWeight: 700,
          color: "#475569",
          backgroundColor: "#f1f5f9",
          padding: "0.25rem 0.65rem",
          borderRadius: "9999px"
        }}
      >
        <span>Status: {status}</span>
      </span>
    );
  };

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "3.5rem" }}>
      {/* Top Banner */}
      <div
        style={{
          backgroundColor: "#0f172a",
          borderRadius: "16px",
          padding: "2.25rem 2.5rem",
          marginBottom: "2rem",
          color: "#ffffff",
          position: "relative",
          overflow: "hidden",
          boxShadow: "0 10px 15px -3px rgba(0,0,0,0.1)"
        }}
      >
        <div style={{ maxWidth: "820px", position: "relative", zIndex: 1 }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.4rem",
              backgroundColor: "rgba(255,255,255,0.12)",
              padding: "0.25rem 0.75rem",
              borderRadius: "9999px",
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "#93c5fd",
              marginBottom: "0.85rem",
              letterSpacing: "0.03em"
            }}
          >
            <Sparkles size={13} />
            <span>MINISTRY OF TRIBAL AFFAIRS &bull; SCHOLAR-ST PORTAL</span>
          </div>
          <h1 style={{ fontSize: "2rem", fontWeight: 800, margin: "0 0 0.6rem 0", lineHeight: 1.25 }}>
            Statutory ST Scholarship &amp; Fellowship Schemes
          </h1>
          <p style={{ color: "#cbd5e1", fontSize: "0.95rem", lineHeight: 1.5, margin: "0 0 1.25rem 0" }}>
            Select an active scheme tailored to your study program. Your verified applicant profile
            and OCR-verified Scheduled Tribe documents are reused automatically — eliminating repetitive entries.
          </p>

          <div style={{ display: "flex", flexWrap: "wrap", gap: "1rem", fontSize: "0.8rem", color: "#94a3b8" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <Shield size={14} color="#60a5fa" />
              <span>Article 342 Constitutional Verification</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <CheckCircle2 size={14} color="#34d399" />
              <span>Real-time Dynamic Eligibility</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
              <FileText size={14} color="#fbbf24" />
              <span>1-Click Reusable Profile</span>
            </div>
          </div>

          <div style={{ marginTop: "1.25rem" }}>
            <Link
              to="/applicant/cross-scheme-intelligence"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                padding: "0.55rem 1.15rem",
                borderRadius: "8px",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "0.85rem",
                textDecoration: "none",
                boxShadow: "0 2px 8px rgba(37,99,235,0.3)"
              }}
            >
              <Sparkles size={16} />
              <span>Launch Cross-Scheme Intelligence Engine</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      </div>

      {/* Search and Study Level Filter Tabs */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "1rem",
          marginBottom: "1.75rem",
          backgroundColor: "#ffffff",
          padding: "0.85rem 1.25rem",
          borderRadius: "12px",
          border: "1px solid #e2e8f0"
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
          {STUDY_LEVEL_FILTERS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedFilter(tab.id)}
              style={{
                padding: "0.45rem 0.95rem",
                borderRadius: "8px",
                border: "none",
                backgroundColor: selectedFilter === tab.id ? "#2563eb" : "#f1f5f9",
                color: selectedFilter === tab.id ? "#ffffff" : "#475569",
                fontWeight: 700,
                fontSize: "0.82rem",
                cursor: "pointer",
                transition: "all 0.15s"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div style={{ position: "relative", minWidth: "260px" }}>
          <Search size={15} style={{ position: "absolute", left: "10px", top: "11px", color: "#94a3b8" }} />
          <input
            type="text"
            placeholder="Search active schemes or required docs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              width: "100%",
              padding: "0.5rem 0.75rem 0.5rem 2.1rem",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "0.82rem",
              outline: "none"
            }}
          />
        </div>
      </div>

      {/* Scheme Cards Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem 0", color: "#64748b" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              border: "3px solid #e2e8f0",
              borderTopColor: "#2563eb",
              borderRadius: "50%",
              margin: "0 auto 1rem auto",
              animation: "spin 1s linear infinite"
            }}
          />
          <div>Loading active scholarship schemes from Supabase Cloud...</div>
        </div>
      ) : filteredSchemes.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "4rem 2rem",
            backgroundColor: "#ffffff",
            borderRadius: "16px",
            border: "1px dashed #cbd5e1"
          }}
        >
          <Award size={48} style={{ color: "#94a3b8", margin: "0 auto 0.75rem auto" }} />
          <h3 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#1e293b", margin: "0 0 0.35rem 0" }}>
            No Active Schemes Found
          </h3>
          <p style={{ color: "#64748b", fontSize: "0.88rem", maxWidth: "480px", margin: "0 auto" }}>
            No active schemes matched your filter or search criteria. Please try another category or check back during the next admission cycle.
          </p>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: "1.75rem" }}>
          {filteredSchemes.map((scheme) => {
            const hasApplied = Boolean(scheme.user_application_status);

            return (
              <div
                key={scheme.scheme_code}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "14px",
                  border: hasApplied ? "2px solid #93c5fd" : "1px solid #e2e8f0",
                  padding: "1.75rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  transition: "transform 0.15s, box-shadow 0.15s",
                  position: "relative"
                }}
              >
                <div>
                  {/* Card Header: Scheme Code & Application Status */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      marginBottom: "0.85rem",
                      gap: "0.5rem"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span
                        style={{
                          fontSize: "0.82rem",
                          fontWeight: 800,
                          padding: "0.25rem 0.7rem",
                          borderRadius: "6px",
                          backgroundColor: "#eff6ff",
                          color: "#1d4ed8",
                          letterSpacing: "0.03em"
                        }}
                      >
                        {scheme.scheme_code}
                      </span>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 600,
                          color: "#64748b",
                          padding: "0.2rem 0.5rem",
                          borderRadius: "4px",
                          backgroundColor: "#f8fafc",
                          border: "1px solid #f1f5f9"
                        }}
                      >
                        {scheme.academic_year || "2026-2027"}
                      </span>
                    </div>

                    {/* Status badge: Applied vs Open */}
                    {getStatusBadge(scheme.user_application_status, scheme.user_application_number)}
                  </div>

                  {/* Scheme Full Name */}
                  <h3
                    style={{
                      fontSize: "1.2rem",
                      fontWeight: 700,
                      color: "#0f172a",
                      margin: "0 0 0.35rem 0",
                      lineHeight: 1.35
                    }}
                  >
                    {scheme.scheme_name}
                  </h3>

                  <div style={{ fontSize: "0.76rem", color: "#64748b", marginBottom: "0.85rem", fontWeight: 500 }}>
                    {scheme.ministry_or_department} &bull; {scheme.slots_available || 100} Quota Seats
                  </div>

                  {/* Short Description */}
                  <p
                    style={{
                      fontSize: "0.84rem",
                      color: "#475569",
                      lineHeight: 1.5,
                      marginBottom: "1.25rem"
                    }}
                  >
                    {scheme.description}
                  </p>

                  {/* Eligibility Summary Section */}
                  <div
                    style={{
                      backgroundColor: "#f8fafc",
                      borderRadius: "10px",
                      padding: "1rem",
                      border: "1px solid #f1f5f9",
                      marginBottom: "1.25rem"
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        color: "#1e293b",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        marginBottom: "0.6rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem"
                      }}
                    >
                      <Sliders size={13} color="#2563eb" />
                      <span>Eligibility Summary</span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "0.45rem", fontSize: "0.78rem" }}>
                      {/* Target Category */}
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#64748b" }}>Target Category:</span>
                        <strong style={{ color: "#0f172a" }}>
                          {scheme.target_category || "Scheduled Tribe (ST) - Art. 342"}
                        </strong>
                      </div>

                      {/* Income Limits */}
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#64748b" }}>Family Income Ceiling:</span>
                        <strong style={{ color: "#0f172a" }}>
                          {scheme.max_family_income
                            ? `Up to ₹${scheme.max_family_income.toLocaleString()} / annum`
                            : "No Income Ceiling"}
                        </strong>
                      </div>

                      {/* Academic Requirements */}
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#64748b" }}>Academic Requirement:</span>
                        <strong style={{ color: "#0f172a" }}>
                          {scheme.min_academic_percentage
                            ? `Min ${scheme.min_academic_percentage}% aggregate marks`
                            : "Confirmed Degree Admission"}
                        </strong>
                      </div>

                      {/* Age Limit */}
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span style={{ color: "#64748b" }}>Age Limit:</span>
                        <strong style={{ color: "#0f172a" }}>
                          {scheme.max_age_limit ? `Up to ${scheme.max_age_limit} years` : "No Upper Age Limit"}
                        </strong>
                      </div>

                      {/* Other Conditions */}
                      {scheme.other_conditions && scheme.other_conditions.length > 0 && (
                        <div
                          style={{
                            borderTop: "1px dashed #e2e8f0",
                            paddingTop: "0.45rem",
                            marginTop: "0.2rem",
                            fontSize: "0.74rem",
                            color: "#475569"
                          }}
                        >
                          <strong style={{ color: "#334155" }}>Special Conditions:</strong>{" "}
                          {scheme.other_conditions.join("; ")}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Required Documents Section */}
                  <div style={{ marginBottom: "1.25rem" }}>
                    <div
                      style={{
                        fontSize: "0.72rem",
                        fontWeight: 800,
                        color: "#475569",
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        marginBottom: "0.45rem",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem"
                      }}
                    >
                      <FileText size={13} color="#2563eb" />
                      <span>Required Documents ({scheme.required_documents?.length || 4})</span>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                      {scheme.required_documents && scheme.required_documents.length > 0 ? (
                        scheme.required_documents.map((docKey) => {
                          const label = DOCUMENT_LABELS[docKey] || docKey.replace(/_/g, " ");
                          return (
                            <span
                              key={docKey}
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "0.25rem",
                                fontSize: "0.72rem",
                                padding: "0.25rem 0.55rem",
                                borderRadius: "6px",
                                backgroundColor: "#f1f5f9",
                                color: "#334155",
                                fontWeight: 500,
                                border: "1px solid #e2e8f0"
                              }}
                            >
                              <span>📄</span>
                              <span>{label}</span>
                            </span>
                          );
                        })
                      ) : (
                        <>
                          <span style={{ fontSize: "0.72rem", padding: "0.2rem 0.5rem", borderRadius: "4px", backgroundColor: "#f1f5f9", color: "#334155" }}>
                            📄 ST Certificate (Art. 342)
                          </span>
                          <span style={{ fontSize: "0.72rem", padding: "0.2rem 0.5rem", borderRadius: "4px", backgroundColor: "#f1f5f9", color: "#334155" }}>
                            📄 Income Certificate
                          </span>
                          <span style={{ fontSize: "0.72rem", padding: "0.2rem 0.5rem", borderRadius: "4px", backgroundColor: "#f1f5f9", color: "#334155" }}>
                            📄 Degree Marksheets
                          </span>
                          <span style={{ fontSize: "0.72rem", padding: "0.2rem 0.5rem", borderRadius: "4px", backgroundColor: "#f1f5f9", color: "#334155" }}>
                            📄 Admission Offer
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer Action Bar */}
                <div
                  style={{
                    borderTop: "1px solid #f1f5f9",
                    paddingTop: "1.1rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "0.75rem"
                  }}
                >
                  <div style={{ fontSize: "0.74rem", color: "#64748b" }}>
                    {scheme.rules_count || 3} cloud rules verified dynamically
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <button
                      type="button"
                      onClick={() => handleCheckGaps(scheme)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        padding: "0.55rem 0.85rem",
                        borderRadius: "8px",
                        backgroundColor: "#f8fafc",
                        border: "1px solid #cbd5e1",
                        color: "#475569",
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      <Sparkles size={14} color="#7c3aed" />
                      <span>Check Gaps</span>
                    </button>

                    {hasApplied ? (
                      <Link
                        to={`/applicant/applications`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.4rem",
                          padding: "0.55rem 1.15rem",
                          borderRadius: "8px",
                          backgroundColor: "#f1f5f9",
                          color: "#1e293b",
                          fontSize: "0.82rem",
                          fontWeight: 700,
                          textDecoration: "none",
                          border: "1px solid #cbd5e1"
                        }}
                      >
                        <Eye size={15} />
                        <span>View Application</span>
                      </Link>
                    ) : (
                      <Link
                        to={`/applicant/apply?scheme=${scheme.scheme_code}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.45rem",
                          padding: "0.55rem 1.25rem",
                          borderRadius: "8px",
                          backgroundColor: "#2563eb",
                          color: "#ffffff",
                          fontSize: "0.84rem",
                          fontWeight: 700,
                          textDecoration: "none",
                          boxShadow: "0 2px 4px rgba(37,99,235,0.25)"
                        }}
                      >
                        <span>Apply Now</span>
                        <ArrowRight size={15} />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Gap Intelligence Audit Modal Dialog */}
      {gapModalScheme && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "1rem"
          }}
          onClick={() => setGapModalScheme(null)}
        >
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "14px",
              maxWidth: "920px",
              width: "100%",
              maxHeight: "90vh",
              overflowY: "auto",
              padding: "1.75rem",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",
              position: "relative"
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, textTransform: "uppercase", color: "#7c3aed", backgroundColor: "#f5f3ff", padding: "0.2rem 0.55rem", borderRadius: "4px" }}>
                  Scheme Gap Intelligence Audit
                </span>
                <h2 style={{ margin: "0.35rem 0 0.15rem 0", fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>
                  {gapModalScheme.scheme_name} ({gapModalScheme.scheme_code})
                </h2>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "#64748b" }}>
                  Active Supabase rule check for {currentUser?.full_name || "Applicant"}. Evaluates Requirement &rarr; Status &rarr; Gap &rarr; Action.
                </p>
              </div>

              <button
                onClick={() => setGapModalScheme(null)}
                style={{
                  background: "transparent",
                  border: "none",
                  fontSize: "1.5rem",
                  cursor: "pointer",
                  color: "#64748b",
                  lineHeight: 1
                }}
              >
                &times;
              </button>
            </div>

            {loadingGaps ? (
              <div style={{ textAlign: "center", padding: "3rem", color: "#64748b" }}>
                <Clock size={28} style={{ margin: "0 auto 0.75rem", color: "#7c3aed" }} />
                <div style={{ fontWeight: 600, fontSize: "0.95rem" }}>Evaluating Active Scheme Rules in Supabase...</div>
              </div>
            ) : (
              <SchemeGapViewer
                schemeCode={gapModalScheme.scheme_code}
                schemeName={gapModalScheme.scheme_name}
                gapIntelligence={gapModalData}
                showFilterTabs={true}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
