import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileText, ArrowRight, Download, PlusCircle, Search } from "lucide-react";
import { scholarService } from "../../services/scholarService";
import type { ScholarshipApplication } from "../../types/scholar";

export default function ApplicantApplicationsPage() {
  const [applications, setApplications] = useState<ScholarshipApplication[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    scholarService.getApplications().then((data) => {
      setApplications(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = applications.filter((a) =>
    a.application_number.toLowerCase().includes(search.toLowerCase()) ||
    a.scheme_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: "1150px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.35rem" }}>
            My Scholarship Applications
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.92rem" }}>
            Track statutory verification progress and officer determination status.
          </p>
        </div>
        <Link
          to="/applicant/apply"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
            padding: "0.6rem 1.25rem",
            borderRadius: "8px",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            fontSize: "0.86rem",
            fontWeight: 700,
            textDecoration: "none"
          }}
        >
          <PlusCircle size={18} />
          <span>New Application</span>
        </Link>
      </div>

      <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.5rem" }}>
        <div style={{ marginBottom: "1.25rem", position: "relative", maxWidth: "360px" }}>
          <Search size={18} style={{ position: "absolute", left: "10px", top: "10px", color: "#94a3b8" }} />
          <input
            type="text"
            placeholder="Search application number or scheme..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "0.55rem 0.75rem 0.55rem 2.2rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
          />
        </div>

        {filtered.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
            <FileText size={36} style={{ color: "#cbd5e1", margin: "0 auto 0.75rem" }} />
            <div>No matching applications found.</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e2e8f0", color: "#64748b", textAlign: "left" }}>
                  <th style={{ padding: "0.75rem" }}>Application No</th>
                  <th style={{ padding: "0.75rem" }}>Scheme Applied</th>
                  <th style={{ padding: "0.75rem" }}>Tribe</th>
                  <th style={{ padding: "0.75rem" }}>Eligibility</th>
                  <th style={{ padding: "0.75rem" }}>Submitted Date</th>
                  <th style={{ padding: "0.75rem" }}>Status</th>
                  <th style={{ padding: "0.75rem", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((app) => (
                  <tr key={app.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "0.75rem", fontWeight: 700, color: "#0f172a" }}>
                      {app.application_number}
                    </td>
                    <td style={{ padding: "0.75rem" }}>{app.scheme_name}</td>
                    <td style={{ padding: "0.75rem", color: "#475569" }}>{app.tribe_name || "ST"}</td>
                    <td style={{ padding: "0.75rem", fontWeight: 700, color: app.eligibility_score >= 80 ? "#059669" : "#d97706" }}>
                      {app.eligibility_score}%
                    </td>
                    <td style={{ padding: "0.75rem", color: "#64748b" }}>
                      {new Date(app.created_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      {(() => {
                        const statusColors: Record<string, { bg: string; text: string }> = {
                          APPROVED: { bg: "#ecfdf5", text: "#065f46" },
                          REJECTED: { bg: "#fef2f2", text: "#991b1b" },
                          DEFICIENCY: { bg: "#fff1f2", text: "#be123c" },
                          RESUBMITTED: { bg: "#f0f9ff", text: "#0369a1" },
                          OFFICER_REVIEW: { bg: "#fffbeb", text: "#92400e" },
                          DOCUMENT_VERIFICATION: { bg: "#faf5ff", text: "#6b21a8" },
                          RULE_VALIDATION: { bg: "#fdf4ff", text: "#86198f" },
                          SUBMITTED: { bg: "#eff6ff", text: "#1d4ed8" },
                          DRAFT: { bg: "#f1f5f9", text: "#475569" },
                        };
                        const c = statusColors[app.status] || { bg: "#f8fafc", text: "#334155" };
                        return (
                          <span
                            style={{
                              fontSize: "0.74rem",
                              fontWeight: 700,
                              padding: "0.25rem 0.6rem",
                              borderRadius: "4px",
                              backgroundColor: c.bg,
                              color: c.text
                            }}
                          >
                            {app.status.replace(/_/g, " ")}
                          </span>
                        );
                      })()}
                    </td>
                    <td style={{ padding: "0.75rem", textAlign: "right", whiteSpace: "nowrap" }}>
                      <Link
                        to={`/applicant/applications/${app.id}`}
                        style={{ color: "#2563eb", fontWeight: 600, textDecoration: "none", marginRight: "1rem" }}
                      >
                        View Dossier
                      </Link>
                      <a
                        href={scholarService.getApplicationPdfUrl(app.id)}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "#0f172a", textDecoration: "none" }}
                        title="Download PDF"
                      >
                        <Download size={16} />
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
