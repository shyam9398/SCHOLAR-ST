import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import {
  Shield,
  Lock,
  User,
  Mail,
  Phone,
  GraduationCap,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  Loader2,
  CheckCircle2,
  FileText,
  Building,
} from "lucide-react";
import { authService, type RegisterPayload } from "../services/authService";

export default function Register() {
  const navigate = useNavigate();

  // Role: 'applicant' or 'officer'
  const [role, setRole] = useState<"applicant" | "officer">("applicant");

  // Form State
  const [fullName, setFullName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Applicant specific ST details
  const [tribeName, setTribeName] = useState("");
  const [casteCertNo, setCasteCertNo] = useState("");
  const [annualIncome, setAnnualIncome] = useState<string>("");
  const [stateOfDomicile, setStateOfDomicile] = useState("Jharkhand");
  const [district, setDistrict] = useState("");
  const [academicLevel, setAcademicLevel] = useState("Undergraduate");

  // Officer specific details
  const [designation, setDesignation] = useState("Verification Officer");
  const [department, setDepartment] = useState("Tribal Welfare Directorate");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation
    if (!fullName.trim()) {
      setError("Please enter your full legal name.");
      return;
    }
    if (!username.trim() || username.trim().length < 3) {
      setError("Username must be at least 3 characters long.");
      return;
    }
    if (!email.trim() || !email.includes("@")) {
      setError("Please provide a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-enter.");
      return;
    }

    setLoading(true);

    const payload: RegisterPayload = {
      full_name: fullName.trim(),
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      password: password,
      role: role,
      phone: phone.trim() || undefined,
    };

    if (role === "applicant") {
      payload.tribe_name = tribeName.trim() || undefined;
      payload.caste_certificate_no = casteCertNo.trim() || undefined;
      payload.annual_income = annualIncome ? parseFloat(annualIncome) : undefined;
      payload.state_of_domicile = stateOfDomicile || undefined;
      payload.district = district.trim() || undefined;
      payload.academic_level = academicLevel || undefined;
    } else {
      payload.designation = designation.trim() || "Verification Officer";
      payload.department = department.trim() || "Tribal Welfare Directorate";
    }

    try {
      const { profile } = await authService.register(payload);
      setSuccess(true);

      setTimeout(() => {
        const dest = authService.getDashboardPath(profile.role);
        navigate(dest, { replace: true });
      }, 1200);
    } catch (err: any) {
      setError(err?.message || "Failed to complete registration. Please check your inputs.");
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#f8fafc",
        color: "#0f172a",
        fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
      }}
    >
      {/* Official Government Top Bar */}
      <div
        style={{
          backgroundColor: "#07152f",
          borderBottom: "1px solid #1e293b",
          padding: "0.3rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.72rem",
          color: "#94a3b8"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <span style={{ color: "#ffffff", fontWeight: 700 }}>भारत सरकार / GOVERNMENT OF INDIA</span>
          <span>&bull;</span>
          <span>MINISTRY OF TRIBAL AFFAIRS</span>
        </div>
        <Link to="/" style={{ color: "#93c5fd", textDecoration: "none" }}>
          &larr; Return to National Portal
        </Link>
      </div>

      {/* Main Header */}
      <header
        style={{
          padding: "0.85rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #e2e8f0",
          backgroundColor: "#ffffff",
        }}
      >
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              backgroundColor: "#0f3b7a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
            }}
          >
            <Shield size={20} />
          </div>
          <div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f3b7a" }}>
              SCHOLAR-ST
            </div>
            <div style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: 600 }}>
              National ST Scholarships Portal
            </div>
          </div>
        </Link>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem", fontSize: "0.85rem" }}>
          <span style={{ color: "#64748b" }}>Already have an account?</span>
          <Link
            to="/login"
            style={{
              color: "#0f3b7a",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Sign In &rarr;
          </Link>
        </div>
      </header>

      {/* Main Form Container */}
      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2.5rem 1rem",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "600px",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            padding: "2.25rem",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
          }}
        >
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "10px",
                backgroundColor: "#eff6ff",
                color: "#0f3b7a",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "0.75rem",
              }}
            >
              {role === "applicant" ? <GraduationCap size={24} /> : <Shield size={24} />}
            </div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.35rem" }}>
              Register for SCHOLAR-ST
            </h1>
            <p style={{ color: "#64748b", fontSize: "0.88rem" }}>
              {role === "applicant"
                ? "Create your Scheduled Tribe Scholar account for direct benefit transfer and scheme applications"
                : "Create an official Verification Officer adjudication account"}
            </p>
          </div>

          {/* Role Toggle Selector */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "0.5rem",
              padding: "0.35rem",
              backgroundColor: "#f1f5f9",
              borderRadius: "8px",
              marginBottom: "1.75rem",
            }}
          >
            <button
              type="button"
              onClick={() => setRole("applicant")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.6rem 1rem",
                borderRadius: "6px",
                border: "none",
                backgroundColor: role === "applicant" ? "#ffffff" : "transparent",
                color: role === "applicant" ? "#0f3b7a" : "#64748b",
                fontWeight: role === "applicant" ? 700 : 500,
                fontSize: "0.84rem",
                cursor: "pointer",
                boxShadow: role === "applicant" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <GraduationCap size={16} />
              <span>ST Scholar (Applicant)</span>
            </button>
            <button
              type="button"
              onClick={() => setRole("officer")}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                padding: "0.6rem 1rem",
                borderRadius: "6px",
                border: "none",
                backgroundColor: role === "officer" ? "#ffffff" : "transparent",
                color: role === "officer" ? "#0f3b7a" : "#64748b",
                fontWeight: role === "officer" ? 700 : 500,
                fontSize: "0.84rem",
                cursor: "pointer",
                boxShadow: role === "officer" ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                transition: "all 0.15s ease",
              }}
            >
              <Shield size={16} />
              <span>Verification Officer</span>
            </button>
          </div>

          {/* Feedback Messages */}
          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#991b1b",
                fontSize: "0.84rem",
                marginBottom: "1.25rem",
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                backgroundColor: "#ecfdf5",
                border: "1px solid #a7f3d0",
                color: "#065f46",
                fontSize: "0.84rem",
                marginBottom: "1.25rem",
              }}
            >
              <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
              <span>Account registered successfully! Redirecting to dashboard...</span>
            </div>
          )}

          {/* Registration Form */}
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.1rem" }}>
            {/* Full Name */}
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                Full Legal Name {role === "applicant" && "(As recorded in Caste Certificate)"} *
              </label>
              <div style={{ position: "relative" }}>
                <User size={16} style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="e.g. Ramesh Kumar Oraon"
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.85rem 0.65rem 2.4rem",
                    backgroundColor: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    color: "#0f172a",
                    fontSize: "0.88rem",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Username & Email Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                  Username *
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. ramesh.oraon"
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.85rem",
                    backgroundColor: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    color: "#0f172a",
                    fontSize: "0.88rem",
                    outline: "none",
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                  Email Address *
                </label>
                <div style={{ position: "relative" }}>
                  <Mail size={16} style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. scholar@example.gov.in"
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem 0.65rem 2.4rem",
                      backgroundColor: "#ffffff",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      color: "#0f172a",
                      fontSize: "0.88rem",
                      outline: "none",
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Phone */}
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                Mobile Number (Aadhaar linked recommended)
              </label>
              <div style={{ position: "relative" }}>
                <Phone size={16} style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 9876543210"
                  style={{
                    width: "100%",
                    padding: "0.65rem 0.85rem 0.65rem 2.4rem",
                    backgroundColor: "#ffffff",
                    border: "1px solid #cbd5e1",
                    borderRadius: "8px",
                    color: "#0f172a",
                    fontSize: "0.88rem",
                    outline: "none",
                  }}
                />
              </div>
            </div>

            {/* Applicant Specific Details */}
            {role === "applicant" && (
              <div
                style={{
                  padding: "1rem",
                  backgroundColor: "#f8fafc",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.85rem",
                }}
              >
                <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#0f3b7a", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Scheduled Tribe Credentials (Article 342)
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#475569", marginBottom: "0.25rem" }}>
                      Recognized ST Community / Tribe
                    </label>
                    <input
                      type="text"
                      value={tribeName}
                      onChange={(e) => setTribeName(e.target.value)}
                      placeholder="e.g. Santhal, Gond, Bhil, Oraon"
                      style={{
                        width: "100%",
                        padding: "0.55rem 0.75rem",
                        backgroundColor: "#ffffff",
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px",
                        color: "#0f172a",
                        fontSize: "0.82rem",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#475569", marginBottom: "0.25rem" }}>
                      ST Caste Certificate Number
                    </label>
                    <input
                      type="text"
                      value={casteCertNo}
                      onChange={(e) => setCasteCertNo(e.target.value)}
                      placeholder="e.g. ST/JH/2024/0981"
                      style={{
                        width: "100%",
                        padding: "0.55rem 0.75rem",
                        backgroundColor: "#ffffff",
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px",
                        color: "#0f172a",
                        fontSize: "0.82rem",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#475569", marginBottom: "0.25rem" }}>
                      Annual Family Income (₹ INR)
                    </label>
                    <input
                      type="number"
                      value={annualIncome}
                      onChange={(e) => setAnnualIncome(e.target.value)}
                      placeholder="e.g. 240000"
                      style={{
                        width: "100%",
                        padding: "0.55rem 0.75rem",
                        backgroundColor: "#ffffff",
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px",
                        color: "#0f172a",
                        fontSize: "0.82rem",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#475569", marginBottom: "0.25rem" }}>
                      Current Academic Level
                    </label>
                    <select
                      value={academicLevel}
                      onChange={(e) => setAcademicLevel(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "0.55rem 0.75rem",
                        backgroundColor: "#ffffff",
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px",
                        color: "#0f172a",
                        fontSize: "0.82rem",
                        outline: "none",
                      }}
                    >
                      <option value="Pre-Matric">Pre-Matric (Class IX - X)</option>
                      <option value="Post-Matric">Post-Matric (Class XI - XII)</option>
                      <option value="Undergraduate">Undergraduate (B.A, B.Sc, B.Tech)</option>
                      <option value="Postgraduate">Postgraduate (M.A, M.Sc, M.Tech)</option>
                      <option value="M.Phil / Ph.D.">M.Phil / Ph.D. Research</option>
                      <option value="Premier Institute">Top Class Premier Institute</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Officer Specific Details */}
            {role === "officer" && (
              <div
                style={{
                  padding: "1rem",
                  backgroundColor: "#f8fafc",
                  borderRadius: "8px",
                  border: "1px solid #e2e8f0",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.85rem",
                }}
              >
                <div style={{ fontSize: "0.78rem", fontWeight: 800, color: "#0f3b7a", textTransform: "uppercase", letterSpacing: "0.04em" }}>
                  Officer Directorate Authorization
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem" }}>
                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#475569", marginBottom: "0.25rem" }}>
                      Official Designation
                    </label>
                    <input
                      type="text"
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      placeholder="e.g. Verification Officer Grade-I"
                      style={{
                        width: "100%",
                        padding: "0.55rem 0.75rem",
                        backgroundColor: "#ffffff",
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px",
                        color: "#0f172a",
                        fontSize: "0.82rem",
                        outline: "none",
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontSize: "0.78rem", fontWeight: 600, color: "#475569", marginBottom: "0.25rem" }}>
                      Department / Directorate
                    </label>
                    <input
                      type="text"
                      value={department}
                      onChange={(e) => setDepartment(e.target.value)}
                      placeholder="e.g. Tribal Welfare Directorate"
                      style={{
                        width: "100%",
                        padding: "0.55rem 0.75rem",
                        backgroundColor: "#ffffff",
                        border: "1px solid #cbd5e1",
                        borderRadius: "6px",
                        color: "#0f172a",
                        fontSize: "0.82rem",
                        outline: "none",
                      }}
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Password & Confirm Password */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.85rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                  Security Password *
                </label>
                <div style={{ position: "relative" }}>
                  <Lock size={16} style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min. 8 characters"
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem 0.65rem 2.4rem",
                      backgroundColor: "#ffffff",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      color: "#0f172a",
                      fontSize: "0.88rem",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 600, color: "#334155", marginBottom: "0.35rem" }}>
                  Confirm Password *
                </label>
                <div style={{ position: "relative" }}>
                  <Lock size={16} style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter password"
                    style={{
                      width: "100%",
                      padding: "0.65rem 2.4rem 0.65rem 2.4rem",
                      backgroundColor: "#ffffff",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      color: "#0f172a",
                      fontSize: "0.88rem",
                      outline: "none",
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{
                      position: "absolute",
                      right: "0.75rem",
                      top: "50%",
                      transform: "translateY(-50%)",
                      background: "none",
                      border: "none",
                      color: "#94a3b8",
                      cursor: "pointer",
                      padding: 0,
                    }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading || success}
              style={{
                width: "100%",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#0f3b7a",
                color: "#ffffff",
                fontSize: "0.92rem",
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                cursor: loading || success ? "not-allowed" : "pointer",
                marginTop: "0.5rem",
                boxShadow: "0 2px 6px rgba(15, 59, 122, 0.25)",
                transition: "all 0.15s ease",
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="spin" />
                  <span>Registering Profile...</span>
                </>
              ) : success ? (
                <>
                  <CheckCircle2 size={18} />
                  <span>Registration Complete!</span>
                </>
              ) : (
                <>
                  <span>Complete Registration</span>
                  <ArrowRight size={18} />
                </>
              )}
            </button>
          </form>

          {/* Statutory Footer Notice */}
          <div
            style={{
              marginTop: "1.75rem",
              paddingTop: "1.25rem",
              borderTop: "1px solid #f1f5f9",
              textAlign: "center",
              fontSize: "0.75rem",
              color: "#64748b",
              lineHeight: 1.5,
            }}
          >
            By registering, you declare that all submitted personal, educational, and community caste credentials are authentic under the provisions of the Scheduled Castes and Scheduled Tribes (Prevention of Atrocities) Act and Ministry of Tribal Affairs guidelines.
          </div>
        </div>
      </main>

      {/* Official MoTA Footer */}
      <footer
        style={{
          padding: "1rem 2rem",
          borderTop: "1px solid #e2e8f0",
          backgroundColor: "#ffffff",
          textAlign: "center",
          fontSize: "0.75rem",
          color: "#64748b",
        }}
      >
        SCHOLAR-ST &bull; Ministry of Tribal Affairs, Government of India &bull; National Scheduled Tribe Scholarship &amp; Fellowship Adjudication Platform
      </footer>
    </div>
  );
}
