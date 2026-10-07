import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  FileText,
  TrendingDown,
  DollarSign,
  GraduationCap,
  Award,
  CheckCircle2,
  XCircle,
  ArrowRight,
  ExternalLink,
  UploadCloud,
  FileCheck2,
  Info,
  Clock,
  ShieldCheck,
  ChevronRight
} from "lucide-react";
import type { SchemeGapItem, SchemeGapIntelligence } from "../../types/scholar";

interface SchemeGapViewerProps {
  schemeCode?: string;
  schemeName?: string;
  gapIntelligence?: SchemeGapIntelligence | null;
  gaps?: SchemeGapItem[];
  title?: string;
  showFilterTabs?: boolean;
  compact?: boolean;
}

export const SchemeGapViewer: React.FC<SchemeGapViewerProps> = ({
  schemeCode,
  schemeName,
  gapIntelligence,
  gaps: propGaps,
  title,
  showFilterTabs = true,
  compact = false
}) => {
  const [selectedType, setSelectedType] = useState<string>("ALL");

  // Determine gap items
  const allGaps: SchemeGapItem[] =
    gapIntelligence?.gaps || propGaps || [];

  if (allGaps.length === 0) {
    return (
      <div
        style={{
          padding: "1.25rem 1.5rem",
          backgroundColor: "#f0fdf4",
          border: "1px solid #bbf7d0",
          borderRadius: "10px",
          display: "flex",
          alignItems: "center",
          gap: "0.85rem",
          color: "#166534"
        }}
      >
        <CheckCircle2 size={24} style={{ color: "#16a34a", flexShrink: 0 }} />
        <div>
          <div style={{ fontWeight: 700, fontSize: "0.92rem" }}>
            No Statutory Eligibility Gaps Identified
          </div>
          <div style={{ fontSize: "0.82rem", opacity: 0.9, marginTop: "0.15rem" }}>
            Candidate verified profile and uploaded evidence satisfy all active scheme rules in Supabase.
          </div>
        </div>
      </div>
    );
  }

  // Filter items
  const filteredGaps = allGaps.filter((gap) => {
    if (selectedType === "ALL") return true;
    if (selectedType === "DOCUMENTS") return gap.gap_type === "MISSING_DOCUMENT";
    if (selectedType === "ACADEMIC") return gap.gap_type === "ACADEMIC_REQUIREMENT_UNMET";
    if (selectedType === "INCOME") return gap.gap_type === "INCOME_REQUIREMENT_UNMET";
    if (selectedType === "QUALIFICATION") return gap.gap_type === "QUALIFICATION_MISSING";
    if (selectedType === "CERTIFICATE") return gap.gap_type === "CERTIFICATE_INCOMPLETE";
    return true;
  });

  const getGapTypeBadge = (type: string) => {
    switch (type) {
      case "MISSING_DOCUMENT":
        return {
          label: "Missing Document",
          icon: <FileText size={14} />,
          bg: "#eff6ff",
          border: "#bfdbfe",
          text: "#1d4ed8"
        };
      case "ACADEMIC_REQUIREMENT_UNMET":
        return {
          label: "Academic Requirement Unmet",
          icon: <GraduationCap size={14} />,
          bg: "#fef3c7",
          border: "#fde68a",
          text: "#b45309"
        };
      case "INCOME_REQUIREMENT_UNMET":
        return {
          label: "Income Ceiling Exceeded",
          icon: <DollarSign size={14} />,
          bg: "#fef2f2",
          border: "#fecaca",
          text: "#b91c1c"
        };
      case "QUALIFICATION_MISSING":
        return {
          label: "Required Qualification Missing",
          icon: <Award size={14} />,
          bg: "#f3e8ff",
          border: "#e9d5ff",
          text: "#7e22ce"
        };
      case "CERTIFICATE_INCOMPLETE":
        return {
          label: "Certificate Incomplete",
          icon: <AlertTriangle size={14} />,
          bg: "#fff7ed",
          border: "#fed7aa",
          text: "#c2410c"
        };
      default:
        return {
          label: "Statutory Condition",
          icon: <Info size={14} />,
          bg: "#f1f5f9",
          border: "#cbd5e1",
          text: "#475569"
        };
    }
  };

  const getActionLink = (gap: SchemeGapItem) => {
    if (gap.gap_type === "MISSING_DOCUMENT" || gap.gap_type === "CERTIFICATE_INCOMPLETE") {
      return {
        text: "Upload in Document Center",
        url: "/applicant/documents",
        icon: <UploadCloud size={13} />
      };
    }
    if (gap.gap_type === "ACADEMIC_REQUIREMENT_UNMET" || gap.gap_type === "QUALIFICATION_MISSING") {
      return {
        text: "Update Academic Profile",
        url: "/applicant/profile",
        icon: <GraduationCap size={13} />
      };
    }
    if (gap.gap_type === "INCOME_REQUIREMENT_UNMET") {
      return {
        text: "Explore Other Schemes",
        url: "/applicant/schemes",
        icon: <ExternalLink size={13} />
      };
    }
    return {
      text: "Review Profile",
      url: "/applicant/profile",
      icon: <ArrowRight size={13} />
    };
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      {/* Header / Summary */}
      {!compact && (
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "0.75rem",
            paddingBottom: "0.75rem",
            borderBottom: "1px solid #e2e8f0"
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "#2563eb",
                  backgroundColor: "#eff6ff",
                  padding: "0.2rem 0.55rem",
                  borderRadius: "4px"
                }}
              >
                Scheme Gap Intelligence
              </span>
              {schemeCode && (
                <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0f172a" }}>
                  {schemeCode} &bull; {schemeName || "Statutory Evaluation"}
                </span>
              )}
            </div>
            <h3
              style={{
                margin: "0.35rem 0 0.15rem 0",
                fontSize: "1.1rem",
                fontWeight: 800,
                color: "#0f172a"
              }}
            >
              {title || "Identified Statutory Eligibility Gaps"}
            </h3>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "#64748b" }}>
              Evidence-based analysis comparing applicant facts against active rules in Supabase.
            </p>
          </div>

          <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
            <span
              style={{
                fontSize: "0.76rem",
                padding: "0.3rem 0.65rem",
                borderRadius: "6px",
                backgroundColor: "#fef2f2",
                color: "#991b1b",
                fontWeight: 700,
                border: "1px solid #fecaca"
              }}
            >
              {allGaps.filter((g) => g.is_disqualifying).length} Disqualifying
            </span>
            <span
              style={{
                fontSize: "0.76rem",
                padding: "0.3rem 0.65rem",
                borderRadius: "6px",
                backgroundColor: "#fffbeb",
                color: "#92400e",
                fontWeight: 700,
                border: "1px solid #fde68a"
              }}
            >
              {allGaps.filter((g) => !g.is_disqualifying).length} Resolvable Gaps
            </span>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      {showFilterTabs && (
        <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
          {[
            { id: "ALL", label: `All Gaps (${allGaps.length})` },
            {
              id: "DOCUMENTS",
              label: `Documents (${allGaps.filter((g) => g.gap_type === "MISSING_DOCUMENT").length})`
            },
            {
              id: "ACADEMIC",
              label: `Academic (${allGaps.filter((g) => g.gap_type === "ACADEMIC_REQUIREMENT_UNMET").length})`
            },
            {
              id: "INCOME",
              label: `Income (${allGaps.filter((g) => g.gap_type === "INCOME_REQUIREMENT_UNMET").length})`
            },
            {
              id: "QUALIFICATION",
              label: `Qualification (${allGaps.filter((g) => g.gap_type === "QUALIFICATION_MISSING").length})`
            },
            {
              id: "CERTIFICATE",
              label: `Certificate (${allGaps.filter((g) => g.gap_type === "CERTIFICATE_INCOMPLETE").length})`
            }
          ]
            .filter((tab) => tab.id === "ALL" || !tab.label.includes("(0)"))
            .map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedType(tab.id)}
                style={{
                  padding: "0.35rem 0.75rem",
                  borderRadius: "6px",
                  fontSize: "0.76rem",
                  fontWeight: selectedType === tab.id ? 700 : 500,
                  backgroundColor: selectedType === tab.id ? "#0f172a" : "#f1f5f9",
                  color: selectedType === tab.id ? "#ffffff" : "#475569",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.15s ease"
                }}
              >
                {tab.label}
              </button>
            ))}
        </div>
      )}

      {/* Gaps List - 4-stage chain presentation */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.9rem" }}>
        {filteredGaps.map((gap, index) => {
          const typeBadge = getGapTypeBadge(gap.gap_type);
          const actionLink = getActionLink(gap);

          return (
            <div
              key={gap.gap_id || index}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "10px",
                border: `1px solid ${gap.is_disqualifying ? "#fecaca" : "#fed7aa"}`,
                boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
                overflow: "hidden"
              }}
            >
              {/* Gap Header */}
              <div
                style={{
                  padding: "0.75rem 1rem",
                  backgroundColor: gap.is_disqualifying ? "#fff5f5" : "#fffaf0",
                  borderBottom: `1px solid ${gap.is_disqualifying ? "#fee2e2" : "#ffedd5"}`,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.5rem"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  <span
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.35rem",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      padding: "0.25rem 0.6rem",
                      borderRadius: "6px",
                      backgroundColor: typeBadge.bg,
                      color: typeBadge.text,
                      border: `1px solid ${typeBadge.border}`
                    }}
                  >
                    {typeBadge.icon}
                    {typeBadge.label}
                  </span>

                  <span style={{ fontSize: "0.86rem", fontWeight: 700, color: "#0f172a" }}>
                    {gap.rule_name}
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <span
                    style={{
                      fontSize: "0.68rem",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      padding: "0.2rem 0.5rem",
                      borderRadius: "4px",
                      backgroundColor: gap.is_disqualifying ? "#dc2626" : "#d97706",
                      color: "#ffffff"
                    }}
                  >
                    {gap.is_disqualifying ? "Disqualifying Condition" : "Resolvable Deficiency"}
                  </span>
                </div>
              </div>

              {/* 4-STAGE TRANSPARENT FLOW */}
              <div style={{ padding: "1rem" }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                    gap: "0.75rem",
                    alignItems: "stretch"
                  }}
                >
                  {/* STAGE 1: REQUIREMENT */}
                  <div
                    style={{
                      padding: "0.85rem",
                      borderRadius: "8px",
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      flexDirection: "column"
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        fontSize: "0.7rem",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        color: "#475569",
                        marginBottom: "0.45rem"
                      }}
                    >
                      <span
                        style={{
                          width: "16px",
                          height: "16px",
                          borderRadius: "50%",
                          backgroundColor: "#cbd5e1",
                          color: "#1e293b",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.65rem",
                          fontWeight: 800
                        }}
                      >
                        1
                      </span>
                      <span>Requirement</span>
                    </div>

                    <div
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        color: "#0f172a",
                        lineHeight: 1.4,
                        flex: 1
                      }}
                    >
                      {gap.requirement}
                    </div>

                    {gap.statutory_reference && (
                      <div
                        style={{
                          marginTop: "0.5rem",
                          fontSize: "0.68rem",
                          color: "#64748b",
                          fontStyle: "italic"
                        }}
                      >
                        Ref: {gap.statutory_reference}
                      </div>
                    )}
                  </div>

                  {/* STAGE 2: APPLICANT STATUS */}
                  <div
                    style={{
                      padding: "0.85rem",
                      borderRadius: "8px",
                      backgroundColor: "#f8fafc",
                      border: "1px solid #e2e8f0",
                      display: "flex",
                      flexDirection: "column"
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        fontSize: "0.7rem",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        color: "#0284c7",
                        marginBottom: "0.45rem"
                      }}
                    >
                      <span
                        style={{
                          width: "16px",
                          height: "16px",
                          borderRadius: "50%",
                          backgroundColor: "#bae6fd",
                          color: "#0369a1",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.65rem",
                          fontWeight: 800
                        }}
                      >
                        2
                      </span>
                      <span>Applicant Status</span>
                    </div>

                    <div
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        color: "#0369a1",
                        lineHeight: 1.4,
                        flex: 1
                      }}
                    >
                      {gap.applicant_status || "Not Provided in Dossier"}
                    </div>

                    <div
                      style={{
                        marginTop: "0.5rem",
                        fontSize: "0.68rem",
                        color: "#64748b"
                      }}
                    >
                      Fact verified from dossier / profile
                    </div>
                  </div>

                  {/* STAGE 3: GAP */}
                  <div
                    style={{
                      padding: "0.85rem",
                      borderRadius: "8px",
                      backgroundColor: gap.is_disqualifying ? "#fff5f5" : "#fffbeb",
                      border: `1px solid ${gap.is_disqualifying ? "#fecaca" : "#fde68a"}`,
                      display: "flex",
                      flexDirection: "column"
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        fontSize: "0.7rem",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        color: gap.is_disqualifying ? "#dc2626" : "#d97706",
                        marginBottom: "0.45rem"
                      }}
                    >
                      <span
                        style={{
                          width: "16px",
                          height: "16px",
                          borderRadius: "50%",
                          backgroundColor: gap.is_disqualifying ? "#fee2e2" : "#fef3c7",
                          color: gap.is_disqualifying ? "#991b1b" : "#92400e",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.65rem",
                          fontWeight: 800
                        }}
                      >
                        3
                      </span>
                      <span>Identified Gap</span>
                    </div>

                    <div
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: 700,
                        color: gap.is_disqualifying ? "#991b1b" : "#92400e",
                        lineHeight: 1.4,
                        flex: 1
                      }}
                    >
                      {gap.gap}
                    </div>

                    <div
                      style={{
                        marginTop: "0.5rem",
                        fontSize: "0.68rem",
                        color: gap.is_disqualifying ? "#b91c1c" : "#b45309"
                      }}
                    >
                      {gap.is_disqualifying ? "Mandatory statutory barrier" : "Actionable shortfall"}
                    </div>
                  </div>

                  {/* STAGE 4: SUGGESTED ACTION */}
                  <div
                    style={{
                      padding: "0.85rem",
                      borderRadius: "8px",
                      backgroundColor: "#f0fdf4",
                      border: "1px solid #bbf7d0",
                      display: "flex",
                      flexDirection: "column"
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        fontSize: "0.7rem",
                        fontWeight: 800,
                        textTransform: "uppercase",
                        letterSpacing: "0.04em",
                        color: "#16a34a",
                        marginBottom: "0.45rem"
                      }}
                    >
                      <span
                        style={{
                          width: "16px",
                          height: "16px",
                          borderRadius: "50%",
                          backgroundColor: "#dcfce7",
                          color: "#15803d",
                          display: "inline-flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "0.65rem",
                          fontWeight: 800
                        }}
                      >
                        4
                      </span>
                      <span>Suggested Action</span>
                    </div>

                    <div
                      style={{
                        fontSize: "0.82rem",
                        fontWeight: 600,
                        color: "#166534",
                        lineHeight: 1.4,
                        flex: 1
                      }}
                    >
                      {gap.suggested_action}
                    </div>

                    <div style={{ marginTop: "0.6rem" }}>
                      <Link
                        to={actionLink.url}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          fontSize: "0.74rem",
                          fontWeight: 700,
                          color: "#15803d",
                          textDecoration: "none",
                          padding: "0.25rem 0.55rem",
                          borderRadius: "4px",
                          backgroundColor: "#dcfce7",
                          border: "1px solid #86efac"
                        }}
                      >
                        {actionLink.icon}
                        <span>{actionLink.text}</span>
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Informational Guidance Footer */}
      <div
        style={{
          padding: "0.75rem 1rem",
          backgroundColor: "#f8fafc",
          border: "1px solid #e2e8f0",
          borderRadius: "8px",
          display: "flex",
          alignItems: "center",
          gap: "0.6rem",
          fontSize: "0.78rem",
          color: "#64748b"
        }}
      >
        <ShieldCheck size={18} style={{ color: "#2563eb", flexShrink: 0 }} />
        <span>
          <strong>Informational & Evidence-Based Notice:</strong> Gap Intelligence strictly evaluates active statutory rules stored in Supabase. Eligibility is never determined artificially. Applicants choose which schemes to apply for.
        </span>
      </div>
    </div>
  );
};
