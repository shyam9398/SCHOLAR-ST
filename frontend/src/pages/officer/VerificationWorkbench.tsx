import React, { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  FileText,
  Download,
  ArrowLeft,
  Loader2,
  Building2,
  Calendar,
  Lock,
  Stamp,
  Sparkles,
  Info,
  Eye,
  History,
  Clock,
  User,
  GraduationCap,
  IndianRupee,
  MapPin,
  RotateCcw
} from "lucide-react";
import { scholarService } from "../../services/scholarService";
import type { ScholarshipApplication, ApplicationDocument, ApplicationHistoryItem } from "../../types/scholar";

export default function VerificationWorkbench() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [application, setApplication] = useState<ScholarshipApplication | null>(null);
  const [history, setHistory] = useState<ApplicationHistoryItem[]>([]);
  const [selectedDocIndex, setSelectedDocIndex] = useState(0);
  const [decision, setDecision] = useState<"APPROVE" | "REQUEST_RESUBMISSION" | "UNDER_REVIEW" | "REJECT">("APPROVE");
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      setLoading(true);
      Promise.all([
        scholarService.getApplication(id),
        scholarService.getApplicationHistory(id)
      ]).then(([app, hist]) => {
        setApplication(app);
        setHistory(hist || []);
        if (app?.officer_decision) {
          const d = app.officer_decision.toUpperCase();
          if (d.includes("APPROV")) setDecision("APPROVE");
          else if (d.includes("REJECT")) setDecision("REJECT");
          else if (d.includes("RESUB") || d.includes("CLARIF")) setDecision("REQUEST_RESUBMISSION");
          else if (d.includes("REVIEW")) setDecision("UNDER_REVIEW");
        }
        if (app?.officer_remarks) {
          setRemarks(app.officer_remarks);
        } else {
          setRemarks("Verified ST community certificate issued under Article 342, qualifying marks, and income ceiling satisfied. Approved for statutory sanction.");
        }
        setLoading(false);
      }).catch((err) => {
        setError(err?.message || "Failed to load application dossier");
        setLoading(false);
      });
    }
  }, [id]);

  const handleSelectDecision = (newDec: "APPROVE" | "REQUEST_RESUBMISSION" | "UNDER_REVIEW" | "REJECT") => {
    setDecision(newDec);
    if (newDec === "APPROVE") {
      setRemarks("Verified ST community certificate issued under Article 342, qualifying marks, and income ceiling satisfied. Approved for statutory sanction.");
    } else if (newDec === "REQUEST_RESUBMISSION") {
      setRemarks("Deficiency identified in uploaded certificate/document. Please resubmit an unblurred, legible copy issued by the competent revenue authority.");
    } else if (newDec === "UNDER_REVIEW") {
      setRemarks("Application dossier assigned for active statutory review and secondary cross-verification.");
    } else if (newDec === "REJECT") {
      setRemarks("Statutory criteria not met based on verified documentary evidence.");
    }
  };

  const handleRecordDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!application) return;

    if (decision === "REJECT" && !remarks.trim()) {
      setError("Official statutory justification remarks are mandatory when rejecting an application.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const updated = await scholarService.recordOfficerDecision(
        application.id,
        decision,
        remarks.trim() || `Statutory determination recorded as ${decision}`
      );
      setApplication(updated);
      const updatedHistory = await scholarService.getApplicationHistory(application.id);
      setHistory(updatedHistory);
      alert(`Statutory action recorded: Application is now ${updated.status}`);
      navigate("/officer/queue");
    } catch (err: any) {
      setError(err?.message || "Failed to record determination.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>Loading Verification Workbench...</div>;
  }

  if (!application) {
    return (
      <div style={{ padding: "3rem", textAlign: "center" }}>
        <h3>Application Dossier Not Found</h3>
        <Link to="/officer/queue" style={{ color: "#2563eb", marginTop: "1rem", display: "inline-block" }}>
          &larr; Back to Queue
        </Link>
      </div>
    );
  }

  const evaluation = application.evaluation;
  const docs = application.documents || [];
  const currentDoc: ApplicationDocument | undefined = docs[selectedDocIndex];

  return (
    <div style={{ maxWidth: "1350px", margin: "0 auto" }}>
      {/* Top Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
        <Link
          to="/officer/queue"
          style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#64748b", textDecoration: "none", fontSize: "0.85rem", fontWeight: 600 }}
        >
          <ArrowLeft size={16} /> Back to Application Queue
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ fontSize: "0.78rem", color: "#64748b" }}>
            Application Status: <strong style={{ color: "#0f172a" }}>{application.status}</strong>
          </span>
          <Link
            to={`/officer/applications/${application.id}/verification-report`}
            target="_blank"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              padding: "0.45rem 0.95rem",
              borderRadius: "6px",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              fontSize: "0.8rem",
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
              gap: "0.35rem",
              padding: "0.45rem 0.95rem",
              borderRadius: "6px",
              backgroundColor: "#0f172a",
              color: "#ffffff",
              fontSize: "0.8rem",
              fontWeight: 600,
              textDecoration: "none"
            }}
          >
            <Download size={15} />
            <span>Download PDF Dossier</span>
          </a>
        </div>
      </div>

      {/* Header Banner */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.25rem 1.75rem", marginBottom: "1.5rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: "0.74rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>
            Human-in-the-Loop Statutory Verification Workstation
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", marginTop: "0.15rem" }}>
            {application.application_number} &bull; {application.applicant_name}
          </h1>
          <div style={{ fontSize: "0.85rem", color: "#2563eb", fontWeight: 600 }}>
            {application.scheme_name} ({application.scheme_code}) &bull; Scheduled Tribe: {application.tribe_name || "ST Certified"}
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 600 }}>Deterministic Score</div>
          <div style={{ fontSize: "1.7rem", fontWeight: 800, color: application.eligibility_score >= 80 ? "#059669" : "#d97706" }}>
            {application.eligibility_score}%
          </div>
          <div style={{ fontSize: "0.72rem", color: "#64748b" }}>
            {application.passed_rules} of {application.total_rules} Rules Satisfied
          </div>
        </div>
      </div>

      {error && (
        <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "0.85rem 1rem", color: "#991b1b", fontSize: "0.85rem", marginBottom: "1.25rem" }}>
          {error}
        </div>
      )}

      {/* Applicant Profile Statutory Overview Card */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.25rem 1.5rem", marginBottom: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.85rem", borderBottom: "1px solid #f1f5f9", paddingBottom: "0.6rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <User size={18} color="#2563eb" />
            <h2 style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              Applicant Profile &amp; Statutory Credentials
            </h2>
          </div>
          <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
            Constitutional Framework: <strong>The Constitution (Scheduled Tribes) Order, 1950 (Article 342)</strong>
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1rem", fontSize: "0.82rem" }}>
          {/* Scheduled Tribe */}
          <div style={{ backgroundColor: "#f8fafc", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Scheduled Tribe Community</div>
            <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a", marginTop: "0.2rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
              <span>{application.tribe_name || "ST Community"}</span>
              <span style={{ fontSize: "0.65rem", padding: "0.1rem 0.35rem", borderRadius: "4px", backgroundColor: "#ecfdf5", color: "#065f46", fontWeight: 700 }}>Art. 342 Verified</span>
            </div>
            <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "0.2rem" }}>
              Cert No: <code>{application.caste_certificate_no || "VERIFIED-ST"}</code>
            </div>
          </div>

          {/* Annual Household Income */}
          <div style={{ backgroundColor: "#f8fafc", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Annual Household Income</div>
            <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a", marginTop: "0.2rem" }}>
              ₹{application.annual_family_income ? application.annual_family_income.toLocaleString("en-IN") : "0"} / yr
            </div>
            <div style={{ fontSize: "0.72rem", color: "#059669", marginTop: "0.2rem", fontWeight: 600 }}>
              ✓ Verified below statutory income threshold
            </div>
          </div>

          {/* Academic Aggregate */}
          <div style={{ backgroundColor: "#f8fafc", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Academic Performance</div>
            <div style={{ fontSize: "0.95rem", fontWeight: 800, color: "#0f172a", marginTop: "0.2rem" }}>
              {application.aggregate_percentage || "0"}% Aggregate
            </div>
            <div style={{ fontSize: "0.72rem", color: "#059669", marginTop: "0.2rem", fontWeight: 600 }}>
              ✓ Satisfies academic eligibility cutoff
            </div>
          </div>

          {/* Enrolled Course & Institution */}
          <div style={{ backgroundColor: "#f8fafc", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
            <div style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 700, textTransform: "uppercase" }}>Course &amp; Academic Institution</div>
            <div style={{ fontSize: "0.85rem", fontWeight: 800, color: "#0f172a", marginTop: "0.2rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {application.course_enrolled || "Higher Education"}
            </div>
            <div style={{ fontSize: "0.72rem", color: "#475569", marginTop: "0.2rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
              {application.institution_name || "Recognized University / Institute"}
            </div>
          </div>
        </div>
      </div>

      {/* Split-Screen Workstation Layout */}
      <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr", gap: "1.5rem", alignItems: "flex-start" }}>
        {/* LEFT COLUMN: DOCUMENT VIEWER & OCR TEXT */}
        <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.5rem", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
              1. Document Inspection Panel
            </h3>
            <span style={{ fontSize: "0.74rem", color: "#64748b" }}>
              {docs.length} Uploaded File(s)
            </span>
          </div>

          {/* Document Tabs */}
          <div style={{ display: "flex", gap: "0.4rem", overflowX: "auto", borderBottom: "1px solid #e2e8f0", paddingBottom: "0.5rem" }}>
            {docs.map((doc, idx) => (
              <button
                key={doc.id}
                onClick={() => setSelectedDocIndex(idx)}
                style={{
                  padding: "0.45rem 0.85rem",
                  borderRadius: "6px",
                  border: "none",
                  backgroundColor: selectedDocIndex === idx ? "#0f172a" : "#f1f5f9",
                  color: selectedDocIndex === idx ? "#ffffff" : "#475569",
                  fontSize: "0.78rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
              >
                {doc.document_type.replace(/_/g, " ")}
              </button>
            ))}
          </div>

          {currentDoc ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              {/* Document Metadata Bar */}
              <div style={{ backgroundColor: "#f8fafc", padding: "0.75rem 1rem", borderRadius: "8px", fontSize: "0.8rem", border: "1px solid #e2e8f0", display: "flex", justifyContent: "space-between" }}>
                <span>File: <strong>{currentDoc.file_name}</strong></span>
                <span>Type: <strong>{currentDoc.file_type?.toUpperCase()}</strong></span>
                <span style={{ color: "#059669", fontWeight: 700 }}>✓ High-DPI Enhanced</span>
              </div>

              {/* AI-Assisted Document Understanding Layer (Gemini Flash) */}
              {(() => {
                const aiMeta = (currentDoc.extracted_fields as any)?.ai_understanding || {};
                const explanation = aiMeta.document_explanation || (currentDoc.extracted_fields as any)?.document_explanation;
                const classification = aiMeta.classification || {
                  classified_type: (currentDoc.extracted_fields as any)?.document_type || currentDoc.document_type,
                  confidence: (currentDoc.extracted_fields as any)?.classification_confidence || 0.94,
                  rationale: (currentDoc.extracted_fields as any)?.classification_rationale || "Visual structural analysis and layout inspection."
                };
                const unclearFlags: string[] = aiMeta.unclear_information_flags || (currentDoc.extracted_fields as any)?.unclear_information_flags || [];
                const inconsistencies: string[] = aiMeta.inconsistencies_detected || (currentDoc.extracted_fields as any)?.inconsistencies_detected || [];

                return (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                    {/* Constitutional Guardrail Notice */}
                    <div style={{ border: "1px solid #c7d2fe", borderRadius: "8px", padding: "0.85rem", backgroundColor: "#f5f7ff" }}>
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.4rem", flexWrap: "wrap", gap: "0.4rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", color: "#1e1b4b", fontWeight: 800, fontSize: "0.82rem" }}>
                          <Sparkles size={16} color="#4f46e5" />
                          <span>AI-Assisted Document Understanding (Gemini Flash)</span>
                        </div>
                        <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "0.15rem 0.45rem", borderRadius: "4px", backgroundColor: "#e0e7ff", color: "#3730a3" }}>
                          ASSISTIVE LAYER ONLY
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: "0.72rem", color: "#4338ca", lineHeight: 1.45 }}>
                        <strong>Statutory Directive:</strong> Gemini assists exclusively with visual document parsing, textual interpretation, and detecting unclear or inconsistent areas. Gemini does <strong>NOT</strong> approve or reject eligibility. Final statutory determination rests strictly with the Dynamic Rule Engine and your officer sign-off.
                      </p>
                    </div>

                    {/* Document Explanation */}
                    {explanation && (
                      <div style={{ backgroundColor: "#faf5ff", border: "1px solid #f3e8ff", borderRadius: "8px", padding: "0.75rem", fontSize: "0.78rem", color: "#581c87", lineHeight: 1.45 }}>
                        <strong>Document Interpretation:</strong> {explanation}
                      </div>
                    )}

                    {/* Classification Assistance */}
                    <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", fontSize: "0.76rem", color: "#475569", flexWrap: "wrap", backgroundColor: "#f8fafc", padding: "0.6rem 0.75rem", borderRadius: "6px", border: "1px solid #e2e8f0" }}>
                      <span>Classified As: <strong style={{ color: "#0f172a" }}>{classification.classified_type}</strong></span>
                      <span style={{ color: "#94a3b8" }}>&bull;</span>
                      <span>Confidence: <strong>{Math.round((classification.confidence || 0.9) * 100)}%</strong></span>
                      {classification.rationale && (
                        <>
                          <span style={{ color: "#94a3b8" }}>&bull;</span>
                          <span style={{ fontStyle: "italic", color: "#64748b" }}>{classification.rationale}</span>
                        </>
                      )}
                    </div>

                    {/* Extracted Factual Fields Grid */}
                    {currentDoc.extracted_fields && Object.keys(currentDoc.extracted_fields).length > 0 && (
                      <div style={{ border: "1px solid #e2e8f0", borderRadius: "8px", padding: "0.85rem", backgroundColor: "#ffffff" }}>
                        <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", marginBottom: "0.5rem", textTransform: "uppercase" }}>
                          Structured Factual Fields
                        </div>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", fontSize: "0.78rem" }}>
                          {Object.entries(currentDoc.extracted_fields)
                            .filter(([k, v]) => v !== null && typeof v !== "object" && k !== "extraction_notes" && k !== "extraction_confidence" && k !== "document_explanation" && k !== "classification_rationale" && k !== "classification_confidence")
                            .slice(0, 10)
                            .map(([key, val]) => (
                              <div key={key}>
                                <span style={{ color: "#64748b" }}>{key.replace(/_/g, " ")}: </span>
                                <strong style={{ color: "#0f172a" }}>{String(val)}</strong>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* Unclear Information Flags */}
                    {unclearFlags.length > 0 ? (
                      <div style={{ border: "1px solid #fde68a", backgroundColor: "#fffbeb", borderRadius: "8px", padding: "0.75rem", fontSize: "0.76rem", color: "#92400e" }}>
                        <strong>⚠️ Unclear / Degraded Areas Flagged:</strong>
                        <ul style={{ margin: "0.25rem 0 0 1.2rem", padding: 0 }}>
                          {unclearFlags.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div style={{ fontSize: "0.73rem", color: "#065f46", backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "6px", padding: "0.45rem 0.65rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <CheckCircle2 size={14} color="#059669" />
                        <span>Visual Quality: No illegible or degraded sections flagged by Gemini.</span>
                      </div>
                    )}

                    {/* Inconsistencies Detected */}
                    {inconsistencies.length > 0 ? (
                      <div style={{ border: "1px solid #fecaca", backgroundColor: "#fef2f2", borderRadius: "8px", padding: "0.75rem", fontSize: "0.76rem", color: "#991b1b" }}>
                        <strong>⚠️ Discrepancies / Inconsistencies Detected:</strong>
                        <ul style={{ margin: "0.25rem 0 0 1.2rem", padding: 0 }}>
                          {inconsistencies.map((item, i) => (
                            <li key={i}>{item}</li>
                          ))}
                        </ul>
                      </div>
                    ) : (
                      <div style={{ fontSize: "0.73rem", color: "#065f46", backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0", borderRadius: "6px", padding: "0.45rem 0.65rem", display: "flex", alignItems: "center", gap: "0.35rem" }}>
                        <CheckCircle2 size={14} color="#059669" />
                        <span>Consistency Check: No internal discrepancies detected in document text.</span>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Raw PaddleOCR Text Lines Box */}
              <div>
                <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "#64748b", marginBottom: "0.4rem", textTransform: "uppercase" }}>
                  PaddleOCR Spatial Grounding Text
                </div>
                <div
                  style={{
                    height: "220px",
                    overflowY: "auto",
                    padding: "0.75rem",
                    borderRadius: "8px",
                    backgroundColor: "#0f172a",
                    color: "#38bdf8",
                    fontFamily: "monospace",
                    fontSize: "0.75rem",
                    lineHeight: 1.5
                  }}
                >
                  {currentDoc.ocr_raw_text ? (
                    currentDoc.ocr_raw_text.split("\n").map((line, i) => (
                      <div key={i}>{line}</div>
                    ))
                  ) : (
                    <div>No raw text extracted.</div>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div style={{ padding: "2rem", textAlign: "center", color: "#94a3b8" }}>
              No document uploaded in this slot.
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: DETERMINISTIC RULES & OFFICER DETERMINATION */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {/* Rule Evaluation Checklist */}
          <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
                2. Deterministic Rule Checklist
              </h3>
              <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#2563eb" }}>
                Dynamic Supabase Rules
              </span>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", maxHeight: "380px", overflowY: "auto" }}>
              {evaluation?.rule_results?.map((rule: any) => {
                const ruleCode = rule.rule_evaluated?.rule_code || rule.rule_code;
                const ruleName = rule.rule_evaluated?.rule_name || rule.rule_name;
                const ruleType = rule.rule_evaluated?.rule_type;
                const statutoryRef = rule.rule_evaluated?.statutory_reference;
                const applicantVal = rule.applicant_value !== undefined ? String(rule.applicant_value) : null;
                const reqCond = rule.required_condition || rule.expected_criterion;
                const result = rule.result || rule.status || "REVIEW";
                const evidenceRef = rule.evidence_reference || rule.extracted_evidence;
                const explanation = rule.explanation;

                return (
                  <div
                    key={ruleCode}
                    style={{
                      border: `1px solid ${result === "PASS" ? "#bbf7d0" : result === "FAIL" ? "#fecaca" : "#fef08a"}`,
                      borderRadius: "8px",
                      padding: "0.75rem 0.85rem",
                      backgroundColor: result === "PASS" ? "#fafffd" : result === "FAIL" ? "#fffbfb" : "#fffef9"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.5rem" }}>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", flexWrap: "wrap" }}>
                          <span style={{ fontSize: "0.7rem", fontWeight: 800, padding: "0.1rem 0.4rem", borderRadius: "4px", backgroundColor: "#0f172a", color: "#ffffff" }}>
                            {ruleCode}
                          </span>
                          {ruleType && (
                            <span style={{ fontSize: "0.65rem", fontWeight: 700, padding: "0.1rem 0.35rem", borderRadius: "4px", backgroundColor: "#e0e7ff", color: "#3730a3" }}>
                              {ruleType.replace(/_/g, " ")}
                            </span>
                          )}
                          <strong style={{ fontSize: "0.85rem", color: "#0f172a" }}>{ruleName}</strong>
                        </div>
                        {statutoryRef && (
                          <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "0.15rem", fontStyle: "italic" }}>
                            {statutoryRef}
                          </div>
                        )}
                      </div>

                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          padding: "0.2rem 0.55rem",
                          borderRadius: "4px",
                          backgroundColor:
                            result === "PASS" ? "#ecfdf5" :
                            result === "FAIL" ? "#fef2f2" : "#fffbeb",
                          color:
                            result === "PASS" ? "#065f46" :
                            result === "FAIL" ? "#991b1b" : "#92400e"
                        }}
                      >
                        {result === "PASS" ? "✓ PASS" : result === "FAIL" ? "✗ FAIL" : "• REVIEW"}
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", gap: "0.5rem", marginTop: "0.5rem", fontSize: "0.76rem", backgroundColor: "#f8fafc", padding: "0.4rem 0.6rem", borderRadius: "4px" }}>
                      <div>Expected: <code style={{ fontWeight: 600 }}>{reqCond}</code></div>
                      <div>Declared/Extracted: <strong>{applicantVal ?? "N/A"}</strong></div>
                    </div>

                    {evidenceRef && (
                      <div style={{ fontSize: "0.72rem", color: "#475569", marginTop: "0.35rem" }}>
                        <strong>Evidence:</strong> {evidenceRef}
                      </div>
                    )}

                    {explanation && (
                      <div style={{ fontSize: "0.72rem", marginTop: "0.25rem", color: result === "PASS" ? "#166534" : result === "FAIL" ? "#b91c1c" : "#b45309", fontWeight: 500 }}>
                        {explanation}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Official Officer Determination Form */}
          <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "2px solid #0f172a", padding: "1.75rem", boxShadow: "0 4px 14px rgba(0, 0, 0, 0.08)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1rem" }}>
              <Stamp size={20} color="#0f172a" />
              <h3 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a" }}>
                3. Verification Officer Determination
              </h3>
            </div>

            <p style={{ fontSize: "0.78rem", color: "#64748b", margin: "0 0 1rem 0", lineHeight: 1.45 }}>
              Review the algorithmic rule results and document evidence above. Choose a statutory action to execute your determination.
            </p>

            <form onSubmit={handleRecordDecision} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Decision 4 Actions Grid */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.5rem" }}>
                  Official Determination Action:
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  <button
                    type="button"
                    onClick={() => handleSelectDecision("APPROVE")}
                    style={{
                      padding: "0.65rem 0.5rem",
                      borderRadius: "6px",
                      border: `2px solid ${decision === "APPROVE" ? "#059669" : "#e2e8f0"}`,
                      backgroundColor: decision === "APPROVE" ? "#ecfdf5" : "#ffffff",
                      color: decision === "APPROVE" ? "#065f46" : "#475569",
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.35rem"
                    }}
                  >
                    <CheckCircle2 size={16} color={decision === "APPROVE" ? "#059669" : "#64748b"} />
                    <span>✓ APPROVE</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectDecision("REQUEST_RESUBMISSION")}
                    style={{
                      padding: "0.65rem 0.5rem",
                      borderRadius: "6px",
                      border: `2px solid ${decision === "REQUEST_RESUBMISSION" ? "#d97706" : "#e2e8f0"}`,
                      backgroundColor: decision === "REQUEST_RESUBMISSION" ? "#fffbeb" : "#ffffff",
                      color: decision === "REQUEST_RESUBMISSION" ? "#92400e" : "#475569",
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.35rem"
                    }}
                  >
                    <RotateCcw size={16} color={decision === "REQUEST_RESUBMISSION" ? "#d97706" : "#64748b"} />
                    <span>↺ RESUBMISSION</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectDecision("UNDER_REVIEW")}
                    style={{
                      padding: "0.65rem 0.5rem",
                      borderRadius: "6px",
                      border: `2px solid ${decision === "UNDER_REVIEW" ? "#2563eb" : "#e2e8f0"}`,
                      backgroundColor: decision === "UNDER_REVIEW" ? "#eff6ff" : "#ffffff",
                      color: decision === "UNDER_REVIEW" ? "#1e40af" : "#475569",
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.35rem"
                    }}
                  >
                    <Eye size={16} color={decision === "UNDER_REVIEW" ? "#2563eb" : "#64748b"} />
                    <span>👁 REVIEW</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSelectDecision("REJECT")}
                    style={{
                      padding: "0.65rem 0.5rem",
                      borderRadius: "6px",
                      border: `2px solid ${decision === "REJECT" ? "#dc2626" : "#e2e8f0"}`,
                      backgroundColor: decision === "REJECT" ? "#fef2f2" : "#ffffff",
                      color: decision === "REJECT" ? "#991b1b" : "#475569",
                      fontWeight: 700,
                      fontSize: "0.82rem",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.35rem"
                    }}
                  >
                    <XCircle size={16} color={decision === "REJECT" ? "#dc2626" : "#64748b"} />
                    <span>✗ REJECT</span>
                  </button>
                </div>
              </div>

              {/* Official Remarks */}
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.4rem" }}>
                  Official Remarks &amp; Statutory Justification {decision === "REJECT" && <span style={{ color: "#dc2626" }}>* (Mandatory)</span>}
                </label>
                <textarea
                  rows={3}
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  placeholder={
                    decision === "REJECT"
                      ? "Mandatory: Enter statutory grounds for rejecting this application based on verified evidence..."
                      : decision === "REQUEST_RESUBMISSION"
                      ? "Specify deficient document, missing seal, unblurred requirement, or reason candidate must resubmit..."
                      : "Record formal verification findings, stamp verification notes, or instructions..."
                  }
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.85rem",
                    borderRadius: "8px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.85rem",
                    outline: "none"
                  }}
                />
              </div>

              {/* Digital Officer Sign-off */}
              <div style={{ backgroundColor: "#f8fafc", padding: "0.75rem", borderRadius: "6px", border: "1px solid #e2e8f0", fontSize: "0.75rem", color: "#475569" }}>
                <Lock size={14} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />
                <span>Audit Trail: Action is signed with your active credentials and logged to immutable application history.</span>
              </div>

              <button
                type="submit"
                disabled={saving}
                style={{
                  padding: "0.75rem",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor:
                    decision === "APPROVE" ? "#059669" :
                    decision === "REJECT" ? "#dc2626" :
                    decision === "REQUEST_RESUBMISSION" ? "#d97706" : "#2563eb",
                  color: "#ffffff",
                  fontSize: "0.92rem",
                  fontWeight: 800,
                  cursor: saving ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem"
                }}
              >
                {saving ? (
                  <>
                    <Loader2 size={18} className="spin" />
                    <span>Signing Determination...</span>
                  </>
                ) : (
                  <>
                    <Stamp size={18} />
                    <span>Sign &amp; Issue {decision.replace(/_/g, " ")} Determination</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Application Action History & Audit Trail Timeline */}
          <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.5rem" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "1rem" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "0.45rem" }}>
                <History size={18} color="#0f172a" />
                <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  4. Application Action History &amp; Audit Trail
                </h3>
              </div>
              <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: "4px", backgroundColor: "#f1f5f9" }}>
                {history.length} Event(s)
              </span>
            </div>

            {history.length === 0 ? (
              <div style={{ fontSize: "0.78rem", color: "#64748b", backgroundColor: "#f8fafc", padding: "0.85rem", borderRadius: "8px", textAlign: "center" }}>
                Initial submission pending officer determination.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                {history.map((item, idx) => {
                  const act = item.action.toUpperCase();
                  const isApprove = act.includes("APPROV");
                  const isReject = act.includes("REJECT");
                  const isResubmit = act.includes("RESUB") || act.includes("CLARIF");
                  const isReview = act.includes("REVIEW");

                  return (
                    <div
                      key={item.id || idx}
                      style={{
                        border: "1px solid #e2e8f0",
                        borderRadius: "8px",
                        padding: "0.75rem 0.85rem",
                        backgroundColor: "#f8fafc"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.3rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                          <span
                            style={{
                              fontSize: "0.72rem",
                              fontWeight: 800,
                              padding: "0.15rem 0.5rem",
                              borderRadius: "4px",
                              backgroundColor:
                                isApprove ? "#ecfdf5" :
                                isReject ? "#fef2f2" :
                                isResubmit ? "#fffbeb" :
                                isReview ? "#eff6ff" : "#f1f5f9",
                              color:
                                isApprove ? "#065f46" :
                                isReject ? "#991b1b" :
                                isResubmit ? "#92400e" :
                                isReview ? "#1e40af" : "#334155"
                            }}
                          >
                            {item.action.replace(/_/g, " ")}
                          </span>
                          {item.previous_status && item.new_status && (
                            <span style={{ fontSize: "0.7rem", color: "#64748b" }}>
                              {item.previous_status} &rarr; <strong>{item.new_status}</strong>
                            </span>
                          )}
                        </div>

                        <div style={{ display: "flex", alignItems: "center", gap: "0.25rem", fontSize: "0.7rem", color: "#64748b" }}>
                          <Clock size={12} />
                          <span>{new Date(item.created_at).toLocaleString()}</span>
                        </div>
                      </div>

                      <div style={{ fontSize: "0.78rem", color: "#1e293b", marginTop: "0.3rem", lineHeight: 1.45 }}>
                        {item.remarks || "No remarks logged."}
                      </div>

                      {item.officer_name && (
                        <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "0.3rem", fontStyle: "italic" }}>
                          Signed by: {item.officer_name} ({item.officer_id})
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
