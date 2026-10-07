import { Link } from "react-router-dom";
import {
  Shield,
  GraduationCap,
  Award,
  FileCheck2,
  Sliders,
  CheckCircle2,
  ArrowRight,
  BookOpen,
  Users,
  Building2,
  Lock,
  ChevronRight,
  Check,
  FileText
} from "lucide-react";

export function LandingPage() {
  const schemes = [
    {
      code: "NOS-ST",
      name: "National Overseas Scholarship for ST Candidates",
      level: "Master's & Ph.D. in Accredited Foreign Universities",
      income: "Up to ₹8,00,000 / annum",
      marks: "Min. 55% Aggregate",
      deadline: "30 Nov 2026"
    },
    {
      code: "NFST",
      name: "National Fellowship for Higher Education of ST Students",
      level: "Regular Full-Time M.Phil. & Ph.D. in Indian Universities",
      income: "Up to ₹12,00,000 / annum",
      marks: "Min. 55% Post-Graduation",
      deadline: "15 Dec 2026"
    },
    {
      code: "TOPCLASS-ST",
      name: "Top Class Education Scheme for ST Students",
      level: "Notified Premier Institutes (IIT, IIM, AIIMS, NIT, NLUs)",
      income: "Up to ₹6,00,000 / annum",
      marks: "Class XII Merit Confirmed",
      deadline: "31 Oct 2026"
    },
    {
      code: "PMS-ST",
      name: "Post-Matric Scholarship for Scheduled Tribe Students",
      level: "Post-Secondary College & University Degree Programmes",
      income: "Up to ₹2,50,000 / annum",
      marks: "Min. 50% Aggregate",
      deadline: "31 Dec 2026"
    },
    {
      code: "PREMATRIC-ST",
      name: "Pre-Matric Scholarship for ST Students (Class IX & X)",
      level: "Secondary School Classes 9 & 10 Day Scholars & Hostellers",
      income: "Up to ₹2,50,000 / annum",
      marks: "Preceding Annual School Exam",
      deadline: "15 Nov 2026"
    }
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#ffffff", color: "#0f172a", fontFamily: "var(--font-sans)" }}>
      {/* Official Government Top Ribbon */}
      <div
        style={{
          backgroundColor: "#07152f",
          borderBottom: "1px solid #1e293b",
          padding: "0.35rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.72rem",
          color: "#94a3b8"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flexWrap: "wrap" }}>
          <span style={{ color: "#ffffff", fontWeight: 700 }}>भारत सरकार / GOVERNMENT OF INDIA</span>
          <span>&bull;</span>
          <span>जनजातीय कार्य मंत्रालय / MINISTRY OF TRIBAL AFFAIRS</span>
          <span>&bull;</span>
          <span style={{ color: "#93c5fd" }}>National Scholarship &amp; Fellowship Adjudication Platform</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1.5rem" }}>
          <span style={{ color: "#38bdf8" }}>Official Statutory Verification Portal</span>
          <Link to="/login" style={{ color: "#fbbf24", textDecoration: "none", fontWeight: 700 }}>
            Officer &amp; Admin Sign In &rarr;
          </Link>
        </div>
      </div>

      {/* Main Navigation Bar */}
      <nav
        style={{
          backgroundColor: "#ffffff",
          borderBottom: "1px solid #e2e8f0",
          padding: "0.85rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          position: "sticky",
          top: 0,
          zIndex: 50,
          boxShadow: "0 1px 3px rgba(15, 23, 42, 0.04)"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <div
            style={{
              width: "44px",
              height: "44px",
              borderRadius: "8px",
              backgroundColor: "#0f3b7a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
              boxShadow: "0 2px 8px rgba(15, 59, 122, 0.25)"
            }}
          >
            <Shield size={26} />
          </div>
          <div>
            <div style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f3b7a", letterSpacing: "-0.02em" }}>
              SCHOLAR<span style={{ color: "#b45309" }}>-ST</span>
            </div>
            <div style={{ fontSize: "0.75rem", color: "#64748b", fontWeight: 500 }}>
              National ST Scholarship &amp; Fellowship Management System
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1.25rem" }}>
          <Link
            to="/applicant/schemes"
            style={{ color: "#334155", textDecoration: "none", fontSize: "0.86rem", fontWeight: 600 }}
          >
            Schemes
          </Link>
          <Link
            to="/applicant"
            style={{ color: "#334155", textDecoration: "none", fontSize: "0.86rem", fontWeight: 600 }}
          >
            Applicant Portal
          </Link>
          <Link
            to="/officer"
            style={{ color: "#334155", textDecoration: "none", fontSize: "0.86rem", fontWeight: 600 }}
          >
            Officer Workbench
          </Link>
          <Link
            to="/admin"
            style={{ color: "#334155", textDecoration: "none", fontSize: "0.86rem", fontWeight: 600 }}
          >
            Administration
          </Link>
          <Link
            to="/login"
            style={{
              backgroundColor: "#0f3b7a",
              color: "#ffffff",
              padding: "0.55rem 1.25rem",
              borderRadius: "6px",
              fontSize: "0.84rem",
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 2px 4px rgba(15, 59, 122, 0.2)"
            }}
          >
            Sign In
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section
        style={{
          backgroundColor: "#f8fafc",
          borderBottom: "1px solid #e2e8f0",
          padding: "4.5rem 2rem",
          display: "flex",
          justifyContent: "center"
        }}
      >
        <div style={{ maxWidth: "1100px", width: "100%", textAlign: "center" }}>
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "0.5rem",
              backgroundColor: "#eff6ff",
              border: "1px solid #bfdbfe",
              color: "#0f3b7a",
              padding: "0.35rem 0.85rem",
              borderRadius: "9999px",
              fontSize: "0.78rem",
              fontWeight: 700,
              marginBottom: "1.5rem"
            }}
          >
            <Shield size={14} />
            <span>Ministry of Tribal Affairs &bull; Higher Education &amp; Fellowship Platform</span>
          </div>

          <h1
            style={{
              fontSize: "2.75rem",
              fontWeight: 900,
              color: "#0f3b7a",
              lineHeight: 1.2,
              letterSpacing: "-0.03em",
              marginBottom: "1.25rem"
            }}
          >
            Empowering Scheduled Tribe Scholars with Transparent, Evidence-Based Adjudication
          </h1>

          <p
            style={{
              fontSize: "1.1rem",
              color: "#475569",
              maxWidth: "820px",
              margin: "0 auto 2.25rem auto",
              lineHeight: 1.6
            }}
          >
            SCHOLAR-ST is the official portal for merit and means scholarships, overseas doctoral funding,
            and research fellowships. Verified against Article 342 statutory criteria with zero guesswork.
          </p>

          <div style={{ display: "flex", justifyContent: "center", gap: "1rem", flexWrap: "wrap" }}>
            <Link
              to="/applicant/schemes"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                backgroundColor: "#0f3b7a",
                color: "#ffffff",
                padding: "0.75rem 1.75rem",
                borderRadius: "8px",
                fontSize: "0.95rem",
                fontWeight: 700,
                textDecoration: "none",
                boxShadow: "0 4px 10px rgba(15, 59, 122, 0.25)"
              }}
            >
              <span>Explore Active Schemes</span>
              <ArrowRight size={17} />
            </Link>

            <Link
              to="/login"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                backgroundColor: "#ffffff",
                color: "#0f3b7a",
                padding: "0.75rem 1.75rem",
                borderRadius: "8px",
                fontSize: "0.95rem",
                fontWeight: 700,
                border: "1px solid #cbd5e1",
                textDecoration: "none",
                boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
              }}
            >
              <span>Officer &amp; Admin Login</span>
            </Link>
          </div>

          {/* Quick Metrics Bar */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(4, 1fr)",
              gap: "1.25rem",
              marginTop: "3.5rem",
              backgroundColor: "#ffffff",
              padding: "1.75rem",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              boxShadow: "0 4px 12px rgba(15, 23, 42, 0.03)"
            }}
          >
            <div>
              <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#0f3b7a" }}>5 Active</div>
              <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>National ST Schemes</div>
            </div>
            <div>
              <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#0f3b7a" }}>100% Verified</div>
              <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>Article 342 Tribal Validation</div>
            </div>
            <div>
              <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#0f3b7a" }}>9 States</div>
              <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>Transparent Workflow</div>
            </div>
            <div>
              <div style={{ fontSize: "1.85rem", fontWeight: 800, color: "#0f3b7a" }}>Direct Benefit</div>
              <div style={{ fontSize: "0.78rem", color: "#64748b", fontWeight: 600 }}>Aadhaar-Linked PFMS/DBT</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured National Schemes Section */}
      <section style={{ padding: "4.5rem 2rem", maxWidth: "1150px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <span
            style={{
              backgroundColor: "#eff6ff",
              color: "#0f3b7a",
              fontSize: "0.75rem",
              fontWeight: 800,
              padding: "0.2rem 0.65rem",
              borderRadius: "4px",
              border: "1px solid #bfdbfe",
              textTransform: "uppercase"
            }}
          >
            Statutory Schemes
          </span>
          <h2 style={{ fontSize: "2rem", fontWeight: 800, color: "#0f3b7a", marginTop: "0.5rem" }}>
            Notified Scholarship &amp; Fellowship Programmes
          </h2>
          <p style={{ fontSize: "0.95rem", color: "#64748b", maxWidth: "700px", margin: "0.5rem auto 0 auto" }}>
            All eligibility rules are statutory and stored dynamically with evidence-based verification
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.5rem" }}>
          {schemes.map((s) => (
            <div
              key={s.code}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "12px",
                border: "1px solid #e2e8f0",
                padding: "1.75rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between",
                boxShadow: "0 2px 6px rgba(0,0,0,0.02)",
                transition: "all 0.2s ease"
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
                  <span
                    style={{
                      fontFamily: "monospace",
                      fontWeight: 800,
                      fontSize: "0.85rem",
                      color: "#0f3b7a",
                      backgroundColor: "#eff6ff",
                      padding: "0.2rem 0.55rem",
                      borderRadius: "6px"
                    }}
                  >
                    {s.code}
                  </span>
                  <span style={{ fontSize: "0.75rem", color: "#16a34a", fontWeight: 700 }}>
                    &bull; Active Session 2026-27
                  </span>
                </div>

                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.6rem" }}>
                  {s.name}
                </h3>

                <p style={{ fontSize: "0.82rem", color: "#475569", lineHeight: 1.5, marginBottom: "1rem" }}>
                  {s.level}
                </p>

                <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "0.85rem", display: "flex", flexDirection: "column", gap: "0.4rem", fontSize: "0.78rem", color: "#64748b" }}>
                  <div>
                    <strong>Income Ceiling:</strong> {s.income}
                  </div>
                  <div>
                    <strong>Academic Requirement:</strong> {s.marks}
                  </div>
                  <div>
                    <strong>Application Deadline:</strong> {s.deadline}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: "1.5rem" }}>
                <Link
                  to="/applicant/apply"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "0.4rem",
                    width: "100%",
                    padding: "0.6rem",
                    borderRadius: "6px",
                    backgroundColor: "#0f3b7a",
                    color: "#ffffff",
                    fontSize: "0.82rem",
                    fontWeight: 700,
                    textDecoration: "none"
                  }}
                >
                  <span>Apply Online</span>
                  <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Role Portals Section */}
      <section style={{ backgroundColor: "#f8fafc", borderTop: "1px solid #e2e8f0", padding: "4rem 2rem" }}>
        <div style={{ maxWidth: "1100px", margin: "0 auto" }}>
          <div style={{ textAlign: "center", marginBottom: "2.5rem" }}>
            <h2 style={{ fontSize: "1.85rem", fontWeight: 800, color: "#0f3b7a" }}>
              Dedicated Role Access Portals
            </h2>
            <p style={{ fontSize: "0.9rem", color: "#64748b" }}>
              Role-specific workflows designed for Scheduled Tribe students, Verification Officers, and Administrators
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1.5rem" }}>
            {/* Applicant Card */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                padding: "1.75rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
            >
              <div>
                <div style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: "#eff6ff", color: "#0f3b7a", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                  <GraduationCap size={22} />
                </div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>
                  Applicant Portal
                </h3>
                <p style={{ fontSize: "0.82rem", color: "#64748b", lineHeight: 1.5 }}>
                  Build verified profile, test eligibility across active schemes, upload certificates, and track application lifecycle with full deficiency resolution.
                </p>
              </div>
              <Link
                to="/applicant"
                style={{ marginTop: "1.5rem", display: "inline-flex", alignItems: "center", gap: "0.3rem", color: "#0f3b7a", fontWeight: 700, fontSize: "0.84rem", textDecoration: "none" }}
              >
                <span>Enter Applicant Portal</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            {/* Officer Card */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                padding: "1.75rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
            >
              <div>
                <div style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: "#f0fdf4", color: "#15803d", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                  <FileCheck2 size={22} />
                </div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>
                  Officer Review Workbench
                </h3>
                <p style={{ fontSize: "0.82rem", color: "#64748b", lineHeight: 1.5 }}>
                  Review submitted dossiers, inspect AI certificate verification and OCR evidence, flag actionable deficiencies, or approve statutory grants.
                </p>
              </div>
              <Link
                to="/officer"
                style={{ marginTop: "1.5rem", display: "inline-flex", alignItems: "center", gap: "0.3rem", color: "#15803d", fontWeight: 700, fontSize: "0.84rem", textDecoration: "none" }}
              >
                <span>Enter Officer Workbench</span>
                <ChevronRight size={14} />
              </Link>
            </div>

            {/* Admin Card */}
            <div
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                padding: "1.75rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
            >
              <div>
                <div style={{ width: "40px", height: "40px", borderRadius: "8px", backgroundColor: "#eff6ff", color: "#0f3b7a", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1rem" }}>
                  <Sliders size={22} />
                </div>
                <h3 style={{ fontSize: "1.15rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.5rem" }}>
                  Administrative Console
                </h3>
                <p style={{ fontSize: "0.82rem", color: "#64748b", lineHeight: 1.5 }}>
                  Configure dynamic scheme rules, run pre-activation Rule Impact Analysis, manage officer assignments, and audit tamper-proof rule history.
                </p>
              </div>
              <Link
                to="/admin"
                style={{ marginTop: "1.5rem", display: "inline-flex", alignItems: "center", gap: "0.3rem", color: "#0f3b7a", fontWeight: 700, fontSize: "0.84rem", textDecoration: "none" }}
              >
                <span>Enter Admin Console</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Official Government Footer */}
      <footer
        style={{
          backgroundColor: "#07152f",
          color: "#94a3b8",
          padding: "2.5rem 2rem",
          fontSize: "0.8rem",
          borderTop: "1px solid #1e293b"
        }}
      >
        <div
          style={{
            maxWidth: "1100px",
            margin: "0 auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1.5rem"
          }}
        >
          <div>
            <div style={{ color: "#ffffff", fontWeight: 800, fontSize: "1rem", marginBottom: "0.25rem" }}>
              SCHOLAR-ST &bull; Ministry of Tribal Affairs
            </div>
            <div>Government of India &bull; Shastri Bhawan, New Delhi - 110001</div>
          </div>

          <div style={{ display: "flex", gap: "1.5rem" }}>
            <Link to="/applicant/schemes" style={{ color: "#cbd5e1", textDecoration: "none" }}>
              Scheme Guidelines
            </Link>
            <Link to="/login" style={{ color: "#cbd5e1", textDecoration: "none" }}>
              Officer Sign In
            </Link>
            <span style={{ color: "#64748b" }}>&copy; 2026 Ministry of Tribal Affairs</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
