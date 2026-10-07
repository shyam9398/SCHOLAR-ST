import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  CheckCircle2,
  Clock,
  AlertTriangle,
  FileText,
  Award,
  Filter,
  Check,
  ChevronRight,
  ExternalLink
} from "lucide-react";
import { scholarService } from "../../services/scholarService";
import type { ScholarNotification } from "../../types/scholar";

export default function ApplicantNotificationsPage() {
  const [notifications, setNotifications] = useState<ScholarNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>("ALL");

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await scholarService.getNotifications();
      setNotifications(data || []);
    } catch (err) {
      console.error("Failed to load notifications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await scholarService.markNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error("Failed to mark notifications read:", err);
    }
  };

  const filteredNotifications = notifications.filter((n) => {
    if (filterType === "UNREAD") return !n.is_read;
    if (filterType === "STATUS") return n.notification_type === "STATUS_UPDATE" || n.notification_type === "STATUS_CHANGE";
    if (filterType === "DEFICIENCY") return n.notification_type === "DEFICIENCY_FLAGGED" || n.title.includes("Deficiency");
    return true;
  });

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  return (
    <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
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
          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
            <span
              style={{
                backgroundColor: "#eff6ff",
                color: "#0f3b7a",
                fontSize: "0.72rem",
                fontWeight: 800,
                padding: "0.15rem 0.55rem",
                borderRadius: "4px",
                border: "1px solid #bfdbfe",
                textTransform: "uppercase"
              }}
            >
              Applicant Alerts
            </span>
          </div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f3b7a", margin: 0 }}>
            Notifications &amp; Official Communications
          </h1>
          <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0.25rem 0 0 0" }}>
            Real-time status transitions, deficiency notices, and verification outcomes
          </p>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.4rem",
              padding: "0.5rem 1rem",
              borderRadius: "6px",
              backgroundColor: "#ffffff",
              color: "#0f3b7a",
              border: "1px solid #cbd5e1",
              fontSize: "0.82rem",
              fontWeight: 700,
              cursor: "pointer",
              boxShadow: "0 1px 2px rgba(0,0,0,0.03)"
            }}
          >
            <Check size={15} />
            <span>Mark All as Read</span>
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div
        style={{
          display: "flex",
          gap: "0.5rem",
          backgroundColor: "#ffffff",
          padding: "0.5rem",
          borderRadius: "8px",
          border: "1px solid #e2e8f0",
          marginBottom: "1.25rem"
        }}
      >
        {[
          { key: "ALL", label: `All Notices (${notifications.length})` },
          { key: "UNREAD", label: `Unread (${unreadCount})` },
          { key: "STATUS", label: "Status Updates" },
          { key: "DEFICIENCY", label: "Deficiencies & Action Required" }
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setFilterType(tab.key)}
            style={{
              padding: "0.45rem 0.85rem",
              borderRadius: "6px",
              border: "none",
              fontSize: "0.8rem",
              fontWeight: filterType === tab.key ? 700 : 500,
              backgroundColor: filterType === tab.key ? "#0f3b7a" : "transparent",
              color: filterType === tab.key ? "#ffffff" : "#475569",
              cursor: "pointer"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Notifications List */}
      {loading ? (
        <div style={{ padding: "3rem", textAlign: "center", backgroundColor: "#ffffff", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
          <p style={{ color: "#64748b", fontSize: "0.9rem" }}>Loading official notices...</p>
        </div>
      ) : filteredNotifications.length === 0 ? (
        <div style={{ padding: "3rem", textAlign: "center", backgroundColor: "#ffffff", borderRadius: "10px", border: "1px solid #e2e8f0" }}>
          <Bell size={32} style={{ color: "#94a3b8", margin: "0 auto 0.75rem auto" }} />
          <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.25rem" }}>
            No Notifications Found
          </h3>
          <p style={{ fontSize: "0.82rem", color: "#64748b", margin: 0 }}>
            You have no notifications in this category.
          </p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {filteredNotifications.map((n) => {
            const isDeficiency = n.notification_type === "DEFICIENCY_FLAGGED" || n.title.toLowerCase().includes("deficiency");
            const isApproved = n.title.toLowerCase().includes("approved");

            return (
              <div
                key={n.id}
                style={{
                  backgroundColor: n.is_read ? "#ffffff" : "#f0f9ff",
                  borderRadius: "10px",
                  border: `1px solid ${n.is_read ? "#e2e8f0" : "#bae6fd"}`,
                  padding: "1.15rem 1.35rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "1rem",
                  boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", gap: "0.85rem" }}>
                  <div
                    style={{
                      width: "36px",
                      height: "36px",
                      borderRadius: "8px",
                      backgroundColor: isDeficiency ? "#fffbeb" : isApproved ? "#f0fdf4" : "#eff6ff",
                      color: isDeficiency ? "#b45309" : isApproved ? "#15803d" : "#0f3b7a",
                      border: `1px solid ${isDeficiency ? "#fde68a" : isApproved ? "#bbf7d0" : "#bfdbfe"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0
                    }}
                  >
                    {isDeficiency ? (
                      <AlertTriangle size={18} />
                    ) : isApproved ? (
                      <CheckCircle2 size={18} />
                    ) : (
                      <FileText size={18} />
                    )}
                  </div>

                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.25rem" }}>
                      <h4 style={{ fontSize: "0.95rem", fontWeight: 700, color: "#0f172a", margin: 0 }}>
                        {n.title}
                      </h4>
                      {!n.is_read && (
                        <span
                          style={{
                            backgroundColor: "#0f3b7a",
                            color: "#ffffff",
                            fontSize: "0.62rem",
                            fontWeight: 800,
                            padding: "0.1rem 0.4rem",
                            borderRadius: "4px"
                          }}
                        >
                          NEW
                        </span>
                      )}
                    </div>

                    <p style={{ fontSize: "0.82rem", color: "#475569", margin: "0 0 0.4rem 0", lineHeight: 1.5 }}>
                      {n.message}
                    </p>

                    <div style={{ fontSize: "0.72rem", color: "#94a3b8" }}>
                      {new Date(n.created_at).toLocaleString()}
                    </div>
                  </div>
                </div>

                {n.application_id && (
                  <Link
                    to={`/applicant/applications/${n.application_id}`}
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "0.3rem",
                      padding: "0.45rem 0.85rem",
                      borderRadius: "6px",
                      backgroundColor: "#f8fafc",
                      border: "1px solid #cbd5e1",
                      color: "#0f3b7a",
                      fontSize: "0.78rem",
                      fontWeight: 700,
                      textDecoration: "none",
                      flexShrink: 0
                    }}
                  >
                    <span>View Application</span>
                    <ChevronRight size={14} />
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
