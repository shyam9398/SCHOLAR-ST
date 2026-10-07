import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  User,
  Award,
  FileText,
  FileCheck,
  Bell,
  Clock,
  Inbox,
  AlertTriangle,
  FileSpreadsheet,
  Sliders,
  Users,
  UserCheck,
  BarChart3,
  History,
  ShieldCheck,
  CheckCircle2
} from "lucide-react";
import { useEffect, useState } from "react";
import { scholarService } from "../../services/scholarService";
import { authService } from "../../services/authService";

export function Sidebar() {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  useEffect(() => {
    let isMounted = true;
    authService.getCurrentUser().then((u) => {
      if (isMounted) setCurrentUser(u);
    });
    scholarService.getNotifications().then((n) => {
      if (isMounted) {
        setUnreadCount(n.filter((item) => !item.is_read).length);
      }
    }).catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  const userRole = (currentUser?.role || "").toLowerCase();
  const isAdmin = userRole === "admin" || (!userRole && location.pathname.startsWith("/admin"));
  const isOfficer =
    userRole === "officer" ||
    userRole === "inspector" ||
    (!userRole && location.pathname.startsWith("/officer"));

  interface NavItem {
    to: string;
    label: string;
    icon: any;
    badge?: string;
  }

  // EXACT APPLICANT NAVIGATION SPECIFIED IN REQUIREMENTS
  const applicantNav: NavItem[] = [
    { to: "/applicant", label: "Dashboard", icon: LayoutDashboard },
    { to: "/applicant/profile", label: "Profile", icon: User },
    { to: "/applicant/schemes", label: "Schemes", icon: Award },
    { to: "/applicant/applications", label: "My Applications", icon: FileText },
    { to: "/applicant/documents", label: "Documents", icon: FileCheck },
    {
      to: "/applicant/notifications",
      label: "Notifications",
      icon: Bell,
      badge: unreadCount > 0 ? String(unreadCount) : undefined
    }
  ];

  // EXACT OFFICER NAVIGATION SPECIFIED IN REQUIREMENTS
  const officerNav: NavItem[] = [
    { to: "/officer", label: "Dashboard", icon: LayoutDashboard },
    { to: "/officer/pending", label: "Pending Reviews", icon: Clock },
    { to: "/officer/applications", label: "Applications", icon: Inbox },
    { to: "/officer/deficiencies", label: "Deficiencies", icon: AlertTriangle },
    { to: "/officer/reports", label: "Reports", icon: FileSpreadsheet }
  ];

  // EXACT ADMIN NAVIGATION SPECIFIED IN REQUIREMENTS
  const adminNav: NavItem[] = [
    { to: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { to: "/admin/schemes", label: "Schemes", icon: Award },
    { to: "/admin/rules", label: "Rules", icon: Sliders },
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/officers", label: "Officers", icon: UserCheck },
    { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
    { to: "/admin/rule-history", label: "Rule History", icon: History }
  ];

  const currentNav: NavItem[] = isAdmin ? adminNav : isOfficer ? officerNav : applicantNav;
  const currentSectionTitle = isAdmin
    ? "ADMINISTRATIVE CONSOLE"
    : isOfficer
    ? "OFFICER ADJUDICATION"
    : "APPLICANT PORTAL";

  return (
    <aside
      style={{
        width: "240px",
        backgroundColor: "#ffffff",
        borderRight: "1px solid #e2e8f0",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        minHeight: "calc(100vh - 98px)",
        flexShrink: 0,
        boxShadow: "1px 0 3px 0 rgba(15, 23, 42, 0.02)"
      }}
    >
      <div style={{ padding: "1.25rem 0.85rem" }}>
        {/* Section Heading */}
        <div
          style={{
            fontSize: "0.68rem",
            fontWeight: 800,
            color: "#64748b",
            letterSpacing: "0.06em",
            marginBottom: "0.85rem",
            paddingLeft: "0.75rem",
            textTransform: "uppercase"
          }}
        >
          {currentSectionTitle}
        </div>

        {/* Navigation List */}
        <nav style={{ display: "flex", flexDirection: "column", gap: "0.3rem" }}>
          {currentNav.map((item) => {
            const Icon = item.icon;
            const isActive =
              location.pathname === item.to ||
              (item.to !== "/applicant" &&
                item.to !== "/officer" &&
                item.to !== "/admin" &&
                location.pathname.startsWith(item.to));

            return (
              <NavLink
                key={item.to}
                to={item.to}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "0.65rem 0.85rem",
                  borderRadius: "8px",
                  fontSize: "0.84rem",
                  fontWeight: isActive ? 700 : 500,
                  textDecoration: "none",
                  color: isActive ? "#0f3b7a" : "#334155",
                  backgroundColor: isActive ? "#eff6ff" : "transparent",
                  borderLeft: isActive ? "3px solid #0f3b7a" : "3px solid transparent",
                  transition: "all 0.15s ease-in-out"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <Icon
                    size={17}
                    style={{
                      color: isActive ? "#0f3b7a" : "#64748b"
                    }}
                  />
                  <span>{item.label}</span>
                </div>

                {item.badge && (
                  <span
                    style={{
                      backgroundColor: "#0f3b7a",
                      color: "#ffffff",
                      fontSize: "0.68rem",
                      fontWeight: 800,
                      padding: "0.1rem 0.45rem",
                      borderRadius: "9999px"
                    }}
                  >
                    {item.badge}
                  </span>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>

      {/* Footer Info Box */}
      <div
        style={{
          padding: "1rem",
          margin: "0.85rem",
          backgroundColor: "#f8fafc",
          borderRadius: "8px",
          border: "1px solid #e2e8f0"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.4rem", marginBottom: "0.25rem" }}>
          <ShieldCheck size={14} style={{ color: "#0f3b7a" }} />
          <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#0f3b7a" }}>
            MoTA Official Portal
          </span>
        </div>
        <p style={{ fontSize: "0.68rem", color: "#64748b", margin: 0, lineHeight: 1.4 }}>
          Ministry of Tribal Affairs &bull; Secure National Portal
        </p>
      </div>
    </aside>
  );
}
