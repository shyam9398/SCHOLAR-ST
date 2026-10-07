import { useEffect, useState } from "react";
import { BarChart3, Users, Award, CheckCircle2, TrendingUp } from "lucide-react";
import { scholarService } from "../../services/scholarService";
import type { AdminAnalyticsData } from "../../types/scholar";

export function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<AdminAnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    scholarService.getAdminAnalytics().then((data) => {
      setAnalytics(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div style={{ maxWidth: "1150px", margin: "0 auto" }}>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.35rem" }}>
          Scheduled Tribe Demographics &amp; Disbursements
        </h1>
        <p style={{ color: "#64748b", fontSize: "0.92rem" }}>
          Analytical breakdown of ST sub-tribal community participation, scheme coverage, and approval rates.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.5rem", marginBottom: "2rem" }}>
        {/* Scheme Distribution */}
        <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", marginBottom: "1rem" }}>
            Applications by Scheme
          </h3>
          {analytics?.schemes_distribution && analytics.schemes_distribution.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
              {analytics.schemes_distribution.map((s) => (
                <div key={s.scheme_code} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.75rem", backgroundColor: "#f8fafc", borderRadius: "6px" }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: "0.85rem", color: "#0f172a" }}>{s.scheme_name}</div>
                    <div style={{ fontSize: "0.72rem", color: "#64748b" }}>Code: {s.scheme_code}</div>
                  </div>
                  <div style={{ fontWeight: 800, fontSize: "1.1rem", color: "#2563eb" }}>
                    {s.app_count}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: "#94a3b8", fontSize: "0.85rem", padding: "1.5rem", textAlign: "center" }}>
              Scheme distribution data is aggregating.
            </div>
          )}
        </div>

        {/* Tribal Community Representation */}
        <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.5rem" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: 700, color: "#0f172a", marginBottom: "1rem" }}>
            Scheduled Tribe Community Representation
          </h3>
          {analytics?.tribe_distribution && analytics.tribe_distribution.length > 0 ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {analytics.tribe_distribution.map((t) => (
                <div key={t.tribe_name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.6rem 0.85rem", backgroundColor: "#f8fafc", borderRadius: "6px", fontSize: "0.85rem" }}>
                  <span style={{ fontWeight: 600, color: "#1e293b" }}>{t.tribe_name}</span>
                  <span style={{ fontWeight: 700, color: "#7e22ce" }}>{t.count} scholars</span>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: "#94a3b8", fontSize: "0.85rem", padding: "1.5rem", textAlign: "center" }}>
              Community breakdown updates automatically with verified caste applications.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
