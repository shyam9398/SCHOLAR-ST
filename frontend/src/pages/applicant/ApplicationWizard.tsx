import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import {
  Award,
  UploadCloud,
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Building2,
  Calendar,
  FileText,
  Sparkles
} from "lucide-react";
import { scholarService } from "../../services/scholarService";
import type { ScholarScheme, ApplicationEvaluation } from "../../types/scholar";

export default function ApplicationWizard() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [schemes, setSchemes] = useState<ScholarScheme[]>([]);
  const [selectedSchemeCode, setSelectedSchemeCode] = useState<string>(searchParams.get("scheme") || "NOS-ST");

  // Form Fields
  const [applicantName, setApplicantName] = useState("");
  const [applicantEmail, setApplicantEmail] = useState("");
  const [applicantPhone, setApplicantPhone] = useState("");
  const [tribeName, setTribeName] = useState("");
  const [casteCertNo, setCasteCertNo] = useState("");
  const [annualIncome, setAnnualIncome] = useState<number | "">("");
  const [aggregatePercentage, setAggregatePercentage] = useState<number | "">("");
  const [applicantAge, setApplicantAge] = useState<number | "">("");
  const [institutionName, setInstitutionName] = useState("");
  const [courseEnrolled, setCourseEnrolled] = useState("");
  const [admissionStatus, setAdmissionStatus] = useState("CONFIRMED");

  // Document Files
  const [casteFile, setCasteFile] = useState<File | null>(null);
  const [incomeFile, setIncomeFile] = useState<File | null>(null);
  const [academicFile, setAcademicFile] = useState<File | null>(null);
  const [offerFile, setOfferFile] = useState<File | null>(null);

  // Evaluation & Processing State
  const [evaluating, setEvaluating] = useState(false);
  const [evaluationResult, setEvaluationResult] = useState<ApplicationEvaluation | null>(null);
  const [extractedDocs, setExtractedDocs] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Profile Reusability State
  const [profileDocuments, setProfileDocuments] = useState<any[]>([]);
  const [profileLoaded, setProfileLoaded] = useState(false);

  useEffect(() => {
    scholarService.getSchemes().then((data) => {
      setSchemes(data);
      if (!selectedSchemeCode && data.length > 0) {
        setSelectedSchemeCode(data[0].scheme_code);
      }
    });

    scholarService.getApplicantProfile().then((prof) => {
      if (prof) {
        if (prof.full_name) setApplicantName(prof.full_name);
        if (prof.email) setApplicantEmail(prof.email);
        if (prof.phone) setApplicantPhone(prof.phone);
        if (prof.tribe_name) setTribeName(prof.tribe_name);
        if (prof.caste_certificate_no) setCasteCertNo(prof.caste_certificate_no);
        if (prof.annual_income !== undefined && prof.annual_income !== null) setAnnualIncome(prof.annual_income);
        if (prof.institution_name) setInstitutionName(prof.institution_name);
        if (prof.course_name) setCourseEnrolled(prof.course_name);
        if (prof.aggregate_percentage) setAggregatePercentage(prof.aggregate_percentage);
        if (prof.admission_status) setAdmissionStatus(prof.admission_status);
        if (prof.dob) {
          const birthYear = new Date(prof.dob).getFullYear();
          if (birthYear && birthYear > 1950) {
            setApplicantAge(new Date().getFullYear() - birthYear);
          }
        }
        if (prof.documents) {
          setProfileDocuments(prof.documents);
        }
        setProfileLoaded(true);
      }
    }).catch(() => {});
  }, []);

  const selectedScheme = schemes.find((s) => s.scheme_code === selectedSchemeCode);

  const handleRunEvaluation = async () => {
    setEvaluating(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("scheme_code", selectedSchemeCode);
      if (annualIncome) formData.append("annual_family_income", String(annualIncome));
      if (aggregatePercentage) formData.append("aggregate_percentage", String(aggregatePercentage));
      if (applicantAge) formData.append("applicant_age", String(applicantAge));

      if (casteFile) formData.append("caste_file", casteFile);
      if (incomeFile) formData.append("income_file", incomeFile);
      if (academicFile) formData.append("academic_file", academicFile);
      if (offerFile) formData.append("offer_file", offerFile);

      const res = await scholarService.evaluateSandbox(formData);
      setEvaluationResult(res.evaluation);
      setExtractedDocs(res.extracted_documents || {});
      setStep(3); // Advance to rule review
    } catch (err: any) {
      setError(err?.message || "Document analysis failed. Please verify files.");
    } finally {
      setEvaluating(false);
    }
  };

  const handleFinalSubmit = async () => {
    setSubmitting(true);
    setError(null);
    try {
      const formData = new FormData();
      formData.append("scheme_code", selectedSchemeCode);
      formData.append("applicant_name", applicantName);
      if (applicantEmail) formData.append("applicant_email", applicantEmail);
      if (applicantPhone) formData.append("applicant_phone", applicantPhone);
      if (tribeName) formData.append("tribe_name", tribeName);
      if (casteCertNo) formData.append("caste_certificate_no", casteCertNo);
      if (annualIncome) formData.append("annual_family_income", String(annualIncome));
      if (aggregatePercentage) formData.append("aggregate_percentage", String(aggregatePercentage));
      if (applicantAge) formData.append("applicant_age", String(applicantAge));
      if (institutionName) formData.append("institution_name", institutionName);
      if (courseEnrolled) formData.append("course_enrolled", courseEnrolled);
      formData.append("admission_status", admissionStatus);

      if (casteFile) formData.append("caste_file", casteFile);
      if (incomeFile) formData.append("income_file", incomeFile);
      if (academicFile) formData.append("academic_file", academicFile);
      if (offerFile) formData.append("offer_file", offerFile);

      const app = await scholarService.submitApplication(formData);
      navigate(`/applicant/applications/${app.id}`);
    } catch (err: any) {
      setError(err?.message || "Failed to submit application.");
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      {/* Wizard Header */}
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.35rem" }}>
          Apply for Scheduled Tribe Scheme
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.92rem" }}>
          Step-by-step document submission &bull; Instant PaddleOCR extraction &bull; Supabase dynamic rule pre-validation
        </p>
      </div>

      {/* Stepper Indicator */}
      <div style={{ display: "flex", alignItems: "center", gap: "1rem", marginBottom: "2rem" }}>
        {[
          { num: 1, label: "Scheme & Details" },
          { num: 2, label: "Upload Documents" },
          { num: 3, label: "Rule Pre-Check & Submit" }
        ].map((s) => (
          <div key={s.num} style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor: step === s.num ? "#2563eb" : step > s.num ? "#059669" : "#e2e8f0",
                color: step >= s.num ? "#ffffff" : "#64748b",
                fontWeight: 700,
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              {step > s.num ? "✓" : s.num}
            </div>
            <span style={{ fontSize: "0.85rem", fontWeight: step === s.num ? 700 : 500, color: step === s.num ? "#0f172a" : "#64748b" }}>
              {s.label}
            </span>
            {s.num < 3 && <div style={{ width: "40px", height: "2px", backgroundColor: "#e2e8f0", marginLeft: "0.5rem" }} />}
          </div>
        ))}
      </div>

      {error && (
        <div style={{ backgroundColor: "#fef2f2", border: "1px solid #fecaca", borderRadius: "8px", padding: "0.85rem 1rem", color: "#991b1b", fontSize: "0.85rem", marginBottom: "1.5rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* STEP 1: SCHEME & APPLICANT DATA */}
      {step === 1 && (
        <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", flexWrap: "wrap", gap: "0.5rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
              Step 1: Select Scheme &amp; Applicant Information
            </h2>
            {profileLoaded && (
              <span style={{ fontSize: "0.76rem", fontWeight: 700, color: "#1e40af", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", padding: "0.25rem 0.65rem", borderRadius: "999px", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                <CheckCircle2 size={13} /> Reusable Profile Auto-Populated
              </span>
            )}
          </div>

          {profileLoaded && (
            <div style={{ backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: "8px", padding: "0.75rem 1rem", marginBottom: "1.25rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <CheckCircle2 size={16} color="#16a34a" />
              <span style={{ fontSize: "0.82rem", color: "#166534", fontWeight: 600 }}>
                Applicant credentials synchronized from your verified SCHOLAR-ST profile. No duplicate entries required.
              </span>
            </div>
          )}

          <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "#1e293b", marginBottom: "0.4rem" }}>
                Select Scholarship / Fellowship Scheme
              </label>
              <select
                value={selectedSchemeCode}
                onChange={(e) => setSelectedSchemeCode(e.target.value)}
                style={{ width: "100%", padding: "0.7rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", backgroundColor: "#f8fafc" }}
              >
                {schemes.map((s) => (
                  <option key={s.scheme_code} value={s.scheme_code}>
                    {s.scheme_name} ({s.scheme_code})
                  </option>
                ))}
              </select>
              {selectedScheme && (
                <div style={{ marginTop: "0.5rem", padding: "0.75rem", backgroundColor: "#eff6ff", borderRadius: "6px", fontSize: "0.8rem", color: "#1e40af" }}>
                  <strong>{selectedScheme.study_level}:</strong> {selectedScheme.description}
                </div>
              )}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "#1e293b", marginBottom: "0.4rem" }}>
                  Applicant Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={applicantName}
                  onChange={(e) => setApplicantName(e.target.value)}
                  placeholder="e.g. Birsa Munda"
                  style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "#1e293b", marginBottom: "0.4rem" }}>
                  Scheduled Tribe Community *
                </label>
                <input
                  type="text"
                  required
                  value={tribeName}
                  onChange={(e) => setTribeName(e.target.value)}
                  placeholder="e.g. Gond, Santhal, Bhil, Munda, Koya"
                  style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "#1e293b", marginBottom: "0.4rem" }}>
                  Annual Family Income (INR) *
                </label>
                <input
                  type="number"
                  required
                  value={annualIncome}
                  onChange={(e) => setAnnualIncome(e.target.value ? Number(e.target.value) : "")}
                  placeholder="e.g. 240000"
                  style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "#1e293b", marginBottom: "0.4rem" }}>
                  Aggregate % or Equivalent *
                </label>
                <input
                  type="number"
                  step="0.1"
                  required
                  value={aggregatePercentage}
                  onChange={(e) => setAggregatePercentage(e.target.value ? Number(e.target.value) : "")}
                  placeholder="e.g. 68.5"
                  style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "#1e293b", marginBottom: "0.4rem" }}>
                  Applicant Age (Years) *
                </label>
                <input
                  type="number"
                  required
                  value={applicantAge}
                  onChange={(e) => setApplicantAge(e.target.value ? Number(e.target.value) : "")}
                  placeholder="e.g. 26"
                  style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "#1e293b", marginBottom: "0.4rem" }}>
                  Admitted Institution / University
                </label>
                <input
                  type="text"
                  value={institutionName}
                  onChange={(e) => setInstitutionName(e.target.value)}
                  placeholder="e.g. University of Oxford / IIT Bombay"
                  style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "#1e293b", marginBottom: "0.4rem" }}>
                  Course / Program of Study
                </label>
                <input
                  type="text"
                  value={courseEnrolled}
                  onChange={(e) => setCourseEnrolled(e.target.value)}
                  placeholder="e.g. Ph.D. in Computer Science"
                  style={{ width: "100%", padding: "0.65rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>
            </div>

            <div style={{ marginTop: "1rem", display: "flex", justifyContent: "flex-end" }}>
              <button
                type="button"
                onClick={() => {
                  if (!applicantName.trim()) {
                    setError("Please provide applicant name.");
                    return;
                  }
                  setError(null);
                  setStep(2);
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  padding: "0.7rem 1.5rem",
                  borderRadius: "8px",
                  backgroundColor: "#2563eb",
                  color: "#ffffff",
                  fontSize: "0.88rem",
                  fontWeight: 700,
                  border: "none",
                  cursor: "pointer"
                }}
              >
                <span>Continue to Document Upload</span>
                <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* STEP 2: DOCUMENT UPLOADS */}
      {step === 2 && (
        <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <h2 style={{ fontSize: "1.2rem", fontWeight: 700, color: "#0f172a" }}>
              Step 2: Upload Required Statutory Documents
            </h2>
            <button
              type="button"
              onClick={() => setStep(1)}
              style={{ display: "flex", alignItems: "center", gap: "0.3rem", background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "0.84rem" }}
            >
              <ArrowLeft size={16} /> Back to Details
            </button>
          </div>

          <p style={{ fontSize: "0.84rem", color: "#64748b", marginBottom: "1.5rem" }}>
            Upload PDFs or high-resolution images. Our OpenCV pipeline deskews, enhances stamps and watermarks, and PaddleOCR extracts lines before rule checks.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem", marginBottom: "2rem" }}>
            {/* Caste Certificate */}
            {(() => {
              const profDoc = profileDocuments.find((d) => d.document_type === "CASTE_CERTIFICATE");
              return (
                <div style={{ border: profDoc ? "1px solid #a7f3d0" : "1px solid #e2e8f0", borderRadius: "10px", padding: "1.25rem", backgroundColor: profDoc ? "#f0fdf4" : "#f8fafc" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#0f172a", fontWeight: 700, fontSize: "0.9rem" }}>
                      <ShieldCheck size={18} color="#059669" />
                      <span>1. ST Caste Certificate *</span>
                    </div>
                    {profDoc && (
                      <span style={{ fontSize: "0.72rem", color: "#166534", fontWeight: 700, backgroundColor: "#dcfce7", padding: "0.15rem 0.5rem", borderRadius: "999px" }}>
                        ✓ From Verified Profile
                      </span>
                    )}
                  </div>
                  {profDoc && (
                    <div style={{ fontSize: "0.76rem", color: "#166534", marginBottom: "0.4rem", fontWeight: 600 }}>
                      Attached: {profDoc.file_name} (Article 342 Verified)
                    </div>
                  )}
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => setCasteFile(e.target.files ? e.target.files[0] : null)}
                    style={{ fontSize: "0.82rem", marginTop: "0.2rem" }}
                  />
                  {casteFile && <div style={{ fontSize: "0.75rem", color: "#059669", marginTop: "0.3rem" }}>✓ Override file selected: {casteFile.name}</div>}
                </div>
              );
            })()}

            {/* Income Certificate */}
            {(() => {
              const profDoc = profileDocuments.find((d) => d.document_type === "INCOME_CERTIFICATE");
              return (
                <div style={{ border: profDoc ? "1px solid #a7f3d0" : "1px solid #e2e8f0", borderRadius: "10px", padding: "1.25rem", backgroundColor: profDoc ? "#f0fdf4" : "#f8fafc" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#0f172a", fontWeight: 700, fontSize: "0.9rem" }}>
                      <FileText size={18} color="#2563eb" />
                      <span>2. Income Certificate *</span>
                    </div>
                    {profDoc && (
                      <span style={{ fontSize: "0.72rem", color: "#166534", fontWeight: 700, backgroundColor: "#dcfce7", padding: "0.15rem 0.5rem", borderRadius: "999px" }}>
                        ✓ From Verified Profile
                      </span>
                    )}
                  </div>
                  {profDoc && (
                    <div style={{ fontSize: "0.76rem", color: "#166534", marginBottom: "0.4rem", fontWeight: 600 }}>
                      Attached: {profDoc.file_name}
                    </div>
                  )}
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => setIncomeFile(e.target.files ? e.target.files[0] : null)}
                    style={{ fontSize: "0.82rem", marginTop: "0.2rem" }}
                  />
                  {incomeFile && <div style={{ fontSize: "0.75rem", color: "#059669", marginTop: "0.3rem" }}>✓ Override file selected: {incomeFile.name}</div>}
                </div>
              );
            })()}

            {/* Marksheet */}
            {(() => {
              const profDoc = profileDocuments.find((d) => d.document_type === "MARKSHEET");
              return (
                <div style={{ border: profDoc ? "1px solid #a7f3d0" : "1px solid #e2e8f0", borderRadius: "10px", padding: "1.25rem", backgroundColor: profDoc ? "#f0fdf4" : "#f8fafc" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#0f172a", fontWeight: 700, fontSize: "0.9rem" }}>
                      <Award size={18} color="#7c3aed" />
                      <span>3. Marksheet / Transcript *</span>
                    </div>
                    {profDoc && (
                      <span style={{ fontSize: "0.72rem", color: "#166534", fontWeight: 700, backgroundColor: "#dcfce7", padding: "0.15rem 0.5rem", borderRadius: "999px" }}>
                        ✓ From Verified Profile
                      </span>
                    )}
                  </div>
                  {profDoc && (
                    <div style={{ fontSize: "0.76rem", color: "#166534", marginBottom: "0.4rem", fontWeight: 600 }}>
                      Attached: {profDoc.file_name}
                    </div>
                  )}
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => setAcademicFile(e.target.files ? e.target.files[0] : null)}
                    style={{ fontSize: "0.82rem", marginTop: "0.2rem" }}
                  />
                  {academicFile && <div style={{ fontSize: "0.75rem", color: "#059669", marginTop: "0.3rem" }}>✓ Override file selected: {academicFile.name}</div>}
                </div>
              );
            })()}

            {/* Offer Letter */}
            {(() => {
              const profDoc = profileDocuments.find((d) => d.document_type === "ADMISSION_OFFER");
              return (
                <div style={{ border: profDoc ? "1px solid #a7f3d0" : "1px solid #e2e8f0", borderRadius: "10px", padding: "1.25rem", backgroundColor: profDoc ? "#f0fdf4" : "#f8fafc" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.5rem" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", color: "#0f172a", fontWeight: 700, fontSize: "0.9rem" }}>
                      <Building2 size={18} color="#059669" />
                      <span>4. Admission Offer / Bonafide</span>
                    </div>
                    {profDoc && (
                      <span style={{ fontSize: "0.72rem", color: "#166534", fontWeight: 700, backgroundColor: "#dcfce7", padding: "0.15rem 0.5rem", borderRadius: "999px" }}>
                        ✓ From Verified Profile
                      </span>
                    )}
                  </div>
                  {profDoc && (
                    <div style={{ fontSize: "0.76rem", color: "#166534", marginBottom: "0.4rem", fontWeight: 600 }}>
                      Attached: {profDoc.file_name}
                    </div>
                  )}
                  <input
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg"
                    onChange={(e) => setOfferFile(e.target.files ? e.target.files[0] : null)}
                    style={{ fontSize: "0.82rem", marginTop: "0.2rem" }}
                  />
                  {offerFile && <div style={{ fontSize: "0.75rem", color: "#059669", marginTop: "0.3rem" }}>✓ Override file selected: {offerFile.name}</div>}
                </div>
              );
            })()}
          </div>

          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => setStep(1)}
              style={{ padding: "0.6rem 1.25rem", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", color: "#475569", fontSize: "0.85rem", cursor: "pointer" }}
            >
              Previous
            </button>

            <button
              type="button"
              disabled={evaluating}
              onClick={handleRunEvaluation}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 1.75rem",
                borderRadius: "8px",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                fontSize: "0.9rem",
                fontWeight: 700,
                border: "none",
                cursor: evaluating ? "not-allowed" : "pointer",
                boxShadow: "0 2px 8px rgba(37, 99, 235, 0.3)"
              }}
            >
              {evaluating ? (
                <>
                  <Loader2 size={18} className="spin" style={{ animation: "spin 1s linear infinite" }} />
                  <span>Processing OCR &amp; Dynamic Rules...</span>
                </>
              ) : (
                <>
                  <span>Run Live Rule Pre-Check</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: RULE EVALUATION PREVIEW & SUBMIT */}
      {step === 3 && evaluationResult && (
        <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "2rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem" }}>
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a" }}>
                Step 3: Deterministic Rule Evaluation Report
              </h2>
              <p style={{ color: "#64748b", fontSize: "0.82rem" }}>
                Evaluated against active rules for <strong>{selectedSchemeCode}</strong> stored in Supabase.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setStep(2)}
              style={{ display: "flex", alignItems: "center", gap: "0.3rem", background: "none", border: "none", color: "#64748b", cursor: "pointer", fontSize: "0.84rem" }}
            >
              <ArrowLeft size={16} /> Back to Uploads
            </button>
          </div>

          {/* Overall Advisory Banner */}
          <div
            style={{
              padding: "1rem 1.25rem",
              borderRadius: "10px",
              backgroundColor:
                evaluationResult.eligibility_score >= 80 ? "#ecfdf5" :
                evaluationResult.failed_rules > 0 ? "#fef2f2" : "#fffbeb",
              border: `1px solid ${
                evaluationResult.eligibility_score >= 80 ? "#a7f3d0" :
                evaluationResult.failed_rules > 0 ? "#fecaca" : "#fde68a"
              }`,
              marginBottom: "1.5rem",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center"
            }}
          >
            <div>
              <div style={{ fontWeight: 800, fontSize: "0.95rem", color: "#0f172a" }}>
                System Advisory: {evaluationResult.system_recommendation.replace(/_/g, " ")}
              </div>
              <div style={{ fontSize: "0.82rem", color: "#475569", marginTop: "0.2rem" }}>
                {evaluationResult.recommendation_text}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#0f172a" }}>
                {evaluationResult.eligibility_score}%
              </div>
              <div style={{ fontSize: "0.72rem", color: "#64748b" }}>
                {evaluationResult.passed_rules} of {evaluationResult.total_rules} Passed
              </div>
            </div>
          </div>

          {/* AI-Assisted Document Understanding Layer (Gemini Flash) */}
          {extractedDocs && Object.keys(extractedDocs).length > 0 && (
            <div style={{ backgroundColor: "#f8fafc", borderRadius: "10px", border: "1px solid #cbd5e1", padding: "1.25rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem", flexWrap: "wrap", gap: "0.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.45rem", fontWeight: 800, fontSize: "0.88rem", color: "#1e293b" }}>
                  <Sparkles size={16} color="#4f46e5" />
                  <span>AI-Assisted Document Understanding (Gemini Flash)</span>
                  <span style={{ fontSize: "0.68rem", fontWeight: 700, padding: "0.15rem 0.45rem", borderRadius: "4px", backgroundColor: "#e0e7ff", color: "#3730a3" }}>
                    DOCUMENT INTERPRETATION LAYER
                  </span>
                </div>
                <span style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 600 }}>
                  Constitutional Directive: Gemini does NOT approve or reject eligibility
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "0.75rem" }}>
                {Object.entries(extractedDocs).map(([docKey, docData]: [string, any]) => {
                  const explanation = docData?.document_explanation || docData?.ai_understanding?.document_explanation || "Document layout interpreted.";
                  const classification = docData?.ai_understanding?.classification?.classified_type || docData?.document_type || docKey;
                  const confidence = Math.round((docData?.ai_understanding?.classification?.confidence || docData?.classification_confidence || 0.9) * 100);
                  const unclear = docData?.unclear_information_flags || docData?.ai_understanding?.unclear_information_flags || [];
                  const inconsistencies = docData?.inconsistencies_detected || docData?.ai_understanding?.inconsistencies_detected || [];

                  return (
                    <div key={docKey} style={{ backgroundColor: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0", padding: "0.85rem", fontSize: "0.78rem" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.4rem" }}>
                        <strong style={{ color: "#0f172a", textTransform: "capitalize" }}>{docKey.replace(/_/g, " ")}</strong>
                        <span style={{ fontSize: "0.7rem", backgroundColor: "#f1f5f9", padding: "0.1rem 0.4rem", borderRadius: "4px", color: "#475569" }}>
                          {classification} ({confidence}%)
                        </span>
                      </div>
                      <div style={{ color: "#334155", marginBottom: "0.4rem", lineHeight: 1.4 }}>
                        {explanation}
                      </div>
                      {unclear.length > 0 && (
                        <div style={{ color: "#92400e", backgroundColor: "#fffbeb", padding: "0.3rem 0.5rem", borderRadius: "4px", marginBottom: "0.3rem" }}>
                          ⚠️ Unclear: {unclear.join(", ")}
                        </div>
                      )}
                      {inconsistencies.length > 0 && (
                        <div style={{ color: "#991b1b", backgroundColor: "#fef2f2", padding: "0.3rem 0.5rem", borderRadius: "4px" }}>
                          ⚠️ Inconsistencies: {inconsistencies.join(", ")}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "0.75rem", borderTop: "1px dashed #cbd5e1", paddingTop: "0.5rem" }}>
                <strong>Statutory Architecture:</strong> Document &rarr; OpenCV &rarr; PaddleOCR &rarr; Structured Data &rarr; Gemini Interpretation &rarr; Dynamic Rule Engine (100% Deterministic) &rarr; Officer Review.
              </div>
            </div>
          )}

          {/* Rule-by-Rule Checklist */}
          <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem", marginBottom: "2rem" }}>
            {evaluationResult.rule_results.map((rule: any) => {
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
                          Authority: {statutoryRef}
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
                      <span style={{ color: "#64748b" }}>Evaluated Value: </span>
                      <span style={{ fontWeight: 700, color: applicantVal ? "#0f172a" : "#94a3b8" }}>{applicantVal ?? "Not Provided"}</span>
                    </div>
                  </div>

                  {evidenceRef && (
                    <div style={{ fontSize: "0.76rem", color: "#475569", marginTop: "0.45rem" }}>
                      <strong>Evidence:</strong> {evidenceRef}
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

          {/* Submission Bar */}
          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <button
              type="button"
              onClick={() => setStep(2)}
              style={{ padding: "0.6rem 1.25rem", borderRadius: "8px", border: "1px solid #cbd5e1", backgroundColor: "#ffffff", color: "#475569", fontSize: "0.85rem", cursor: "pointer" }}
            >
              Adjust Documents
            </button>

            <button
              type="button"
              disabled={submitting}
              onClick={handleFinalSubmit}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 2rem",
                borderRadius: "8px",
                backgroundColor: "#059669",
                color: "#ffffff",
                fontSize: "0.92rem",
                fontWeight: 700,
                border: "none",
                cursor: submitting ? "not-allowed" : "pointer",
                boxShadow: "0 2px 10px rgba(5, 150, 105, 0.35)"
              }}
            >
              {submitting ? (
                <>
                  <Loader2 size={18} className="spin" style={{ animation: "spin 1s linear infinite" }} />
                  <span>Submitting Application to Verification Officer...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 size={18} />
                  <span>Confirm &amp; Submit Application</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
