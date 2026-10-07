import React, { useEffect, useState } from "react";
import {
  Award,
  PlusCircle,
  CheckCircle2,
  XCircle,
  Edit3,
  Sliders,
  ShieldCheck,
  Cloud,
  FileText,
  AlertCircle,
  Calendar,
  Users,
  DollarSign,
  GraduationCap,
  Clock,
  Sparkles,
  RefreshCw,
  Search,
  Check,
  X,
  ExternalLink
} from "lucide-react";
import { scholarService } from "../../services/scholarService";
import type { ScholarScheme } from "../../types/scholar";

const STANDARD_DOCUMENTS = [
  { id: "CASTE_CERTIFICATE", label: "ST Caste Certificate (Art. 342)" },
  { id: "INCOME_CERTIFICATE", label: "Income Certificate (Revenue Authority)" },
  { id: "MARKSHEET", label: "Qualifying Academic Marksheet / Degree" },
  { id: "ADMISSION_OFFER", label: "Admission / Offer Letter" },
  { id: "BANK_PASSBOOK", label: "Aadhaar-Seeded Bank Passbook" },
  { id: "DOMICILE_CERTIFICATE", label: "Domicile / Native Certificate" },
  { id: "DISABILITY_CERTIFICATE", label: "Disability Certificate (if applicable)" },
  { id: "RESEARCH_PROPOSAL", label: "Approved Research Proposal / Synopsis" },
];

const STUDY_LEVELS = [
  { value: "OVERSEAS", label: "Overseas Master's & Ph.D." },
  { value: "PHD_RESEARCH", label: "Higher Education / Ph.D. Fellowships" },
  { value: "PREMIER_INSTITUTES", label: "Top Class Premier Institutes (IIT/IIM/NIT)" },
  { value: "POST_MATRIC", label: "Post-Matric Degree & Diploma" },
  { value: "PRE_MATRIC", label: "Pre-Matric Secondary (Class 9-10)" },
];

export function AdminSchemes() {
  const [schemes, setSchemes] = useState<ScholarScheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [togglingCode, setTogglingCode] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingScheme, setEditingScheme] = useState<ScholarScheme | null>(null);
  const [saving, setSaving] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const [modalSuccess, setModalSuccess] = useState<string | null>(null);

  // Form Fields
  const [schemeCode, setSchemeCode] = useState("");
  const [schemeName, setSchemeName] = useState("");
  const [ministry, setMinistry] = useState("Ministry of Tribal Affairs");
  const [studyLevel, setStudyLevel] = useState("POST_MATRIC");
  const [description, setDescription] = useState("");
  const [targetCategory, setTargetCategory] = useState("Scheduled Tribe (ST)");
  const [maxIncome, setMaxIncome] = useState<number | "">("");
  const [minMarks, setMinMarks] = useState<number | "">("");
  const [minAge, setMinAge] = useState<number | "">("");
  const [maxAge, setMaxAge] = useState<number | "">("");
  const [slots, setSlots] = useState<number | "">(100);
  const [academicYear, setAcademicYear] = useState("2026-2027");
  const [deadline, setDeadline] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [selectedDocs, setSelectedDocs] = useState<string[]>([
    "CASTE_CERTIFICATE",
    "INCOME_CERTIFICATE",
    "MARKSHEET",
    "ADMISSION_OFFER"
  ]);
  const [customDocInput, setCustomDocInput] = useState("");
  const [conditions, setConditions] = useState<string[]>([]);
  const [newConditionInput, setNewConditionInput] = useState("");

  const loadSchemes = async () => {
    setLoading(true);
    try {
      // Fetch all schemes including inactive for admin
      const data = await scholarService.getSchemes(false);
      setSchemes(data);
    } catch (err) {
      console.error("Error loading schemes:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchemes();
  }, []);

  const openCreateModal = () => {
    setEditingScheme(null);
    setSchemeCode("");
    setSchemeName("");
    setMinistry("Ministry of Tribal Affairs");
    setStudyLevel("POST_MATRIC");
    setDescription("");
    setTargetCategory("Scheduled Tribe (ST)");
    setMaxIncome("");
    setMinMarks("");
    setMinAge("");
    setMaxAge("");
    setSlots(100);
    setAcademicYear("2026-2027");
    setDeadline("2026-11-30");
    setIsActive(true);
    setSelectedDocs(["CASTE_CERTIFICATE", "INCOME_CERTIFICATE", "MARKSHEET", "ADMISSION_OFFER"]);
    setConditions([
      "Must hold verified Scheduled Tribe certificate issued under Art. 342",
      "Regular and full-time enrolled student"
    ]);
    setModalError(null);
    setModalSuccess(null);
    setIsModalOpen(true);
  };

  const openEditModal = (scheme: ScholarScheme) => {
    setEditingScheme(scheme);
    setSchemeCode(scheme.scheme_code);
    setSchemeName(scheme.scheme_name);
    setMinistry(scheme.ministry_or_department || "Ministry of Tribal Affairs");
    setStudyLevel(scheme.study_level || "POST_MATRIC");
    setDescription(scheme.description || "");
    setTargetCategory(scheme.target_category || "Scheduled Tribe (ST)");
    setMaxIncome(scheme.max_family_income !== null && scheme.max_family_income !== undefined ? scheme.max_family_income : "");
    setMinMarks(scheme.min_academic_percentage !== null && scheme.min_academic_percentage !== undefined ? scheme.min_academic_percentage : "");
    setMinAge(scheme.min_age_limit !== null && scheme.min_age_limit !== undefined ? scheme.min_age_limit : "");
    setMaxAge(scheme.max_age_limit !== null && scheme.max_age_limit !== undefined ? scheme.max_age_limit : "");
    setSlots(scheme.slots_available || 100);
    setAcademicYear(scheme.academic_year || "2026-2027");
    setDeadline(scheme.application_deadline || "");
    setIsActive(scheme.is_active);
    setSelectedDocs(
      scheme.required_documents && scheme.required_documents.length > 0
        ? scheme.required_documents
        : ["CASTE_CERTIFICATE", "INCOME_CERTIFICATE", "MARKSHEET", "ADMISSION_OFFER"]
    );
    setConditions(
      scheme.other_conditions && scheme.other_conditions.length > 0
        ? scheme.other_conditions
        : []
    );
    setModalError(null);
    setModalSuccess(null);
    setIsModalOpen(true);
  };

  const handleToggleDoc = (docId: string) => {
    if (selectedDocs.includes(docId)) {
      setSelectedDocs(selectedDocs.filter((d) => d !== docId));
    } else {
      setSelectedDocs([...selectedDocs, docId]);
    }
  };

  const handleAddCustomDoc = () => {
    if (!customDocInput.trim()) return;
    const clean = customDocInput.trim().toUpperCase().replace(/\s+/g, "_");
    if (!selectedDocs.includes(clean)) {
      setSelectedDocs([...selectedDocs, clean]);
    }
    setCustomDocInput("");
  };

  const handleAddCondition = () => {
    if (!newConditionInput.trim()) return;
    setConditions([...conditions, newConditionInput.trim()]);
    setNewConditionInput("");
  };

  const handleRemoveCondition = (index: number) => {
    setConditions(conditions.filter((_, idx) => idx !== index));
  };

  const handleToggleStatus = async (scheme: ScholarScheme) => {
    setTogglingCode(scheme.scheme_code);
    try {
      const updated = await scholarService.toggleSchemeStatus(scheme.scheme_code);
      setSchemes((prev) =>
        prev.map((s) => (s.scheme_code === scheme.scheme_code ? { ...s, is_active: updated.is_active } : s))
      );
    } catch (err: any) {
      alert(err?.message || "Failed to toggle status");
    } finally {
      setTogglingCode(null);
    }
  };

  const handleSaveScheme = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!schemeCode.trim() || !schemeName.trim()) {
      setModalError("Scheme Code and Scheme Name are mandatory.");
      return;
    }

    setSaving(true);
    setModalError(null);

    const payload: Partial<ScholarScheme> = {
      scheme_code: schemeCode.trim().toUpperCase(),
      scheme_name: schemeName.trim(),
      ministry_or_department: ministry.trim(),
      study_level: studyLevel,
      description: description.trim(),
      target_category: targetCategory.trim(),
      max_family_income: maxIncome === "" ? null : Number(maxIncome),
      min_academic_percentage: minMarks === "" ? null : Number(minMarks),
      min_age_limit: minAge === "" ? null : Number(minAge),
      max_age_limit: maxAge === "" ? null : Number(maxAge),
      slots_available: slots === "" ? 100 : Number(slots),
      academic_year: academicYear.trim(),
      application_deadline: deadline || null,
      required_documents: selectedDocs,
      other_conditions: conditions,
      is_active: isActive
    };

    try {
      if (editingScheme) {
        const updated = await scholarService.updateScheme(editingScheme.scheme_code, payload);
        setSchemes((prev) =>
          prev.map((s) => (s.scheme_code === editingScheme.scheme_code ? { ...s, ...updated } : s))
        );
        setModalSuccess("Scheme successfully updated and synced to Supabase Cloud!");
      } else {
        const created = await scholarService.createScheme(payload);
        setSchemes((prev) => [created, ...prev]);
        setModalSuccess("Scheme successfully created and synced to Supabase Cloud!");
      }
      setTimeout(() => {
        setIsModalOpen(false);
      }, 700);
    } catch (err: any) {
      setModalError(err?.message || "Error saving scheme to Supabase/SQLite");
    } finally {
      setSaving(false);
    }
  };

  const filteredSchemes = schemes.filter((s) => {
    if (filterStatus === "ACTIVE" && !s.is_active) return false;
    if (filterStatus === "INACTIVE" && s.is_active) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        s.scheme_code.toLowerCase().includes(q) ||
        s.scheme_name.toLowerCase().includes(q) ||
        (s.description && s.description.toLowerCase().includes(q))
      );
    }
    return true;
  });

  const activeCount = schemes.filter((s) => s.is_active).length;
  const inactiveCount = schemes.length - activeCount;

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto", paddingBottom: "3rem" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: "1.75rem",
          flexWrap: "wrap",
          gap: "1rem"
        }}
      >
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.35rem" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
              Scholarship &amp; Fellowship Scheme Management
            </h1>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.35rem",
                padding: "0.25rem 0.65rem",
                borderRadius: "9999px",
                backgroundColor: "#ecfdf5",
                border: "1px solid #a7f3d0",
                color: "#065f46",
                fontSize: "0.72rem",
                fontWeight: 700
              }}
              title="All schemes are mirrored in Supabase table compliance_rules under category SCHOLAR_ST_SCHEME"
            >
              <Cloud size={13} color="#059669" />
              <span>Supabase Cloud Synced</span>
            </div>
          </div>
          <p style={{ color: "#64748b", fontSize: "0.92rem", margin: 0 }}>
            Configure scheme quotas, category criteria, income ceilings, age brackets, and required document checklists.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            padding: "0.65rem 1.35rem",
            borderRadius: "8px",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            fontSize: "0.88rem",
            fontWeight: 700,
            border: "none",
            cursor: "pointer",
            boxShadow: "0 2px 4px rgba(37,99,235,0.2)"
          }}
        >
          <PlusCircle size={18} />
          <span>Create New Scheme</span>
        </button>
      </div>

      {/* Control Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          padding: "0.85rem 1.25rem",
          marginBottom: "1.75rem",
          flexWrap: "wrap",
          gap: "1rem"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <button
            onClick={() => setFilterStatus("ALL")}
            style={{
              padding: "0.4rem 0.85rem",
              borderRadius: "6px",
              border: "none",
              backgroundColor: filterStatus === "ALL" ? "#0f172a" : "#f1f5f9",
              color: filterStatus === "ALL" ? "#ffffff" : "#475569",
              fontSize: "0.8rem",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            All Schemes ({schemes.length})
          </button>
          <button
            onClick={() => setFilterStatus("ACTIVE")}
            style={{
              padding: "0.4rem 0.85rem",
              borderRadius: "6px",
              border: "none",
              backgroundColor: filterStatus === "ACTIVE" ? "#059669" : "#ecfdf5",
              color: filterStatus === "ACTIVE" ? "#ffffff" : "#047857",
              fontSize: "0.8rem",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            Active ({activeCount})
          </button>
          <button
            onClick={() => setFilterStatus("INACTIVE")}
            style={{
              padding: "0.4rem 0.85rem",
              borderRadius: "6px",
              border: "none",
              backgroundColor: filterStatus === "INACTIVE" ? "#dc2626" : "#fef2f2",
              color: filterStatus === "INACTIVE" ? "#ffffff" : "#b91c1c",
              fontSize: "0.8rem",
              fontWeight: 700,
              cursor: "pointer"
            }}
          >
            Inactive / Draft ({inactiveCount})
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", minWidth: "260px" }}>
          <div style={{ position: "relative", width: "100%" }}>
            <Search size={15} style={{ position: "absolute", left: "10px", top: "10px", color: "#94a3b8" }} />
            <input
              type="text"
              placeholder="Search scheme name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "0.45rem 0.75rem 0.45rem 2rem",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "0.82rem",
                outline: "none"
              }}
            />
          </div>
          <button
            onClick={loadSchemes}
            title="Reload from Cloud"
            style={{
              padding: "0.45rem",
              borderRadius: "6px",
              border: "1px solid #e2e8f0",
              backgroundColor: "#f8fafc",
              color: "#64748b",
              cursor: "pointer"
            }}
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      {/* Schemes Grid */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "4rem 0", color: "#64748b" }}>
          <RefreshCw size={28} className="animate-spin" style={{ margin: "0 auto 1rem auto", color: "#2563eb" }} />
          <div>Synchronizing with Supabase Schemes &amp; Local Cache...</div>
        </div>
      ) : filteredSchemes.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "3.5rem",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            border: "1px dashed #cbd5e1"
          }}
        >
          <Award size={40} style={{ color: "#94a3b8", margin: "0 auto 0.75rem auto" }} />
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.25rem" }}>
            No Schemes Found
          </h3>
          <p style={{ color: "#64748b", fontSize: "0.86rem", marginBottom: "1rem" }}>
            No schemes matched the selected filter criteria.
          </p>
          <button
            onClick={openCreateModal}
            style={{
              padding: "0.5rem 1.25rem",
              borderRadius: "6px",
              backgroundColor: "#2563eb",
              color: "#fff",
              border: "none",
              fontSize: "0.84rem",
              fontWeight: 600,
              cursor: "pointer"
            }}
          >
            Create New Scheme
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: "1.5rem" }}>
          {filteredSchemes.map((scheme) => {
            const isToggling = togglingCode === scheme.scheme_code;
            return (
              <div
                key={scheme.scheme_code}
                style={{
                  backgroundColor: "#ffffff",
                  borderRadius: "14px",
                  border: scheme.is_active ? "1px solid #e2e8f0" : "1px dashed #cbd5e1",
                  opacity: scheme.is_active ? 1 : 0.85,
                  padding: "1.5rem",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.03)",
                  position: "relative"
                }}
              >
                <div>
                  {/* Top Bar: Code, Status & Quick Toggle */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: "0.75rem"
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                      <span
                        style={{
                          fontSize: "0.8rem",
                          fontWeight: 800,
                          padding: "0.22rem 0.65rem",
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
                          fontSize: "0.7rem",
                          fontWeight: 600,
                          color: "#64748b",
                          padding: "0.2rem 0.5rem",
                          borderRadius: "4px",
                          backgroundColor: "#f1f5f9"
                        }}
                      >
                        {scheme.study_level}
                      </span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
                      <button
                        onClick={() => handleToggleStatus(scheme)}
                        disabled={isToggling}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          padding: "0.25rem 0.65rem",
                          borderRadius: "9999px",
                          border: scheme.is_active ? "1px solid #bbf7d0" : "1px solid #fecaca",
                          backgroundColor: scheme.is_active ? "#f0fdf4" : "#fef2f2",
                          color: scheme.is_active ? "#15803d" : "#b91c1c",
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          cursor: isToggling ? "wait" : "pointer",
                          transition: "all 0.2s"
                        }}
                        title={scheme.is_active ? "Click to deactivate (hide from applicants)" : "Click to activate (publish to applicants)"}
                      >
                        {scheme.is_active ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
                        <span>{scheme.is_active ? "ACTIVE" : "INACTIVE"}</span>
                      </button>
                    </div>
                  </div>

                  {/* Title & Ministry */}
                  <h3
                    style={{
                      fontSize: "1.12rem",
                      fontWeight: 700,
                      color: "#0f172a",
                      margin: "0 0 0.25rem 0",
                      lineHeight: 1.3
                    }}
                  >
                    {scheme.scheme_name}
                  </h3>
                  <div style={{ fontSize: "0.74rem", color: "#64748b", marginBottom: "0.75rem", fontWeight: 500 }}>
                    {scheme.ministry_or_department} &bull; Cycle: {scheme.academic_year || "2026-2027"}
                  </div>

                  <p
                    style={{
                      fontSize: "0.82rem",
                      color: "#475569",
                      lineHeight: 1.45,
                      marginBottom: "1rem",
                      display: "-webkit-box",
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                      overflow: "hidden"
                    }}
                  >
                    {scheme.description}
                  </p>

                  {/* Eligibility Baseline Box */}
                  <div
                    style={{
                      backgroundColor: "#f8fafc",
                      borderRadius: "8px",
                      padding: "0.85rem",
                      fontSize: "0.76rem",
                      display: "flex",
                      flexDirection: "column",
                      gap: "0.4rem",
                      border: "1px solid #f1f5f9",
                      marginBottom: "1rem"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#64748b" }}>Target Category:</span>
                      <strong style={{ color: "#0f172a" }}>{scheme.target_category || "Scheduled Tribe (ST)"}</strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#64748b" }}>Income Ceiling:</span>
                      <strong style={{ color: "#0f172a" }}>
                        {scheme.max_family_income ? `₹${scheme.max_family_income.toLocaleString()} / year` : "No limit"}
                      </strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#64748b" }}>Academic Requirement:</span>
                      <strong style={{ color: "#0f172a" }}>
                        {scheme.min_academic_percentage ? `Min ${scheme.min_academic_percentage}% aggregate` : "Admitted"}
                      </strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#64748b" }}>Age Limit:</span>
                      <strong style={{ color: "#0f172a" }}>
                        {scheme.max_age_limit ? `Up to ${scheme.max_age_limit} yrs` : "No upper age limit"}
                      </strong>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#64748b" }}>Available Quota:</span>
                      <strong style={{ color: "#0f172a" }}>{scheme.slots_available || 100} slots</strong>
                    </div>
                  </div>

                  {/* Required Documents Pill Cloud */}
                  <div style={{ marginBottom: "1rem" }}>
                    <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", marginBottom: "0.4rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                      Required Documents ({scheme.required_documents?.length || 0})
                    </div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "0.35rem" }}>
                      {scheme.required_documents && scheme.required_documents.length > 0 ? (
                        scheme.required_documents.map((docKey) => {
                          const std = STANDARD_DOCUMENTS.find((d) => d.id === docKey);
                          const docLabel = std ? std.label.split("(")[0] : docKey.replace(/_/g, " ");
                          return (
                            <span
                              key={docKey}
                              style={{
                                fontSize: "0.7rem",
                                padding: "0.2rem 0.5rem",
                                borderRadius: "4px",
                                backgroundColor: "#f3f4f6",
                                color: "#374151",
                                fontWeight: 500,
                                border: "1px solid #e5e7eb"
                              }}
                            >
                              📄 {docLabel}
                            </span>
                          );
                        })
                      ) : (
                        <span style={{ fontSize: "0.72rem", color: "#94a3b8" }}>Standard document package</span>
                      )}
                    </div>
                  </div>

                  {/* Other Conditions */}
                  {scheme.other_conditions && scheme.other_conditions.length > 0 && (
                    <div style={{ marginBottom: "1rem" }}>
                      <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", marginBottom: "0.3rem", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                        Specific Conditions ({scheme.other_conditions.length})
                      </div>
                      <ul style={{ margin: 0, paddingLeft: "1.1rem", fontSize: "0.73rem", color: "#475569", lineHeight: 1.4 }}>
                        {scheme.other_conditions.slice(0, 2).map((c, idx) => (
                          <li key={idx}>{c}</li>
                        ))}
                        {scheme.other_conditions.length > 2 && (
                          <li style={{ color: "#6b7280" }}>+{scheme.other_conditions.length - 2} more conditions</li>
                        )}
                      </ul>
                    </div>
                  )}
                </div>

                {/* Footer Actions */}
                <div
                  style={{
                    borderTop: "1px solid #f1f5f9",
                    paddingTop: "0.85rem",
                    marginTop: "0.5rem",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <a
                    href="/admin/rules"
                    style={{
                      fontSize: "0.76rem",
                      color: "#7e22ce",
                      fontWeight: 700,
                      textDecoration: "none",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.25rem"
                    }}
                  >
                    <Sliders size={13} />
                    <span>{scheme.rules_count || 3} Dynamic Rules</span>
                  </a>

                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <button
                      onClick={() => openEditModal(scheme)}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: "0.35rem",
                        padding: "0.4rem 0.85rem",
                        borderRadius: "6px",
                        backgroundColor: "#f8fafc",
                        border: "1px solid #cbd5e1",
                        color: "#1e293b",
                        fontSize: "0.78rem",
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      <Edit3 size={13} />
                      <span>Edit Scheme</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREATE / EDIT SCHEME MODAL */}
      {isModalOpen && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            backgroundColor: "rgba(15, 23, 42, 0.65)",
            backdropFilter: "blur(4px)",
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
              borderRadius: "16px",
              width: "100%",
              maxWidth: "760px",
              maxHeight: "90vh",
              overflowY: "auto",
              boxShadow: "0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)",
              border: "1px solid #e2e8f0"
            }}
          >
            {/* Modal Header */}
            <div
              style={{
                padding: "1.25rem 1.75rem",
                borderBottom: "1px solid #e2e8f0",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                position: "sticky",
                top: 0,
                backgroundColor: "#ffffff",
                zIndex: 10
              }}
            >
              <div>
                <h3 style={{ fontSize: "1.25rem", fontWeight: 800, color: "#0f172a", margin: 0 }}>
                  {editingScheme ? `Edit Scheme: ${editingScheme.scheme_code}` : "Create New Scholarship Scheme"}
                </h3>
                <p style={{ fontSize: "0.8rem", color: "#64748b", margin: "0.2rem 0 0 0" }}>
                  Changes are synchronized instantly into Supabase Cloud &amp; Local Verification Engine.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#94a3b8",
                  cursor: "pointer",
                  padding: "0.25rem",
                  borderRadius: "6px"
                }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveScheme} style={{ padding: "1.5rem 1.75rem" }}>
              {modalError && (
                <div
                  style={{
                    backgroundColor: "#fef2f2",
                    border: "1px solid #fecaca",
                    color: "#b91c1c",
                    padding: "0.75rem 1rem",
                    borderRadius: "8px",
                    fontSize: "0.82rem",
                    marginBottom: "1.25rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}
                >
                  <AlertCircle size={16} />
                  <span>{modalError}</span>
                </div>
              )}

              {modalSuccess && (
                <div
                  style={{
                    backgroundColor: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    color: "#15803d",
                    padding: "0.75rem 1rem",
                    borderRadius: "8px",
                    fontSize: "0.82rem",
                    marginBottom: "1.25rem",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.5rem"
                  }}
                >
                  <CheckCircle2 size={16} />
                  <span>{modalSuccess}</span>
                </div>
              )}

              {/* Section 1: Basic Information */}
              <div style={{ marginBottom: "1.5rem" }}>
                <h4 style={{ fontSize: "0.88rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.75rem" }}>
                  1. Scheme Identity &amp; Scope
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "0.85rem", marginBottom: "0.85rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>
                      Scheme Code *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. NOS-ST"
                      required
                      disabled={!!editingScheme}
                      value={schemeCode}
                      onChange={(e) => setSchemeCode(e.target.value.toUpperCase())}
                      style={{
                        width: "100%",
                        padding: "0.55rem 0.75rem",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.85rem",
                        fontWeight: 700,
                        backgroundColor: editingScheme ? "#f1f5f9" : "#ffffff"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>
                      Scheme Full Name *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. National Overseas Scholarship for ST Students"
                      required
                      value={schemeName}
                      onChange={(e) => setSchemeName(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.55rem 0.75rem",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.85rem"
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "0.85rem", marginBottom: "0.85rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>
                      Ministry / Implementing Department
                    </label>
                    <input
                      type="text"
                      value={ministry}
                      onChange={(e) => setMinistry(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.55rem 0.75rem",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.85rem"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>
                      Study Level Category
                    </label>
                    <select
                      value={studyLevel}
                      onChange={(e) => setStudyLevel(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.55rem 0.75rem",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.85rem",
                        backgroundColor: "#ffffff"
                      }}
                    >
                      {STUDY_LEVELS.map((lvl) => (
                        <option key={lvl.value} value={lvl.value}>
                          {lvl.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: "0.85rem" }}>
                  <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>
                    Short Scheme Description &amp; Objectives
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Enter short description explaining eligibility, objective, and beneficiaries..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{
                      width: "100%",
                      padding: "0.55rem 0.75rem",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.85rem",
                      fontFamily: "inherit"
                    }}
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.85rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>
                      Slots Quota
                    </label>
                    <input
                      type="number"
                      placeholder="100"
                      value={slots}
                      onChange={(e) => setSlots(e.target.value ? Number(e.target.value) : "")}
                      style={{
                        width: "100%",
                        padding: "0.55rem 0.75rem",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.85rem"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>
                      Academic Year
                    </label>
                    <input
                      type="text"
                      placeholder="2026-2027"
                      value={academicYear}
                      onChange={(e) => setAcademicYear(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.55rem 0.75rem",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.85rem"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>
                      Application Deadline
                    </label>
                    <input
                      type="date"
                      value={deadline}
                      onChange={(e) => setDeadline(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.55rem 0.75rem",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.85rem"
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Eligibility Criteria */}
              <div style={{ marginBottom: "1.5rem", borderTop: "1px solid #f1f5f9", paddingTop: "1.25rem" }}>
                <h4 style={{ fontSize: "0.88rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.75rem" }}>
                  2. Eligibility Criteria (Category, Income, Academics, Age)
                </h4>

                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "0.85rem", marginBottom: "0.85rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>
                      Target Category Requirement
                    </label>
                    <input
                      type="text"
                      placeholder="Scheduled Tribe (ST) under Art. 342"
                      value={targetCategory}
                      onChange={(e) => setTargetCategory(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.55rem 0.75rem",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.85rem"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>
                      Annual Family Income Limit (₹)
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 800000 (leave blank for none)"
                      value={maxIncome}
                      onChange={(e) => setMaxIncome(e.target.value ? Number(e.target.value) : "")}
                      style={{
                        width: "100%",
                        padding: "0.55rem 0.75rem",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.85rem"
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0.85rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>
                      Min Qualifying Marks (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="e.g. 55.0"
                      value={minMarks}
                      onChange={(e) => setMinMarks(e.target.value ? Number(e.target.value) : "")}
                      style={{
                        width: "100%",
                        padding: "0.55rem 0.75rem",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.85rem"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>
                      Min Age Requirement
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 17"
                      value={minAge}
                      onChange={(e) => setMinAge(e.target.value ? Number(e.target.value) : "")}
                      style={{
                        width: "100%",
                        padding: "0.55rem 0.75rem",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.85rem"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.75rem", fontWeight: 600, color: "#475569", marginBottom: "0.3rem" }}>
                      Max Age Limit
                    </label>
                    <input
                      type="number"
                      placeholder="e.g. 35"
                      value={maxAge}
                      onChange={(e) => setMaxAge(e.target.value ? Number(e.target.value) : "")}
                      style={{
                        width: "100%",
                        padding: "0.55rem 0.75rem",
                        borderRadius: "6px",
                        border: "1px solid #cbd5e1",
                        fontSize: "0.85rem"
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: Required Documents */}
              <div style={{ marginBottom: "1.5rem", borderTop: "1px solid #f1f5f9", paddingTop: "1.25rem" }}>
                <h4 style={{ fontSize: "0.88rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.5rem" }}>
                  3. Required Document Checklist
                </h4>
                <p style={{ fontSize: "0.75rem", color: "#64748b", marginBottom: "0.75rem" }}>
                  Selected documents will be required during applicant submission and validated via the OCR pipeline.
                </p>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  {STANDARD_DOCUMENTS.map((doc) => {
                    const isChecked = selectedDocs.includes(doc.id);
                    return (
                      <div
                        key={doc.id}
                        onClick={() => handleToggleDoc(doc.id)}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "0.5rem",
                          padding: "0.55rem 0.75rem",
                          borderRadius: "6px",
                          border: isChecked ? "1px solid #93c5fd" : "1px solid #e2e8f0",
                          backgroundColor: isChecked ? "#eff6ff" : "#f8fafc",
                          cursor: "pointer",
                          transition: "all 0.15s"
                        }}
                      >
                        <div
                          style={{
                            width: "16px",
                            height: "16px",
                            borderRadius: "4px",
                            border: isChecked ? "none" : "1px solid #cbd5e1",
                            backgroundColor: isChecked ? "#2563eb" : "#ffffff",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#ffffff"
                          }}
                        >
                          {isChecked && <Check size={12} />}
                        </div>
                        <span style={{ fontSize: "0.76rem", fontWeight: isChecked ? 600 : 500, color: isChecked ? "#1e40af" : "#475569" }}>
                          {doc.label}
                        </span>
                      </div>
                    );
                  })}
                </div>

                {/* Custom Document Adder */}
                <div style={{ display: "flex", gap: "0.5rem" }}>
                  <input
                    type="text"
                    placeholder="Add other custom document (e.g. GRE_SCORECARD)..."
                    value={customDocInput}
                    onChange={(e) => setCustomDocInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCustomDoc();
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: "0.45rem 0.75rem",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.78rem"
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomDoc}
                    style={{
                      padding: "0.45rem 0.85rem",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      backgroundColor: "#f8fafc",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    + Add Doc
                  </button>
                </div>
              </div>

              {/* Section 4: Other Conditions */}
              <div style={{ marginBottom: "1.5rem", borderTop: "1px solid #f1f5f9", paddingTop: "1.25rem" }}>
                <h4 style={{ fontSize: "0.88rem", fontWeight: 700, color: "#1e293b", marginBottom: "0.5rem" }}>
                  4. Scheme-Specific Conditions &amp; Prerequisites
                </h4>

                <div style={{ display: "flex", gap: "0.5rem", marginBottom: "0.75rem" }}>
                  <input
                    type="text"
                    placeholder="e.g. Must have unconditional offer letter from top 500 QS ranked university"
                    value={newConditionInput}
                    onChange={(e) => setNewConditionInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddCondition();
                      }
                    }}
                    style={{
                      flex: 1,
                      padding: "0.45rem 0.75rem",
                      borderRadius: "6px",
                      border: "1px solid #cbd5e1",
                      fontSize: "0.78rem"
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddCondition}
                    style={{
                      padding: "0.45rem 0.85rem",
                      borderRadius: "6px",
                      border: "none",
                      backgroundColor: "#2563eb",
                      color: "#ffffff",
                      fontSize: "0.78rem",
                      fontWeight: 600,
                      cursor: "pointer"
                    }}
                  >
                    Add Condition
                  </button>
                </div>

                {conditions.length > 0 && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
                    {conditions.map((cond, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          padding: "0.45rem 0.75rem",
                          borderRadius: "6px",
                          backgroundColor: "#f8fafc",
                          border: "1px solid #e2e8f0",
                          fontSize: "0.76rem"
                        }}
                      >
                        <span style={{ color: "#334155" }}>{cond}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveCondition(idx)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#ef4444",
                            cursor: "pointer",
                            padding: "0.15rem"
                          }}
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Section 5: Activation Status */}
              <div
                style={{
                  marginBottom: "1.5rem",
                  borderTop: "1px solid #f1f5f9",
                  paddingTop: "1.25rem",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between"
                }}
              >
                <div>
                  <div style={{ fontSize: "0.84rem", fontWeight: 700, color: "#1e293b" }}>
                    Scheme Publication Status
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "#64748b" }}>
                    When Active, this scheme is immediately visible on the applicant selection page.
                  </div>
                </div>

                <label style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", cursor: "pointer" }}>
                  <input
                    type="checkbox"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    style={{ width: "18px", height: "18px", accentColor: "#2563eb" }}
                  />
                  <span style={{ fontSize: "0.82rem", fontWeight: 700, color: isActive ? "#059669" : "#dc2626" }}>
                    {isActive ? "ACTIVE (Live)" : "INACTIVE (Hidden)"}
                  </span>
                </label>
              </div>

              {/* Modal Actions */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "0.75rem",
                  borderTop: "1px solid #e2e8f0",
                  paddingTop: "1.25rem"
                }}
              >
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  style={{
                    padding: "0.55rem 1.25rem",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    background: "none",
                    color: "#475569",
                    fontSize: "0.82rem",
                    fontWeight: 600,
                    cursor: "pointer"
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0.45rem",
                    padding: "0.55rem 1.5rem",
                    borderRadius: "6px",
                    border: "none",
                    backgroundColor: "#2563eb",
                    color: "#ffffff",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    cursor: saving ? "wait" : "pointer",
                    boxShadow: "0 2px 4px rgba(37,99,235,0.2)"
                  }}
                >
                  {saving ? (
                    <>
                      <RefreshCw size={14} className="animate-spin" />
                      <span>Saving &amp; Syncing to Cloud...</span>
                    </>
                  ) : (
                    <>
                      <Cloud size={15} />
                      <span>{editingScheme ? "Save & Sync to Supabase" : "Create & Sync to Supabase"}</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
