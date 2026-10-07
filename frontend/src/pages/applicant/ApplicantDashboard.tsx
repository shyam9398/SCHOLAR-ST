import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  ShieldCheck,
  Award,
  FilePlus,
  Clock,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  FileText,
  User,
  ExternalLink,
  Sparkles
} from "lucide-react";
import { scholarService } from "../../services/scholarService";
import type { ScholarScheme, ScholarshipApplication, ApplicantProfileData, CrossSchemeIntelligenceData } from "../../types/scholar";

export default function ApplicantDashboard() {
  const [profile, setProfile] = useState<ApplicantProfileData | null>(null);
  const [applications, setApplications] = useState<ScholarshipApplication[]>([]);
  const [schemes, setSchemes] = useState<ScholarScheme[]>([]);
  const [intelligence, setIntelligence] = useState<CrossSchemeIntelligenceData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [prof, apps, schs, intel] = await Promise.all([
          scholarService.getApplicantProfile().catch(() => null),
          scholarService.getApplications().catch(() => []),
          scholarService.getSchemes().catch(() => []),
          scholarService.getCrossSchemeIntelligence().catch(() => null)
        ]);
        setProfile(prof);
        setApplications(apps);
        setSchemes(schs);
        setIntelligence(intel);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const casteVerified = profile?.caste_verified || applications.some(a => a.caste_verified);

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Top Welcome Header */}
      <div style={{ marginBottom: "2rem", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.35rem" }}>
            Welcome, {profile?.full_name || "ST Scholar"}
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.92rem" }}>
            National Scheduled Tribe Scholarship &amp; Fellowship Dashboard &bull; Academic Year 2026-2027
          </p>
        </div>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Link
            to="/applicant/caste-validation"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.6rem 1rem",
              borderRadius: "8px",
              backgroundColor: casteVerified ? "#ecfdf5" : "#fef3c7",
              color: casteVerified ? "#065f46" : "#92400e",
              border: `1px solid ${casteVerified ? "#a7f3d0" : "#fde68a"}`,
              fontSize: "0.84rem",
              fontWeight: 700,
              textDecoration: "none"
            }}
          >
            <ShieldCheck size={18} />
            <span>{casteVerified ? "ST Caste Verified" : "Validate ST Caste Cert"}</span>
          </Link>
          <Link
            to="/applicant/apply"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.45rem",
              padding: "0.6rem 1.15rem",
              borderRadius: "6px",
              backgroundColor: "#0f3b7a",
              color: "#ffffff",
              fontSize: "0.84rem",
              fontWeight: 700,
              textDecoration: "none",
              boxShadow: "0 2px 6px rgba(15, 59, 122, 0.2)"
            }}
          >
            <FilePlus size={18} />
            <span>Apply for Scheme</span>
          </Link>
        </div>
      </div>

      {/* Caste Verification Alert if pending */}
      {!casteVerified && (
        <div
          style={{
            backgroundColor: "#fffbeb",
            border: "1px solid #fde68a",
            borderRadius: "12px",
            padding: "1.25rem 1.5rem",
            marginBottom: "2rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 1px 3px rgba(0,0,0,0.05)"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "8px",
                backgroundColor: "#fef3c7",
                color: "#d97706",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
            >
              <AlertTriangle size={24} />
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.95rem", color: "#92400e" }}>
                Scheduled Tribe Caste Certificate Validation Required
              </div>
              <div style={{ fontSize: "0.82rem", color: "#78350f" }}>
                Upload your statutory ST Certificate for instant AI &amp; OCR verification under Article 342. Required before scheme disbursement.
              </div>
            </div>
          </div>
          <Link
            to="/applicant/caste-validation"
            style={{
              padding: "0.55rem 1.1rem",
              borderRadius: "6px",
              backgroundColor: "#d97706",
              color: "#ffffff",
              fontWeight: 700,
              fontSize: "0.82rem",
              textDecoration: "none"
            }}
          >
            Validate Now &rarr;
          </Link>
        </div>
      )}

      {/* Cross-Scheme Intelligence Spotlight Card */}
      {intelligence && (
        <div
          style={{
            background: "linear-gradient(135deg, #0f3b7a 0%, #1e40af 100%)",
            color: "#ffffff",
            borderRadius: "12px",
            padding: "1.35rem 1.75rem",
            marginBottom: "1.75rem",
            boxShadow: "0 4px 15px rgba(15, 59, 122, 0.2)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexWrap: "wrap",
            gap: "1.25rem"
          }}
        >
          <div style={{ flex: 1, minWidth: "280px" }}>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "0.4rem", padding: "0.2rem 0.6rem", borderRadius: "20px", backgroundColor: "rgba(255,255,255,0.15)", fontSize: "0.72rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase", marginBottom: "0.5rem" }}>
              <Sparkles size={13} color="#fbbf24" />
              <span>Cross-Scheme Intelligence Engine</span>
            </div>
            <h3 style={{ margin: "0 0 0.35rem 0", fontSize: "1.25rem", fontWeight: 800 }}>
              {intelligence.counts.eligible > 0
                ? `${intelligence.counts.eligible} Eligible Scholarship Opportunities Matched`
                : intelligence.counts.potentially_eligible > 0
                ? `${intelligence.counts.potentially_eligible} Schemes Potentially Eligible`
                : "Active Schemes Evaluated Against Your Profile"}
            </h3>
            <p style={{ margin: 0, fontSize: "0.84rem", color: "#c7d2fe", lineHeight: 1.45 }}>
              The dynamic rule engine evaluated all {intelligence.counts.total_active_schemes} active schemes against your verified credentials.
              {intelligence.counts.eligible > 0 ? " You can apply with 1-click verified pre-fill." : " Complete missing document requirements to qualify."}
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "1rem", flexWrap: "wrap" }}>
            <div style={{ display: "flex", gap: "0.6rem" }}>
              <div style={{ textAlign: "center", padding: "0.5rem 0.85rem", borderRadius: "8px", backgroundColor: "rgba(16, 185, 129, 0.2)", border: "1px solid rgba(16, 185, 129, 0.4)" }}>
                <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#34d399" }}>{intelligence.counts.eligible}</div>
                <div style={{ fontSize: "0.68rem", color: "#a7f3d0", fontWeight: 600 }}>Eligible Now</div>
              </div>
              <div style={{ textAlign: "center", padding: "0.5rem 0.85rem", borderRadius: "8px", backgroundColor: "rgba(245, 158, 11, 0.2)", border: "1px solid rgba(245, 158, 11, 0.4)" }}>
                <div style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fbbf24" }}>{intelligence.counts.potentially_eligible}</div>
                <div style={{ fontSize: "0.68rem", color: "#fde68a", fontWeight: 600 }}>Potential</div>
              </div>
            </div>

            <Link
              to="/applicant/cross-scheme-intelligence"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.45rem",
                padding: "0.65rem 1.25rem",
                borderRadius: "8px",
                backgroundColor: "#ffffff",
                color: "#0f3b7a",
                fontWeight: 800,
                fontSize: "0.84rem",
                textDecoration: "none",
                boxShadow: "0 2px 8px rgba(0,0,0,0.15)"
              }}
            >
              <span>Explore Opportunities</span>
              <ArrowRight size={15} />
            </Link>
          </div>
        </div>
      )}

      {/* Profile Completion & Reusable Credentials Banner */}
      {(() => {
        const pct = profile?.completion_stats?.completion_percentage || profile?.profile_completion_percentage || 0;
        const docsCount = profile?.documents?.length || 0;
        return (
          <div
            style={{
              backgroundColor: "#ffffff",
              borderRadius: "12px",
              border: "1px solid #e2e8f0",
              padding: "1.25rem 1.5rem",
              marginBottom: "1.75rem",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              flexWrap: "wrap",
              gap: "1rem",
              boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <div
                style={{
                  width: "52px",
                  height: "52px",
                  borderRadius: "50%",
                  backgroundColor: pct >= 80 ? "#ecfdf5" : pct >= 50 ? "#eff6ff" : "#fffbeb",
                  border: `3px solid ${pct >= 80 ? "#10b981" : pct >= 50 ? "#3b82f6" : "#f59e0b"}`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontWeight: 900,
                  fontSize: "1rem",
                  color: pct >= 80 ? "#065f46" : pct >= 50 ? "#1e40af" : "#92400e"
                }}
              >
                {pct}%
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontWeight: 800, fontSize: "1rem", color: "#0f172a" }}>
                    Applicant Scholar Profile
                  </span>
                  <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#1e40af", backgroundColor: "#eff6ff", border: "1px solid #bfdbfe", padding: "0.15rem 0.5rem", borderRadius: "999px" }}>
                    Zero Redundancy Active
                  </span>
                </div>
                <div style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "0.2rem" }}>
                  {profile?.completion_stats?.readiness_label || "Keep your credentials and documents up to date for instant 1-click scholarship submissions."}
                  {" "}&bull; <strong>{docsCount} document(s)</strong> attached to profile.
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "0.6rem" }}>
              <Link
                to="/applicant/profile"
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "0.4rem",
                  padding: "0.55rem 1.15rem",
                  borderRadius: "8px",
                  backgroundColor: "#0f3b7a",
                  color: "#ffffff",
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  textDecoration: "none"
                }}
              >
                <User size={15} />
                <span>Manage Profile &amp; Documents</span>
              </Link>
            </div>
          </div>
        );
      })()}

      {/* Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem", marginBottom: "2rem" }}>
        <div style={{ backgroundColor: "#ffffff", padding: "1.25rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
          <div style={{ color: "#64748b", fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase" }}>Applications Submitted</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0f172a", marginTop: "0.4rem" }}>{applications.length}</div>
          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.2rem" }}>Active this academic cycle</div>
        </div>

        <div style={{ backgroundColor: "#ffffff", padding: "1.25rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
          <div style={{ color: "#64748b", fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase" }}>Verification Status</div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: casteVerified ? "#059669" : "#d97706", marginTop: "0.4rem" }}>
            {casteVerified ? "ST Certified" : "Unverified"}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.2rem" }}>
            {profile?.tribe_name ? `Tribe: ${profile.tribe_name}` : "Upload certificate to certify"}
          </div>
        </div>

        <div style={{ backgroundColor: "#ffffff", padding: "1.25rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
          <div style={{ color: "#64748b", fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase" }}>Schemes Available</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#0f3b7a", marginTop: "0.4rem" }}>{schemes.length}</div>
          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.2rem" }}>National Overseas, NFST, Top Class</div>
        </div>

        <div style={{ backgroundColor: "#ffffff", padding: "1.25rem", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
          <div style={{ color: "#64748b", fontSize: "0.78rem", fontWeight: 600, textTransform: "uppercase" }}>Approved Awards</div>
          <div style={{ fontSize: "1.8rem", fontWeight: 800, color: "#059669", marginTop: "0.4rem" }}>
            {applications.filter(a => a.status === "APPROVED").length}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.2rem" }}>Ready for disbursement</div>
        </div>
      </div>

      {/* Active Applications Section */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.5rem", marginBottom: "2rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>My Submitted Applications</h3>
          <Link to="/applicant/applications" style={{ color: "#0f3b7a", fontSize: "0.82rem", fontWeight: 600, textDecoration: "none" }}>
            View All Applications &rarr;
          </Link>
        </div>

        {applications.length === 0 ? (
          <div style={{ padding: "2.5rem 1rem", textAlign: "center", color: "#64748b" }}>
            <FileText size={36} style={{ color: "#cbd5e1", margin: "0 auto 0.75rem" }} />
            <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "#1e293b" }}>No scholarship applications submitted yet</div>
            <p style={{ fontSize: "0.84rem", maxWidth: "400px", margin: "0.4rem auto 1.25rem" }}>
              Select an ST scholarship or fellowship scheme, upload your credentials, and run the automated rule pre-check.
            </p>
            <Link
              to="/applicant/apply"
              style={{
                padding: "0.55rem 1.25rem",
                borderRadius: "6px",
                backgroundColor: "#0f3b7a",
                color: "#ffffff",
                fontSize: "0.84rem",
                fontWeight: 600,
                textDecoration: "none"
              }}
            >
              Start New Application
            </Link>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e2e8f0", color: "#64748b", textAlign: "left" }}>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Application No</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Scheme</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Eligibility Score</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Submitted On</th>
                  <th style={{ padding: "0.75rem 0.5rem" }}>Status</th>
                  <th style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((app) => (
                  <tr key={app.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "0.75rem 0.5rem", fontWeight: 700, color: "#0f172a" }}>
                      {app.application_number}
                    </td>
                    <td style={{ padding: "0.75rem 0.5rem" }}>{app.scheme_name}</td>
                    <td style={{ padding: "0.75rem 0.5rem" }}>
                      <span
                        style={{
                          fontWeight: 700,
                          color: app.eligibility_score >= 80 ? "#059669" : "#d97706"
                        }}
                      >
                        {app.eligibility_score}%
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 0.5rem", color: "#64748b" }}>
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "0.75rem 0.5rem" }}>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          padding: "0.25rem 0.6rem",
                          borderRadius: "4px",
                          backgroundColor:
                            app.status === "APPROVED" ? "#ecfdf5" :
                            app.status === "REJECTED" ? "#fef2f2" : "#eff6ff",
                          color:
                            app.status === "APPROVED" ? "#065f46" :
                            app.status === "REJECTED" ? "#991b1b" : "#1e40af"
                        }}
                      >
                        {app.status.replace("_", " ")}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 0.5rem", textAlign: "right" }}>
                      <Link
                        to={`/applicant/applications/${app.id}`}
                        style={{ color: "#0f3b7a", fontWeight: 600, textDecoration: "none" }}
                      >
                        View Dossier &rarr;
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Available Schemes Catalogue Preview */}
      <div>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a" }}>
            Available National ST Schemes
          </h3>
          <Link to="/applicant/schemes" style={{ color: "#0f3b7a", fontSize: "0.82rem", fontWeight: 600, textDecoration: "none" }}>
            Browse All Schemes &rarr;
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>
          {schemes.slice(0, 3).map((s) => (
            <div
              key={s.scheme_code}
              style={{
                backgroundColor: "#ffffff",
                borderRadius: "10px",
                border: "1px solid #e2e8f0",
                padding: "1.25rem",
                display: "flex",
                flexDirection: "column",
                justifyContent: "space-between"
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
                  <span style={{ fontSize: "0.75rem", fontWeight: 700, padding: "0.2rem 0.5rem", borderRadius: "4px", backgroundColor: "#eff6ff", color: "#1d4ed8" }}>
                    {s.scheme_code}
                  </span>
                  <span style={{ fontSize: "0.72rem", color: "#64748b" }}>{s.academic_year}</span>
                </div>
                <h4 style={{ fontSize: "0.98rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.4rem" }}>
                  {s.scheme_name}
                </h4>
                <p style={{ fontSize: "0.82rem", color: "#64748b", lineHeight: 1.4, marginBottom: "0.75rem" }}>
                  {s.description}
                </p>
              </div>
              <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.76rem", color: "#475569" }}>
                  Max Income: <strong>{s.max_family_income ? `Rs. ${s.max_family_income.toLocaleString()}` : "No Limit"}</strong>
                </span>
                <Link
                  to={`/applicant/apply?scheme=${s.scheme_code}`}
                  style={{
                    padding: "0.4rem 0.85rem",
                    borderRadius: "6px",
                    backgroundColor: "#0f3b7a",
                    color: "#ffffff",
                    fontSize: "0.78rem",
                    fontWeight: 600,
                    textDecoration: "none"
                  }}
                >
                  Apply &rarr;
                </Link>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
