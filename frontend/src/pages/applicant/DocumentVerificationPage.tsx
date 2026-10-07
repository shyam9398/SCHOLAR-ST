import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Award,
  Upload,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  RefreshCw,
  FileText,
  FileCheck,
  Building,
  GraduationCap,
  Banknote,
  ArrowRight,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Info,
  Check,
  Loader2,
  FileUp,
  ArrowLeft
} from "lucide-react";
import { scholarService } from "../../services/scholarService";
import type {
  ScholarScheme,
  SchemeRequirementsResponse,
  DocumentRequirementItem,
  SchemeDocumentVerification,
  ApplicantProfileData
} from "../../types/scholar";

export default function DocumentVerificationPage() {
  const [schemes, setSchemes] = useState<ScholarScheme[]>([]);
  const [selectedSchemeCode, setSelectedSchemeCode] = useState<string>("NOS-ST");
  const [requirementsData, setRequirementsData] = useState<SchemeRequirementsResponse | null>(null);
  const [applicantProfile, setApplicantProfile] = useState<ApplicantProfileData | null>(null);

  const [loading, setLoading] = useState<boolean>(true);
  const [verifyingDocType, setVerifyingDocType] = useState<string | null>(null);
  const [verificationStage, setVerificationStage] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  // File selection map: doc_type -> File
  const [selectedFiles, setSelectedFiles] = useState<Record<string, File>>({});
  // Expanded card map: doc_type -> boolean
  const [expandedCards, setExpandedCards] = useState<Record<string, boolean>>({});

  // Resubmission modal state
  const [resubmittingDoc, setResubmittingDoc] = useState<{
    docType: string;
    title: string;
    verificationId: string;
    deficiencies: string[];
    remedies: string[];
  } | null>(null);
  const [resubmitFile, setResubmitFile] = useState<File | null>(null);
  const [resubmitting, setResubmitting] = useState<boolean>(false);

  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

  // 1. Initial Load: Fetch active schemes and profile
  useEffect(() => {
    async function init() {
      try {
        setLoading(true);
        const [schs, prof] = await Promise.all([
          scholarService.getSchemes(true),
          scholarService.getApplicantProfile().catch(() => null)
        ]);
        setSchemes(schs);
        if (prof) setApplicantProfile(prof);

        if (schs.length > 0) {
          const initialCode = schs[0].scheme_code;
          setSelectedSchemeCode(initialCode);
          await loadRequirements(initialCode);
        }
      } catch (err: any) {
        setError(err?.message || "Failed to initialize document verification module.");
      } finally {
        setLoading(false);
      }
    }
    init();
  }, []);

  // 2. Load requirements for chosen scheme
  const loadRequirements = async (schemeCode: string) => {
    try {
      setError(null);
      const reqs = await scholarService.getSchemeDocumentRequirements(schemeCode);
      setRequirementsData(reqs);

      // Auto-expand cards that are INVALID or INCOMPLETE so applicant notices deficiencies
      const expMap: Record<string, boolean> = {};
      reqs.required_documents.forEach((d) => {
        if (d.verification_status === "INVALID" || d.verification_status === "INCOMPLETE") {
          expMap[d.document_type] = true;
        }
      });
      setExpandedCards((prev) => ({ ...prev, ...expMap }));
    } catch (err: any) {
      setError(err?.message || "Failed to load scheme document requirements.");
    }
  };

  const handleSchemeChange = async (schemeCode: string) => {
    setSelectedSchemeCode(schemeCode);
    setSelectedFiles({});
    await loadRequirements(schemeCode);
  };

  const handleFileSelect = (docType: string, file: File | null) => {
    if (!file) return;
    setSelectedFiles((prev) => ({ ...prev, [docType]: file }));
  };

  const toggleExpandCard = (docType: string) => {
    setExpandedCards((prev) => ({ ...prev, [docType]: !prev[docType] }));
  };

  // 3. Run 8-stage verification pipeline
  const handleVerifyDocument = async (docType: string) => {
    const file = selectedFiles[docType];
    if (!file) {
      setError(`Please select a file to upload for ${docType.replace(/_/g, " ")}.`);
      return;
    }

    setVerifyingDocType(docType);
    setError(null);
    setSuccessToast(null);

    // Multi-stage UX status transitions
    setVerificationStage("1/5: Validating file format & statutory integrity...");
    const stageTimer1 = setTimeout(() => {
      setVerificationStage("2/5: OpenCV high-DPI rasterization & contrast enhancement...");
    }, 700);
    const stageTimer2 = setTimeout(() => {
      setVerificationStage("3/5: PaddleOCR reading ground-truth text & coordinates...");
    }, 1500);
    const stageTimer3 = setTimeout(() => {
      setVerificationStage("4/5: Cross-matching extracted facts with ST profile...");
    }, 2400);
    const stageTimer4 = setTimeout(() => {
      setVerificationStage("5/5: Auditing statutory completeness & recording evidence...");
    }, 3200);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("scheme_code", selectedSchemeCode);
      formData.append("document_type", docType);

      const res = await scholarService.verifySchemeDocument(formData);

      // Refresh requirements to sync scorecard
      await loadRequirements(selectedSchemeCode);

      // Expand card to review results
      setExpandedCards((prev) => ({ ...prev, [docType]: true }));

      // Clear selected file
      setSelectedFiles((prev) => {
        const next = { ...prev };
        delete next[docType];
        return next;
      });

      if (res.verification_result === "VALID") {
        setSuccessToast(`✓ ${docType.replace(/_/g, " ")} successfully verified as VALID!`);
      } else {
        setError(`Notice: Document verification resulted in ${res.verification_result}. Please review deficiency reasons below.`);
      }
    } catch (err: any) {
      setError(err?.message || "Document verification pipeline error.");
    } finally {
      clearTimeout(stageTimer1);
      clearTimeout(stageTimer2);
      clearTimeout(stageTimer3);
      clearTimeout(stageTimer4);
      setVerifyingDocType(null);
      setVerificationStage("");
    }
  };

  // 4. Resubmission pipeline
  const handleResubmit = async () => {
    if (!resubmittingDoc || !resubmitFile) {
      setError("Please select a revised file to resubmit.");
      return;
    }

    setResubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("file", resubmitFile);

      const res = await scholarService.resubmitSchemeDocument(resubmittingDoc.verificationId, formData);
      await loadRequirements(selectedSchemeCode);

      setSuccessToast(`Resubmission processed! Refreshed verification result: ${res.verification_result}.`);
      setResubmittingDoc(null);
      setResubmitFile(null);
    } catch (err: any) {
      setError(err?.message || "Failed to resubmit document.");
    } finally {
      setResubmitting(false);
    }
  };

  const getDocIcon = (category: string) => {
    switch (category) {
      case "STATUTORY_IDENTITY":
        return <ShieldCheck size={20} color="#059669" />;
      case "FINANCIAL_ELIGIBILITY":
        return <Banknote size={20} color="#0284c7" />;
      case "ACADEMIC_RECORD":
        return <GraduationCap size={20} color="#7c3aed" />;
      case "INSTITUTION_VERIFICATION":
        return <Building size={20} color="#ea580c" />;
      case "DISBURSEMENT_BANK":
        return <FileCheck size={20} color="#0d9488" />;
      default:
        return <FileText size={20} color="#475569" />;
    }
  };

  const renderStatusBadge = (status: string) => {
    switch (status) {
      case "VALID":
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.25rem 0.75rem", borderRadius: "999px", backgroundColor: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0", fontWeight: 700, fontSize: "0.78rem" }}>
            <CheckCircle2 size={14} /> VALID
          </span>
        );
      case "INVALID":
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.25rem 0.75rem", borderRadius: "999px", backgroundColor: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca", fontWeight: 700, fontSize: "0.78rem" }}>
            <XCircle size={14} /> INVALID
          </span>
        );
      case "INCOMPLETE":
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.25rem 0.75rem", borderRadius: "999px", backgroundColor: "#fffbeb", color: "#92400e", border: "1px solid #fde68a", fontWeight: 700, fontSize: "0.78rem" }}>
            <AlertTriangle size={14} /> INCOMPLETE
          </span>
        );
      case "REQUIRES REVIEW":
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.25rem 0.75rem", borderRadius: "999px", backgroundColor: "#fefce8", color: "#854d0e", border: "1px solid #fef08a", fontWeight: 700, fontSize: "0.78rem" }}>
            <HelpCircle size={14} /> REQUIRES REVIEW
          </span>
        );
      default:
        return (
          <span style={{ display: "inline-flex", alignItems: "center", gap: "0.35rem", padding: "0.25rem 0.75rem", borderRadius: "999px", backgroundColor: "#f1f5f9", color: "#64748b", border: "1px solid #e2e8f0", fontWeight: 600, fontSize: "0.78rem" }}>
            <Upload size={13} /> NOT UPLOADED
          </span>
        );
    }
  };

  const selectedScheme = schemes.find((s) => s.scheme_code === selectedSchemeCode);

  return (
    <div style={{ maxWidth: "1150px", margin: "0 auto", paddingBottom: "3rem" }}>
      {/* Module Header */}
      <div style={{ marginBottom: "1.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#2563eb", fontSize: "0.85rem", fontWeight: 700, marginBottom: "0.25rem" }}>
          <ShieldCheck size={18} />
          <span>STATUTORY VERIFICATION &bull; SCHOLAR-ST</span>
        </div>
        <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.35rem" }}>
          Scholarship Document Verification Module
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.92rem", lineHeight: 1.5 }}>
          Upload scheme-required documents to run OpenCV enhancement, PaddleOCR ground-truth extraction,
          cross-profile comparison, and completeness auditing. Invalid or incomplete credentials provide clear deficiency causes and instant resubmission.
        </p>
      </div>

      {/* Toast and Error notifications */}
      {successToast && (
        <div style={{ padding: "0.9rem 1.25rem", borderRadius: "10px", backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0", color: "#065f46", fontSize: "0.88rem", fontWeight: 600, marginBottom: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>{successToast}</span>
          <button onClick={() => setSuccessToast(null)} style={{ background: "none", border: "none", color: "#065f46", cursor: "pointer", fontWeight: 800 }}>✕</button>
        </div>
      )}
      {error && (
        <div style={{ padding: "0.9rem 1.25rem", borderRadius: "10px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", color: "#991b1b", fontSize: "0.88rem", fontWeight: 600, marginBottom: "1.25rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span>{error}</span>
          <button onClick={() => setError(null)} style={{ background: "none", border: "none", color: "#991b1b", cursor: "pointer", fontWeight: 800 }}>✕</button>
        </div>
      )}

      {/* Scheme Selector Tabs */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.25rem", marginBottom: "1.5rem", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
        <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#475569", textTransform: "uppercase", marginBottom: "0.75rem", display: "flex", alignItems: "center", gap: "0.4rem" }}>
          <Award size={16} color="#2563eb" />
          <span>Select Scholarship / Fellowship Scheme:</span>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {schemes.map((s) => {
            const isSelected = s.scheme_code === selectedSchemeCode;
            return (
              <button
                key={s.scheme_code}
                type="button"
                onClick={() => handleSchemeChange(s.scheme_code)}
                style={{
                  padding: "0.6rem 1.1rem",
                  borderRadius: "8px",
                  border: isSelected ? "2px solid #2563eb" : "1px solid #cbd5e1",
                  backgroundColor: isSelected ? "#eff6ff" : "#ffffff",
                  color: isSelected ? "#1d4ed8" : "#334155",
                  fontWeight: isSelected ? 800 : 600,
                  fontSize: "0.85rem",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  transition: "all 0.15s ease"
                }}
              >
                <span>{s.scheme_code}</span>
                <span style={{ fontSize: "0.74rem", opacity: 0.75, fontWeight: 500 }}>
                  ({s.scheme_name.split(" ")[0]})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Scheme Statutory Readiness Scorecard */}
      {requirementsData && (
        <div
          style={{
            backgroundColor: requirementsData.is_scheme_ready_for_submission ? "#f0fdf4" : "#ffffff",
            borderRadius: "12px",
            border: `1.5px solid ${requirementsData.is_scheme_ready_for_submission ? "#86efac" : "#e2e8f0"}`,
            padding: "1.5rem",
            marginBottom: "1.75rem",
            boxShadow: "0 2px 8px rgba(0,0,0,0.04)"
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 800, padding: "0.15rem 0.5rem", borderRadius: "4px", backgroundColor: "#0f172a", color: "#ffffff" }}>
                  {requirementsData.scheme_code}
                </span>
                <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>
                  {requirementsData.scheme_name}
                </h2>
              </div>
              <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "0.35rem" }}>
                Target: <strong>{requirementsData.target_category}</strong> &bull;{" "}
                {requirementsData.max_family_income ? `Income Limit: ≤ ₹${requirementsData.max_family_income.toLocaleString()} &bull; ` : ""}
                {requirementsData.min_academic_percentage ? `Min Academic Cutoff: ≥ ${requirementsData.min_academic_percentage}%` : ""}
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600 }}>Dossier Readiness</div>
                <div style={{ fontSize: "1.6rem", fontWeight: 800, color: requirementsData.is_scheme_ready_for_submission ? "#059669" : "#2563eb" }}>
                  {requirementsData.readiness_percentage}%
                </div>
                <div style={{ fontSize: "0.72rem", color: "#64748b" }}>
                  {requirementsData.verified_valid_count} of {requirementsData.mandatory_documents_count} Mandatory Valid
                </div>
              </div>

              {requirementsData.is_scheme_ready_for_submission ? (
                <Link
                  to="/applicant/apply"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    padding: "0.7rem 1.25rem",
                    borderRadius: "8px",
                    backgroundColor: "#059669",
                    color: "#ffffff",
                    fontSize: "0.85rem",
                    fontWeight: 700,
                    textDecoration: "none",
                    boxShadow: "0 2px 6px rgba(5, 150, 105, 0.3)"
                  }}
                >
                  <span>Apply Now</span>
                  <ArrowRight size={16} />
                </Link>
              ) : (
                <div style={{ fontSize: "0.76rem", color: "#b45309", backgroundColor: "#fef3c7", padding: "0.5rem 0.85rem", borderRadius: "6px", fontWeight: 600 }}>
                  Complete required documents below to unlock application
                </div>
              )}
            </div>
          </div>

          {/* Progress bar */}
          <div style={{ marginTop: "1rem", height: "8px", width: "100%", backgroundColor: "#e2e8f0", borderRadius: "999px", overflow: "hidden" }}>
            <div
              style={{
                height: "100%",
                width: `${requirementsData.readiness_percentage}%`,
                backgroundColor: requirementsData.is_scheme_ready_for_submission ? "#059669" : "#2563eb",
                transition: "width 0.4s ease"
              }}
            />
          </div>
        </div>
      )}

      {/* Dynamic Required Documents List */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        {requirementsData?.required_documents.map((doc: DocumentRequirementItem) => {
          const isExpanded = !!expandedCards[doc.document_type];
          const isVerifying = verifyingDocType === doc.document_type;
          const selectedFile = selectedFiles[doc.document_type];
          const existing = doc.existing_verification;
          const isInvalidOrIncomplete = doc.verification_status === "INVALID" || doc.verification_status === "INCOMPLETE";

          return (
            <div
              key={doc.document_type}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                border: isInvalidOrIncomplete
                  ? "1.5px solid #fca5a5"
                  : doc.verification_status === "VALID"
                  ? "1px solid #bbf7d0"
                  : "1px solid #e2e8f0",
                padding: "1.5rem",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)",
                transition: "all 0.2s ease"
              }}
            >
              {/* Card Header */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.85rem" }}>
                  <div style={{ padding: "0.6rem", borderRadius: "8px", backgroundColor: "#f8fafc", border: "1px solid #e2e8f0" }}>
                    {getDocIcon(doc.category)}
                  </div>
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                      <h3 style={{ fontSize: "1.05rem", fontWeight: 800, color: "#0f172a" }}>
                        {doc.title}
                      </h3>
                      <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "0.15rem 0.45rem", borderRadius: "4px", backgroundColor: "#f1f5f9", color: "#475569" }}>
                        {doc.category.replace(/_/g, " ")}
                      </span>
                      {doc.mandatory ? (
                        <span style={{ fontSize: "0.68rem", fontWeight: 800, padding: "0.15rem 0.45rem", borderRadius: "4px", backgroundColor: "#fee2e2", color: "#991b1b" }}>
                          MANDATORY
                        </span>
                      ) : (
                        <span style={{ fontSize: "0.68rem", fontWeight: 600, padding: "0.15rem 0.45rem", borderRadius: "4px", backgroundColor: "#f3f4f6", color: "#64748b" }}>
                          OPTIONAL
                        </span>
                      )}
                    </div>
                    <p style={{ color: "#475569", fontSize: "0.82rem", marginTop: "0.3rem" }}>
                      {doc.description}
                    </p>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.2rem" }}>
                      Authority: <em>{doc.issuing_authority_hint}</em>
                    </div>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  {renderStatusBadge(doc.verification_status)}
                  {existing && (
                    <button
                      type="button"
                      onClick={() => toggleExpandCard(doc.document_type)}
                      style={{ background: "none", border: "none", color: "#64748b", cursor: "pointer", display: "flex", alignItems: "center", padding: "0.25rem" }}
                      title="Expand verification dossier"
                    >
                      {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                    </button>
                  )}
                </div>
              </div>

              {/* DEFICIENCY ALERT BANNER (If INVALID or INCOMPLETE) */}
              {isInvalidOrIncomplete && existing && (
                <div
                  style={{
                    marginTop: "1.25rem",
                    padding: "1rem 1.25rem",
                    borderRadius: "8px",
                    backgroundColor: doc.verification_status === "INVALID" ? "#fff1f2" : "#fffbeb",
                    border: `1px solid ${doc.verification_status === "INVALID" ? "#fecdd3" : "#fde68a"}`,
                    color: doc.verification_status === "INVALID" ? "#9f1239" : "#92400e"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontWeight: 800, fontSize: "0.88rem" }}>
                    <AlertTriangle size={18} />
                    <span>
                      {doc.verification_status === "INVALID" ? "Statutory Ineligibility / Discrepancy Detected" : "Incomplete Statutory Information"}
                    </span>
                  </div>

                  {existing.deficiency_reasons && existing.deficiency_reasons.length > 0 && (
                    <div style={{ marginTop: "0.5rem", fontSize: "0.82rem" }}>
                      <strong>Deficiency Reason:</strong>
                      <ul style={{ margin: "0.3rem 0 0 1.2rem", padding: 0 }}>
                        {existing.deficiency_reasons.map((def: string, i: number) => (
                          <li key={i} style={{ marginTop: "0.2rem" }}>{def}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {existing.remedy_suggestions && existing.remedy_suggestions.length > 0 && (
                    <div style={{ marginTop: "0.5rem", fontSize: "0.8rem", color: "#475569" }}>
                      <strong>Remedy Guidance:</strong>
                      <ul style={{ margin: "0.25rem 0 0 1.2rem", padding: 0 }}>
                        {existing.remedy_suggestions.map((rem: string, i: number) => (
                          <li key={i} style={{ marginTop: "0.15rem" }}>{rem}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Immediate Action Buttons */}
                  <div style={{ marginTop: "0.85rem", display: "flex", gap: "0.75rem", alignItems: "center" }}>
                    <button
                      type="button"
                      onClick={() =>
                        setResubmittingDoc({
                          docType: doc.document_type,
                          title: doc.title,
                          verificationId: existing.id || existing.verification_id || "",
                          deficiencies: existing.deficiency_reasons || [],
                          remedies: existing.remedy_suggestions || []
                        })
                      }
                      style={{
                        padding: "0.5rem 1rem",
                        borderRadius: "6px",
                        backgroundColor: "#0f172a",
                        color: "#ffffff",
                        fontSize: "0.8rem",
                        fontWeight: 700,
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "0.4rem"
                      }}
                    >
                      <RefreshCw size={14} />
                      <span>Resubmit Clearer Document &bull; Re-run Verification</span>
                    </button>
                    {existing.resubmission_count !== undefined && existing.resubmission_count > 0 && (
                      <span style={{ fontSize: "0.72rem", color: "#64748b" }}>
                        (Resubmitted {existing.resubmission_count} time{existing.resubmission_count > 1 ? "s" : ""})
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Dossier Expanded Details (Extracted credentials, completeness, profile comparison) */}
              {isExpanded && existing && (
                <div style={{ marginTop: "1.25rem", borderTop: "1px solid #f1f5f9", paddingTop: "1.25rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1rem" }}>
                    {/* Column 1: Extracted Facts */}
                    <div style={{ backgroundColor: "#f8fafc", borderRadius: "8px", padding: "1rem", border: "1px solid #e2e8f0" }}>
                      <div style={{ fontSize: "0.76rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                        Extracted Credentials (OCR + Structured Extraction)
                      </div>
                      {existing.extracted_fields && Object.keys(existing.extracted_fields).length > 0 ? (
                        <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.8rem" }}>
                          {Object.entries(existing.extracted_fields).map(([k, v]) => {
                            if (v === null || v === undefined || v === "" || typeof v === "object") return null;
                            return (
                              <div key={k} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #e2e8f0", paddingBottom: "0.2rem" }}>
                                <span style={{ color: "#64748b" }}>{k.replace(/_/g, " ")}:</span>
                                <strong style={{ color: "#0f172a" }}>{String(v)}</strong>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={{ fontSize: "0.78rem", color: "#94a3b8" }}>No structured fields detected.</div>
                      )}
                    </div>

                    {/* Column 2: Profile Match & Completeness */}
                    <div style={{ backgroundColor: "#f8fafc", borderRadius: "8px", padding: "1rem", border: "1px solid #e2e8f0" }}>
                      <div style={{ fontSize: "0.76rem", fontWeight: 800, color: "#334155", textTransform: "uppercase", marginBottom: "0.5rem" }}>
                        Profile Alignment &amp; Completeness
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", fontSize: "0.8rem" }}>
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                            <span style={{ color: "#64748b" }}>Completeness Score:</span>
                            <strong>{existing.completeness?.completeness_score ?? 0}%</strong>
                          </div>
                          <div style={{ height: "6px", width: "100%", backgroundColor: "#e2e8f0", borderRadius: "999px", overflow: "hidden" }}>
                            <div
                              style={{
                                height: "100%",
                                width: `${existing.completeness?.completeness_score ?? 0}%`,
                                backgroundColor: (existing.completeness?.completeness_score ?? 0) >= 80 ? "#059669" : "#d97706"
                              }}
                            />
                          </div>
                        </div>

                        {existing.profile_comparison && (
                          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "0.4rem" }}>
                            <div style={{ display: "flex", justifyContent: "space-between" }}>
                              <span style={{ color: "#64748b" }}>Name Match:</span>
                              <strong>{existing.profile_comparison.name_match_percentage}% ({existing.profile_comparison.name_match_status})</strong>
                            </div>
                            <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "0.2rem" }}>
                              {existing.profile_comparison.name_notes}
                            </div>
                          </div>
                        )}

                        {existing.file_info && (
                          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "0.4rem", fontSize: "0.75rem", color: "#64748b" }}>
                            File: <strong>{existing.file_info.file_name}</strong> &bull; Sharpness: <strong>{existing.file_info.is_sharp ? "✓ Sharp" : "Low Contrast"}</strong>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {existing.evidence_summary && (
                    <div style={{ marginTop: "0.85rem", fontSize: "0.78rem", color: "#475569", backgroundColor: "#f1f5f9", padding: "0.6rem 0.85rem", borderRadius: "6px" }}>
                      <strong>Statutory Audit Trail:</strong> {existing.evidence_summary}
                    </div>
                  )}

                  {/* AI-Assisted Document Understanding Layer (Gemini Flash) */}
                  {existing.ai_understanding && (
                    <div style={{ marginTop: "1rem", backgroundColor: "#f8fafc", borderRadius: "10px", border: "1px solid #cbd5e1", padding: "1.1rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.6rem", flexWrap: "wrap", gap: "0.5rem" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", fontWeight: 800, fontSize: "0.84rem", color: "#1e293b" }}>
                          <span>🤖 AI-Assisted Document Understanding</span>
                          <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "0.15rem 0.45rem", borderRadius: "4px", backgroundColor: "#e0e7ff", color: "#3730a3" }}>
                            Gemini 2.5/3.5 Flash
                          </span>
                        </div>
                        <span style={{ fontSize: "0.7rem", color: "#64748b", fontWeight: 600 }}>
                          Strictly Document Interpretation Layer &bull; No Decision Authority
                        </span>
                      </div>

                      {/* Plain Language Interpretation / Explanation */}
                      {existing.ai_understanding.document_explanation && (
                        <div style={{ fontSize: "0.82rem", color: "#334155", backgroundColor: "#ffffff", padding: "0.75rem 1rem", borderRadius: "8px", border: "1px solid #e2e8f0", marginBottom: "0.75rem", lineHeight: 1.5 }}>
                          <strong>Document Interpretation:</strong> {existing.ai_understanding.document_explanation}
                        </div>
                      )}

                      {/* Assisted Classification */}
                      {existing.ai_understanding.classification && (
                        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", fontSize: "0.78rem", color: "#475569", marginBottom: "0.6rem", flexWrap: "wrap" }}>
                          <span>Classification: <strong style={{ color: "#0f172a" }}>{existing.ai_understanding.classification.classified_type}</strong> ({Math.round((existing.ai_understanding.classification.confidence || 0.85) * 100)}% confidence)</span>
                          {existing.ai_understanding.classification.rationale && (
                            <>
                              <span>&bull;</span>
                              <span style={{ fontStyle: "italic" }}>{existing.ai_understanding.classification.rationale}</span>
                            </>
                          )}
                        </div>
                      )}

                      {/* Unclear Information Flags */}
                      {existing.ai_understanding.unclear_information_flags && existing.ai_understanding.unclear_information_flags.length > 0 && (
                        <div style={{ marginBottom: "0.5rem", padding: "0.6rem 0.85rem", borderRadius: "6px", backgroundColor: "#fffbeb", border: "1px solid #fde68a", fontSize: "0.78rem", color: "#92400e" }}>
                          <strong>Unclear / Degraded Elements Identified:</strong>
                          <ul style={{ margin: "0.2rem 0 0 1.2rem", padding: 0 }}>
                            {existing.ai_understanding.unclear_information_flags.map((item: string, idx: number) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* Inconsistencies Detected */}
                      {existing.ai_understanding.inconsistencies_detected && existing.ai_understanding.inconsistencies_detected.length > 0 && (
                        <div style={{ marginBottom: "0.5rem", padding: "0.6rem 0.85rem", borderRadius: "6px", backgroundColor: "#fef2f2", border: "1px solid #fecaca", fontSize: "0.78rem", color: "#991b1b" }}>
                          <strong>Discrepancies / Inconsistencies Detected:</strong>
                          <ul style={{ margin: "0.2rem 0 0 1.2rem", padding: 0 }}>
                            {existing.ai_understanding.inconsistencies_detected.map((item: string, idx: number) => (
                              <li key={idx}>{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "0.5rem", borderTop: "1px dashed #cbd5e1", paddingTop: "0.5rem" }}>
                        <strong>Architecture Directives:</strong> Document &rarr; OpenCV &rarr; PaddleOCR &rarr; Structured Data &rarr; Gemini Interpretation &rarr; Dynamic Rule Engine (100% Deterministic) &rarr; Officer Review.
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Upload Dropzone / Verification Action Bar */}
              <div style={{ marginTop: "1.25rem", borderTop: "1px solid #f1f5f9", paddingTop: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "0.75rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    ref={(el) => {
                      fileInputRefs.current[doc.document_type] = el;
                    }}
                    style={{ display: "none" }}
                    onChange={(e) => handleFileSelect(doc.document_type, e.target.files ? e.target.files[0] : null)}
                  />
                  <button
                    type="button"
                    onClick={() => fileInputRefs.current[doc.document_type]?.click()}
                    style={{
                      padding: "0.5rem 0.9rem",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#ffffff",
                      color: "#334155",
                      fontSize: "0.82rem",
                      fontWeight: 600,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.35rem"
                    }}
                  >
                    <FileUp size={15} />
                    <span>{selectedFile ? "Change File" : existing ? "Upload Replacement" : "Select Document"}</span>
                  </button>

                  {selectedFile && (
                    <span style={{ fontSize: "0.8rem", color: "#059669", fontWeight: 600 }}>
                      ✓ {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                    </span>
                  )}
                </div>

                {selectedFile && (
                  <button
                    type="button"
                    disabled={isVerifying}
                    onClick={() => handleVerifyDocument(doc.document_type)}
                    style={{
                      padding: "0.6rem 1.4rem",
                      borderRadius: "6px",
                      backgroundColor: "#2563eb",
                      color: "#ffffff",
                      fontSize: "0.85rem",
                      fontWeight: 700,
                      border: "none",
                      cursor: isVerifying ? "not-allowed" : "pointer",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.45rem",
                      boxShadow: "0 2px 6px rgba(37, 99, 235, 0.3)"
                    }}
                  >
                    {isVerifying ? (
                      <>
                        <Loader2 size={16} className="spin" style={{ animation: "spin 1s linear infinite" }} />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      <>
                        <ShieldCheck size={16} />
                        <span>Run Statutory Verification</span>
                      </>
                    )}
                  </button>
                )}
              </div>

              {/* In-flight stage indicator */}
              {isVerifying && (
                <div style={{ marginTop: "0.75rem", fontSize: "0.78rem", color: "#2563eb", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <Loader2 size={14} className="spin" style={{ animation: "spin 1s linear infinite" }} />
                  <span>{verificationStage}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* RESUBMISSION MODAL */}
      {resubmittingDoc && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
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
              borderRadius: "12px",
              padding: "1.75rem",
              maxWidth: "550px",
              width: "100%",
              boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
              <div>
                <h3 style={{ fontSize: "1.2rem", fontWeight: 800, color: "#0f172a" }}>
                  Resubmit: {resubmittingDoc.title}
                </h3>
                <p style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "0.2rem" }}>
                  Upload an improved, high-resolution document to resolve noted deficiencies.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setResubmittingDoc(null)}
                style={{ background: "none", border: "none", color: "#94a3b8", cursor: "pointer", fontSize: "1.2rem" }}
              >
                ✕
              </button>
            </div>

            {/* Deficiencies Checklist */}
            <div style={{ backgroundColor: "#fef2f2", borderRadius: "8px", padding: "0.85rem", border: "1px solid #fecaca", marginBottom: "1.25rem" }}>
              <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#991b1b", textTransform: "uppercase" }}>
                Identified Deficiencies to Address:
              </div>
              <ul style={{ margin: "0.3rem 0 0 1.2rem", padding: 0, fontSize: "0.8rem", color: "#7f1d1d" }}>
                {resubmittingDoc.deficiencies.map((d, i) => (
                  <li key={i} style={{ marginTop: "0.2rem" }}>{d}</li>
                ))}
              </ul>
            </div>

            {/* File upload input */}
            <div style={{ marginBottom: "1.5rem" }}>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#334155", marginBottom: "0.4rem" }}>
                Select Replacement File (.pdf, .png, .jpg):
              </label>
              <input
                type="file"
                accept=".pdf,.png,.jpg,.jpeg"
                onChange={(e) => setResubmitFile(e.target.files ? e.target.files[0] : null)}
                style={{ fontSize: "0.85rem", width: "100%" }}
              />
              {resubmitFile && (
                <div style={{ fontSize: "0.78rem", color: "#059669", marginTop: "0.3rem", fontWeight: 600 }}>
                  ✓ Selected: {resubmitFile.name} ({(resubmitFile.size / 1024).toFixed(1)} KB)
                </div>
              )}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem" }}>
              <button
                type="button"
                onClick={() => setResubmittingDoc(null)}
                style={{ padding: "0.6rem 1.1rem", borderRadius: "6px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", color: "#475569", fontSize: "0.82rem", cursor: "pointer" }}
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={!resubmitFile || resubmitting}
                onClick={handleResubmit}
                style={{
                  padding: "0.6rem 1.35rem",
                  borderRadius: "6px",
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  border: "none",
                  cursor: !resubmitFile || resubmitting ? "not-allowed" : "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem"
                }}
              >
                {resubmitting ? (
                  <>
                    <Loader2 size={16} className="spin" style={{ animation: "spin 1s linear infinite" }} />
                    <span>Re-verifying...</span>
                  </>
                ) : (
                  <>
                    <RefreshCw size={15} />
                    <span>Resubmit &amp; Re-run Verification</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
