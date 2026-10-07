import { useEffect, useState } from "react";
import { ScrollText, Shield, Clock } from "lucide-react";
import { scholarService } from "../../services/scholarService";

export function AdminLogs() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    scholarService.getAuditLogs().then((data) => {
      setLogs(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: "1150px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.35rem" }}>
          Immutable Supabase Audit Trails
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.92rem" }}>
          Real-time activity logs for statutory accountability, officer decisions, and dynamic rule modifications.
        </p>
      </div>

      <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.5rem" }}>
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>Loading audit trails...</div>
        ) : logs.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>No audit log entries recorded yet.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid #e2e8f0", color: "#64748b", textAlign: "left" }}>
                <th style={{ padding: "0.75rem 0.5rem" }}>Timestamp</th>
                <th style={{ padding: "0.75rem 0.5rem" }}>Action</th>
                <th style={{ padding: "0.75rem 0.5rem" }}>Entity</th>
                <th style={{ padding: "0.75rem 0.5rem" }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                  <td style={{ padding: "0.75rem 0.5rem", color: "#64748b", whiteSpace: "nowrap" }}>
                    {new Date(log.created_at).toLocaleString()}
                  </td>
                  <td style={{ padding: "0.75rem 0.5rem" }}>
                    <span style={{ fontSize: "0.74rem", fontWeight: 700, padding: "0.15rem 0.45rem", borderRadius: "4px", backgroundColor: "#f1f5f9", color: "#334155" }}>
                      {log.action}
                    </span>
                  </td>
                  <td style={{ padding: "0.75rem 0.5rem", color: "#475569" }}>{log.entity_type}</td>
                  <td style={{ padding: "0.75rem 0.5rem", color: "#0f172a" }}>{log.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
