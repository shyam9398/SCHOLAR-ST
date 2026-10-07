import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Shield,
  Bell,
  User,
  LogOut,
  ChevronDown,
  CheckCircle2,
  ExternalLink,
  BookOpen,
  HelpCircle,
  FileText
} from "lucide-react";
import { authService } from "../../services/authService";
import { scholarService } from "../../services/scholarService";
import type { ScholarNotification } from "../../types/scholar";

export function Topbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [notifications, setNotifications] = useState<ScholarNotification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  const isApplicant = location.pathname.startsWith("/applicant");
  const isOfficer = location.pathname.startsWith("/officer");
  const isAdmin = location.pathname.startsWith("/admin");

  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      const user = await authService.getCurrentUser();
      if (isMounted && user) {
        setCurrentUser(user);
        try {
          const notifs = await scholarService.getNotifications();
          if (isMounted) {
            setNotifications(notifs);
            setUnreadCount(notifs.filter((n) => !n.is_read).length);
          }
        } catch {}
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  const handleLogout = async () => {
    await authService.logout();
    navigate("/login");
  };

  const handleMarkRead = async () => {
    try {
      await scholarService.markNotificationsRead();
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {}
  };

  const userRole = (currentUser?.role || (isAdmin ? "admin" : isOfficer ? "officer" : "applicant")).toLowerCase();
  const roleBadgeLabel =
    userRole === "admin"
      ? "Portal Administrator"
      : userRole === "officer" || userRole === "inspector"
      ? "Verification Officer"
      : "Applicant";

  const roleBadgeBg =
    userRole === "admin"
      ? "#eff6ff"
      : userRole === "officer" || userRole === "inspector"
      ? "#f0fdf4"
      : "#eff6ff";

  const roleBadgeColor =
    userRole === "admin"
      ? "#0f3b7a"
      : userRole === "officer" || userRole === "inspector"
      ? "#15803d"
      : "#0f3b7a";

  const roleBadgeBorder =
    userRole === "admin"
      ? "#bfdbfe"
      : userRole === "officer" || userRole === "inspector"
      ? "#bbf7d0"
      : "#bfdbfe";

  return (
    <header
      style={{
        backgroundColor: "#ffffff",
        borderBottom: "1px solid #e2e8f0",
        position: "sticky",
        top: 0,
        zIndex: 50,
        boxShadow: "0 1px 3px 0 rgba(15, 23, 42, 0.04)"
      }}
    >
      {/* Official Government Top Ribbon */}
      <div
        style={{
          backgroundColor: "#07152f",
          color: "#94a3b8",
          fontSize: "0.7rem",
          fontWeight: 600,
          letterSpacing: "0.04em",
          padding: "0.3rem 1.5rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem", flexWrap: "wrap" }}>
          <span style={{ color: "#ffffff", fontWeight: 700 }}>भारत सरकार / GOVERNMENT OF INDIA</span>
          <span>&bull;</span>
          <span>जनजातीय कार्य मंत्रालय / MINISTRY OF TRIBAL AFFAIRS</span>
          <span>&bull;</span>
          <span style={{ color: "#93c5fd" }}>National Scholarship &amp; Fellowship Portal</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <span style={{ color: "#cbd5e1" }}>Statutory Verification Framework</span>
          <span style={{ color: "#f59e0b" }}>Article 342 Compliance</span>
        </div>
      </div>

      {/* Primary Navigation Bar */}
      <div
        style={{
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 1.5rem"
        }}
      >
        {/* Brand & Emblem Logo */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          <Link
            to={isAdmin ? "/admin" : isOfficer ? "/officer" : "/applicant"}
            style={{ display: "flex", alignItems: "center", gap: "0.85rem", textDecoration: "none" }}
          >
            {/* Government Seal Icon Badge */}
            <div
              style={{
                width: "42px",
                height: "42px",
                borderRadius: "8px",
                backgroundColor: "#0f3b7a",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#ffffff",
                boxShadow: "0 2px 6px rgba(15, 59, 122, 0.25)"
              }}
            >
              <Shield size={24} style={{ color: "#ffffff" }} />
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                <span
                  style={{
                    fontSize: "1.25rem",
                    fontWeight: 800,
                    color: "#0f3b7a",
                    letterSpacing: "-0.02em"
                  }}
                >
                  SCHOLAR<span style={{ color: "#b45309" }}>-ST</span>
                </span>
                <span
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    padding: "0.15rem 0.55rem",
                    borderRadius: "4px",
                    backgroundColor: roleBadgeBg,
                    color: roleBadgeColor,
                    border: `1px solid ${roleBadgeBorder}`,
                    letterSpacing: "0.02em",
                    textTransform: "uppercase"
                  }}
                >
                  {roleBadgeLabel}
                </span>
              </div>
              <div style={{ fontSize: "0.74rem", color: "#64748b", fontWeight: 500 }}>
                Scheduled Tribe Higher Education &amp; Fellowship Management System
              </div>
            </div>
          </Link>
        </div>

        {/* Right Tools & User Actions */}
        <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
          {/* Quick Guidance Link */}
          <Link
            to={isApplicant ? "/applicant/schemes" : "/applicant/schemes"}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "0.35rem",
              fontSize: "0.82rem",
              fontWeight: 600,
              color: "#0f3b7a",
              textDecoration: "none",
              padding: "0.4rem 0.75rem",
              borderRadius: "6px",
              backgroundColor: "#f8fafc",
              border: "1px solid #e2e8f0"
            }}
          >
            <BookOpen size={15} />
            <span>Scheme Guidelines</span>
          </Link>

          {/* Notifications Dropdown */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                setShowUserMenu(false);
              }}
              style={{
                position: "relative",
                width: "38px",
                height: "38px",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                backgroundColor: showNotifications ? "#eff6ff" : "#ffffff",
                color: showNotifications ? "#0f3b7a" : "#475569",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer"
              }}
              title="Notifications"
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: "absolute",
                    top: "-4px",
                    right: "-4px",
                    backgroundColor: "#dc2626",
                    color: "#ffffff",
                    fontSize: "0.65rem",
                    fontWeight: 800,
                    width: "18px",
                    height: "18px",
                    borderRadius: "50%",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    border: "2px solid #ffffff"
                  }}
                >
                  {unreadCount > 9 ? "9+" : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Menu Drawer */}
            {showNotifications && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "46px",
                  width: "360px",
                  backgroundColor: "#ffffff",
                  borderRadius: "12px",
                  border: "1px solid #cbd5e1",
                  boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.15)",
                  zIndex: 100,
                  overflow: "hidden"
                }}
              >
                <div
                  style={{
                    padding: "0.85rem 1.15rem",
                    backgroundColor: "#f8fafc",
                    borderBottom: "1px solid #e2e8f0",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center"
                  }}
                >
                  <div style={{ fontSize: "0.88rem", fontWeight: 700, color: "#0f172a" }}>
                    Notifications ({notifications.length})
                  </div>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkRead}
                      style={{
                        background: "none",
                        border: "none",
                        color: "#0f3b7a",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        cursor: "pointer"
                      }}
                    >
                      Mark all read
                    </button>
                  )}
                </div>

                <div style={{ maxHeight: "320px", overflowY: "auto" }}>
                  {notifications.length === 0 ? (
                    <div style={{ padding: "2rem", textAlign: "center", color: "#64748b", fontSize: "0.85rem" }}>
                      No notifications right now
                    </div>
                  ) : (
                    notifications.slice(0, 6).map((n) => (
                      <div
                        key={n.id}
                        style={{
                          padding: "0.75rem 1.15rem",
                          borderBottom: "1px solid #f1f5f9",
                          backgroundColor: n.is_read ? "#ffffff" : "#f0f9ff"
                        }}
                      >
                        <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.2rem" }}>
                          {n.title}
                        </div>
                        <div style={{ fontSize: "0.76rem", color: "#475569", lineHeight: 1.4 }}>
                          {n.message}
                        </div>
                        <div style={{ fontSize: "0.68rem", color: "#94a3b8", marginTop: "0.3rem" }}>
                          {new Date(n.created_at).toLocaleString()}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {isApplicant && (
                  <div
                    style={{
                      padding: "0.65rem",
                      textAlign: "center",
                      backgroundColor: "#f8fafc",
                      borderTop: "1px solid #e2e8f0"
                    }}
                  >
                    <Link
                      to="/applicant/notifications"
                      onClick={() => setShowNotifications(false)}
                      style={{ fontSize: "0.78rem", fontWeight: 700, color: "#0f3b7a", textDecoration: "none" }}
                    >
                      View All Notifications &rarr;
                    </Link>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* User Profile Button & Dropdown */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => {
                setShowUserMenu(!showUserMenu);
                setShowNotifications(false);
              }}
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                padding: "0.35rem 0.75rem 0.35rem 0.5rem",
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                backgroundColor: showUserMenu ? "#f8fafc" : "#ffffff",
                cursor: "pointer"
              }}
            >
              <div
                style={{
                  width: "30px",
                  height: "30px",
                  borderRadius: "50%",
                  backgroundColor: "#0f3b7a",
                  color: "#ffffff",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "0.8rem",
                  fontWeight: 800
                }}
              >
                {(currentUser?.full_name || currentUser?.username || "U")[0].toUpperCase()}
              </div>

              <div style={{ textAlign: "left", lineHeight: 1.2 }}>
                <div style={{ fontSize: "0.82rem", fontWeight: 700, color: "#0f172a" }}>
                  {currentUser?.full_name || currentUser?.username || "Authenticated User"}
                </div>
                <div style={{ fontSize: "0.7rem", color: "#64748b" }}>
                  {roleBadgeLabel}
                </div>
              </div>

              <ChevronDown size={14} style={{ color: "#64748b" }} />
            </button>

            {/* User Dropdown */}
            {showUserMenu && (
              <div
                style={{
                  position: "absolute",
                  right: 0,
                  top: "46px",
                  width: "220px",
                  backgroundColor: "#ffffff",
                  borderRadius: "10px",
                  border: "1px solid #cbd5e1",
                  boxShadow: "0 10px 20px -5px rgba(15, 23, 42, 0.12)",
                  zIndex: 100,
                  overflow: "hidden"
                }}
              >
                <div style={{ padding: "0.75rem 1rem", borderBottom: "1px solid #f1f5f9" }}>
                  <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "#0f172a" }}>
                    {currentUser?.full_name || currentUser?.username}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#64748b" }}>
                    {currentUser?.email || "user@scholar-st.gov.in"}
                  </div>
                </div>

                <div style={{ padding: "0.4rem" }}>
                  {isApplicant && (
                    <Link
                      to="/applicant/profile"
                      onClick={() => setShowUserMenu(false)}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                        padding: "0.5rem 0.75rem",
                        borderRadius: "6px",
                        fontSize: "0.8rem",
                        color: "#334155",
                        textDecoration: "none"
                      }}
                    >
                      <User size={15} />
                      <span>My Profile</span>
                    </Link>
                  )}

                  <button
                    onClick={handleLogout}
                    style={{
                      width: "100%",
                      display: "flex",
                      alignItems: "center",
                      gap: "0.5rem",
                      padding: "0.5rem 0.75rem",
                      borderRadius: "6px",
                      fontSize: "0.8rem",
                      color: "#dc2626",
                      backgroundColor: "transparent",
                      border: "none",
                      cursor: "pointer",
                      textAlign: "left"
                    }}
                  >
                    <LogOut size={15} />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
