import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldAlert, ArrowLeft, LogOut, Shield } from "lucide-react";
import { authService } from "../services/authService";
import type { UserProfile } from "../types/platform";

export default function Unauthorized() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    authService.getCurrentUser().then((user) => {
      setCurrentUser(user);
    });
  }, []);

  const handleReturnToDashboard = () => {
    const dest = authService.getDashboardPath(currentUser?.role);
    navigate(dest, { replace: true });
  };

  const handleLogout = async () => {
    await authService.logout();
    navigate("/login", { replace: true });
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        backgroundColor: "#f8fafc",
        color: "#0f172a",
        fontFamily: "var(--font-sans, system-ui, -apple-system, sans-serif)",
      }}
    >
      {/* Official Government Top Bar */}
      <div
        style={{
          backgroundColor: "#07152f",
          borderBottom: "1px solid #1e293b",
          padding: "0.3rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "0.72rem",
          color: "#94a3b8"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
          <span style={{ color: "#ffffff", fontWeight: 700 }}>भारत सरकार / GOVERNMENT OF INDIA</span>
          <span>&bull;</span>
          <span>MINISTRY OF TRIBAL AFFAIRS</span>
        </div>
        <Link to="/" style={{ color: "#93c5fd", textDecoration: "none" }}>
          &larr; Return to National Portal
        </Link>
      </div>

      {/* Main Header */}
      <header
        style={{
          padding: "0.85rem 2rem",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          borderBottom: "1px solid #e2e8f0",
          backgroundColor: "#ffffff",
        }}
      >
        <Link to="/" style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none" }}>
          <div
            style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              backgroundColor: "#0f3b7a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#ffffff",
            }}
          >
            <Shield size={20} />
          </div>
          <div>
            <div style={{ fontSize: "1.1rem", fontWeight: 800, color: "#0f3b7a" }}>
              SCHOLAR-ST
            </div>
            <div style={{ fontSize: "0.68rem", color: "#64748b", fontWeight: 600 }}>
              National ST Scholarships Portal
            </div>
          </div>
        </Link>
        <button
          onClick={handleLogout}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            backgroundColor: "transparent",
            border: "1px solid #cbd5e1",
            padding: "0.45rem 0.85rem",
            borderRadius: "6px",
            color: "#475569",
            fontSize: "0.82rem",
            fontWeight: 600,
            cursor: "pointer",
          }}
        >
          <LogOut size={14} />
          <span>Sign Out</span>
        </button>
      </header>

      {/* Main Container */}
      <main
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "2.5rem 1rem",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "520px",
            backgroundColor: "#ffffff",
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            padding: "2.5rem 2rem",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: "56px",
              height: "56px",
              borderRadius: "12px",
              backgroundColor: "#fef2f2",
              color: "#b91c1c",
              display: "inline-flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: "1rem",
            }}
          >
            <ShieldAlert size={28} />
          </div>

          <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.5rem" }}>
            Access Restricted
          </h1>

          <p style={{ color: "#64748b", fontSize: "0.9rem", lineHeight: 1.5, marginBottom: "1.5rem" }}>
            You do not possess the required administrative or verification role to access this section of the SCHOLAR-ST portal.
          </p>

          {currentUser && (
            <div
              style={{
                padding: "0.85rem 1rem",
                borderRadius: "8px",
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                fontSize: "0.82rem",
                color: "#475569",
                marginBottom: "1.75rem",
                textAlign: "left",
              }}
            >
              <div>Authenticated as: <strong>{currentUser.full_name || currentUser.username}</strong></div>
              <div style={{ marginTop: "0.25rem" }}>Current Assigned Role: <span style={{ textTransform: "capitalize", fontWeight: 700, color: "#0f3b7a" }}>{currentUser.role}</span></div>
            </div>
          )}

          <div style={{ display: "flex", gap: "0.75rem", justifyContent: "center" }}>
            <button
              onClick={handleReturnToDashboard}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "0.5rem",
                padding: "0.65rem 1.25rem",
                borderRadius: "8px",
                border: "none",
                backgroundColor: "#0f3b7a",
                color: "#ffffff",
                fontSize: "0.86rem",
                fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 2px 6px rgba(15, 59, 122, 0.2)",
              }}
            >
              <ArrowLeft size={16} />
              <span>Return to My Dashboard</span>
            </button>
          </div>
        </div>
      </main>

      {/* Official MoTA Footer */}
      <footer
        style={{
          padding: "1rem 2rem",
          borderTop: "1px solid #e2e8f0",
          backgroundColor: "#ffffff",
          textAlign: "center",
          fontSize: "0.75rem",
          color: "#64748b",
        }}
      >
        SCHOLAR-ST &bull; Ministry of Tribal Affairs, Government of India
      </footer>
    </div>
  );
}
