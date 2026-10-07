import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { authService } from "../services/authService";
import type { UserProfile, UserRole } from "../types/platform";
import { Shield, Loader2, GraduationCap } from "lucide-react";

interface ProtectedRouteProps {
  allowedRole?: UserRole | string;
  allowedRoles?: Array<UserRole | string>;
}

export default function ProtectedRoute({ allowedRole, allowedRoles }: ProtectedRouteProps) {
  const location = useLocation();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        const user = await authService.getCurrentUser();
        if (isMounted) {
          setCurrentUser(user);
          setLoading(false);
        }
      } catch {
        if (isMounted) {
          setCurrentUser(null);
          setLoading(false);
        }
      }
    }

    checkAuth();

    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  if (loading) {
    const isApplicant = allowedRole === "applicant" || allowedRoles?.includes("applicant");
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#070d1e",
          gap: "1.25rem",
        }}
      >
        <div
          style={{
            width: "60px",
            height: "60px",
            borderRadius: "14px",
            background: isApplicant
              ? "linear-gradient(135deg, #16a34a 0%, #15803d 100%)"
              : "linear-gradient(135deg, #1e3a8a 0%, #0284c7 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#ffffff",
            boxShadow: "0 8px 20px rgba(0, 0, 0, 0.4)",
          }}
        >
          {isApplicant ? <GraduationCap size={32} /> : <Shield size={32} />}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.6rem",
            color: "#94a3b8",
            fontSize: "0.92rem",
            fontWeight: 600,
          }}
        >
          <Loader2
            size={20}
            className="spin"
            style={{ animation: "spin 1s linear infinite", color: "#38bdf8" }}
          />
          <span>Verifying SCHOLAR-ST authorization &amp; role credentials...</span>
        </div>
      </div>
    );
  }

  // Not authenticated -> redirect to login
  if (!currentUser || !currentUser.is_active || !authService.isAuthenticated()) {
    authService.clearSession();
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Role validation
  const rolesList: string[] = [];
  if (allowedRole) rolesList.push(allowedRole.toLowerCase());
  if (allowedRoles) {
    rolesList.push(...allowedRoles.map((r) => r.toLowerCase()));
  }

  if (rolesList.length > 0) {
    const userRole = (currentUser.role || "").toLowerCase();

    // Map officer and inspector as equivalent
    const isOfficerMatch =
      (rolesList.includes("officer") || rolesList.includes("inspector")) &&
      (userRole === "officer" || userRole === "inspector");

    const isMatch = rolesList.includes(userRole) || isOfficerMatch;

    if (!isMatch) {
      // User is authenticated but NOT authorized for this role's portal.
      // Strict role isolation: Redirect to their own authorized dashboard.
      const redirectPath = authService.getDashboardPath(userRole);
      return <Navigate to={redirectPath} replace />;
    }
  }

  return <Outlet />;
}