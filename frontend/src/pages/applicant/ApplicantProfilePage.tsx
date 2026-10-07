import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import {
  User,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Save,
  FileText,
  UploadCloud,
  Trash2,
  Eye,
  GraduationCap,
  Building2,
  DollarSign,
  Landmark,
  BadgePercent,
  Check,
  Clock,
  ExternalLink,
  Sparkles,
  Info,
  Calendar,
  MapPin,
  Phone,
  Mail,
  ArrowRight
} from "lucide-react";
import { scholarService } from "../../services/scholarService";
import type { ApplicantProfileData, ProfileDocument, ProfileCompletionStatus } from "../../types/scholar";

export default function ApplicantProfilePage() {
  const [profile, setProfile] = useState<ApplicantProfileData>({
    full_name: "",
    email: "",
    phone: "",
    dob: "",
    gender: "",
    address: "",
    pincode: "",
    state_of_domicile: "",
    district: "",
    category: "Scheduled Tribe (ST)",
    tribe_name: "",
    caste_certificate_no: "",
    caste_verified: false,
    caste_issuing_authority: "",
    caste_issue_date: "",
    education_qualification: "UNDERGRADUATE",
    academic_level: "UNDERGRADUATE",
    institution_name: "",
    course_name: "",
    academic_year: "2026-2027",
    aggregate_percentage: undefined,
    admission_status: "CONFIRMED",
    father_or_guardian_name: "",
    guardian_occupation: "",
    annual_income: undefined,
    income_certificate_no: "",
    income_issuing_authority: "",
    income_issue_date: "",
    bank_name: "",
    bank_account_no: "",
    bank_ifsc: ""
  });

  const [documents, setDocuments] = useState<ProfileDocument[]>([]);
  const [completionStats, setCompletionStats] = useState<ProfileCompletionStatus | null>(null);
  const [recognizedTribes, setRecognizedTribes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"personal" | "caste" | "academic" | "income" | "bank" | "documents">("personal");
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Document upload state
  const [uploadingDocType, setUploadingDocType] = useState<string | null>(null);
  const [uploadFeedback, setUploadFeedback] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [currentUploadDocType, setCurrentUploadDocType] = useState<string>("CASTE_CERTIFICATE");

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    try {
      const [prof, tribes] = await Promise.all([
        scholarService.getApplicantProfile().catch(() => null),
        scholarService.getRecognizedTribes().catch(() => [])
      ]);

      if (prof) {
        setProfile(prof);
        if (prof.documents) setDocuments(prof.documents);
        if (prof.completion_stats) setCompletionStats(prof.completion_stats);
      }
      setRecognizedTribes(tribes);
    } catch (err: any) {
      setFeedback({ type: "error", message: "Failed to load applicant profile data." });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProfile = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const updated = await scholarService.updateApplicantProfile(profile);
      setProfile(updated);
      if (updated.documents) setDocuments(updated.documents);
      if (updated.completion_stats) setCompletionStats(updated.completion_stats);
      setFeedback({
        type: "success",
        message: "Profile saved successfully! Data is now synchronized across all scholarship applications."
      });
      // Scroll to top of form smoothly
      window.scrollTo({ top: 120, behavior: "smooth" });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to update profile." });
    } finally {
      setSaving(false);
    }
  };

  const triggerUploadModal = (docType: string) => {
    setCurrentUploadDocType(docType);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
      fileInputRef.current.click();
    }
  };

  const handleDocumentFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingDocType(currentUploadDocType);
    setUploadFeedback(`Uploading and running AI OCR extraction on ${file.name}...`);

    try {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("document_type", currentUploadDocType);
      formData.append("document_name", file.name);

      const res = await scholarService.uploadProfileDocument(formData);
      if (res.profile) {
        setProfile(res.profile);
        if (res.profile.documents) setDocuments(res.profile.documents);
        if (res.profile.completion_stats) setCompletionStats(res.profile.completion_stats);
      }
      setFeedback({
        type: "success",
        message: `${res.message || "Document successfully associated with your profile."}`
      });
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to upload document. Please ensure valid PDF or image file."
      });
    } finally {
      setUploadingDocType(null);
      setUploadFeedback(null);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!window.confirm("Are you sure you want to remove this document from your profile?")) return;
    try {
      const updatedProf = await scholarService.deleteProfileDocument(docId);
      setProfile(updatedProf);
      if (updatedProf.documents) setDocuments(updatedProf.documents);
      if (updatedProf.completion_stats) setCompletionStats(updatedProf.completion_stats);
      setFeedback({ type: "success", message: "Document removed from profile." });
    } catch (err: any) {
      setFeedback({ type: "error", message: err.message || "Failed to delete document." });
    }
  };

  const completionPct = completionStats?.completion_percentage || profile.profile_completion_percentage || 0;

  if (loading) {
    return (
      <div style={{ padding: "4rem", textAlign: "center", color: "#64748b" }}>
        <Loader2 size={36} className="spin" style={{ margin: "0 auto 1rem auto", color: "#2563eb" }} />
        <div style={{ fontWeight: 600 }}>Loading SCHOLAR-ST Applicant Profile...</div>
      </div>
    );
  }

  const DOCUMENT_SLOTS = [
    {
      type: "CASTE_CERTIFICATE",
      title: "Scheduled Tribe (ST) Certificate",
      desc: "Statutory certificate issued under Article 342 by Revenue Authority (SDM/Tehsildar).",
      required: true,
      hint: "Article 342 verification required for all ST schemes"
    },
    {
      type: "INCOME_CERTIFICATE",
      title: "Annual Family Income Certificate",
      desc: "Revenue authority income certificate or valid ration / BPL card.",
      required: true,
      hint: "Required for means-tested schemes (NOS-ST ceiling: ₹8L, NFST ceiling: ₹12L)"
    },
    {
      type: "MARKSHEET",
      title: "Degree Marksheet / Academic Transcript",
      desc: "Latest qualifying examination marksheet or graduation transcript.",
      required: true,
      hint: "Used to verify merit criteria (55%+ graduation marks for fellowship)"
    },
    {
      type: "ADMISSION_OFFER",
      title: "Institution Admission Offer / Bonafide",
      desc: "Confirmed admission offer or bonafide student enrolment certificate.",
      required: false,
      hint: "Required for overseas scholarship (NOS-ST) or fellowship disbursement"
    },
    {
      type: "IDENTITY_CARD",
      title: "Identity Proof / Aadhaar / Student ID",
      desc: "Government issued identity proof or university student identity card.",
      required: false,
      hint: "Used for DBT Aadhaar bank account matching"
    }
  ];

  return (
    <div style={{ maxWidth: "1100px", margin: "0 auto", paddingBottom: "3rem" }}>
      {/* Hidden file input for document association */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleDocumentFileChange}
        accept=".pdf,.jpg,.jpeg,.png,.webp"
        style={{ display: "none" }}
      />

      {/* Top Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.75rem", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.35rem" }}>
            <h1 style={{ fontSize: "1.85rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              Applicant Profile &amp; Reusable Credentials
            </h1>
            {profile.caste_verified ? (
              <span style={{ backgroundColor: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0", fontSize: "0.74rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "999px", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                <CheckCircle2 size={13} /> Article 342 Verified
              </span>
            ) : (
              <span style={{ backgroundColor: "#fffbeb", color: "#92400e", border: "1px solid #fde68a", fontSize: "0.74rem", fontWeight: 700, padding: "0.2rem 0.6rem", borderRadius: "999px", display: "inline-flex", alignItems: "center", gap: "0.3rem" }}>
                <Clock size={13} /> Verification In Progress
              </span>
            )}
          </div>
          <p style={{ color: "#64748b", fontSize: "0.92rem", margin: 0 }}>
            Unified Scheduled Tribe Scholar profile. Enter and verify your statutory credentials once to apply across all Ministry of Tribal Affairs scholarships without repeated entries.
          </p>
        </div>

        <div style={{ display: "flex", gap: "0.75rem" }}>
          <button
            onClick={() => handleSaveProfile()}
            disabled={saving}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.65rem 1.25rem",
              borderRadius: "8px",
              backgroundColor: "#2563eb",
              color: "#ffffff",
              fontSize: "0.85rem",
              fontWeight: 700,
              border: "none",
              cursor: saving ? "not-allowed" : "pointer",
              boxShadow: "0 2px 8px rgba(37,99,235,0.25)"
            }}
          >
            {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
            <span>Save Profile</span>
          </button>

          <Link
            to="/applicant/apply"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.65rem 1.25rem",
              borderRadius: "8px",
              backgroundColor: "#059669",
              color: "#ffffff",
              fontSize: "0.85rem",
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 2px 8px rgba(5,150,105,0.2)"
            }}
          >
            <Sparkles size={16} />
            <span>Apply to Scheme</span>
          </Link>
        </div>
      </div>

      {/* Global Feedback Banner */}
      {feedback && (
        <div
          style={{
            padding: "0.9rem 1.25rem",
            borderRadius: "8px",
            backgroundColor: feedback.type === "success" ? "#ecfdf5" : "#fef2f2",
            border: `1px solid ${feedback.type === "success" ? "#a7f3d0" : "#fecaca"}`,
            color: feedback.type === "success" ? "#065f46" : "#991b1b",
            fontSize: "0.88rem",
            fontWeight: 600,
            marginBottom: "1.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {feedback.type === "success" ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
            <span>{feedback.message}</span>
          </div>
          <button
            onClick={() => setFeedback(null)}
            style={{ background: "transparent", border: "none", cursor: "pointer", color: "inherit", fontWeight: 700 }}
          >
            &times;
          </button>
        </div>
      )}

      {/* Reusability Active Highlight Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, #eff6ff 0%, #e0e7ff 100%)",
          border: "1px solid #bfdbfe",
          borderRadius: "12px",
          padding: "1rem 1.25rem",
          marginBottom: "1.5rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "0.75rem"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: "38px", height: "38px", borderRadius: "8px", backgroundColor: "#2563eb", color: "#ffffff", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Sparkles size={20} />
          </div>
          <div>
            <div style={{ fontWeight: 700, color: "#1e3a8a", fontSize: "0.92rem" }}>
              Zero Redundancy Active &bull; Single Verified Profile Across All ST Schemes
            </div>
            <div style={{ color: "#3b82f6", fontSize: "0.8rem", marginTop: "0.15rem" }}>
              Your profile information and attached certificates are automatically populated whenever you apply for NOS-ST, NFST, PMS-ST, or other fellowship schemes.
            </div>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1e40af", backgroundColor: "#ffffff", padding: "0.35rem 0.75rem", borderRadius: "6px", border: "1px solid #93c5fd" }}>
            {documents.length} Document(s) Attached
          </span>
        </div>
      </div>

      {/* PROFILE COMPLETION INDICATOR & READINESS SCORE CARD */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "14px",
          border: "1px solid #e2e8f0",
          padding: "1.5rem",
          marginBottom: "1.75rem",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)"
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
          <div>
            <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Profile Completion &amp; Scheme Readiness
            </div>
            <div style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", marginTop: "0.2rem" }}>
              {completionStats?.readiness_label || "Profile Readiness Status"}
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontSize: "1.75rem", fontWeight: 900, color: completionPct >= 80 ? "#059669" : completionPct >= 50 ? "#2563eb" : "#d97706", lineHeight: 1 }}>
                {completionPct}%
              </div>
              <div style={{ fontSize: "0.74rem", color: "#64748b", fontWeight: 600 }}>Completed</div>
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ width: "100%", height: "10px", backgroundColor: "#f1f5f9", borderRadius: "999px", overflow: "hidden", marginBottom: "1.25rem" }}>
          <div
            style={{
              width: `${completionPct}%`,
              height: "100%",
              backgroundColor: completionPct >= 90 ? "#10b981" : completionPct >= 65 ? "#3b82f6" : "#f59e0b",
              borderRadius: "999px",
              transition: "width 0.4s ease"
            }}
          />
        </div>

        {/* Section Checklist Pills */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "0.75rem" }}>
          {completionStats?.checklist?.map((item) => (
            <div
              key={item.key}
              style={{
                padding: "0.65rem 0.85rem",
                borderRadius: "8px",
                backgroundColor: item.completed ? "#f0fdf4" : "#f8fafc",
                border: `1px solid ${item.completed ? "#bbf7d0" : "#e2e8f0"}`
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "0.2rem" }}>
                <span style={{ fontSize: "0.76rem", fontWeight: 700, color: item.completed ? "#166534" : "#475569" }}>
                  {item.title}
                </span>
                {item.completed ? (
                  <CheckCircle2 size={14} style={{ color: "#16a34a", flexShrink: 0 }} />
                ) : (
                  <Clock size={14} style={{ color: "#94a3b8", flexShrink: 0 }} />
                )}
              </div>
              <div style={{ fontSize: "0.7rem", color: item.completed ? "#15803d" : "#64748b" }}>
                {item.detail || `${item.score}/${item.max_score} pts`}
              </div>
            </div>
          ))}
        </div>

        {/* Missing Items Warning if any */}
        {completionStats?.missing_items && completionStats.missing_items.length > 0 && (
          <div style={{ marginTop: "1rem", padding: "0.75rem 1rem", borderRadius: "8px", backgroundColor: "#fffbeb", border: "1px solid #fef3c7", display: "flex", alignItems: "flex-start", gap: "0.5rem" }}>
            <AlertCircle size={16} style={{ color: "#d97706", marginTop: "2px", flexShrink: 0 }} />
            <div style={{ fontSize: "0.78rem", color: "#92400e" }}>
              <strong>Pending for 100% verification:</strong> {completionStats.missing_items.join(" &bull; ")}
            </div>
          </div>
        )}
      </div>

      {/* Main Tabs Navigation */}
      <div style={{ display: "flex", borderBottom: "1px solid #e2e8f0", marginBottom: "1.5rem", gap: "0.25rem", overflowX: "auto" }}>
        {[
          { key: "personal", label: "1. Personal & Contact", icon: User },
          { key: "caste", label: "2. Tribal Status (Art. 342)", icon: ShieldCheck },
          { key: "academic", label: "3. Academic Enrolment", icon: GraduationCap },
          { key: "income", label: "4. Family & Income", icon: DollarSign },
          { key: "bank", label: "5. DBT Bank Account", icon: Landmark },
          { key: "documents", label: `6. Associated Documents (${documents.length})`, icon: FileText }
        ].map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setActiveTab(tab.key as any)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.45rem",
                padding: "0.85rem 1.15rem",
                border: "none",
                borderBottom: isActive ? "2.5px solid #2563eb" : "2.5px solid transparent",
                backgroundColor: "transparent",
                color: isActive ? "#1e40af" : "#64748b",
                fontWeight: isActive ? 700 : 500,
                fontSize: "0.88rem",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.15s ease"
              }}
            >
              <IconComp size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* FORM CONTAINER */}
      <form onSubmit={handleSaveProfile} style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "2rem" }}>
        {/* ========================================================= */}
        {/* TAB 1: PERSONAL & CONTACT                                  */}
        {/* ========================================================= */}
        {activeTab === "personal" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.25rem" }}>
                Personal &amp; Demographic Information
              </h2>
              <p style={{ color: "#64748b", fontSize: "0.85rem" }}>
                Standard applicant identification particulars as recorded on official Aadhaar and matriculation records.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.4rem" }}>
                  Full Name (as per Certificate) *
                </label>
                <input
                  type="text"
                  required
                  value={profile.full_name || ""}
                  onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                  placeholder="e.g. Birsa Munda"
                  style={{ width: "100%", padding: "0.7rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.4rem" }}>
                  Date of Birth (DOB) *
                </label>
                <input
                  type="date"
                  value={profile.dob || ""}
                  onChange={(e) => setProfile({ ...profile, dob: e.target.value })}
                  style={{ width: "100%", padding: "0.7rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.4rem" }}>
                  Gender *
                </label>
                <select
                  value={profile.gender || ""}
                  onChange={(e) => setProfile({ ...profile, gender: e.target.value })}
                  style={{ width: "100%", padding: "0.7rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", backgroundColor: "#ffffff" }}
                >
                  <option value="">Select Gender</option>
                  <option value="MALE">Male</option>
                  <option value="FEMALE">Female</option>
                  <option value="TRANSGENDER">Transgender</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.4rem" }}>
                  Mobile Number (SMS Updates) *
                </label>
                <input
                  type="tel"
                  value={profile.phone || ""}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  placeholder="+91 9876543210"
                  style={{ width: "100%", padding: "0.7rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.4rem" }}>
                  Email Address *
                </label>
                <input
                  type="email"
                  value={profile.email || ""}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  placeholder="applicant@example.com"
                  style={{ width: "100%", padding: "0.7rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.4rem" }}>
                  PIN Code
                </label>
                <input
                  type="text"
                  value={profile.pincode || ""}
                  onChange={(e) => setProfile({ ...profile, pincode: e.target.value })}
                  placeholder="e.g. 835210"
                  style={{ width: "100%", padding: "0.7rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.4rem" }}>
                Full Residential Address (Village / Town / Street)
              </label>
              <textarea
                rows={2}
                value={profile.address || ""}
                onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                placeholder="House No, Village/Ward, Post Office, Police Station"
                style={{ width: "100%", padding: "0.7rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.4rem" }}>
                  State of Domicile *
                </label>
                <input
                  type="text"
                  value={profile.state_of_domicile || ""}
                  onChange={(e) => setProfile({ ...profile, state_of_domicile: e.target.value })}
                  placeholder="e.g. Jharkhand, Odisha, Madhya Pradesh"
                  style={{ width: "100%", padding: "0.7rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.4rem" }}>
                  District *
                </label>
                <input
                  type="text"
                  value={profile.district || ""}
                  onChange={(e) => setProfile({ ...profile, district: e.target.value })}
                  placeholder="e.g. Khunti, Mayurbhanj, Bastar"
                  style={{ width: "100%", padding: "0.7rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: TRIBAL IDENTITY & ST CERTIFICATE                   */}
        {/* ========================================================= */}
        {activeTab === "caste" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.25rem" }}>
                Scheduled Tribe (ST) Statutory Identification &bull; Article 342
              </h2>
              <p style={{ color: "#64748b", fontSize: "0.85rem" }}>
                Statutory tribal community status issued under the Constitution of India. Verified certificates are accepted unconditionally across all national schemes.
              </p>
            </div>

            {/* Verification Status Card */}
            <div
              style={{
                padding: "1.25rem",
                borderRadius: "10px",
                backgroundColor: profile.caste_verified ? "#ecfdf5" : "#fffbeb",
                border: `1px solid ${profile.caste_verified ? "#a7f3d0" : "#fde68a"}`,
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "1rem"
              }}
            >
              <div>
                <div style={{ fontWeight: 800, fontSize: "0.95rem", color: profile.caste_verified ? "#065f46" : "#92400e", display: "flex", alignItems: "center", gap: "0.4rem" }}>
                  <ShieldCheck size={18} />
                  <span>
                    {profile.caste_verified
                      ? "Statutory Status: Officially Verified ST under Article 342"
                      : "Statutory Status: Pending Verification or Document Upload"}
                  </span>
                </div>
                <div style={{ fontSize: "0.82rem", color: "#475569", marginTop: "0.3rem" }}>
                  Declared Tribe: <strong>{profile.tribe_name || "Not specified"}</strong> &bull; Certificate No: <strong>{profile.caste_certificate_no || "N/A"}</strong>
                </div>
              </div>

              <div style={{ display: "flex", gap: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => triggerUploadModal("CASTE_CERTIFICATE")}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "6px",
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    border: "none",
                    cursor: "pointer"
                  }}
                >
                  Upload / Replace Certificate
                </button>
                <Link
                  to="/applicant/caste-validation"
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "6px",
                    backgroundColor: "#ffffff",
                    color: "#1e293b",
                    fontSize: "0.8rem",
                    fontWeight: 700,
                    textDecoration: "none",
                    border: "1px solid #cbd5e1"
                  }}
                >
                  Live AI OCR Scanner &rarr;
                </Link>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.4rem" }}>
                  Category *
                </label>
                <select
                  value={profile.category || "Scheduled Tribe (ST)"}
                  onChange={(e) => setProfile({ ...profile, category: e.target.value })}
                  style={{ width: "100%", padding: "0.7rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", backgroundColor: "#ffffff" }}
                >
                  <option value="Scheduled Tribe (ST)">Scheduled Tribe (ST)</option>
                  <option value="Particularly Vulnerable Tribal Group (PVTG)">Particularly Vulnerable Tribal Group (PVTG)</option>
                  <option value="De-notified Tribe (DNT)">De-notified Tribe (DNT)</option>
                  <option value="Nomadic / Semi-Nomadic Tribe">Nomadic / Semi-Nomadic Tribe</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.4rem" }}>
                  Scheduled Tribe (Community / Tribe Name) *
                </label>
                <input
                  list="tribes-datalist"
                  value={profile.tribe_name || ""}
                  onChange={(e) => setProfile({ ...profile, tribe_name: e.target.value })}
                  placeholder="e.g. Santhal, Gond, Bhil, Munda, Oraon, Bodo"
                  style={{ width: "100%", padding: "0.7rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
                <datalist id="tribes-datalist">
                  {recognizedTribes.map((t) => (
                    <option key={t} value={t} />
                  ))}
                </datalist>
                <span style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "0.2rem", display: "block" }}>
                  Recognized across 700+ communities listed under Article 342.
                </span>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.4rem" }}>
                  ST Certificate Number *
                </label>
                <input
                  type="text"
                  value={profile.caste_certificate_no || ""}
                  onChange={(e) => setProfile({ ...profile, caste_certificate_no: e.target.value })}
                  placeholder="e.g. ST/JH/2025/08942"
                  style={{ width: "100%", padding: "0.7rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.4rem" }}>
                  Issuing Authority (Revenue Official)
                </label>
                <input
                  type="text"
                  value={profile.caste_issuing_authority || ""}
                  onChange={(e) => setProfile({ ...profile, caste_issuing_authority: e.target.value })}
                  placeholder="e.g. Sub-Divisional Magistrate (SDM) / Tehsildar"
                  style={{ width: "100%", padding: "0.7rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.4rem" }}>
                  Date of Issue
                </label>
                <input
                  type="date"
                  value={profile.caste_issue_date || ""}
                  onChange={(e) => setProfile({ ...profile, caste_issue_date: e.target.value })}
                  style={{ width: "100%", padding: "0.7rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>
            </div>

            {/* OCR Extracted details card if available */}
            {profile.caste_verification_details && (
              <div style={{ backgroundColor: "#f8fafc", borderRadius: "8px", border: "1px solid #e2e8f0", padding: "1rem" }}>
                <div style={{ fontSize: "0.78rem", fontWeight: 700, color: "#475569", marginBottom: "0.5rem", textTransform: "uppercase" }}>
                  Statutory Engine Verification Record
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "0.5rem", fontSize: "0.8rem", color: "#334155" }}>
                  <div>Verified Status: <strong>{profile.caste_verification_details.verification_status || "VERIFIED"}</strong></div>
                  <div>Article 342 Match: <strong>{profile.caste_verification_details.tribe_recognized_under_art342 ? "Yes" : "Under Review"}</strong></div>
                  <div>Official Seal Detected: <strong>{profile.caste_verification_details.has_official_seal ? "Verified" : "Pending"}</strong></div>
                  <div>Issuing Authority: <strong>{profile.caste_verification_details.issuing_authority || "Recorded"}</strong></div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: ACADEMIC QUALIFICATIONS                            */}
        {/* ========================================================= */}
        {activeTab === "academic" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.25rem" }}>
                Educational Qualifications &amp; Institution Enrolment
              </h2>
              <p style={{ color: "#64748b", fontSize: "0.85rem" }}>
                Details of current study level, accredited university/college, and academic achievement for fellowship eligibility.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.4rem" }}>
                  Education Qualification Level *
                </label>
                <select
                  value={profile.education_qualification || profile.academic_level || "UNDERGRADUATE"}
                  onChange={(e) => setProfile({ ...profile, education_qualification: e.target.value, academic_level: e.target.value })}
                  style={{ width: "100%", padding: "0.7rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", backgroundColor: "#ffffff" }}
                >
                  <option value="SECONDARY_CLASS_9_10">Secondary (Class IX - X) [Pre-Matric]</option>
                  <option value="HIGHER_SECONDARY_11_12">Higher Secondary (Class XI - XII) [Post-Matric]</option>
                  <option value="DIPLOMA_POLYTECHNIC">Diploma / Polytechnic</option>
                  <option value="UNDERGRADUATE">Undergraduate / Bachelor's (B.Tech, B.Sc, B.A)</option>
                  <option value="POSTGRADUATE">Postgraduate / Master's (M.Tech, M.Sc, M.A)</option>
                  <option value="M_PHIL_PHD">M.Phil / Ph.D Research Fellowship (NFST)</option>
                  <option value="OVERSEAS_POSTGRADUATE_PHD">Foreign Master's / Ph.D Degree (NOS-ST)</option>
                  <option value="POST_DOCTORAL">Post-Doctoral Fellow</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.4rem" }}>
                  Current Academic Year *
                </label>
                <input
                  type="text"
                  value={profile.academic_year || "2026-2027"}
                  onChange={(e) => setProfile({ ...profile, academic_year: e.target.value })}
                  placeholder="2026-2027"
                  style={{ width: "100%", padding: "0.7rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.4rem" }}>
                  Institution / University Name *
                </label>
                <input
                  type="text"
                  value={profile.institution_name || ""}
                  onChange={(e) => setProfile({ ...profile, institution_name: e.target.value })}
                  placeholder="e.g. Indian Institute of Technology Delhi"
                  style={{ width: "100%", padding: "0.7rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.4rem" }}>
                  Course / Degree Programme Enrolled *
                </label>
                <input
                  type="text"
                  value={profile.course_name || ""}
                  onChange={(e) => setProfile({ ...profile, course_name: e.target.value })}
                  placeholder="e.g. B.Tech Computer Science / Ph.D Anthropology"
                  style={{ width: "100%", padding: "0.7rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.4rem" }}>
                  Aggregate Percentage / CGPA (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={profile.aggregate_percentage || ""}
                  onChange={(e) => setProfile({ ...profile, aggregate_percentage: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="e.g. 78.50"
                  style={{ width: "100%", padding: "0.7rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
                <span style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "0.2rem", display: "block" }}>
                  Minimum 55.0% required for National Overseas Scholarship (NOS-ST).
                </span>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.4rem" }}>
                  Admission Status
                </label>
                <select
                  value={profile.admission_status || "CONFIRMED"}
                  onChange={(e) => setProfile({ ...profile, admission_status: e.target.value })}
                  style={{ width: "100%", padding: "0.7rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", backgroundColor: "#ffffff" }}
                >
                  <option value="CONFIRMED">Confirmed / Enrolled (Regular)</option>
                  <option value="PROVISIONAL">Provisional Offer</option>
                  <option value="AWAITING_RESULT">Awaiting Result / Renewal</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: FAMILY & INCOME DECLARATION                        */}
        {/* ========================================================= */}
        {activeTab === "income" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.25rem" }}>
                Family Particulars &amp; Annual Income Declaration
              </h2>
              <p style={{ color: "#64748b", fontSize: "0.85rem" }}>
                Income criteria determine eligibility under means-tested Ministry of Tribal Affairs schemes.
              </p>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.4rem" }}>
                  Father / Mother / Guardian Name *
                </label>
                <input
                  type="text"
                  value={profile.father_or_guardian_name || ""}
                  onChange={(e) => setProfile({ ...profile, father_or_guardian_name: e.target.value })}
                  placeholder="e.g. Sibu Munda"
                  style={{ width: "100%", padding: "0.7rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.4rem" }}>
                  Parent / Guardian Occupation
                </label>
                <select
                  value={profile.guardian_occupation || ""}
                  onChange={(e) => setProfile({ ...profile, guardian_occupation: e.target.value })}
                  style={{ width: "100%", padding: "0.7rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem", backgroundColor: "#ffffff" }}
                >
                  <option value="">Select Occupation</option>
                  <option value="AGRICULTURE_FARMING">Agriculture / Traditional Farming</option>
                  <option value="DAILY_WAGE_LABOR">Daily Wage Laborer / Artisan</option>
                  <option value="GOVERNMENT_SERVICE">State / Central Government Service</option>
                  <option value="PRIVATE_SERVICE">Private Organization</option>
                  <option value="SELF_EMPLOYED_BUSINESS">Self-Employed / Small Enterprise</option>
                  <option value="OTHER">Other</option>
                </select>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.4rem" }}>
                  Total Annual Family Income (INR) *
                </label>
                <input
                  type="number"
                  value={profile.annual_income !== undefined ? profile.annual_income : ""}
                  onChange={(e) => setProfile({ ...profile, annual_income: e.target.value ? Number(e.target.value) : undefined })}
                  placeholder="e.g. 240000"
                  style={{ width: "100%", padding: "0.7rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
                <span style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "0.2rem", display: "block" }}>
                  Ceilings: NOS-ST (₹8,00,000/yr) &bull; NFST (₹12,00,000/yr) &bull; PMS-ST (₹2,50,000/yr).
                </span>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.4rem" }}>
                  Income Certificate / Ration Card No.
                </label>
                <input
                  type="text"
                  value={profile.income_certificate_no || ""}
                  onChange={(e) => setProfile({ ...profile, income_certificate_no: e.target.value })}
                  placeholder="e.g. INC/JH/2026/04128"
                  style={{ width: "100%", padding: "0.7rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.4rem" }}>
                  Income Issuing Authority
                </label>
                <input
                  type="text"
                  value={profile.income_issuing_authority || ""}
                  onChange={(e) => setProfile({ ...profile, income_issuing_authority: e.target.value })}
                  placeholder="e.g. Circle Officer / Tehsildar"
                  style={{ width: "100%", padding: "0.7rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.4rem" }}>
                  Income Certificate Issue Date
                </label>
                <input
                  type="date"
                  value={profile.income_issue_date || ""}
                  onChange={(e) => setProfile({ ...profile, income_issue_date: e.target.value })}
                  style={{ width: "100%", padding: "0.7rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: DBT BANK ACCOUNT                                   */}
        {/* ========================================================= */}
        {activeTab === "bank" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.25rem" }}>
                Direct Benefit Transfer (DBT) Bank Account
              </h2>
              <p style={{ color: "#64748b", fontSize: "0.85rem" }}>
                All scholarship disbursements are transferred directly via PFMS DBT to the applicant's Aadhaar-seeded active savings bank account.
              </p>
            </div>

            <div style={{ padding: "0.9rem 1.15rem", borderRadius: "8px", backgroundColor: "#f0fdf4", border: "1px solid #bbf7d0", fontSize: "0.82rem", color: "#166534" }}>
              <strong>PFMS Direct Benefit Transfer Notice:</strong> Ensure the bank account is opened in the sole name of the applicant (<strong>{profile.full_name || "Applicant"}</strong>) and seeded with your Aadhaar number. Joint accounts with parents may cause disbursement rejection.
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "1.25rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.4rem" }}>
                  Bank Name *
                </label>
                <input
                  type="text"
                  value={profile.bank_name || ""}
                  onChange={(e) => setProfile({ ...profile, bank_name: e.target.value })}
                  placeholder="e.g. State Bank of India (SBI)"
                  style={{ width: "100%", padding: "0.7rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.4rem" }}>
                  Savings Account Number *
                </label>
                <input
                  type="text"
                  value={profile.bank_account_no || ""}
                  onChange={(e) => setProfile({ ...profile, bank_account_no: e.target.value })}
                  placeholder="e.g. 102938475612"
                  style={{ width: "100%", padding: "0.7rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.4rem" }}>
                  Bank IFSC Code *
                </label>
                <input
                  type="text"
                  value={profile.bank_ifsc || ""}
                  onChange={(e) => setProfile({ ...profile, bank_ifsc: e.target.value.toUpperCase() })}
                  placeholder="e.g. SBIN0001234"
                  style={{ width: "100%", padding: "0.7rem 0.85rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.88rem" }}
                />
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: ASSOCIATED DOCUMENTS REPOSITORY                    */}
        {/* ========================================================= */}
        {activeTab === "documents" && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            <div>
              <h2 style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.25rem" }}>
                Associated Profile Documents Repository
              </h2>
              <p style={{ color: "#64748b", fontSize: "0.85rem" }}>
                Documents uploaded here are securely associated with your verified profile. When applying for any scholarship, these documents accompany your application automatically.
              </p>
            </div>

            {uploadingDocType && (
              <div style={{ padding: "0.85rem 1.25rem", borderRadius: "8px", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e40af", fontSize: "0.85rem", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <Loader2 size={18} className="spin" />
                <span>{uploadFeedback}</span>
              </div>
            )}

            {/* Document Slots Cards */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "1rem" }}>
              {DOCUMENT_SLOTS.map((slot) => {
                const attached = documents.find((d) => d.document_type === slot.type);
                return (
                  <div
                    key={slot.type}
                    style={{
                      padding: "1.25rem",
                      borderRadius: "10px",
                      border: attached ? "1px solid #a7f3d0" : "1px solid #e2e8f0",
                      backgroundColor: attached ? "#f0fdf4" : "#ffffff",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "1rem"
                    }}
                  >
                    <div style={{ flex: 1, minWidth: "260px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.2rem" }}>
                        <span style={{ fontWeight: 800, fontSize: "0.92rem", color: "#0f172a" }}>
                          {slot.title}
                        </span>
                        {attached ? (
                          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#166534", backgroundColor: "#dcfce7", padding: "0.15rem 0.5rem", borderRadius: "999px", display: "inline-flex", alignItems: "center", gap: "0.25rem" }}>
                            <CheckCircle2 size={12} /> {attached.verification_status || "Attached"}
                          </span>
                        ) : slot.required ? (
                          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#b91c1c", backgroundColor: "#fee2e2", padding: "0.15rem 0.5rem", borderRadius: "999px" }}>
                            Required
                          </span>
                        ) : (
                          <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#64748b", backgroundColor: "#f1f5f9", padding: "0.15rem 0.5rem", borderRadius: "999px" }}>
                            Optional
                          </span>
                        )}
                      </div>

                      <div style={{ fontSize: "0.8rem", color: "#64748b", marginBottom: "0.35rem" }}>
                        {slot.desc}
                      </div>

                      {attached ? (
                        <div style={{ fontSize: "0.78rem", color: "#15803d", fontWeight: 600, display: "flex", alignItems: "center", gap: "0.5rem" }}>
                          <span>File: {attached.file_name}</span>
                          <span>&bull;</span>
                          <span>Size: {attached.file_size ? `${Math.round(attached.file_size / 1024)} KB` : "Uploaded"}</span>
                          <span>&bull;</span>
                          <span>Added: {new Date(attached.created_at).toLocaleDateString()}</span>
                        </div>
                      ) : (
                        <div style={{ fontSize: "0.74rem", color: "#d97706" }}>
                          &bull; {slot.hint}
                        </div>
                      )}
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      {attached ? (
                        <>
                          <a
                            href={scholarService.getProfileDocumentFileUrl(attached.id)}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "0.35rem",
                              padding: "0.5rem 0.85rem",
                              borderRadius: "6px",
                              backgroundColor: "#ffffff",
                              color: "#2563eb",
                              fontSize: "0.8rem",
                              fontWeight: 700,
                              textDecoration: "none",
                              border: "1px solid #bfdbfe"
                            }}
                          >
                            <Eye size={14} />
                            <span>Preview</span>
                          </a>
                          <button
                            type="button"
                            onClick={() => triggerUploadModal(slot.type)}
                            style={{
                              padding: "0.5rem 0.85rem",
                              borderRadius: "6px",
                              backgroundColor: "#f8fafc",
                              color: "#475569",
                              fontSize: "0.8rem",
                              fontWeight: 700,
                              border: "1px solid #cbd5e1",
                              cursor: "pointer"
                            }}
                          >
                            Replace
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteDocument(attached.id)}
                            style={{
                              padding: "0.5rem 0.65rem",
                              borderRadius: "6px",
                              backgroundColor: "#fee2e2",
                              color: "#991b1b",
                              border: "none",
                              cursor: "pointer"
                            }}
                            title="Remove Document"
                          >
                            <Trash2 size={15} />
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          onClick={() => triggerUploadModal(slot.type)}
                          disabled={uploadingDocType !== null}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "0.4rem",
                            padding: "0.55rem 1.15rem",
                            borderRadius: "6px",
                            backgroundColor: "#2563eb",
                            color: "#ffffff",
                            fontSize: "0.82rem",
                            fontWeight: 700,
                            border: "none",
                            cursor: uploadingDocType !== null ? "not-allowed" : "pointer"
                          }}
                        >
                          <UploadCloud size={16} />
                          <span>Attach Document</span>
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* BOTTOM SAVE BAR */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "2rem", paddingTop: "1.5rem", borderTop: "1px solid #f1f5f9", flexWrap: "wrap", gap: "1rem" }}>
          <div style={{ fontSize: "0.82rem", color: "#64748b" }}>
            Last updated: {profile.id ? "Synchronized with SCHOLAR-ST Database" : "Unsaved changes"}
          </div>

          <div style={{ display: "flex", gap: "0.75rem" }}>
            <button
              type="submit"
              disabled={saving}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.75rem 2rem",
                borderRadius: "8px",
                backgroundColor: "#2563eb",
                color: "#ffffff",
                fontSize: "0.92rem",
                fontWeight: 700,
                border: "none",
                cursor: saving ? "not-allowed" : "pointer",
                boxShadow: "0 2px 10px rgba(37, 99, 235, 0.28)"
              }}
            >
              {saving ? <Loader2 size={18} className="spin" /> : <Save size={18} />}
              <span>Save &amp; Update Profile</span>
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
