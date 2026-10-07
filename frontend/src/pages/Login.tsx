import React, { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { Shield, Lock, User, ArrowRight, AlertCircle, Loader2, KeyRound, UserPlus, Eye, EyeOff } from "lucide-react";
import { authService } from "../services/authService";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Please enter both username and password.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { profile } = await authService.login(username.trim(), password);
      const role = (profile.role || "").toLowerCase();

      // Check if location state has a specific destination for this role
      const fromPath = (location.state as any)?.from?.pathname;
      if (fromPath && typeof fromPath === "string") {
        if (role === "admin" && fromPath.startsWith("/admin")) {
          navigate(fromPath, { replace: true });
          return;
        }
        if ((role === "officer" || role === "inspector") && fromPath.startsWith("/officer")) {
          navigate(fromPath, { replace: true });
          return;
        }
        if (role === "applicant" && fromPath.startsWith("/applicant")) {
          navigate(fromPath, { replace: true });
          return;
        }
      }

      // Default role-based redirects
      if (role === "admin") {
        navigate("/admin", { replace: true });
      } else if (role === "inspector" || role === "officer") {
        navigate("/officer", { replace: true });
      } else {
        navigate("/applicant", { replace: true });
      }
    } catch (err: any) {
      setError(err?.message || "Authentication failed. Please verify credentials.");
    } finally {
      setLoading(false);
    }
  };

  const setDemoCredentials = (u: string, p: string) => {
    setUsername(u);
    setPassword(p);
    setError(null);
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

      {/* Header */}
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
            <span style={{ fontSize: "1.15rem", fontWeight: 800, color: "#0f3b7a" }}>
              SCHOLAR<span style={{ color: "#b45309" }}>-ST</span>
            </span>
            <div style={{ fontSize: "0.68rem", color: "#64748b" }}>
              National Scholarship Adjudication Portal
            </div>
          </div>
        </Link>
        <Link to="/register" style={{ color: "#0f3b7a", fontSize: "0.82rem", fontWeight: 700, textDecoration: "none" }}>
          New Student? Register Here &rarr;
        </Link>
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
            maxWidth: "460px",
            backgroundColor: "#ffffff",
            borderRadius: "14px",
            border: "1px solid #cbd5e1",
            padding: "2.25rem",
            boxShadow: "0 10px 25px -5px rgba(15, 23, 42, 0.08)",
          }}
        >
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
            <div
              style={{
                width: "48px",
                height: "48px",
                borderRadius: "10px",
                backgroundColor: "#eff6ff",
                color: "#0f3b7a",
                border: "1px solid #bfdbfe",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "0.85rem",
              }}
            >
              <KeyRound size={22} />
            </div>
            <h1 style={{ fontSize: "1.35rem", fontWeight: 800, color: "#0f3b7a", margin: 0 }}>
              Official Portal Sign In
            </h1>
            <p style={{ fontSize: "0.82rem", color: "#64748b", marginTop: "0.3rem" }}>
              Authorized Single Sign-On for Applicants, Officers &amp; Administrators
            </p>
          </div>

          {error && (
            <div
              style={{
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                borderRadius: "8px",
                padding: "0.75rem 1rem",
                marginBottom: "1.25rem",
                display: "flex",
                alignItems: "center",
                gap: "0.65rem",
                color: "#b91c1c",
                fontSize: "0.82rem",
              }}
            >
              <AlertCircle size={17} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: 700, color: "#334155", marginBottom: "0.35rem" }}>
                Username / Email / Mobile *
              </label>
              <div style={{ position: "relative" }}>
                <User size={16} style={{ position: "absolute", left: "12px", top: "11px", color: "#94a3b8" }} />
                <input
                  type="text"
                  required
                  placeholder="e.g. birsa_munda or officer_meena"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.6rem 0.85rem 0.6rem 2.25rem",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.88rem",
                    outline: "none",
                    color: "#0f172a",
                    backgroundColor: "#ffffff",
                  }}
                />
              </div>
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.35rem" }}>
                <label style={{ fontSize: "0.8rem", fontWeight: 700, color: "#334155" }}>
                  Password *
                </label>
                <Link to="/forgot-password" style={{ fontSize: "0.75rem", color: "#0f3b7a", textDecoration: "none" }}>
                  Forgot password?
                </Link>
              </div>
              <div style={{ position: "relative" }}>
                <Lock size={16} style={{ position: "absolute", left: "12px", top: "11px", color: "#94a3b8" }} />
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  placeholder="Enter your account password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "0.6rem 2.5rem 0.6rem 2.25rem",
                    borderRadius: "6px",
                    border: "1px solid #cbd5e1",
                    fontSize: "0.88rem",
                    outline: "none",
                    color: "#0f172a",
                    backgroundColor: "#ffffff",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: "absolute",
                    right: "10px",
                    top: "10px",
                    background: "none",
                    border: "none",
                    color: "#94a3b8",
                    cursor: "pointer",
                  }}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: "0.5rem",
                width: "100%",
                padding: "0.7rem",
                borderRadius: "6px",
                border: "none",
                backgroundColor: "#0f3b7a",
                color: "#ffffff",
                fontSize: "0.88rem",
                fontWeight: 700,
                cursor: loading ? "wait" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "0.5rem",
                boxShadow: "0 2px 4px rgba(15, 59, 122, 0.2)",
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span>Verifying Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Portal</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Credentials */}
          <div style={{ marginTop: "1.75rem", borderTop: "1px solid #f1f5f9", paddingTop: "1.25rem" }}>
            <div style={{ fontSize: "0.72rem", fontWeight: 700, color: "#64748b", textTransform: "uppercase", letterSpacing: "0.04em", marginBottom: "0.75rem", textAlign: "center" }}>
              Quick Evaluation Credentials
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "0.5rem" }}>
              <button
                type="button"
                onClick={() => setDemoCredentials("applicant_test", "demo123")}
                style={{
                  padding: "0.45rem",
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#f8fafc",
                  color: "#0f3b7a",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                ST Applicant
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials("officer_meena", "demo123")}
                style={{
                  padding: "0.45rem",
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#f8fafc",
                  color: "#15803d",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Officer
              </button>
              <button
                type="button"
                onClick={() => setDemoCredentials("admin_mota", "demo123")}
                style={{
                  padding: "0.45rem",
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                  backgroundColor: "#f8fafc",
                  color: "#0f3b7a",
                  fontSize: "0.72rem",
                  fontWeight: 700,
                  cursor: "pointer",
                }}
              >
                Administrator
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer style={{ padding: "1rem", textAlign: "center", fontSize: "0.75rem", color: "#64748b", borderTop: "1px solid #e2e8f0", backgroundColor: "#ffffff" }}>
        Official Portal &bull; Ministry of Tribal Affairs &bull; Government of India
      </footer>
    </div>
  );
}