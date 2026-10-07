import React, { useState } from "react";
import {
  ShieldAlert,
  AlertTriangle,
  CheckCircle,
  XCircle,
  HelpCircle,
  ArrowRight,
  Users,
  Layers,
  FileCheck2,
  X,
  ExternalLink,
  Info,
  Check
} from "lucide-react";
import type { RuleImpactAnalysisResponse, AffectedApplicationItem } from "../../types/scholar";

interface RuleImpactModalProps {
  impact: RuleImpactAnalysisResponse | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void> | void;
  isConfirming?: boolean;
  confirmButtonText?: string;
}

export const RuleImpactModal: React.FC<RuleImpactModalProps> = ({
  impact,
  isOpen,
  onClose,
  onConfirm,
  isConfirming = false,
  confirmButtonText = "Confirm & Activate Rule"
}) => {
  const [filterEffect, setFilterEffect] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState<string>("");

  if (!isOpen || !impact) return null;

  const {
    scheme_code,
    scheme_name,
    rule_code,
    rule_name,
    field_name,
    is_status_toggle,
    is_simulated_cohort,
    previous_condition,
    new_condition,
    impact_metrics,
    impact_narrative,
    affected_applications,
    guardrail_notice
  } = impact;

  // Filter affected applications
  const filteredApps = (affected_applications || []).filter((app: AffectedApplicationItem) => {
    if (filterEffect !== "ALL" && app.impact_effect !== filterEffect) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = app.application_number?.toLowerCase().includes(q);
      const matchName = app.applicant_name?.toLowerCase().includes(q);
      const matchStatus = app.current_status?.toLowerCase().includes(q);
      return matchNum || matchName || matchStatus;
    }
    return true;
  });

  return (
    <div
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        backgroundColor: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1100,
        padding: "1rem"
      }}
    >
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "20px",
          width: "100%",
          maxWidth: "920px",
          maxHeight: "92vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 25px 50px -12px rgba(15, 23, 42, 0.25)",
          border: "1px solid #cbd5e1",
          overflow: "hidden"
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: "1.25rem 1.75rem",
            backgroundColor: "#0f172a",
            color: "#ffffff",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            borderBottom: "1px solid #334155"
          }}
        >
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.35rem" }}>
              <span
                style={{
                  backgroundColor: "#7e22ce",
                  color: "#ffffff",
                  fontSize: "0.72rem",
                  fontWeight: 800,
                  padding: "0.2rem 0.6rem",
                  borderRadius: "6px",
                  letterSpacing: "0.04em",
                  textTransform: "uppercase"
                }}
              >
                Rule Impact Preview
              </span>
              <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>
                Pre-Activation Deterministic Analysis
              </span>
            </div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#ffffff", margin: 0 }}>
              Preview Rule Impact on Existing Applications
            </h2>
            <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginTop: "0.4rem", flexWrap: "wrap" }}>
              <span style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>
                <strong>Scheme:</strong> {scheme_name} (<code style={{ color: "#38bdf8" }}>{scheme_code}</code>)
              </span>
              <span style={{ fontSize: "0.8rem", color: "#cbd5e1" }}>
                <strong>Rule:</strong> {rule_name} (<code style={{ color: "#a855f7" }}>{rule_code}</code>)
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              background: "rgba(255, 255, 255, 0.1)",
              border: "none",
              borderRadius: "8px",
              color: "#cbd5e1",
              padding: "0.4rem",
              cursor: "pointer"
            }}
            title="Close Preview"
          >
            <X size={20} />
          </button>
        </div>

        {/* Scrollable Body */}
        <div style={{ padding: "1.5rem 1.75rem", overflowY: "auto", flex: 1, display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          
          {/* Statutory Guardrail Notice */}
          <div
            style={{
              backgroundColor: "#fef3c7",
              border: "1px solid #fde68a",
              borderRadius: "12px",
              padding: "0.85rem 1.15rem",
              display: "flex",
              alignItems: "flex-start",
              gap: "0.85rem"
            }}
          >
            <ShieldAlert size={22} style={{ color: "#b45309", flexShrink: 0, marginTop: "2px" }} />
            <div>
              <div style={{ fontSize: "0.84rem", fontWeight: 700, color: "#92400e", marginBottom: "0.15rem" }}>
                Statutory Decision Protection Guardrail
              </div>
              <p style={{ fontSize: "0.78rem", color: "#78350f", margin: 0, lineHeight: 1.45 }}>
                {guardrail_notice ||
                  "This preview does not automatically change final decisions on existing application records. Applications with criteria shifts are flagged for Verification Officer re-evaluation in accordance with Ministry guidelines."}
              </p>
            </div>
          </div>

          {/* Condition Comparison Grid */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr auto 1fr",
              gap: "0.75rem",
              alignItems: "center"
            }}
          >
            {/* Previous Condition */}
            <div
              style={{
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "1rem 1.15rem"
              }}
            >
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                Previous Condition {previous_condition.active ? "(Active)" : "(Inactive)"}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <span
                  style={{
                    backgroundColor: previous_condition.active ? "#e0f2fe" : "#f1f5f9",
                    color: previous_condition.active ? "#0369a1" : "#64748b",
                    padding: "0.25rem 0.6rem",
                    borderRadius: "6px",
                    fontFamily: "monospace",
                    fontSize: "0.85rem",
                    fontWeight: 700
                  }}
                >
                  {field_name} {previous_condition.operator} {previous_condition.expected_value}
                </span>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    padding: "0.2rem 0.5rem",
                    borderRadius: "4px",
                    backgroundColor: previous_condition.active ? "#dcfce7" : "#fee2e2",
                    color: previous_condition.active ? "#15803d" : "#991b1b"
                  }}
                >
                  {previous_condition.active ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>
              <div style={{ fontSize: "0.76rem", color: "#475569", lineHeight: 1.4 }}>
                <strong>Requirement:</strong> {previous_condition.requirement || "No formal requirement specified."}
              </div>
            </div>

            {/* Shift Arrow */}
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "0 0.25rem" }}>
              <div
                style={{
                  width: "36px",
                  height: "36px",
                  borderRadius: "50%",
                  backgroundColor: "#f3e8ff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#7e22ce"
                }}
              >
                <ArrowRight size={18} />
              </div>
            </div>

            {/* New Condition */}
            <div
              style={{
                backgroundColor: "#faf5ff",
                border: "1px solid #e9d5ff",
                borderRadius: "12px",
                padding: "1rem 1.15rem"
              }}
            >
              <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#7e22ce", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                Proposed New Condition {new_condition.active ? "(Active)" : "(Inactive)"}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                <span
                  style={{
                    backgroundColor: new_condition.active ? "#f3e8ff" : "#f1f5f9",
                    color: new_condition.active ? "#6b21a8" : "#64748b",
                    padding: "0.25rem 0.6rem",
                    borderRadius: "6px",
                    fontFamily: "monospace",
                    fontSize: "0.85rem",
                    fontWeight: 700
                  }}
                >
                  {field_name} {new_condition.operator} {new_condition.expected_value}
                </span>
                <span
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    padding: "0.2rem 0.5rem",
                    borderRadius: "4px",
                    backgroundColor: new_condition.active ? "#dcfce7" : "#fee2e2",
                    color: new_condition.active ? "#15803d" : "#991b1b"
                  }}
                >
                  {new_condition.active ? "ACTIVE" : "INACTIVE"}
                </span>
              </div>
              <div style={{ fontSize: "0.76rem", color: "#581c87", lineHeight: 1.4 }}>
                <strong>Requirement:</strong> {new_condition.requirement || "No formal requirement specified."}
              </div>
            </div>
          </div>

          {/* Metrics Summary Strip */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(5, 1fr)",
              gap: "0.75rem"
            }}
          >
            {/* Total Evaluated */}
            <div
              style={{
                backgroundColor: "#ffffff",
                border: "1px solid #e2e8f0",
                borderRadius: "10px",
                padding: "0.85rem",
                textAlign: "center"
              }}
            >
              <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                Evaluated
              </div>
              <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "#0f172a", margin: "0.2rem 0" }}>
                {impact_metrics.total_applications_evaluated}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#94a3b8" }}>
                {is_simulated_cohort ? "Representative Cohort" : "Total Scheme Applications"}
              </div>
            </div>

            {/* Total Affected */}
            <div
              style={{
                backgroundColor: impact_metrics.total_affected_applications > 0 ? "#eff6ff" : "#f8fafc",
                border: `1px solid ${impact_metrics.total_affected_applications > 0 ? "#bfdbfe" : "#e2e8f0"}`,
                borderRadius: "10px",
                padding: "0.85rem",
                textAlign: "center"
              }}
            >
              <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#1e40af", textTransform: "uppercase" }}>
                Total Affected
              </div>
              <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "#1d4ed8", margin: "0.2rem 0" }}>
                {impact_metrics.total_affected_applications}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#3b82f6" }}>
                Criteria Result Shifted
              </div>
            </div>

            {/* Would Qualify */}
            <div
              style={{
                backgroundColor: "#f0fdf4",
                border: "1px solid #bbf7d0",
                borderRadius: "10px",
                padding: "0.85rem",
                textAlign: "center"
              }}
            >
              <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#15803d", textTransform: "uppercase" }}>
                Newly Compliant
              </div>
              <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "#16a34a", margin: "0.2rem 0" }}>
                {impact_metrics.newly_eligible_count}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#22c55e" }}>
                Would Now Qualify
              </div>
            </div>

            {/* Newly Deficient */}
            <div
              style={{
                backgroundColor: impact_metrics.newly_deficient_count > 0 ? "#fef2f2" : "#f8fafc",
                border: `1px solid ${impact_metrics.newly_deficient_count > 0 ? "#fecaca" : "#e2e8f0"}`,
                borderRadius: "10px",
                padding: "0.85rem",
                textAlign: "center"
              }}
            >
              <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#b91c1c", textTransform: "uppercase" }}>
                Newly Deficient
              </div>
              <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "#dc2626", margin: "0.2rem 0" }}>
                {impact_metrics.newly_deficient_count}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#ef4444" }}>
                Would Fail Criteria
              </div>
            </div>

            {/* Requires Re-evaluation */}
            <div
              style={{
                backgroundColor: "#fffbeb",
                border: "1px solid #fde68a",
                borderRadius: "10px",
                padding: "0.85rem",
                textAlign: "center"
              }}
            >
              <div style={{ fontSize: "0.7rem", fontWeight: 700, color: "#b45309", textTransform: "uppercase" }}>
                Re-evaluation Flagged
              </div>
              <div style={{ fontSize: "1.45rem", fontWeight: 800, color: "#d97706", margin: "0.2rem 0" }}>
                {impact_metrics.requires_reevaluation_count}
              </div>
              <div style={{ fontSize: "0.7rem", color: "#f59e0b" }}>
                For Verification Officer
              </div>
            </div>
          </div>

          {/* Narrative Summary */}
          {impact_narrative && (
            <div
              style={{
                backgroundColor: "#f8fafc",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                padding: "0.85rem 1.15rem",
                display: "flex",
                alignItems: "center",
                gap: "0.75rem"
              }}
            >
              <Info size={18} style={{ color: "#64748b", flexShrink: 0 }} />
              <div style={{ fontSize: "0.8rem", color: "#334155", lineHeight: 1.45 }}>
                {impact_narrative}
              </div>
            </div>
          )}

          {/* Applications Requiring Re-evaluation Section */}
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "14px",
              border: "1px solid #e2e8f0",
              overflow: "hidden"
            }}
          >
            {/* Sub-Header & Controls */}
            <div
              style={{
                padding: "0.85rem 1.25rem",
                backgroundColor: "#f8fafc",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "0.75rem"
              }}
            >
              <div>
                <div style={{ fontSize: "0.92rem", fontWeight: 700, color: "#0f172a" }}>
                  Applications Requiring Re-evaluation ({affected_applications.length})
                </div>
                <div style={{ fontSize: "0.74rem", color: "#64748b" }}>
                  Existing records whose rule evaluation outcomes shift under the new condition
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                {/* Filter Effect */}
                <select
                  value={filterEffect}
                  onChange={(e) => setFilterEffect(e.target.value)}
                  style={{
                    padding: "0.35rem 0.65rem",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.75rem",
                    backgroundColor: "#ffffff",
                    color: "#334155"
                  }}
                >
                  <option value="ALL">All Impact Effects</option>
                  <option value="WOULD_QUALIFY">Newly Compliant (Would Qualify)</option>
                  <option value="WOULD_FAIL_CRITERIA">Newly Deficient (Would Fail)</option>
                  <option value="REQUIREMENT_REMOVED">Requirement Removed (Inactive)</option>
                  <option value="NEW_DEFICIENCY_INTRODUCED">New Requirement Active</option>
                </select>

                {/* Search */}
                <input
                  type="text"
                  placeholder="Search app no. or applicant..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    padding: "0.35rem 0.65rem",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.75rem",
                    outline: "none",
                    minWidth: "180px"
                  }}
                />
              </div>
            </div>

            {/* Applications Table */}
            {filteredApps.length === 0 ? (
              <div style={{ padding: "2rem", textAlign: "center", color: "#64748b", fontSize: "0.85rem" }}>
                {affected_applications.length === 0
                  ? "Zero existing applications are adversely impacted by this rule condition change."
                  : "No applications match the search or filter criteria."}
              </div>
            ) : (
              <div style={{ maxHeight: "240px", overflowY: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.78rem" }}>
                  <thead>
                    <tr style={{ backgroundColor: "#f1f5f9", textAlign: "left", color: "#475569" }}>
                      <th style={{ padding: "0.5rem 0.85rem", fontWeight: 700 }}>Application</th>
                      <th style={{ padding: "0.5rem 0.85rem", fontWeight: 700 }}>Applicant</th>
                      <th style={{ padding: "0.5rem 0.85rem", fontWeight: 700 }}>Current Status</th>
                      <th style={{ padding: "0.5rem 0.85rem", fontWeight: 700 }}>Value</th>
                      <th style={{ padding: "0.5rem 0.85rem", fontWeight: 700 }}>Outcome Shift</th>
                      <th style={{ padding: "0.5rem 0.85rem", fontWeight: 700 }}>Impact Effect</th>
                      <th style={{ padding: "0.5rem 0.85rem", fontWeight: 700 }}>Re-evaluation</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredApps.map((app: AffectedApplicationItem, idx: number) => (
                      <tr
                        key={app.application_id || idx}
                        style={{
                          borderBottom: "1px solid #f1f5f9",
                          backgroundColor: idx % 2 === 0 ? "#ffffff" : "#f8fafc"
                        }}
                      >
                        <td style={{ padding: "0.55rem 0.85rem", fontFamily: "monospace", fontWeight: 700, color: "#1e293b" }}>
                          {app.application_number}
                        </td>
                        <td style={{ padding: "0.55rem 0.85rem", fontWeight: 600, color: "#334155" }}>
                          {app.applicant_name}
                        </td>
                        <td style={{ padding: "0.55rem 0.85rem" }}>
                          <span
                            style={{
                              padding: "0.15rem 0.45rem",
                              borderRadius: "4px",
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              backgroundColor: "#e2e8f0",
                              color: "#334155"
                            }}
                          >
                            {app.current_status}
                          </span>
                        </td>
                        <td style={{ padding: "0.55rem 0.85rem", fontFamily: "monospace", color: "#475569" }}>
                          {String(app.applicant_value ?? "—")}
                        </td>
                        <td style={{ padding: "0.55rem 0.85rem" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.3rem" }}>
                            <span
                              style={{
                                fontSize: "0.68rem",
                                fontWeight: 800,
                                padding: "0.1rem 0.35rem",
                                borderRadius: "3px",
                                backgroundColor: app.previous_result === "PASS" ? "#dcfce7" : "#fee2e2",
                                color: app.previous_result === "PASS" ? "#15803d" : "#991b1b"
                              }}
                            >
                              {app.previous_result}
                            </span>
                            <ArrowRight size={12} style={{ color: "#94a3b8" }} />
                            <span
                              style={{
                                fontSize: "0.68rem",
                                fontWeight: 800,
                                padding: "0.1rem 0.35rem",
                                borderRadius: "3px",
                                backgroundColor: app.new_result === "PASS" ? "#dcfce7" : "#fee2e2",
                                color: app.new_result === "PASS" ? "#15803d" : "#991b1b"
                              }}
                            >
                              {app.new_result}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: "0.55rem 0.85rem" }}>
                          <span
                            style={{
                              padding: "0.2rem 0.5rem",
                              borderRadius: "6px",
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              backgroundColor: `${app.effect_color || "#7e22ce"}15`,
                              color: app.effect_color || "#7e22ce",
                              border: `1px solid ${app.effect_color || "#7e22ce"}40`
                            }}
                          >
                            {app.effect_label}
                          </span>
                        </td>
                        <td style={{ padding: "0.55rem 0.85rem" }}>
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.25rem",
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              color: "#b45309",
                              backgroundColor: "#fef3c7",
                              padding: "0.15rem 0.45rem",
                              borderRadius: "4px"
                            }}
                          >
                            Required
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: "1rem 1.75rem",
            backgroundColor: "#f8fafc",
            borderTop: "1px solid #e2e8f0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center"
          }}
        >
          <div style={{ fontSize: "0.76rem", color: "#64748b" }}>
            Rule modification will be recorded permanently in <code>rule_change_history</code>.
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <button
              type="button"
              onClick={onClose}
              disabled={isConfirming}
              style={{
                padding: "0.55rem 1.15rem",
                borderRadius: "8px",
                border: "1px solid #cbd5e1",
                backgroundColor: "#ffffff",
                color: "#334155",
                fontSize: "0.82rem",
                fontWeight: 600,
                cursor: "pointer"
              }}
            >
              Cancel / Back to Editing
            </button>

            <button
              type="button"
              onClick={onConfirm}
              disabled={isConfirming}
              style={{
                padding: "0.55rem 1.45rem",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#7e22ce",
                color: "#ffffff",
                fontSize: "0.82rem",
                fontWeight: 700,
                cursor: isConfirming ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
                boxShadow: "0 2px 4px rgba(126, 34, 206, 0.25)"
              }}
            >
              {isConfirming ? (
                <>Saving &amp; Synchronizing...</>
              ) : (
                <>
                  <Check size={16} />
                  {confirmButtonText}
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
