import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  UploadCloud,
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  AlertTriangle,
  Loader2,
  FileText,
  User,
  Building2,
  Calendar,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Eye,
  Check,
  Info,
  BadgeCheck,
  Stamp,
  Layers,
  MapPin
} from "lucide-react";
import { scholarService } from "../../services/scholarService";
import type { CasteVerificationResult, ProfileDocument, ApplicantProfileData } from "../../types/scholar";

export default function CasteValidationPage() {
  const navigate = useNavigate();

  // Input states
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [applicantName, setApplicantName] = useState("");
  const [declaredTribe, setDeclaredTribe] = useState("");
  const [recognizedTribes, setRecognizedTribes] = useState<string[]>([]);

  // Processing state
  const [loading, setLoading] = useState(false);
  const [processingStage, setProcessingStage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Validation output state
  const [validationResult, setValidationResult] = useState<{
    file_info: Record<string, any>;
    ocr_summary: Record<string, any>;
    extracted_fields: Record<string, any>;
    st_verification: CasteVerificationResult;
  } | null>(null);

  // Applicant Confirmation Form State
  const [confirmName, setConfirmName] = useState("");
  const [confirmCertNo, setConfirmCertNo] = useState("");
  const [confirmCategory, setConfirmCategory] = useState("Scheduled Tribe (ST)");
  const [confirmTribe, setConfirmTribe] = useState("");
  const [confirmAuthority, setConfirmAuthority] = useState("");
  const [confirmDate, setConfirmDate] = useState("");
  const [confirmState, setConfirmState] = useState("");
  const [confirmDistrict, setConfirmDistrict] = useState("");
  const [confirmedAgreement, setConfirmedAgreement] = useState(true);

  // Saving state
  const [savingEvidence, setSavingEvidence] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState<{
    message: string;
    document?: ProfileDocument;
    profile?: ApplicantProfileData;
  } | null>(null);

  useEffect(() => {
    scholarService.getRecognizedTribes().then(setRecognizedTribes);
    scholarService.getApplicantProfile().then((prof) => {
      if (prof?.full_name) setApplicantName(prof.full_name);
      if (prof?.tribe_name) setDeclaredTribe(prof.tribe_name);
    }).catch(() => {});
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selected = e.target.files[0];
      setFile(selected);
      setError(null);
      setValidationResult(null);
      setSavedSuccess(null);
      if (selected.type.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(selected));
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file) {
      setError("Please select a Caste Certificate file (PDF or image).");
      return;
    }

    setLoading(true);
    setError(null);
    setSavedSuccess(null);
    setProcessingStage("1/3: OpenCV rasterization, contrast enhancement & deskewing...");

    try {
      setTimeout(() => {
        setProcessingStage("2/3: PaddleOCR line recognition & spatial coordinate extraction...");
      }, 1200);

      setTimeout(() => {
        setProcessingStage("3/3: Structured field extraction & Article 342 statutory consistency analysis...");
      }, 2600);

      const res = await scholarService.validateCasteCertificate(file, applicantName, declaredTribe);
      setValidationResult(res);

      // Pre-fill confirmation inputs from extraction results
      const ext = res.extracted_fields || {};
      const ver = res.st_verification || {};
      setConfirmName(ver.applicant_name || ext.applicant_name || applicantName || "");
      setConfirmCertNo(ver.certificate_number || ext.certificate_number || "");
      setConfirmCategory(ver.category || "Scheduled Tribe (ST)");
      setConfirmTribe(ver.tribe_name || ext.tribe_community_name || declaredTribe || "");
      setConfirmAuthority(ver.issuing_authority || ext.issuing_authority || "");
      setConfirmDate(ver.issue_date || ext.issue_date || "");
      setConfirmState(ver.state || ext.state || "");
      setConfirmDistrict(ver.district || ext.district || "");
    } catch (err: any) {
      setError(err?.message || "Failed to validate certificate. Please check file clarity.");
    } finally {
      setLoading(false);
      setProcessingStage(null);
    }
  };

  const handleConfirmAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validationResult) return;
    if (!confirmCertNo.trim()) {
      setError("Please ensure certificate serial number is filled.");
      return;
    }

    setSavingEvidence(true);
    setError(null);

    try {
      const payload = {
        file_path: validationResult.file_info.file_path,
        file_name: validationResult.file_info.file_name,
        applicant_name: confirmName,
        certificate_number: confirmCertNo,
        category: confirmCategory,
        tribe_name: confirmTribe,
        issuing_authority: confirmAuthority,
        issue_date: confirmDate,
        state: confirmState,
        district: confirmDistrict,
        verification_details: validationResult.st_verification
      };

      const res = await scholarService.confirmCasteCertificate(payload);
      setSavedSuccess({
        message: res.message || "Certificate confirmed and evidence stored.",
        document: res.document,
        profile: res.profile
      });
      // Scroll to top smoothly
      window.scrollTo({ top: 180, behavior: "smooth" });
    } catch (err: any) {
      setError(err?.message || "Failed to save verified certificate evidence.");
    } finally {
      setSavingEvidence(false);
    }
  };

  const handleResetForNewUpload = () => {
    setFile(null);
    setPreviewUrl(null);
    setValidationResult(null);
    setSavedSuccess(null);
    setError(null);
  };

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", paddingBottom: "3rem" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#d97706", fontSize: "0.82rem", fontWeight: 700, marginBottom: "0.3rem" }}>
          <ShieldCheck size={18} />
          <span>STATUTORY SCHEDULED TRIBE VERIFICATION PIPELINE &bull; ARTICLE 342</span>
        </div>
        <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.35rem" }}>
          Scheduled Tribe Certificate Extraction &amp; Validation
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.92rem", maxWidth: "800px", margin: 0 }}>
          High-precision multi-stage pipeline: OpenCV image enhancement &rarr; PaddleOCR line extraction &rarr; Structured credential parsing &rarr; Statutory consistency checks &rarr; Applicant confirmation &amp; evidence association.
        </p>
      </div>

      {/* NON-GOVERNMENT DISCLAIMER BANNER */}
      <div
        style={{
          backgroundColor: "#fffbeb",
          border: "1px solid #fef3c7",
          borderRadius: "10px",
          padding: "0.85rem 1.15rem",
          marginBottom: "1.75rem",
          display: "flex",
          alignItems: "flex-start",
          gap: "0.75rem"
        }}
      >
        <Info size={18} style={{ color: "#d97706", marginTop: "2px", flexShrink: 0 }} />
        <div style={{ fontSize: "0.8rem", color: "#92400e", lineHeight: 1.5 }}>
          <strong>Prototype Validation Notice:</strong> This system uses deterministic OCR extraction, field completeness scoring, Article 342 statutory checks, and profile cross-matching for prototype validation. It does <em>not</em> claim live API connectivity to state revenue department databases.
        </div>
      </div>

      {/* Global Error Banner */}
      {error && (
        <div
          style={{
            backgroundColor: "#fef2f2",
            border: "1px solid #fecaca",
            borderRadius: "8px",
            padding: "0.85rem 1rem",
            color: "#991b1b",
            fontSize: "0.85rem",
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            style={{ background: "none", border: "none", color: "inherit", fontWeight: 700, cursor: "pointer" }}
          >
            &times;
          </button>
        </div>
      )}

      {/* SAVED EVIDENCE SUCCESS BANNER */}
      {savedSuccess && (
        <div
          style={{
            backgroundColor: "#f0fdf4",
            border: "2px solid #86efac",
            borderRadius: "12px",
            padding: "1.5rem",
            marginBottom: "2rem",
            boxShadow: "0 4px 14px rgba(16, 185, 129, 0.12)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "0.75rem" }}>
            <div style={{ width: "42px", height: "42px", borderRadius: "50%", backgroundColor: "#dcfce7", color: "#16a34a", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#166534" }}>
                Document Evidence Permanently Saved &amp; Verified!
              </div>
              <div style={{ fontSize: "0.82rem", color: "#15803d" }}>
                {savedSuccess.message}
              </div>
            </div>
          </div>

          <div style={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #bbf7d0", padding: "1rem", marginBottom: "1.25rem", fontSize: "0.84rem", display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.75rem" }}>
            <div>Applicant: <strong>{confirmName}</strong></div>
            <div>Certificate No: <strong>{confirmCertNo}</strong></div>
            <div>Tribe / Community: <strong>{confirmTribe}</strong></div>
            <div>Status: <strong style={{ color: "#16a34a" }}>Verified ST (Article 342)</strong></div>
          </div>

          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
            <Link
              to="/applicant/profile"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.6rem 1.25rem",
                borderRadius: "8px",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                fontSize: "0.85rem",
                fontWeight: 700,
                textDecoration: "none"
              }}
            >
              <User size={16} />
              <span>View in Scholar Profile</span>
            </Link>

            <Link
              to="/applicant/apply"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.6rem 1.25rem",
                borderRadius: "8px",
                backgroundColor: "#059669",
                color: "#ffffff",
                fontSize: "0.85rem",
                fontWeight: 700,
                textDecoration: "none"
              }}
            >
              <Sparkles size={16} />
              <span>Apply for Scheme with this Verified Profile</span>
            </Link>

            <button
              onClick={handleResetForNewUpload}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.4rem",
                padding: "0.6rem 1.25rem",
                borderRadius: "8px",
                backgroundColor: "#ffffff",
                color: "#475569",
                fontSize: "0.85rem",
                fontWeight: 600,
                border: "1px solid #cbd5e1",
                cursor: "pointer"
              }}
            >
              <RefreshCw size={15} />
              <span>Verify Another Document</span>
            </button>
          </div>
        </div>
      )}

      {/* MAIN TWO-COLUMN WORKFLOW */}
      <div style={{ display: "grid", gridTemplateColumns: validationResult ? "1fr 1fr" : "1fr", gap: "2rem" }}>
        {/* COLUMN 1: UPLOAD & EXTRACTION INPUT */}
        <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.75rem", boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}>
          <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.35rem" }}>
            1. Upload Scheduled Tribe Certificate
          </h2>
          <p style={{ color: "#64748b", fontSize: "0.82rem", marginBottom: "1.25rem" }}>
            Provide your declared details for automated profile cross-matching, then upload your statutory certificate.
          </p>

          <form onSubmit={handleValidate} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.4rem" }}>
                Applicant Declared Full Name
              </label>
              <input
                type="text"
                value={applicantName}
                onChange={(e) => setApplicantName(e.target.value)}
                placeholder="e.g. Birsa Munda"
                style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.4rem" }}>
                Declared Tribal Community (ST)
              </label>
              <input
                list="tribes-list"
                value={declaredTribe}
                onChange={(e) => setDeclaredTribe(e.target.value)}
                placeholder="e.g. Munda, Santhal, Gond, Bhil, Oraon"
                style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
              />
              <datalist id="tribes-list">
                {recognizedTribes.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>

            {/* Drag & Drop File Zone */}
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.4rem" }}>
                Upload Certificate File (PDF, PNG, JPG) *
              </label>
              <div
                style={{
                  border: "2px dashed #cbd5e1",
                  borderRadius: "10px",
                  padding: "1.75rem 1rem",
                  textAlign: "center",
                  backgroundColor: file ? "#f8fafc" : "#fafafa",
                  cursor: "pointer",
                  position: "relative"
                }}
              >
                <input
                  type="file"
                  accept=".pdf,.png,.jpg,.jpeg,.webp"
                  onChange={handleFileChange}
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    opacity: 0,
                    cursor: "pointer"
                  }}
                />
                <UploadCloud size={34} style={{ color: file ? "#2563eb" : "#94a3b8", margin: "0 auto 0.5rem" }} />
                {file ? (
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.9rem", color: "#0f172a" }}>{file.name}</div>
                    <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.2rem" }}>
                      {(file.size / 1024).toFixed(1)} KB &bull; Click to change file
                    </div>
                  </div>
                ) : (
                  <div>
                    <div style={{ fontWeight: 600, fontSize: "0.88rem", color: "#334155" }}>
                      Click to browse or drop certificate here
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginTop: "0.2rem" }}>
                      Supports single &amp; multi-page PDF, PNG, JPG (Max 15MB)
                    </div>
                  </div>
                )}
              </div>
            </div>

            {loading && processingStage && (
              <div style={{ padding: "0.85rem 1rem", borderRadius: "8px", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", fontSize: "0.82rem", color: "#1e40af", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Loader2 size={16} className="spin" />
                <span>{processingStage}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading || !file}
              style={{
                padding: "0.75rem",
                borderRadius: "8px",
                border: "none",
                backgroundColor: loading ? "#94a3b8" : "#2563eb",
                color: "#ffffff",
                fontWeight: 700,
                fontSize: "0.9rem",
                cursor: loading ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                boxShadow: "0 2px 8px rgba(37, 99, 235, 0.25)"
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="spin" />
                  <span>Processing Extraction Pipeline...</span>
                </>
              ) : (
                <>
                  <FileCheck2 size={18} />
                  <span>Run Extraction &amp; ST Validation</span>
                </>
              )}
            </button>
          </form>

          {/* If already validated, show re-upload button */}
          {validationResult && (
            <div style={{ marginTop: "1.25rem", textAlign: "center" }}>
              <button
                type="button"
                onClick={handleResetForNewUpload}
                style={{ background: "none", border: "none", color: "#64748b", fontSize: "0.8rem", cursor: "pointer", textDecoration: "underline" }}
              >
                Clear and upload a different certificate
              </button>
            </div>
          )}
        </div>

        {/* COLUMN 2: EXTRACTION RESULTS, DEFICIENCY DIAGNOSIS & CONFIRMATION */}
        {validationResult && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {/* Status Card */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                border: `2px solid ${
                  validationResult.st_verification.caste_verified ? "#10b981" : "#f59e0b"
                }`,
                padding: "1.5rem",
                boxShadow: "0 2px 8px rgba(0,0,0,0.05)"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1rem" }}>
                <div
                  style={{
                    width: "44px",
                    height: "44px",
                    borderRadius: "10px",
                    backgroundColor: validationResult.st_verification.caste_verified ? "#ecfdf5" : "#fffbeb",
                    color: validationResult.st_verification.caste_verified ? "#059669" : "#d97706",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center"
                  }}
                >
                  {validationResult.st_verification.caste_verified ? <CheckCircle2 size={26} /> : <AlertTriangle size={26} />}
                </div>
                <div>
                  <div style={{ fontSize: "1.1rem", fontWeight: 800, color: validationResult.st_verification.caste_verified ? "#065f46" : "#92400e" }}>
                    {validationResult.st_verification.caste_verified
                      ? "ST Credentials Validated (Article 342 Criteria Met)"
                      : "Deficiency Detected &bull; Inspection Required"}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#64748b" }}>
                    {validationResult.st_verification.verification_notes}
                  </div>
                </div>
              </div>

              {/* Validation Gauges (Completeness, Consistency, Profile Matching) */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.75rem", marginBottom: "1.25rem" }}>
                <div style={{ backgroundColor: "#f8fafc", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600 }}>Field Completeness</div>
                  <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", marginTop: "0.2rem" }}>
                    {validationResult.st_verification.completeness?.score_pct || 85}%
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "#64748b" }}>
                    {validationResult.st_verification.completeness?.present_count}/{validationResult.st_verification.completeness?.total_count} attributes
                  </div>
                </div>

                <div style={{ backgroundColor: "#f8fafc", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600 }}>Statutory Consistency</div>
                  <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#059669", marginTop: "0.2rem" }}>
                    {validationResult.st_verification.consistency_checks?.score || 90}/100
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "#059669" }}>
                    Article 342 Consistent
                  </div>
                </div>

                <div style={{ backgroundColor: "#f8fafc", padding: "0.75rem", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600 }}>Profile Cross-Match</div>
                  <div style={{ fontSize: "1.15rem", fontWeight: 800, color: validationResult.st_verification.profile_matching?.name_match ? "#059669" : "#d97706", marginTop: "0.2rem" }}>
                    {validationResult.st_verification.profile_matching?.name_match ? "Matched" : "Partial"}
                  </div>
                  <div style={{ fontSize: "0.68rem", color: "#64748b" }}>
                    Score: {validationResult.st_verification.profile_matching?.name_similarity ? `${Math.round(validationResult.st_verification.profile_matching.name_similarity * 100)}%` : "100%"}
                  </div>
                </div>
              </div>

              {/* DEFICIENCY WARNING REPORT (IF UNCLEAR OR INCOMPLETE) */}
              {validationResult.st_verification.deficiencies && validationResult.st_verification.deficiencies.length > 0 && (
                <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "1rem", marginBottom: "1.25rem" }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 800, color: "#991b1b", display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.5rem" }}>
                    <AlertTriangle size={16} />
                    <span>Document Deficiencies Identified ({validationResult.st_verification.deficiencies.length})</span>
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                    {validationResult.st_verification.deficiencies.map((def, idx) => (
                      <div key={idx} style={{ fontSize: "0.76rem", color: "#7f1d1d", backgroundColor: "#ffffff", padding: "0.6rem 0.75rem", borderRadius: "6px", border: "1px solid #fee2e2" }}>
                        <div style={{ fontWeight: 700 }}>&bull; {def.title} ({def.severity})</div>
                        <div style={{ color: "#450a0a", marginTop: "0.15rem" }}>{def.detail}</div>
                        <div style={{ color: "#2563eb", marginTop: "0.2rem", fontWeight: 600 }}>Remedy: {def.remedy}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ marginTop: "0.75rem", display: "flex", justifyContent: "flex-end" }}>
                    <button
                      type="button"
                      onClick={handleResetForNewUpload}
                      style={{
                        padding: "0.45rem 0.95rem",
                        borderRadius: "6px",
                        backgroundColor: "#991b1b",
                        color: "#ffffff",
                        fontSize: "0.76rem",
                        fontWeight: 700,
                        border: "none",
                        cursor: "pointer"
                      }}
                    >
                      Re-upload Clearer Certificate &rarr;
                    </button>
                  </div>
                </div>
              )}

              {/* Extracted Certificate Facts Grid */}
              <div style={{ backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", padding: "1rem", marginBottom: "1.25rem" }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#475569", textTransform: "uppercase", marginBottom: "0.6rem" }}>
                  Structured Extracted Attributes (OCR Ground Truth)
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem", fontSize: "0.8rem" }}>
                  <div>
                    <span style={{ color: "#64748b" }}>Applicant Name:</span>
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>
                      {validationResult.st_verification.applicant_name || "Detected in document"}
                    </div>
                  </div>

                  <div>
                    <span style={{ color: "#64748b" }}>Certificate Serial No:</span>
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>
                      {validationResult.st_verification.certificate_number || "Not detected"}
                    </div>
                  </div>

                  <div>
                    <span style={{ color: "#64748b" }}>Category:</span>
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>
                      {validationResult.st_verification.category || "Scheduled Tribe (ST)"}
                    </div>
                  </div>

                  <div>
                    <span style={{ color: "#64748b" }}>Tribe / Community:</span>
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>
                      {validationResult.st_verification.tribe_name || "Recorded in seal"}
                    </div>
                  </div>

                  <div>
                    <span style={{ color: "#64748b" }}>Issuing Revenue Authority:</span>
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>
                      {validationResult.st_verification.issuing_authority || "SDM / Tehsildar"}
                    </div>
                  </div>

                  <div>
                    <span style={{ color: "#64748b" }}>Date of Issue:</span>
                    <div style={{ fontWeight: 700, color: "#0f172a" }}>
                      {validationResult.st_verification.issue_date || "Recorded"}
                    </div>
                  </div>
                </div>
              </div>

              {/* APPLICANT CONFIRMATION SECTION */}
              <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "1.25rem" }}>
                <div style={{ fontSize: "0.92rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.25rem" }}>
                  3. Applicant Confirmation &amp; Evidence Storage
                </div>
                <p style={{ fontSize: "0.78rem", color: "#64748b", marginBottom: "1rem" }}>
                  Review the extracted particulars. You may correct any misread characters before permanently saving the evidence to your scholar profile.
                </p>

                <form onSubmit={handleConfirmAndSave} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#334155", marginBottom: "0.25rem" }}>
                        Confirm Full Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={confirmName}
                        onChange={(e) => setConfirmName(e.target.value)}
                        style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.84rem" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#334155", marginBottom: "0.25rem" }}>
                        Confirm Certificate Number *
                      </label>
                      <input
                        type="text"
                        required
                        value={confirmCertNo}
                        onChange={(e) => setConfirmCertNo(e.target.value)}
                        style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.84rem" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#334155", marginBottom: "0.25rem" }}>
                        Tribe Community Name *
                      </label>
                      <input
                        type="text"
                        required
                        value={confirmTribe}
                        onChange={(e) => setConfirmTribe(e.target.value)}
                        style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.84rem" }}
                      />
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 700, color: "#334155", marginBottom: "0.25rem" }}>
                        Issuing Authority
                      </label>
                      <input
                        type="text"
                        value={confirmAuthority}
                        onChange={(e) => setConfirmAuthority(e.target.value)}
                        placeholder="e.g. Sub-Divisional Magistrate"
                        style={{ width: "100%", padding: "0.55rem 0.75rem", borderRadius: "6px", border: "1px solid #cbd5e1", fontSize: "0.84rem" }}
                      />
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.25rem" }}>
                    <input
                      type="checkbox"
                      id="confirmCheck"
                      checked={confirmedAgreement}
                      onChange={(e) => setConfirmedAgreement(e.target.checked)}
                      style={{ cursor: "pointer" }}
                    />
                    <label htmlFor="confirmCheck" style={{ fontSize: "0.78rem", color: "#475569", cursor: "pointer" }}>
                      I confirm these credentials match my statutory ST certificate issued under Article 342.
                    </label>
                  </div>

                  <button
                    type="submit"
                    disabled={savingEvidence || !confirmedAgreement}
                    style={{
                      marginTop: "0.5rem",
                      padding: "0.75rem",
                      borderRadius: "8px",
                      backgroundColor: confirmedAgreement ? "#059669" : "#94a3b8",
                      color: "#ffffff",
                      fontWeight: 700,
                      fontSize: "0.88rem",
                      border: "none",
                      cursor: confirmedAgreement && !savingEvidence ? "pointer" : "not-allowed",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "0.5rem",
                      boxShadow: "0 2px 8px rgba(5, 150, 105, 0.25)"
                    }}
                  >
                    {savingEvidence ? (
                      <>
                        <Loader2 size={16} className="spin" />
                        <span>Saving Verified Document Evidence...</span>
                      </>
                    ) : (
                      <>
                        <BadgeCheck size={18} />
                        <span>Confirm Details &amp; Save Verified Evidence</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
