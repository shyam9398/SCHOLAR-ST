import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Inbox, Search, Filter, Download, ArrowRight, CheckCircle2, AlertTriangle, FileText } from "lucide-react";
import { scholarService } from "../../services/scholarService";
import type { ScholarshipApplication, ScholarScheme } from "../../types/scholar";

export default function OfficerQueue() {
  const [applications, setApplications] = useState<ScholarshipApplication[]>([]);
  const [schemes, setSchemes] = useState<ScholarScheme[]>([]);
  const [search, setSearch] = useState("");
  const [selectedScheme, setSelectedScheme] = useState("ALL");
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      scholarService.getApplications(),
      scholarService.getSchemes()
    ]).then(([apps, schs]) => {
      setApplications(apps);
      setSchemes(schs);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const filtered = applications.filter((app) => {
    const matchesSearch =
      app.application_number.toLowerCase().includes(search.toLowerCase()) ||
      app.applicant_name.toLowerCase().includes(search.toLowerCase()) ||
      (app.tribe_name && app.tribe_name.toLowerCase().includes(search.toLowerCase()));

    const matchesScheme = selectedScheme === "ALL" || app.scheme_code === selectedScheme;
    const matchesStatus = selectedStatus === "ALL" || app.status === selectedStatus;

    return matchesSearch && matchesScheme && matchesStatus;
  });

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.35rem" }}>
          Statutory Application Queue
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.92rem" }}>
          Filter and review submitted Scheduled Tribe scholarship dossiers awaiting officer inspection and determination.
        </p>
      </div>

      {/* Filter and Search Controls */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          padding: "1.25rem",
          marginBottom: "1.5rem",
          display: "flex",
          gap: "1rem",
          alignItems: "center",
          flexWrap: "wrap"
        }}
      >
        <div style={{ position: "relative", flex: "1 1 250px" }}>
          <Search size={18} style={{ position: "absolute", left: "10px", top: "10px", color: "#94a3b8" }} />
          <input
            type="text"
            placeholder="Search by application no, student, or tribe..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              padding: "0.55rem 0.75rem 0.55rem 2.2rem",
              borderRadius: "8px",
              border: "1px solid #cbd5e1",
              fontSize: "0.85rem"
            }}
          />
        </div>

        <div>
          <select
            value={selectedScheme}
            onChange={(e) => setSelectedScheme(e.target.value)}
            style={{ padding: "0.55rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem", backgroundColor: "#f8fafc" }}
          >
            <option value="ALL">All Schemes</option>
            {schemes.map((s) => (
              <option key={s.scheme_code} value={s.scheme_code}>
                {s.scheme_code} - {s.scheme_name.slice(0, 30)}...
              </option>
            ))}
          </select>
        </div>

        <div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            style={{ padding: "0.55rem 0.75rem", borderRadius: "8px", border: "1px solid #cbd5e1", fontSize: "0.85rem", backgroundColor: "#f8fafc" }}
          >
            <option value="ALL">All Statuses</option>
            <option value="SUBMITTED">Submitted / Pending</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="CLARIFICATION_REQUIRED">Clarification Required</option>
          </select>
        </div>
      </div>

      {/* Applications Table */}
      <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.5rem" }}>
        {filtered.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
            <FileText size={36} style={{ color: "#cbd5e1", margin: "0 auto 0.75rem" }} />
            <div>No applications match current filters.</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #e2e8f0", color: "#64748b", textAlign: "left" }}>
                  <th style={{ padding: "0.75rem" }}>Application No</th>
                  <th style={{ padding: "0.75rem" }}>Applicant Name</th>
                  <th style={{ padding: "0.75rem" }}>Scheme Applied</th>
                  <th style={{ padding: "0.75rem" }}>Tribe</th>
                  <th style={{ padding: "0.75rem" }}>Rule Score</th>
                  <th style={{ padding: "0.75rem" }}>Advisory</th>
                  <th style={{ padding: "0.75rem" }}>Status</th>
                  <th style={{ padding: "0.75rem", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((app) => (
                  <tr key={app.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                    <td style={{ padding: "0.75rem", fontWeight: 700, color: "#0f172a" }}>
                      {app.application_number}
                    </td>
                    <td style={{ padding: "0.75rem", fontWeight: 600 }}>{app.applicant_name}</td>
                    <td style={{ padding: "0.75rem" }}>{app.scheme_code}</td>
                    <td style={{ padding: "0.75rem", color: "#475569" }}>{app.tribe_name || "ST"}</td>
                    <td style={{ padding: "0.75rem", fontWeight: 700, color: app.eligibility_score >= 80 ? "#059669" : "#d97706" }}>
                      {app.eligibility_score}%
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          padding: "0.15rem 0.45rem",
                          borderRadius: "4px",
                          backgroundColor:
                            app.evaluation?.system_recommendation === "RECOMMENDED_FOR_APPROVAL" ? "#ecfdf5" :
                            app.evaluation?.system_recommendation?.includes("UNMET") ? "#fef2f2" : "#fffbeb",
                          color:
                            app.evaluation?.system_recommendation === "RECOMMENDED_FOR_APPROVAL" ? "#065f46" :
                            app.evaluation?.system_recommendation?.includes("UNMET") ? "#991b1b" : "#92400e"
                        }}
                      >
                        {app.evaluation?.system_recommendation?.replace(/_/g, " ") || "READY"}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem" }}>
                      <span
                        style={{
                          fontSize: "0.72rem",
                          fontWeight: 700,
                          padding: "0.2rem 0.55rem",
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
                    <td style={{ padding: "0.75rem", textAlign: "right", whiteSpace: "nowrap" }}>
                      <Link
                        to={`/officer/verify/${app.id}`}
                        style={{
                          padding: "0.35rem 0.75rem",
                          borderRadius: "6px",
                          backgroundColor: "#d97706",
                          color: "#ffffff",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          textDecoration: "none"
                        }}
                      >
                        Inspect &rarr;
                      </Link>
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
