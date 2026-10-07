import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Inbox,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Clock,
  ArrowRight,
  ShieldCheck,
  FileSearch,
  Filter,
  Users,
  Search,
  FileText,
  Download,
  Eye,
  RefreshCw,
  Stamp,
  RotateCcw,
  Sparkles,
  History,
  X,
  Send,
  AlertOctagon,
  Building2,
  Layers
} from "lucide-react";
import { scholarService } from "../../services/scholarService";
import type { ScholarshipApplication, ApplicationHistoryItem } from "../../types/scholar";

export default function OfficerDashboard() {
  const navigate = useNavigate();
  const [applications, setApplications] = useState<ScholarshipApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING" | "REQUIRES_REVIEW" | "DEFICIENCY" | "VERIFIED" | "REJECTED">("PENDING");
  const [searchQuery, setSearchQuery] = useState("");

  // Quick Action / Inspection Drawer State
  const [selectedApp, setSelectedApp] = useState<ScholarshipApplication | null>(null);
  const [appHistory, setAppHistory] = useState<ApplicationHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Officer Action Modal State
  const [actionModalOpen, setActionModalOpen] = useState(false);
  const [modalActionType, setModalActionType] = useState<"APPROVE" | "REJECT" | "REQUEST_RESUBMISSION" | "UNDER_REVIEW">("APPROVE");
  const [actionRemarks, setActionRemarks] = useState("");
  const [submittingAction, setSubmittingAction] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const data = await scholarService.getApplications();
      setApplications(data);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadApplications();
  }, []);

  // When an application is selected for inspection, fetch its action history
  useEffect(() => {
    if (selectedApp) {
      setLoadingHistory(true);
      scholarService.getApplicationHistory(selectedApp.id)
        .then((hist) => {
          setAppHistory(hist);
          setLoadingHistory(false);
        })
        .catch(() => setLoadingHistory(false));
    } else {
      setAppHistory([]);
    }
  }, [selectedApp]);

  // Metric Categories
  const pendingApps = applications.filter((a) => a.status === "SUBMITTED");
  const requiresReviewApps = applications.filter((a) =>
    a.status === "UNDER_REVIEW" ||
    a.evaluation?.system_recommendation === "ELIGIBLE_PENDING_OFFICER_REVIEW" ||
    (a.evaluation?.review_rules && a.evaluation.review_rules > 0)
  );
  const deficiencyApps = applications.filter((a) =>
    a.status === "CLARIFICATION_REQUIRED" ||
    (a.evaluation?.failed_rules && a.evaluation.failed_rules > 0 && a.status !== "REJECTED")
  );
  const verifiedApps = applications.filter((a) => a.status === "APPROVED");
  const rejectedApps = applications.filter((a) => a.status === "REJECTED");

  // Filtering based on tab & search query
  const filteredApplications = applications.filter((app) => {
    // 1. Tab filter
    if (activeTab === "PENDING" && app.status !== "SUBMITTED") return false;
    if (activeTab === "REQUIRES_REVIEW" && !requiresReviewApps.some((ra) => ra.id === app.id)) return false;
    if (activeTab === "DEFICIENCY" && !deficiencyApps.some((da) => da.id === app.id)) return false;
    if (activeTab === "VERIFIED" && app.status !== "APPROVED") return false;
    if (activeTab === "REJECTED" && app.status !== "REJECTED") return false;

    // 2. Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNo = app.application_number?.toLowerCase().includes(q);
      const matchName = app.applicant_name?.toLowerCase().includes(q);
      const matchScheme = app.scheme_name?.toLowerCase().includes(q) || app.scheme_code?.toLowerCase().includes(q);
      const matchTribe = app.tribe_name?.toLowerCase().includes(q);
      return matchNo || matchName || matchScheme || matchTribe;
    }
    return true;
  });

  const openActionModal = (app: ScholarshipApplication, action: "APPROVE" | "REJECT" | "REQUEST_RESUBMISSION" | "UNDER_REVIEW") => {
    setSelectedApp(app);
    setModalActionType(action);
    setActionRemarks(
      action === "APPROVE"
        ? "Verified ST community certificate issued under Article 342, qualifying marks, and income ceiling satisfied. Approved for statutory sanction."
        : action === "REQUEST_RESUBMISSION"
        ? "Deficiency identified in uploaded certificate scan. Please resubmit an unblurred copy issued by competent revenue authority."
        : action === "UNDER_REVIEW"
        ? "Application dossier assigned to Verification Officer for active statutory inspection."
        : ""
    );
    setActionError(null);
    setActionModalOpen(true);
  };

  const handleExecuteAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedApp) return;

    if (modalActionType === "REJECT" && !actionRemarks.trim()) {
      setActionError("Statutory justification remarks are mandatory when rejecting an application.");
      return;
    }

    setSubmittingAction(true);
    setActionError(null);

    try {
      const updated = await scholarService.recordOfficerDecision(
        selectedApp.id,
        modalActionType,
        actionRemarks.trim() || `Officer action recorded as ${modalActionType}`
      );

      // Update state
      setApplications((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
      setSelectedApp(updated);
      const hist = await scholarService.getApplicationHistory(updated.id);
      setAppHistory(hist);

      setActionModalOpen(false);
      alert(`Determination recorded: Application is now ${updated.status}`);
    } catch (err: any) {
      setActionError(err?.message || "Failed to record determination.");
    } finally {
      setSubmittingAction(false);
    }
  };

  const getScreeningBadge = (app: ScholarshipApplication) => {
    const evalData = app.evaluation;
    if (!evalData) return <span style={{ color: "#64748b" }}>Processing</span>;

    const isAppr = evalData.system_recommendation === "RECOMMENDED_FOR_APPROVAL";
    const hasFail = evalData.failed_rules > 0;
    const hasRev = evalData.review_rules > 0;

    if (isAppr) {
      return (
        <span style={{ fontSize: "0.72rem", fontWeight: 800, padding: "0.2rem 0.55rem", borderRadius: "4px", backgroundColor: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0" }}>
          ✓ Eligible
        </span>
      );
    } else if (hasFail) {
      return (
        <span style={{ fontSize: "0.72rem", fontWeight: 800, padding: "0.2rem 0.55rem", borderRadius: "4px", backgroundColor: "#fffbeb", color: "#92400e", border: "1px solid #fde68a" }}>
          ⚠️ Deficiency Found
        </span>
      );
    } else if (hasRev) {
      return (
        <span style={{ fontSize: "0.72rem", fontWeight: 800, padding: "0.2rem 0.55rem", borderRadius: "4px", backgroundColor: "#eff6ff", color: "#1e40af", border: "1px solid #bfdbfe" }}>
          • Requires Officer Review
        </span>
      );
    }
    return (
      <span style={{ fontSize: "0.72rem", fontWeight: 800, padding: "0.2rem 0.55rem", borderRadius: "4px", backgroundColor: "#f1f5f9", color: "#475569" }}>
        Screened
      </span>
    );
  };

  return (
    <div style={{ maxWidth: "1350px", margin: "0 auto", paddingBottom: "3rem" }}>
      {/* Top Header */}
      <div style={{ marginBottom: "1.75rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#0f3b7a", fontSize: "0.78rem", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.05em" }}>
            <ShieldCheck size={18} />
            <span>Statutory Verification Officer Command Center</span>
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 900, color: "#0f172a", marginTop: "0.2rem" }}>
            Verification Officer Dashboard
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.88rem", marginTop: "0.2rem" }}>
            Review generated evidence, OCR spatial facts &amp; deterministic rule validation dossiers without manual repetition.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <button
            type="button"
            onClick={loadApplications}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.5rem 0.9rem",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              backgroundColor: "#ffffff",
              color: "#334155",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            <span>Refresh Queue</span>
          </button>
        </div>
      </div>

      {/* KPI STAT CARDS (4 Specific Statutory Categories) */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem", marginBottom: "1.75rem" }}>
        {/* 1. Pending Applications */}
        <div
          onClick={() => setActiveTab("PENDING")}
          style={{
            backgroundColor: "#ffffff",
            padding: "1.25rem 1.5rem",
            borderRadius: "12px",
            border: activeTab === "PENDING" ? "2px solid #d97706" : "1px solid #e2e8f0",
            cursor: "pointer",
            boxShadow: activeTab === "PENDING" ? "0 4px 12px rgba(217, 119, 6, 0.15)" : "none",
            transition: "all 0.2s"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#64748b", fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase" }}>Pending Applications</span>
            <Clock size={18} color="#d97706" />
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: "#d97706", marginTop: "0.35rem" }}>
            {pendingApps.length}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.2rem" }}>
            Awaiting initial officer assignment
          </div>
        </div>

        {/* 2. Applications Requiring Review */}
        <div
          onClick={() => setActiveTab("REQUIRES_REVIEW")}
          style={{
            backgroundColor: "#ffffff",
            padding: "1.25rem 1.5rem",
            borderRadius: "12px",
            border: activeTab === "REQUIRES_REVIEW" ? "2px solid #0f3b7a" : "1px solid #e2e8f0",
            cursor: "pointer",
            boxShadow: activeTab === "REQUIRES_REVIEW" ? "0 4px 12px rgba(15, 59, 122, 0.15)" : "none",
            transition: "all 0.2s"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#64748b", fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase" }}>Requires Officer Review</span>
            <HelpCircle size={18} color="#0f3b7a" />
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: "#0f3b7a", marginTop: "0.35rem" }}>
            {requiresReviewApps.length}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.2rem" }}>
            Discretionary or borderline review cases
          </div>
        </div>

        {/* 3. Deficiency Cases */}
        <div
          onClick={() => setActiveTab("DEFICIENCY")}
          style={{
            backgroundColor: "#ffffff",
            padding: "1.25rem 1.5rem",
            borderRadius: "12px",
            border: activeTab === "DEFICIENCY" ? "2px solid #ea580c" : "1px solid #e2e8f0",
            cursor: "pointer",
            boxShadow: activeTab === "DEFICIENCY" ? "0 4px 12px rgba(234, 88, 12, 0.15)" : "none",
            transition: "all 0.2s"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#64748b", fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase" }}>Deficiency Cases</span>
            <AlertTriangle size={18} color="#ea580c" />
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: "#ea580c", marginTop: "0.35rem" }}>
            {deficiencyApps.length}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.2rem" }}>
            Resubmission required / deficient proof
          </div>
        </div>

        {/* 4. Verified Applications */}
        <div
          onClick={() => setActiveTab("VERIFIED")}
          style={{
            backgroundColor: "#ffffff",
            padding: "1.25rem 1.5rem",
            borderRadius: "12px",
            border: activeTab === "VERIFIED" ? "2px solid #059669" : "1px solid #e2e8f0",
            cursor: "pointer",
            boxShadow: activeTab === "VERIFIED" ? "0 4px 12px rgba(5, 150, 105, 0.15)" : "none",
            transition: "all 0.2s"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ color: "#64748b", fontSize: "0.75rem", fontWeight: 800, textTransform: "uppercase" }}>Verified Applications</span>
            <CheckCircle2 size={18} color="#059669" />
          </div>
          <div style={{ fontSize: "2rem", fontWeight: 900, color: "#059669", marginTop: "0.35rem" }}>
            {verifiedApps.length}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.2rem" }}>
            Formally approved for scholarship award
          </div>
        </div>
      </div>

      {/* Main Workspace Grid: Left = Applications Queue, Right = Instant Inspection Drawer */}
      <div style={{ display: "grid", gridTemplateColumns: selectedApp ? "1fr 1fr" : "1fr", gap: "1.5rem", alignItems: "flex-start" }}>
        {/* LEFT COLUMN: APPLICATIONS QUEUE */}
        <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.5rem" }}>
          {/* Controls: Category Tabs & Search Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
            {/* Filter Tabs */}
            <div style={{ display: "flex", gap: "0.35rem", flexWrap: "wrap" }}>
              {[
                { key: "PENDING", label: `Pending (${pendingApps.length})` },
                { key: "REQUIRES_REVIEW", label: `Review Needed (${requiresReviewApps.length})` },
                { key: "DEFICIENCY", label: `Deficiencies (${deficiencyApps.length})` },
                { key: "VERIFIED", label: `Verified (${verifiedApps.length})` },
                { key: "REJECTED", label: `Rejected (${rejectedApps.length})` },
                { key: "ALL", label: `All (${applications.length})` }
              ].map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setActiveTab(t.key as any)}
                  style={{
                    padding: "0.4rem 0.75rem",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: activeTab === t.key ? "#0f3b7a" : "#f1f5f9",
                    color: activeTab === t.key ? "#ffffff" : "#475569",
                    fontSize: "0.76rem",
                    fontWeight: 700,
                    cursor: "pointer"
                  }}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div style={{ position: "relative", minWidth: "240px" }}>
              <Search size={14} style={{ position: "absolute", left: "0.65rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
              <input
                type="text"
                placeholder="Search by name, app no, tribe..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  padding: "0.45rem 0.65rem 0.45rem 2rem",
                  borderRadius: "6px",
                  border: "1px solid #cbd5e1",
                  fontSize: "0.8rem",
                  outline: "none"
                }}
              />
            </div>
          </div>

          {/* Applications Table / Cards */}
          {loading ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>Loading queue...</div>
          ) : filteredApplications.length === 0 ? (
            <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
              <Inbox size={36} color="#94a3b8" style={{ margin: "0 auto 0.75rem" }} />
              <div style={{ fontWeight: 700, color: "#0f172a" }}>No applications found in this view</div>
              <div style={{ fontSize: "0.8rem", marginTop: "0.25rem" }}>Try adjusting filter tabs or search terms.</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {filteredApplications.map((app) => {
                const isSelected = selectedApp?.id === app.id;
                return (
                  <div
                    key={app.id}
                    onClick={() => setSelectedApp(app)}
                    style={{
                      border: isSelected ? "2px solid #2563eb" : "1px solid #e2e8f0",
                      borderRadius: "10px",
                      padding: "1rem 1.15rem",
                      backgroundColor: isSelected ? "#f8faff" : "#ffffff",
                      cursor: "pointer",
                      transition: "all 0.15s"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.5rem" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span style={{ fontSize: "0.74rem", fontWeight: 800, padding: "0.15rem 0.45rem", borderRadius: "4px", backgroundColor: "#0f172a", color: "#ffffff" }}>
                            {app.application_number}
                          </span>
                          <strong style={{ fontSize: "0.95rem", color: "#0f172a" }}>{app.applicant_name}</strong>
                          <span style={{ fontSize: "0.72rem", color: "#059669", fontWeight: 700 }}>
                            &bull; {app.tribe_name || "ST Certified"}
                          </span>
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "#2563eb", marginTop: "0.2rem", fontWeight: 600 }}>
                          {app.scheme_name} ({app.scheme_code})
                        </div>
                      </div>

                      <div style={{ textAlign: "right" }}>
                        {getScreeningBadge(app)}
                        <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "0.25rem" }}>
                          Status: <strong style={{ color: "#0f172a" }}>{app.status}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Factual Highlights Row */}
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "0.5rem", fontSize: "0.75rem", backgroundColor: "#f8fafc", padding: "0.5rem 0.75rem", borderRadius: "6px", marginTop: "0.4rem" }}>
                      <div>
                        <span style={{ color: "#64748b" }}>Rule Score: </span>
                        <strong>{app.eligibility_score}%</strong> ({app.passed_rules}/{app.total_rules} passed)
                      </div>
                      <div>
                        <span style={{ color: "#64748b" }}>Income: </span>
                        <strong>{app.annual_family_income ? `Rs. ${app.annual_family_income.toLocaleString()}` : "Declared"}</strong>
                      </div>
                      <div>
                        <span style={{ color: "#64748b" }}>Marks: </span>
                        <strong>{app.aggregate_percentage ? `${app.aggregate_percentage}%` : "Provided"}</strong>
                      </div>
                      <div>
                        <span style={{ color: "#64748b" }}>Docs Attached: </span>
                        <strong>{app.documents?.length || 0} Files</strong>
                      </div>
                    </div>

                    {/* Action Buttons Row */}
                    <div style={{ marginTop: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: "0.6rem" }}>
                      <div style={{ display: "flex", gap: "0.4rem" }}>
                        <Link
                          to={`/officer/verify/${app.id}`}
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            fontSize: "0.76rem",
                            fontWeight: 700,
                            padding: "0.35rem 0.75rem",
                            borderRadius: "6px",
                            backgroundColor: "#0f3b7a",
                            color: "#ffffff",
                            textDecoration: "none"
                          }}
                        >
                          <Eye size={13} />
                          <span>Full Workstation</span>
                        </Link>

                        <Link
                          to={`/officer/applications/${app.id}/verification-report`}
                          target="_blank"
                          onClick={(e) => e.stopPropagation()}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.3rem",
                            fontSize: "0.76rem",
                            fontWeight: 700,
                            padding: "0.35rem 0.75rem",
                            borderRadius: "6px",
                            backgroundColor: "#eff6ff",
                            color: "#1e40af",
                            border: "1px solid #bfdbfe",
                            textDecoration: "none"
                          }}
                        >
                          <FileText size={13} />
                          <span>Verification Report</span>
                        </Link>
                      </div>

                      {/* Quick Officer Actions */}
                      <div style={{ display: "flex", gap: "0.35rem" }}>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openActionModal(app, "UNDER_REVIEW");
                          }}
                          style={{
                            padding: "0.35rem 0.65rem",
                            borderRadius: "6px",
                            border: "none",
                            backgroundColor: "#eff6ff",
                            color: "#1d4ed8",
                            fontSize: "0.74rem",
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          👁 Review
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openActionModal(app, "APPROVE");
                          }}
                          style={{
                            padding: "0.35rem 0.65rem",
                            borderRadius: "6px",
                            border: "none",
                            backgroundColor: "#ecfdf5",
                            color: "#065f46",
                            fontSize: "0.74rem",
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          ✓ Approve
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openActionModal(app, "REQUEST_RESUBMISSION");
                          }}
                          style={{
                            padding: "0.35rem 0.65rem",
                            borderRadius: "6px",
                            border: "none",
                            backgroundColor: "#fffbeb",
                            color: "#92400e",
                            fontSize: "0.74rem",
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          ↺ Resubmit
                        </button>

                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            openActionModal(app, "REJECT");
                          }}
                          style={{
                            padding: "0.35rem 0.65rem",
                            borderRadius: "6px",
                            border: "none",
                            backgroundColor: "#fef2f2",
                            color: "#991b1b",
                            fontSize: "0.74rem",
                            fontWeight: 700,
                            cursor: "pointer"
                          }}
                        >
                          ✗ Reject
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: INSTANT INSPECTION DRAWER */}
        {selectedApp && (
          <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #cbd5e1", padding: "1.5rem", boxShadow: "0 4px 16px rgba(0, 0, 0, 0.06)", position: "sticky", top: "1rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.75rem" }}>
              <div>
                <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Evidence &amp; Profile Inspector</span>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 900, color: "#0f172a", marginTop: "0.15rem" }}>
                  {selectedApp.applicant_name}
                </h3>
                <div style={{ fontSize: "0.8rem", color: "#2563eb", fontWeight: 600 }}>
                  {selectedApp.application_number} &bull; {selectedApp.scheme_code}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setSelectedApp(null)}
                style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Inspector Body */}
            <div style={{ maxHeight: "75vh", overflowY: "auto", display: "flex", flexDirection: "column", gap: "1.25rem", paddingRight: "0.25rem" }}>
              {/* 1. Applicant Profile Summary */}
              <div>
                <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#0f172a", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                  1. Applicant Profile Details
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.78rem", backgroundColor: "#f8fafc", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <div>
                    <span style={{ color: "#64748b" }}>Scheduled Tribe: </span>
                    <strong style={{ color: "#0f172a" }}>{selectedApp.tribe_name || "ST Certified"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>ST Cert No: </span>
                    <strong style={{ color: "#0f172a" }}>{selectedApp.caste_certificate_no || "Verified"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>Annual Income: </span>
                    <strong style={{ color: "#0f172a" }}>Rs. {selectedApp.annual_family_income?.toLocaleString() || "Declared"}</strong>
                  </div>
                  <div>
                    <span style={{ color: "#64748b" }}>Marks: </span>
                    <strong style={{ color: "#0f172a" }}>{selectedApp.aggregate_percentage}%</strong>
                  </div>
                  <div style={{ gridColumn: "span 2" }}>
                    <span style={{ color: "#64748b" }}>Institution: </span>
                    <strong style={{ color: "#0f172a" }}>{selectedApp.course_enrolled} &bull; {selectedApp.institution_name}</strong>
                  </div>
                </div>
              </div>

              {/* 2. Uploaded Documents & OCR facts */}
              <div>
                <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#0f172a", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                  2. Uploaded Documents ({selectedApp.documents?.length || 0})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                  {selectedApp.documents?.map((d, i) => (
                    <div key={i} style={{ border: "1px solid #e2e8f0", borderRadius: "6px", padding: "0.6rem 0.75rem", fontSize: "0.76rem", backgroundColor: "#ffffff" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <strong style={{ color: "#0f172a" }}>{d.document_type.replace(/_/g, " ")}</strong>
                        <span style={{ fontSize: "0.7rem", color: "#059669", fontWeight: 700 }}>✓ High-DPI Enhanced</span>
                      </div>
                      <div style={{ color: "#64748b", marginTop: "0.15rem" }}>
                        File: <code>{d.file_name}</code>
                      </div>
                      {d.ocr_raw_text && (
                        <div style={{ fontSize: "0.72rem", color: "#475569", marginTop: "0.25rem", fontStyle: "italic", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          OCR: {d.ocr_raw_text.slice(0, 100)}...
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Rule Validation Results & Evidence */}
              <div>
                <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#0f172a", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                  3. Deterministic Rules Evaluated ({selectedApp.evaluation?.total_rules || 0})
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                  {selectedApp.evaluation?.rule_results?.map((r: any, idx: number) => {
                    const rCode = r.rule_evaluated?.rule_code || r.rule_code;
                    const rName = r.rule_evaluated?.rule_name || r.rule_name;
                    const res = r.result || r.status || "REVIEW";
                    return (
                      <div
                        key={idx}
                        style={{
                          border: `1px solid ${res === "PASS" ? "#bbf7d0" : res === "FAIL" ? "#fecaca" : "#fde68a"}`,
                          borderRadius: "6px",
                          padding: "0.55rem 0.75rem",
                          backgroundColor: res === "PASS" ? "#fafffd" : res === "FAIL" ? "#fffbfb" : "#fffef9",
                          fontSize: "0.75rem"
                        }}
                      >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontWeight: 800, color: "#0f172a" }}>{rCode}: {rName}</span>
                          <strong style={{ color: res === "PASS" ? "#065f46" : res === "FAIL" ? "#991b1b" : "#92400e" }}>
                            {res}
                          </strong>
                        </div>
                        {r.evidence_reference && (
                          <div style={{ fontSize: "0.7rem", color: "#475569", marginTop: "0.2rem" }}>
                            <strong>Evidence:</strong> {r.evidence_reference}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. Application History Timeline */}
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontSize: "0.78rem", fontWeight: 800, color: "#0f172a", textTransform: "uppercase", marginBottom: "0.4rem" }}>
                  <History size={14} />
                  <span>4. Application Action History</span>
                </div>

                {loadingHistory ? (
                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>Loading timeline...</div>
                ) : appHistory.length === 0 ? (
                  <div style={{ fontSize: "0.75rem", color: "#64748b", backgroundColor: "#f8fafc", padding: "0.6rem", borderRadius: "6px" }}>
                    No recorded officer actions yet. Current status: {selectedApp.status}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {appHistory.map((h, i) => (
                      <div key={i} style={{ backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", borderRadius: "6px", padding: "0.55rem 0.75rem", fontSize: "0.74rem" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontWeight: 800, color: "#0f172a" }}>{h.action}</span>
                          <span style={{ fontSize: "0.68rem", color: "#64748b" }}>{new Date(h.created_at).toLocaleString()}</span>
                        </div>
                        <div style={{ color: "#334155", marginTop: "0.15rem" }}>
                          {h.remarks}
                        </div>
                        {h.officer_name && (
                          <div style={{ fontSize: "0.68rem", color: "#64748b", marginTop: "0.15rem" }}>
                            Signed by: {h.officer_name}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Drawer Bottom Action Bar */}
            <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "1rem", marginTop: "1rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={() => openActionModal(selectedApp, "APPROVE")}
                style={{ padding: "0.6rem", borderRadius: "6px", backgroundColor: "#059669", color: "#ffffff", border: "none", fontWeight: 800, fontSize: "0.8rem", cursor: "pointer" }}
              >
                ✓ Approve
              </button>
              <button
                type="button"
                onClick={() => openActionModal(selectedApp, "REQUEST_RESUBMISSION")}
                style={{ padding: "0.6rem", borderRadius: "6px", backgroundColor: "#d97706", color: "#ffffff", border: "none", fontWeight: 800, fontSize: "0.8rem", cursor: "pointer" }}
              >
                ↺ Resubmit
              </button>
              <button
                type="button"
                onClick={() => openActionModal(selectedApp, "UNDER_REVIEW")}
                style={{ padding: "0.6rem", borderRadius: "6px", backgroundColor: "#2563eb", color: "#ffffff", border: "none", fontWeight: 800, fontSize: "0.8rem", cursor: "pointer" }}
              >
                👁 Review
              </button>
              <button
                type="button"
                onClick={() => openActionModal(selectedApp, "REJECT")}
                style={{ padding: "0.6rem", borderRadius: "6px", backgroundColor: "#dc2626", color: "#ffffff", border: "none", fontWeight: 800, fontSize: "0.8rem", cursor: "pointer" }}
              >
                ✗ Reject
              </button>
            </div>
            <div style={{ marginTop: "0.5rem" }}>
              <Link
                to={`/officer/verify/${selectedApp.id}`}
                style={{ display: "block", padding: "0.6rem", borderRadius: "6px", backgroundColor: "#0f172a", color: "#ffffff", textDecoration: "none", textAlign: "center", fontWeight: 800, fontSize: "0.8rem" }}
              >
                Open Full Statutory Workstation &rarr;
              </Link>
            </div>
          </div>
        )}
      </div>

      {/* OFFICER ACTION MODAL (APPROVE / REJECT / REQUEST RESUBMISSION / REVIEW) */}
      {actionModalOpen && selectedApp && (
        <div style={{ position: "fixed", inset: 0, backgroundColor: "rgba(15, 23, 42, 0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: "1rem" }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "14px", maxWidth: "540px", width: "100%", padding: "1.75rem", boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Stamp size={20} color="#0f172a" />
                <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a" }}>
                  Record Determination: {modalActionType.replace(/_/g, " ")}
                </h3>
              </div>
              <button type="button" onClick={() => setActionModalOpen(false)} style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer" }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ fontSize: "0.82rem", color: "#475569", marginBottom: "1rem", backgroundColor: "#f8fafc", padding: "0.65rem 0.85rem", borderRadius: "6px" }}>
              Application: <strong>{selectedApp.application_number}</strong> &bull; Applicant: <strong>{selectedApp.applicant_name}</strong>
            </div>

            {actionError && (
              <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "6px", padding: "0.6rem", fontSize: "0.8rem", color: "#991b1b", marginBottom: "0.85rem" }}>
                {actionError}
              </div>
            )}

            <form onSubmit={handleExecuteAction} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.35rem" }}>
                  Statutory Remarks &amp; Determination Notes {modalActionType === "REJECT" && <span style={{ color: "#dc2626" }}>*</span>}
                </label>
                <textarea
                  rows={4}
                  value={actionRemarks}
                  onChange={(e) => setActionRemarks(e.target.value)}
                  placeholder={
                    modalActionType === "REJECT"
                      ? "Mandatory: Enter statutory grounds for rejecting this application..."
                      : modalActionType === "REQUEST_RESUBMISSION"
                      ? "Specify deficient document, missing seal, or reason candidate must resubmit..."
                      : "Enter official determination notes..."
                  }
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.85rem",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.84rem",
                    outline: "none"
                  }}
                />
              </div>

              <div style={{ fontSize: "0.74rem", color: "#64748b", backgroundColor: "#f8fafc", padding: "0.5rem", borderRadius: "6px" }}>
                <Clock size={12} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
                This action will be permanently recorded in the immutable application history audit trail.
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setActionModalOpen(false)}
                  style={{ padding: "0.6rem 1.1rem", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", color: "#475569", fontSize: "0.84rem", cursor: "pointer" }}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submittingAction}
                  style={{
                    padding: "0.6rem 1.4rem",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor:
                      modalActionType === "APPROVE" ? "#059669" :
                      modalActionType === "REJECT" ? "#dc2626" :
                      modalActionType === "REQUEST_RESUBMISSION" ? "#d97706" : "#2563eb",
                    color: "#ffffff",
                    fontSize: "0.84rem",
                    fontWeight: 800,
                    cursor: submittingAction ? "not-allowed" : "pointer"
                  }}
                >
                  {submittingAction ? "Recording..." : `Sign & Execute ${modalActionType.replace(/_/g, " ")}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
