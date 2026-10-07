import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  AlertTriangle,
  Search,
  Filter,
  FileText,
  Clock,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  CheckCircle2,
  RefreshCw
} from "lucide-react";
import { scholarService } from "../../services/scholarService";
import type { ScholarshipApplication } from "../../types/scholar";

export default function OfficerDeficienciesPage() {
  const [applications, setApplications] = useState<ScholarshipApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedScheme, setSelectedScheme] = useState("ALL");

  useEffect(() => {
    loadDeficiencyQueue();
  }, []);

  const loadDeficiencyQueue = async () => {
    setLoading(true);
    try {
      const data = await scholarService.getApplications();
      // Filter applications that have deficiency status or unresolved issues
      const defApps = (data || []).filter(
        (app: ScholarshipApplication) =>
          app.status === "DEFICIENCY" || (app.failed_rules && app.failed_rules > 0)
      );
      setApplications(defApps);
    } catch (err) {
      console.error("Failed to load deficiencies:", err);
    } finally {
      setLoading(false);
    }
  };

  const filteredApps = applications.filter((app) => {
    if (selectedScheme !== "ALL" && app.scheme_code !== selectedScheme) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = app.application_number?.toLowerCase().includes(q);
      const matchName = app.applicant_name?.toLowerCase().includes(q);
      return matchNum || matchName;
    }
    return true;
  });

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
          <span
            style={{
              backgroundColor: "#fffbeb",
              color: "#b45309",
              fontSize: "0.72rem",
              fontWeight: 800,
              padding: "0.15rem 0.55rem",
              borderRadius: "4px",
              border: "1px solid #fde68a",
              textTransform: "uppercase"
            }}
          >
            Adjudication Deficiencies
          </span>
        </div>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f3b7a", margin: 0 }}>
          Deficiency Tracking &amp; Clarification Requests
        </h1>
        <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0.25rem 0 0 0" }}>
          Applications with identified statutory discrepancies, missing document evidence, or pending applicant remedies
        </p>
      </div>

      {/* Controls Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#ffffff",
          padding: "0.85rem 1.25rem",
          borderRadius: "10px",
          border: "1px solid #e2e8f0",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          gap: "1rem"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <div style={{ position: "relative", minWidth: "260px" }}>
            <Search size={15} style={{ position: "absolute", left: "10px", top: "10px", color: "#94a3b8" }} />
            <input
              type="text"
              placeholder="Search application no. or student..."
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

          <select
            value={selectedScheme}
            onChange={(e) => setSelectedScheme(e.target.value)}
            style={{
              padding: "0.45rem 0.75rem",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              fontSize: "0.82rem",
              backgroundColor: "#ffffff",
              color: "#334155"
            }}
          >
            <option value="ALL">All Schemes</option>
            <option value="NOS-ST">National Overseas Scholarship (NOS-ST)</option>
            <option value="NFST">National Fellowship (NFST)</option>
            <option value="TOPCLASS-ST">Top Class Education (TOPCLASS-ST)</option>
            <option value="PMS-ST">Post-Matric Scholarship (PMS-ST)</option>
            <option value="PREMATRIC-ST">Pre-Matric Scholarship (PREMATRIC-ST)</option>
          </select>
        </div>

        <button
          onClick={loadDeficiencyQueue}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.45rem 0.85rem",
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
            backgroundColor: "#ffffff",
            color: "#475569",
            fontSize: "0.8rem",
            cursor: "pointer"
          }}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Applications Table */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
        }}
      >
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
            Loading deficiency records...
          </div>
        ) : filteredApps.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
            <CheckCircle2 size={36} style={{ color: "#16a34a", margin: "0 auto 0.75rem auto" }} />
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.25rem" }}>
              No Pending Deficiencies
            </h3>
            <p style={{ fontSize: "0.82rem", margin: 0 }}>
              All applications in this filter are compliant or have been resolved.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc", textAlign: "left", color: "#475569", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 700 }}>Application No.</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 700 }}>Applicant Name</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 700 }}>Scheme</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 700 }}>Identified Discrepancies</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 700 }}>Current Status</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 700, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredApps.map((app, idx) => (
                  <tr
                    key={app.id || idx}
                    style={{
                      borderBottom: "1px solid #f1f5f9",
                      backgroundColor: idx % 2 === 0 ? "#ffffff" : "#fcfdfe"
                    }}
                  >
                    <td style={{ padding: "0.75rem 1rem", fontFamily: "monospace", fontWeight: 700, color: "#0f3b7a" }}>
                      {app.application_number}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "#0f172a" }}>
                      {app.applicant_name}
                      {app.tribe_name && (
                        <div style={{ fontSize: "0.72rem", color: "#64748b", fontWeight: 400 }}>
                          Tribe: {app.tribe_name}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "0.75rem 1rem", color: "#475569" }}>
                      <span style={{ fontWeight: 600 }}>{app.scheme_code}</span>
                      <div style={{ fontSize: "0.72rem", color: "#64748b" }}>{app.scheme_name}</div>
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.25rem",
                          backgroundColor: "#fffbeb",
                          color: "#b45309",
                          padding: "0.2rem 0.5rem",
                          borderRadius: "4px",
                          border: "1px solid #fde68a",
                          fontSize: "0.72rem",
                          fontWeight: 700
                        }}
                      >
                        <AlertTriangle size={12} />
                        <span>{app.failed_rules || 1} Deficiency Flagged</span>
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem" }}>
                      <span
                        style={{
                          backgroundColor: "#fef3c7",
                          color: "#92400e",
                          fontSize: "0.7rem",
                          fontWeight: 800,
                          padding: "0.15rem 0.45rem",
                          borderRadius: "4px",
                          border: "1px solid #fde68a"
                        }}
                      >
                        {app.status}
                      </span>
                    </td>
                    <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                      <Link
                        to={`/officer/verify/${app.id}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "0.3rem",
                          padding: "0.4rem 0.75rem",
                          borderRadius: "6px",
                          backgroundColor: "#0f3b7a",
                          color: "#ffffff",
                          fontSize: "0.75rem",
                          fontWeight: 700,
                          textDecoration: "none"
                        }}
                      >
                        <span>Adjudicate</span>
                        <ArrowRight size={13} />
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
