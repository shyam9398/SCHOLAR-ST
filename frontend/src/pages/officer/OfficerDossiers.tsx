import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { FileSearch, Download, Search, FileText } from "lucide-react";
import { scholarService } from "../../services/scholarService";
import type { ScholarshipApplication } from "../../types/scholar";

export default function OfficerDossiers() {
  const [applications, setApplications] = useState<ScholarshipApplication[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    scholarService.getApplications().then((data) => {
      setApplications(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = applications.filter((app) =>
    app.application_number.toLowerCase().includes(search.toLowerCase()) ||
    app.applicant_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div style={{ maxWidth: "1150px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.35rem" }}>
          Statutory Verification Dossiers
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.92rem" }}>
          Official audit repository containing PDF and evidence files of all scholarship decisions.
        </p>
      </div>

      <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.5rem" }}>
        <div style={{ marginBottom: "1.25rem", position: "relative", maxWidth: "360px" }}>
          <Search size={18} style={{ position: "absolute", left: "10px", top: "10px", color: "#94a3b8" }} />
          <input
            type="text"
            placeholder="Search dossiers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ width: "100%", padding: "0.55rem 0.75rem 0.55rem 2.2rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem" }}
          />
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "1.25rem" }}>
          {filtered.map((app) => (
            <div
              key={app.id}
              style={{
                backgroundColor: "#f8fafc",
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
                  <span style={{ fontSize: "0.74rem", fontWeight: 700, color: "#2563eb" }}>
                    {app.scheme_code}
                  </span>
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 700,
                      padding: "0.15rem 0.45rem",
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
                </div>
                <h4 style={{ fontSize: "1rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.25rem" }}>
                  {app.application_number}
                </h4>
                <div style={{ fontSize: "0.84rem", color: "#334155", fontWeight: 600 }}>
                  {app.applicant_name} ({app.tribe_name || "ST"})
                </div>
                <div style={{ fontSize: "0.75rem", color: "#64748b", marginTop: "0.3rem" }}>
                  Score: <strong>{app.eligibility_score}%</strong> &bull; Date: {new Date(app.created_at).toLocaleDateString()}
                </div>
              </div>

              <div style={{ marginTop: "1rem", borderTop: "1px solid #e2e8f0", paddingTop: "0.75rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Link
                  to={`/officer/verify/${app.id}`}
                  style={{ fontSize: "0.8rem", color: "#2563eb", fontWeight: 600, textDecoration: "none" }}
                >
                  Inspect Dossier
                </Link>
                <a
                  href={scholarService.getApplicationPdfUrl(app.id)}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "0.3rem",
                    padding: "0.35rem 0.75rem",
                    borderRadius: "6px",
                    backgroundColor: "#0f172a",
                    color: "#ffffff",
                    fontSize: "0.76rem",
                    fontWeight: 600,
                    textDecoration: "none"
                  }}
                >
                  <Download size={14} />
                  <span>Download PDF</span>
                </a>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
