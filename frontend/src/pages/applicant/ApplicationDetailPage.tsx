import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import {
  FileText,
  Download,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Shield,
  ArrowLeft,
  User,
  Building2,
  Calendar,
  FileCheck2,
  UploadCloud,
  Send,
  RefreshCw,
  Mail,
  Bell,
  History,
  Check,
  XCircle,
  AlertCircle,
  Info,
  ChevronRight,
  ExternalLink,
  Layers,
  Sparkles
} from "lucide-react";
import { scholarService } from "../../services/scholarService";
import type {
  ApplicationTrackingData,
  ApplicationTimelineMilestone,
  ApplicationDeficiencyItem,
  ApplicationHistoryItem,
  TrackingNotificationItem,
  SchemeGapIntelligence
} from "../../types/scholar";
import { SchemeGapViewer } from "../../components/scholar/SchemeGapViewer";

export default function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [tracking, setTracking] = useState<ApplicationTrackingData | null>(null);
  const [gapIntelligence, setGapIntelligence] = useState<SchemeGapIntelligence | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"timeline" | "deficiencies" | "rules" | "history" | "notifications" | "gaps">("timeline");

  // Deficiency Resubmission State
  const [selectedDocType, setSelectedDocType] = useState<string>("CASTE_CERTIFICATE");
  const [resubmitFile, setResubmitFile] = useState<File | null>(null);
  const [applicantRemarks, setApplicantRemarks] = useState<string>("");
  const [isSubmittingResubmit, setIsSubmittingResubmit] = useState<boolean>(false);
  const [resubmitSuccessMessage, setResubmitSuccessMessage] = useState<string | null>(null);
  const [resubmitErrorMessage, setResubmitErrorMessage] = useState<string | null>(null);

  const fetchTracking = async (showRefresh = false) => {
    if (!id) return;
    if (showRefresh) setRefreshing(true);
    try {
      const data = await scholarService.getApplicationTracking(id);
      setTracking(data);
    } catch (err) {
      console.error("Failed to load application tracking:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }

    try {
      const gaps = await scholarService.getApplicationGapIntelligence(id);
      setGapIntelligence(gaps);
    } catch (err) {
      console.error("Failed to load gap intelligence for application:", err);
    }
  };

  useEffect(() => {
    fetchTracking();
  }, [id]);

  const handleResubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !resubmitFile) {
      setResubmitErrorMessage("Please select a valid document file to upload.");
      return;
    }

    setIsSubmittingResubmit(true);
    setResubmitErrorMessage(null);
    setResubmitSuccessMessage(null);

    try {
      const formData = new FormData();
      formData.append("document_type", selectedDocType);
      formData.append("resubmitted_file", resubmitFile);
      formData.append("applicant_remarks", applicantRemarks || "Rectified document uploaded by applicant.");

      await scholarService.resubmitDeficiency(id, formData);
      setResubmitSuccessMessage("Replacement document uploaded successfully! The application has transitioned to RESUBMITTED status and re-entered rule validation.");
      setResubmitFile(null);
      setApplicantRemarks("");
      // Refresh tracking data
      await fetchTracking();
    } catch (err: any) {
      setResubmitErrorMessage(err.message || "Failed to resubmit deficiency document.");
    } finally {
      setIsSubmittingResubmit(false);
    }
  };

  if (loading) {
    return (
      <div style={{ maxWidth: "1100px", margin: "3rem auto", textAlign: "center", color: "#64748b" }}>
        <RefreshCw className="spin" size={32} style={{ margin: "0 auto 1rem", animation: "spin 1s linear infinite" }} />
        <h3 style={{ fontSize: "1.1rem", fontWeight: 600, color: "#1e293b" }}>Loading Application Tracking Dossier...</h3>
        <p style={{ fontSize: "0.85rem", color: "#64748b" }}>Querying statutory application states, audit logs, and dynamic rules...</p>
      </div>
    );
  }

  if (!tracking || !tracking.application) {
    return (
      <div style={{ maxWidth: "1100px", margin: "3rem auto", textAlign: "center", padding: "2.5rem", background: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
        <AlertCircle size={48} color="#ef4444" style={{ margin: "0 auto 1rem" }} />
        <h2 style={{ fontSize: "1.3rem", fontWeight: 700, color: "#0f172a" }}>Application Dossier Not Found</h2>
        <p style={{ color: "#64748b", fontSize: "0.9rem", marginTop: "0.5rem" }}>The requested application identifier could not be located in the SCHOLAR-ST registry.</p>
        <Link to="/applicant" style={{ display: "inline-block", marginTop: "1.5rem", padding: "0.5rem 1.25rem", borderRadius: "6px", backgroundColor: "#2563eb", color: "#ffffff", textDecoration: "none", fontWeight: 600 }}>
          &larr; Return to Dashboard
        </Link>
      </div>
    );
  }

  const { application, current_status, status_metadata, timeline, deficiencies, required_action, officer_review_status, history, notifications } = tracking;
  const isApproved = current_status === "APPROVED";
  const isRejected = current_status === "REJECTED";
  const isDeficiency = current_status === "DEFICIENCY";
  const isUnderReview = current_status === "OFFICER_REVIEW";
  const isResubmitted = current_status === "RESUBMITTED";

  const getStatusColor = (status: string) => {
    switch (status) {
      case "APPROVED": return { bg: "#ecfdf5", border: "#a7f3d0", text: "#065f46" };
      case "REJECTED": return { bg: "#fef2f2", border: "#fecaca", text: "#991b1b" };
      case "DEFICIENCY": return { bg: "#fff1f2", border: "#fecdd3", text: "#be123c" };
      case "RESUBMITTED": return { bg: "#f0f9ff", border: "#bae6fd", text: "#0369a1" };
      case "OFFICER_REVIEW": return { bg: "#fffbeb", border: "#fde68a", text: "#92400e" };
      case "DOCUMENT_VERIFICATION": return { bg: "#faf5ff", border: "#e9d5ff", text: "#6b21a8" };
      case "RULE_VALIDATION": return { bg: "#fdf4ff", border: "#f5d0fe", text: "#86198f" };
      case "SUBMITTED": return { bg: "#eff6ff", border: "#bfdbfe", text: "#1d4ed8" };
      default: return { bg: "#f8fafc", border: "#e2e8f0", text: "#334155" };
    }
  };

  const statusTheme = getStatusColor(current_status);

  return (
    <div style={{ maxWidth: "1150px", margin: "0 auto", paddingBottom: "3rem" }}>
      {/* Top Header & Quick Links */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.75rem" }}>
        <Link
          to="/applicant/applications"
          style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#64748b", textDecoration: "none", fontSize: "0.85rem", fontWeight: 600 }}
        >
          <ArrowLeft size={16} /> All Applications
        </Link>

        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", flexWrap: "wrap" }}>
          <button
            onClick={() => fetchTracking(true)}
            disabled={refreshing}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.5rem 0.85rem",
              borderRadius: "6px",
              backgroundColor: "#ffffff",
              border: "1px solid #cbd5e1",
              color: "#334155",
              fontSize: "0.82rem",
              fontWeight: 600,
              cursor: refreshing ? "not-allowed" : "pointer"
            }}
          >
            <RefreshCw size={14} className={refreshing ? "spin" : ""} />
            <span>{refreshing ? "Refreshing..." : "Live Status"}</span>
          </button>

          <Link
            to={`/applicant/applications/${application.id}/verification-report`}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              fontSize: "0.82rem",
              fontWeight: 700,
              textDecoration: "none"
            }}
          >
            <FileText size={15} />
            <span>Evidence Verification Report</span>
          </Link>

          <a
            href={scholarService.getApplicationPdfUrl(application.id)}
            target="_blank"
            rel="noreferrer"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              backgroundColor: "#0f172a",
              color: "#ffffff",
              fontSize: "0.82rem",
              fontWeight: 600,
              textDecoration: "none"
            }}
          >
            <Download size={15} />
            <span>Download PDF</span>
          </a>
        </div>
      </div>

      {/* Main Status Hero Card */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "14px",
          border: `1.5px solid ${statusTheme.border}`,
          padding: "1.75rem",
          marginBottom: "1.5rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.05)",
          position: "relative",
          overflow: "hidden"
        }}
      >
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "4px",
            backgroundColor: status_metadata.badge_color || statusTheme.text
          }}
        />

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap", marginBottom: "1.25rem" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.3rem" }}>
              <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Official Statutory Dossier
              </span>
              <span style={{ fontSize: "0.7rem", backgroundColor: "#f1f5f9", padding: "0.15rem 0.5rem", borderRadius: "4px", color: "#475569", fontWeight: 600 }}>
                Stage {status_metadata.step_number} of 8
              </span>
            </div>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", margin: "0 0 0.25rem 0", letterSpacing: "-0.01em" }}>
              {application.application_number}
            </h1>
            <div style={{ fontSize: "0.95rem", color: "#2563eb", fontWeight: 700 }}>
              {application.scheme_name} <span style={{ color: "#64748b", fontWeight: 500 }}>({application.scheme_code})</span>
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                padding: "0.45rem 1rem",
                borderRadius: "8px",
                backgroundColor: statusTheme.bg,
                border: `1px solid ${statusTheme.border}`,
                color: statusTheme.text,
                fontSize: "0.85rem",
                fontWeight: 800,
                letterSpacing: "0.03em"
              }}
            >
              {isApproved ? <CheckCircle2 size={16} /> : isRejected ? <XCircle size={16} /> : isDeficiency ? <AlertTriangle size={16} /> : <Clock size={16} />}
              <span>{status_metadata.label.toUpperCase()}</span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.4rem" }}>
              Last Updated: {new Date(application.updated_at || application.created_at || Date.now()).toLocaleString()}
            </div>
          </div>
        </div>

        {/* Statutory Explanation Banner */}
        <div style={{ padding: "0.85rem 1.15rem", borderRadius: "8px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", fontSize: "0.86rem", color: "#334155", display: "flex", alignItems: "flex-start", gap: "0.6rem" }}>
          <Info size={18} color="#2563eb" style={{ flexShrink: 0, marginTop: "0.1rem" }} />
          <div>
            <strong style={{ color: "#0f172a" }}>Statutory Progress Overview: </strong>
            {status_metadata.description}
          </div>
        </div>

        {/* Applicant Profile Snapshot Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "0.75rem", marginTop: "1rem", backgroundColor: "#ffffff", border: "1px solid #f1f5f9", borderRadius: "8px", padding: "0.85rem" }}>
          <div>
            <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase" }}>Applicant Name</div>
            <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.88rem" }}>{application.applicant_name}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase" }}>Scheduled Tribe (Art. 342)</div>
            <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.88rem" }}>{application.tribe_name || "ST Verified"}</div>
          </div>
          <div>
            <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase" }}>Annual Family Income</div>
            <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.88rem" }}>
              {application.annual_family_income ? `₹${application.annual_family_income.toLocaleString()}` : "Declared"}
            </div>
          </div>
          <div>
            <div style={{ fontSize: "0.72rem", color: "#64748b", textTransform: "uppercase" }}>Academic Percentage</div>
            <div style={{ fontWeight: 700, color: "#0f172a", fontSize: "0.88rem" }}>
              {application.aggregate_percentage ? `${application.aggregate_percentage}%` : "Recorded"}
            </div>
          </div>
        </div>
      </div>

      {/* High-Visibility "Required Action" Directive Box */}
      {required_action && (
        <div
          style={{
            borderRadius: "12px",
            border: `1.5px solid ${required_action.action_needed ? (isDeficiency ? "#fca5a5" : "#93c5fd") : "#bbf7d0"}`,
            backgroundColor: required_action.action_needed ? (isDeficiency ? "#fff1f2" : "#eff6ff") : "#f0fdf4",
            padding: "1.25rem 1.5rem",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "flex-start",
            gap: "1rem"
          }}
        >
          <div
            style={{
              padding: "0.6rem",
              borderRadius: "50%",
              backgroundColor: required_action.action_needed ? (isDeficiency ? "#fee2e2" : "#dbeafe") : "#dcfce7",
              color: required_action.action_needed ? (isDeficiency ? "#dc2626" : "#2563eb") : "#16a34a",
              flexShrink: 0
            }}
          >
            {required_action.action_needed ? (isDeficiency ? <AlertTriangle size={22} /> : <AlertCircle size={22} />) : <CheckCircle2 size={22} />}
          </div>

          <div style={{ flex: 1 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
              <h3 style={{ fontSize: "1rem", fontWeight: 800, margin: 0, color: required_action.action_needed ? (isDeficiency ? "#991b1b" : "#1e40af") : "#166534" }}>
                {required_action.title}
              </h3>
              {required_action.action_needed && (
                <span style={{ fontSize: "0.68rem", fontWeight: 800, padding: "0.15rem 0.5rem", borderRadius: "4px", backgroundColor: "#dc2626", color: "#ffffff", letterSpacing: "0.04em" }}>
                  ACTION REQUIRED
                </span>
              )}
            </div>
            <p style={{ margin: "0.35rem 0 0 0", fontSize: "0.85rem", color: "#334155", lineHeight: 1.5 }}>
              {required_action.description}
            </p>

            {/* Jump to resubmission workbench button if deficiency */}
            {isDeficiency && (
              <button
                onClick={() => setActiveTab("deficiencies")}
                style={{
                  marginTop: "0.75rem",
                  padding: "0.45rem 1rem",
                  borderRadius: "6px",
                  backgroundColor: "#dc2626",
                  color: "#ffffff",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.4rem"
                }}
              >
                <UploadCloud size={15} />
                <span>Upload Rectified Document Now</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Officer Review Status Card (if under review or officer reviewed) */}
      {officer_review_status && officer_review_status.is_assigned && (
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            padding: "1.25rem 1.5rem",
            marginBottom: "1.5rem",
            borderLeft: `5px solid ${isApproved ? "#16a34a" : isRejected ? "#dc2626" : "#f59e0b"}`
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.5rem", marginBottom: "0.6rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <FileCheck2 size={20} color={isApproved ? "#16a34a" : isRejected ? "#dc2626" : "#d97706"} />
              <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>
                Verification Officer Assessment
              </h4>
            </div>
            <span
              style={{
                fontSize: "0.75rem",
                fontWeight: 800,
                padding: "0.25rem 0.65rem",
                borderRadius: "4px",
                backgroundColor: isApproved ? "#dcfce7" : isRejected ? "#fee2e2" : "#fef3c7",
                color: isApproved ? "#166534" : isRejected ? "#991b1b" : "#92400e"
              }}
            >
              {officer_review_status.decision || "UNDER SCRUTINY"}
            </span>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.75rem", fontSize: "0.82rem" }}>
            <div>
              <span style={{ color: "#64748b" }}>Assigned Officer: </span>
              <strong style={{ color: "#0f172a" }}>{officer_review_status.officer_name}</strong>
            </div>
            <div>
              <span style={{ color: "#64748b" }}>Department: </span>
              <strong style={{ color: "#0f172a" }}>{officer_review_status.department}</strong>
            </div>
            <div>
              <span style={{ color: "#64748b" }}>Review Date: </span>
              <strong style={{ color: "#0f172a" }}>
                {officer_review_status.decision_date ? new Date(officer_review_status.decision_date).toLocaleDateString() : "In Progress"}
              </strong>
            </div>
          </div>

          {officer_review_status.remarks && (
            <div style={{ marginTop: "0.75rem", padding: "0.75rem", borderRadius: "6px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0", fontSize: "0.82rem" }}>
              <strong style={{ color: "#334155" }}>Official Remarks: </strong>
              <span style={{ color: "#0f172a" }}>{officer_review_status.remarks}</span>
            </div>
          )}
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ display: "flex", borderBottom: "2px solid #e2e8f0", marginBottom: "1.5rem", gap: "0.5rem", flexWrap: "wrap" }}>
        <button
          onClick={() => setActiveTab("timeline")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
            padding: "0.75rem 1.15rem",
            border: "none",
            borderBottom: activeTab === "timeline" ? "3px solid #2563eb" : "3px solid transparent",
            backgroundColor: "transparent",
            color: activeTab === "timeline" ? "#2563eb" : "#64748b",
            fontWeight: activeTab === "timeline" ? 700 : 500,
            fontSize: "0.88rem",
            cursor: "pointer",
            marginBottom: "-2px"
          }}
        >
          <Clock size={16} />
          <span>Statutory Timeline</span>
          <span style={{ fontSize: "0.7rem", padding: "0.1rem 0.45rem", borderRadius: "10px", backgroundColor: "#f1f5f9", color: "#475569" }}>
            {timeline?.length || 8}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("deficiencies")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
            padding: "0.75rem 1.15rem",
            border: "none",
            borderBottom: activeTab === "deficiencies" ? "3px solid #dc2626" : "3px solid transparent",
            backgroundColor: "transparent",
            color: activeTab === "deficiencies" ? "#dc2626" : (deficiencies && deficiencies.length > 0 ? "#b91c1c" : "#64748b"),
            fontWeight: activeTab === "deficiencies" ? 700 : 500,
            fontSize: "0.88rem",
            cursor: "pointer",
            marginBottom: "-2px"
          }}
        >
          <AlertTriangle size={16} />
          <span>Deficiencies & Resubmission</span>
          {deficiencies && deficiencies.length > 0 && (
            <span style={{ fontSize: "0.7rem", padding: "0.1rem 0.45rem", borderRadius: "10px", backgroundColor: "#fee2e2", color: "#dc2626", fontWeight: 700 }}>
              {deficiencies.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab("rules")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
            padding: "0.75rem 1.15rem",
            border: "none",
            borderBottom: activeTab === "rules" ? "3px solid #2563eb" : "3px solid transparent",
            backgroundColor: "transparent",
            color: activeTab === "rules" ? "#2563eb" : "#64748b",
            fontWeight: activeTab === "rules" ? 700 : 500,
            fontSize: "0.88rem",
            cursor: "pointer",
            marginBottom: "-2px"
          }}
        >
          <Shield size={16} />
          <span>Dynamic Rules</span>
        </button>

        <button
          onClick={() => setActiveTab("history")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
            padding: "0.75rem 1.15rem",
            border: "none",
            borderBottom: activeTab === "history" ? "3px solid #2563eb" : "3px solid transparent",
            backgroundColor: "transparent",
            color: activeTab === "history" ? "#2563eb" : "#64748b",
            fontWeight: activeTab === "history" ? 700 : 500,
            fontSize: "0.88rem",
            cursor: "pointer",
            marginBottom: "-2px"
          }}
        >
          <History size={16} />
          <span>Application History</span>
          <span style={{ fontSize: "0.7rem", padding: "0.1rem 0.45rem", borderRadius: "10px", backgroundColor: "#f1f5f9", color: "#475569" }}>
            {history?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("notifications")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
            padding: "0.75rem 1.15rem",
            border: "none",
            borderBottom: activeTab === "notifications" ? "3px solid #2563eb" : "3px solid transparent",
            backgroundColor: "transparent",
            color: activeTab === "notifications" ? "#2563eb" : "#64748b",
            fontWeight: activeTab === "notifications" ? 700 : 500,
            fontSize: "0.88rem",
            cursor: "pointer",
            marginBottom: "-2px"
          }}
        >
          <Bell size={16} />
          <span>Notifications</span>
          <span style={{ fontSize: "0.7rem", padding: "0.1rem 0.45rem", borderRadius: "10px", backgroundColor: "#f1f5f9", color: "#475569" }}>
            {notifications?.length || 0}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("gaps")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
            padding: "0.75rem 1.15rem",
            border: "none",
            borderBottom: activeTab === "gaps" ? "3px solid #7c3aed" : "3px solid transparent",
            backgroundColor: "transparent",
            color: activeTab === "gaps" ? "#7c3aed" : "#64748b",
            fontWeight: activeTab === "gaps" ? 700 : 500,
            fontSize: "0.88rem",
            cursor: "pointer",
            marginBottom: "-2px"
          }}
        >
          <Sparkles size={16} />
          <span>Gap Intelligence</span>
          {gapIntelligence && gapIntelligence.total_gaps_count > 0 && (
            <span style={{ fontSize: "0.7rem", padding: "0.1rem 0.45rem", borderRadius: "10px", backgroundColor: "#f3e8ff", color: "#7c3aed", fontWeight: 700 }}>
              {gapIntelligence.total_gaps_count}
            </span>
          )}
        </button>
      </div>

      {/* TAB CONTENT 1: STATUTORY TIMELINE */}
      {activeTab === "timeline" && (
        <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.75rem" }}>
          <div style={{ marginBottom: "1.5rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", margin: "0 0 0.25rem 0" }}>
              Canonical 9-State Lifecycle Tracking
            </h3>
            <p style={{ fontSize: "0.82rem", color: "#64748b", margin: 0 }}>
              Live verification progression adhering to Ministry of Tribal Affairs statutory compliance guidelines.
            </p>
          </div>

          <div style={{ position: "relative", paddingLeft: "1.5rem" }}>
            {/* Vertical timeline connecting line */}
            <div
              style={{
                position: "absolute",
                top: "14px",
                bottom: "14px",
                left: "27px",
                width: "2px",
                backgroundColor: "#e2e8f0"
              }}
            />

            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              {timeline.map((milestone, idx) => {
                const isCompleted = milestone.status === "COMPLETED";
                const isCurrent = milestone.status === "CURRENT";
                const isMilestoneDeficiency = milestone.status === "DEFICIENCY";
                const isSkipped = milestone.status === "SKIPPED";

                let nodeBg = "#f1f5f9";
                let nodeBorder = "#cbd5e1";
                let nodeColor = "#94a3b8";

                if (isCompleted) {
                  nodeBg = "#ecfdf5";
                  nodeBorder = "#10b981";
                  nodeColor = "#10b981";
                } else if (isCurrent) {
                  nodeBg = "#eff6ff";
                  nodeBorder = "#2563eb";
                  nodeColor = "#2563eb";
                } else if (isMilestoneDeficiency) {
                  nodeBg = "#fff1f2";
                  nodeBorder = "#dc2626";
                  nodeColor = "#dc2626";
                } else if (isSkipped) {
                  nodeBg = "#f8fafc";
                  nodeBorder = "#e2e8f0";
                  nodeColor = "#cbd5e1";
                }

                return (
                  <div key={milestone.state} style={{ display: "flex", alignItems: "flex-start", gap: "1.25rem", position: "relative" }}>
                    {/* Node Circle */}
                    <div
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        backgroundColor: nodeBg,
                        border: `2px solid ${nodeBorder}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        zIndex: 2,
                        flexShrink: 0
                      }}
                    >
                      {isCompleted ? (
                        <Check size={14} color="#10b981" strokeWidth={3} />
                      ) : isMilestoneDeficiency ? (
                        <AlertTriangle size={14} color="#dc2626" />
                      ) : isCurrent ? (
                        <div style={{ width: "10px", height: "10px", borderRadius: "50%", backgroundColor: "#2563eb" }} />
                      ) : (
                        <div style={{ width: "6px", height: "6px", borderRadius: "50%", backgroundColor: "#cbd5e1" }} />
                      )}
                    </div>

                    {/* Milestone Card */}
                    <div
                      style={{
                        flex: 1,
                        backgroundColor: isCurrent ? "#f8faff" : isMilestoneDeficiency ? "#fffbfb" : "#ffffff",
                        border: `1px solid ${isCurrent ? "#bfdbfe" : isMilestoneDeficiency ? "#fecdd3" : "#f1f5f9"}`,
                        borderRadius: "10px",
                        padding: "1rem 1.25rem"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.5rem" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                            <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: isCurrent ? "#1d4ed8" : isMilestoneDeficiency ? "#be123c" : "#0f172a" }}>
                              {milestone.label}
                            </h4>
                            {isCurrent && (
                              <span style={{ fontSize: "0.65rem", fontWeight: 800, padding: "0.15rem 0.45rem", borderRadius: "4px", backgroundColor: "#2563eb", color: "#ffffff" }}>
                                CURRENT STATUS
                              </span>
                            )}
                            {isMilestoneDeficiency && (
                              <span style={{ fontSize: "0.65rem", fontWeight: 800, padding: "0.15rem 0.45rem", borderRadius: "4px", backgroundColor: "#dc2626", color: "#ffffff" }}>
                                ACTION REQUIRED
                              </span>
                            )}
                            {isSkipped && (
                              <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem", borderRadius: "4px", backgroundColor: "#f1f5f9", color: "#94a3b8" }}>
                                Skipped (No Deficiencies)
                              </span>
                            )}
                          </div>
                          <p style={{ margin: "0.3rem 0 0 0", fontSize: "0.82rem", color: "#64748b" }}>
                            {milestone.description}
                          </p>
                        </div>

                        {milestone.timestamp && (
                          <div style={{ fontSize: "0.75rem", color: "#64748b", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                            <Calendar size={13} />
                            <span>{new Date(milestone.timestamp).toLocaleString()}</span>
                          </div>
                        )}
                      </div>

                      {/* Actor & Remarks */}
                      {(milestone.actor_name || milestone.remarks) && (
                        <div style={{ marginTop: "0.6rem", paddingTop: "0.6rem", borderTop: "1px dashed #e2e8f0", fontSize: "0.78rem", display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "0.4rem" }}>
                          {milestone.actor_name && (
                            <span style={{ color: "#475569" }}>
                              <strong>Recorded by:</strong> {milestone.actor_name}
                            </span>
                          )}
                          {milestone.remarks && (
                            <span style={{ color: "#64748b", fontStyle: "italic" }}>
                              "{milestone.remarks}"
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB CONTENT 2: DEFICIENCIES & RESUBMISSION WORKBENCH */}
      {activeTab === "deficiencies" && (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Statutory Scheme Gap Intelligence: Requirement -> Status -> Gap -> Action */}
          {gapIntelligence && gapIntelligence.gaps.length > 0 && (
            <div>
              <SchemeGapViewer
                schemeCode={application.scheme_code}
                schemeName={application.scheme_name}
                gapIntelligence={gapIntelligence}
                title="Statutory Scheme Gap Intelligence"
              />
            </div>
          )}

          {/* Active Deficiencies List */}
          <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.75rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", margin: "0 0 0.25rem 0" }}>
              Identified Deficiencies & Rectification Notices
            </h3>
            <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "0 0 1.25rem 0" }}>
              Any document or eligibility criteria flagged during OCR extraction, automated rule evaluation, or Revenue Officer inspection.
            </p>

            {deficiencies && deficiencies.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {deficiencies.map((d) => (
                  <div
                    key={d.id}
                    style={{
                      borderRadius: "10px",
                      border: `1.5px solid ${d.is_resolved ? "#bbf7d0" : "#fecdd3"}`,
                      backgroundColor: d.is_resolved ? "#fafffd" : "#fff5f5",
                      padding: "1.15rem"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          {d.rule_code && (
                            <span style={{ fontSize: "0.7rem", fontWeight: 700, padding: "0.15rem 0.45rem", borderRadius: "4px", backgroundColor: "#0f172a", color: "#ffffff" }}>
                              {d.rule_code}
                            </span>
                          )}
                          <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>
                            {d.title}
                          </h4>
                        </div>
                        <div style={{ marginTop: "0.45rem", fontSize: "0.84rem", color: "#991b1b" }}>
                          <strong>Deficiency Reason: </strong>{d.reason}
                        </div>
                        <div style={{ marginTop: "0.3rem", fontSize: "0.82rem", color: "#0369a1" }}>
                          <strong>Required Action: </strong>{d.required_action}
                        </div>
                      </div>

                      <div>
                        <span
                          style={{
                            fontSize: "0.74rem",
                            fontWeight: 800,
                            padding: "0.25rem 0.65rem",
                            borderRadius: "6px",
                            backgroundColor: d.is_resolved ? "#dcfce7" : "#fee2e2",
                            color: d.is_resolved ? "#166534" : "#991b1b"
                          }}
                        >
                          {d.is_resolved ? "✓ RESOLVED" : "• PENDING CORRECTION"}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: "2rem", textAlign: "center", backgroundColor: "#f8fafc", borderRadius: "10px", border: "1px dashed #cbd5e1" }}>
                <CheckCircle2 size={36} color="#16a34a" style={{ margin: "0 auto 0.5rem" }} />
                <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: 700, color: "#0f172a" }}>No Deficiencies Detected</h4>
                <p style={{ margin: "0.25rem 0 0 0", fontSize: "0.82rem", color: "#64748b" }}>
                  All submitted certificates and eligibility criteria meet statutory requirements.
                </p>
              </div>
            )}
          </div>

          {/* Interactive Document Resubmission Form */}
          <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.75rem" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
              <UploadCloud size={20} color="#2563eb" />
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                Resubmit Rectified Supporting Document
              </h3>
            </div>
            <p style={{ fontSize: "0.82rem", color: "#64748b", margin: "0 0 1.25rem 0" }}>
              Upload an updated or clear copy of the flagged certificate. Upon submission, the application will automatically enter RESUBMITTED status and trigger dynamic re-validation.
            </p>

            {resubmitSuccessMessage && (
              <div style={{ padding: "1rem", borderRadius: "8px", backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", fontSize: "0.85rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <CheckCircle2 size={18} />
                <span>{resubmitSuccessMessage}</span>
              </div>
            )}

            {resubmitErrorMessage && (
              <div style={{ padding: "1rem", borderRadius: "8px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", fontSize: "0.85rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <AlertCircle size={18} />
                <span>{resubmitErrorMessage}</span>
              </div>
            )}

            <form onSubmit={handleResubmit}>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "1rem", marginBottom: "1rem" }}>
                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "0.35rem" }}>
                    Select Document Type to Rectify *
                  </label>
                  <select
                    value={selectedDocType}
                    onChange={(e) => setSelectedDocType(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.6rem 0.85rem",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.85rem",
                      backgroundColor: "#ffffff"
                    }}
                  >
                    <option value="CASTE_CERTIFICATE">Community / Caste Certificate (ST Art. 342)</option>
                    <option value="INCOME_CERTIFICATE">Annual Family Income Certificate</option>
                    <option value="MARKS_MEMO">Previous Qualifying Marks Memo</option>
                    <option value="DOMICILE_CERTIFICATE">State Domicile / Residence Proof</option>
                    <option value="AADHAAR_CARD">Aadhaar Identity Verification</option>
                    <option value="BONAFIDE_CERTIFICATE">Institution Bonafide / Enrollment</option>
                    <option value="OTHER">Other Rectified Document</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "0.35rem" }}>
                    Attach Replacement Document (PDF / JPG / PNG) *
                  </label>
                  <input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png"
                    onChange={(e) => setResubmitFile(e.target.files ? e.target.files[0] : null)}
                    style={{
                      width: "100%",
                      padding: "0.45rem",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.82rem",
                      backgroundColor: "#f8fafc"
                    }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "1.25rem" }}>
                <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "0.35rem" }}>
                  Applicant Explanation & Remarks
                </label>
                <textarea
                  rows={3}
                  value={applicantRemarks}
                  onChange={(e) => setApplicantRemarks(e.target.value)}
                  placeholder="Explain the correction made (e.g. Uploaded gazetted copy with legible Tehsildar stamp and barcode)..."
                  style={{
                    width: "100%",
                    padding: "0.6rem 0.85rem",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.85rem",
                    fontFamily: "inherit",
                    resize: "vertical"
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={isSubmittingResubmit || !resubmitFile}
                style={{
                  padding: "0.65rem 1.5rem",
                  borderRadius: "6px",
                  backgroundColor: !resubmitFile || isSubmittingResubmit ? "#94a3b8" : "#2563eb",
                  color: "#ffffff",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  border: "none",
                  cursor: !resubmitFile || isSubmittingResubmit ? "not-allowed" : "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem"
                }}
              >
                {isSubmittingResubmit ? (
                  <>
                    <RefreshCw size={15} className="spin" />
                    <span>Submitting & Re-evaluating...</span>
                  </>
                ) : (
                  <>
                    <Send size={15} />
                    <span>Submit Rectified Document</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TAB CONTENT 3: DYNAMIC SCHEME RULES */}
      {activeTab === "rules" && (
        <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.75rem" }}>
          <div style={{ marginBottom: "1.25rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", margin: "0 0 0.25rem 0" }}>
              Dynamic Scheme Rules Evaluation Engine
            </h3>
            <p style={{ fontSize: "0.82rem", color: "#64748b", margin: 0 }}>
              Deterministic evaluation executed against dynamic Supabase scheme criteria. AI is utilized strictly for document text OCR assistance, never for final eligibility adjudication.
            </p>
          </div>

          {application.evaluation?.rule_results && application.evaluation.rule_results.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {application.evaluation.rule_results.map((r: any) => {
                const ruleCode = r.rule_evaluated?.rule_code || r.rule_code;
                const ruleName = r.rule_evaluated?.rule_name || r.rule_name;
                const ruleType = r.rule_evaluated?.rule_type;
                const statutoryRef = r.rule_evaluated?.statutory_reference;
                const applicantVal = r.applicant_value !== undefined ? String(r.applicant_value) : null;
                const reqCond = r.required_condition || r.expected_criterion;
                const result = r.result || r.status || "REVIEW";
                const evidenceRef = r.evidence_reference || r.extracted_evidence;
                const explanation = r.explanation;

                return (
                  <div
                    key={ruleCode}
                    style={{
                      border: `1px solid ${result === "PASS" ? "#bbf7d0" : result === "FAIL" ? "#fecaca" : "#fef08a"}`,
                      borderRadius: "10px",
                      padding: "1rem 1.15rem",
                      backgroundColor: result === "PASS" ? "#fafffd" : result === "FAIL" ? "#fffbfb" : "#fffef9"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "0.15rem 0.45rem", borderRadius: "4px", backgroundColor: "#0f172a", color: "#ffffff" }}>
                            {ruleCode}
                          </span>
                          {ruleType && (
                            <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "0.15rem 0.45rem", borderRadius: "4px", backgroundColor: "#e0e7ff", color: "#3730a3" }}>
                              {ruleType.replace(/_/g, " ")}
                            </span>
                          )}
                          <strong style={{ fontSize: "0.92rem", color: "#0f172a" }}>{ruleName}</strong>
                        </div>
                        {statutoryRef && (
                          <div style={{ fontSize: "0.74rem", color: "#64748b", marginTop: "0.25rem", fontStyle: "italic" }}>
                            Statutory Reference: {statutoryRef}
                          </div>
                        )}
                      </div>

                      <div>
                        <span
                          style={{
                            fontSize: "0.75rem",
                            fontWeight: 800,
                            padding: "0.25rem 0.65rem",
                            borderRadius: "6px",
                            backgroundColor:
                              result === "PASS" ? "#ecfdf5" :
                              result === "FAIL" ? "#fef2f2" : "#fffbeb",
                            color:
                              result === "PASS" ? "#065f46" :
                              result === "FAIL" ? "#991b1b" : "#92400e",
                            border: `1px solid ${result === "PASS" ? "#a7f3d0" : result === "FAIL" ? "#fca5a5" : "#fde68a"}`
                          }}
                        >
                          {result === "PASS" ? "✓ PASS" : result === "FAIL" ? "✗ FAIL" : "• REVIEW"}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "0.6rem", marginTop: "0.75rem", fontSize: "0.8rem", backgroundColor: "#f8fafc", padding: "0.6rem 0.75rem", borderRadius: "6px" }}>
                      <div>
                        <span style={{ color: "#64748b" }}>Condition: </span>
                        <code style={{ fontWeight: 700, color: "#0f172a" }}>{reqCond}</code>
                      </div>
                      <div>
                        <span style={{ color: "#64748b" }}>Applicant Fact: </span>
                        <span style={{ fontWeight: 700, color: applicantVal ? "#0f172a" : "#94a3b8" }}>{applicantVal ?? "Not Extracted"}</span>
                      </div>
                    </div>

                    {evidenceRef && (
                      <div style={{ fontSize: "0.76rem", color: "#475569", marginTop: "0.45rem" }}>
                        <strong>Extracted Evidence:</strong> {evidenceRef}
                      </div>
                    )}

                    {explanation && (
                      <div style={{ fontSize: "0.76rem", marginTop: "0.35rem", color: result === "PASS" ? "#166534" : result === "FAIL" ? "#b91c1c" : "#b45309", fontWeight: 500 }}>
                        <strong>Explanation:</strong> {explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ color: "#94a3b8", fontSize: "0.85rem", padding: "2rem", textAlign: "center" }}>
              Dynamic rules evaluation records stored in official registry.
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 4: APPLICATION HISTORY AUDIT TRAIL */}
      {activeTab === "history" && (
        <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.75rem" }}>
          <div style={{ marginBottom: "1.25rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", margin: "0 0 0.25rem 0" }}>
              Immutable Application History Audit Log
            </h3>
            <p style={{ fontSize: "0.82rem", color: "#64748b", margin: 0 }}>
              Every status change and officer determination is permanently recorded in <code style={{ backgroundColor: "#f1f5f9", padding: "0.1rem 0.3rem", borderRadius: "3px" }}>application_history</code>.
            </p>
          </div>

          {history && history.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {history.map((h, i) => (
                <div
                  key={h.id || i}
                  style={{
                    padding: "0.9rem 1.15rem",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    backgroundColor: "#f8fafc",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "flex-start",
                    flexWrap: "wrap",
                    gap: "0.75rem"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span
                        style={{
                          fontSize: "0.74rem",
                          fontWeight: 800,
                          padding: "0.15rem 0.5rem",
                          borderRadius: "4px",
                          backgroundColor: "#0f172a",
                          color: "#ffffff"
                        }}
                      >
                        {h.action}
                      </span>
                      {h.previous_status && h.new_status && (
                        <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
                          {h.previous_status} &rarr; <strong>{h.new_status}</strong>
                        </span>
                      )}
                    </div>

                    {h.remarks && (
                      <div style={{ fontSize: "0.82rem", color: "#334155", marginTop: "0.4rem" }}>
                        <strong>Remarks: </strong>{h.remarks}
                      </div>
                    )}

                    {h.officer_name && (
                      <div style={{ fontSize: "0.74rem", color: "#64748b", marginTop: "0.25rem" }}>
                        Officer: {h.officer_name}
                      </div>
                    )}
                  </div>

                  <div style={{ fontSize: "0.75rem", color: "#64748b", display: "flex", alignItems: "center", gap: "0.3rem" }}>
                    <Clock size={13} />
                    <span>{new Date(h.created_at).toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: "#94a3b8", fontSize: "0.85rem", padding: "2rem", textAlign: "center" }}>
              No history entries recorded yet.
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 5: IN-APP & EMAIL NOTIFICATIONS */}
      {activeTab === "notifications" && (
        <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.75rem" }}>
          <div style={{ marginBottom: "1.25rem" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", margin: "0 0 0.25rem 0" }}>
              Applicant Notification Records
            </h3>
            <p style={{ fontSize: "0.82rem", color: "#64748b", margin: 0 }}>
              Dispatched in-app notices and SMTP email notifications with delivery logs and receipts.
            </p>
          </div>

          {notifications && notifications.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              {notifications.map((n, i) => (
                <div
                  key={n.id || i}
                  style={{
                    padding: "1rem 1.15rem",
                    borderRadius: "8px",
                    border: "1px solid #e2e8f0",
                    backgroundColor: "#ffffff",
                    boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "1rem", flexWrap: "wrap" }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: "0.6rem" }}>
                      <div style={{ padding: "0.45rem", borderRadius: "6px", backgroundColor: "#eff6ff", color: "#2563eb", marginTop: "0.1rem" }}>
                        <Bell size={16} />
                      </div>
                      <div>
                        <h4 style={{ margin: 0, fontSize: "0.92rem", fontWeight: 700, color: "#0f172a" }}>
                          {n.title}
                        </h4>
                        <p style={{ margin: "0.3rem 0 0 0", fontSize: "0.82rem", color: "#475569", lineHeight: 1.4 }}>
                          {n.message}
                        </p>
                      </div>
                    </div>

                    <div style={{ textAlign: "right", flexShrink: 0 }}>
                      <div style={{ fontSize: "0.74rem", color: "#64748b", display: "flex", alignItems: "center", gap: "0.3rem", justifyContent: "flex-end" }}>
                        <Clock size={13} />
                        <span>{new Date(n.created_at).toLocaleString()}</span>
                      </div>

                      {/* Email Dispatch Badge */}
                      <div style={{ marginTop: "0.4rem" }}>
                        {n.email_dispatched ? (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.3rem",
                              fontSize: "0.68rem",
                              fontWeight: 700,
                              padding: "0.15rem 0.5rem",
                              borderRadius: "4px",
                              backgroundColor: "#ecfdf5",
                              color: "#065f46",
                              border: "1px solid #a7f3d0"
                            }}
                          >
                            <Mail size={12} />
                            <span>Email Dispatched ({n.email_status || "Delivered"})</span>
                          </span>
                        ) : (
                          <span
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "0.3rem",
                              fontSize: "0.68rem",
                              fontWeight: 600,
                              padding: "0.15rem 0.5rem",
                              borderRadius: "4px",
                              backgroundColor: "#f8fafc",
                              color: "#64748b",
                              border: "1px solid #e2e8f0"
                            }}
                          >
                            <Bell size={12} />
                            <span>In-App Alert</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: "#94a3b8", fontSize: "0.85rem", padding: "2rem", textAlign: "center" }}>
              No notifications recorded for this application.
            </div>
          )}
        </div>
      )}

      {/* TAB CONTENT 6: SCHEME GAP INTELLIGENCE */}
      {activeTab === "gaps" && (
        <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.75rem" }}>
          <SchemeGapViewer
            schemeCode={application.scheme_code}
            schemeName={application.scheme_name}
            gapIntelligence={gapIntelligence}
            title="Dossier Scheme Gap Intelligence"
          />
        </div>
      )}
    </div>
  );
}
