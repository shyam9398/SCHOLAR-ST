import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Shield, Mail, ArrowRight, AlertCircle, Loader2, CheckCircle2, KeyRound } from "lucide-react";
import { authService, type ForgotPasswordResponse } from "../services/authService";

export default function ForgotPassword() {
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ForgotPasswordResponse | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!identifier.trim()) {
      setError("Please provide your username or registered email address.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const data = await authService.forgotPassword(identifier.trim());
      setResult(data);
    } catch (err: any) {
      setError(err?.message || "Failed to process password reset request. Please check identifier.");
    } finally {
      setLoading(false);
    }
  };

  const handleProceedToReset = () => {
    if (!result) return;
    navigate(`/reset-password?identifier=${encodeURIComponent(identifier.trim())}&code=${encodeURIComponent(result.code || "")}`);
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
        <Link to="/login" style={{ color: "#0f3b7a", fontSize: "0.85rem", fontWeight: 700, textDecoration: "none" }}>
          &larr; Back to Sign In
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
            borderRadius: "12px",
            border: "1px solid #e2e8f0",
            padding: "2.25rem",
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.05)",
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
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "0.75rem",
              }}
            >
              <KeyRound size={24} />
            </div>
            <h1 style={{ fontSize: "1.45rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.35rem" }}>
              Recover Account Access
            </h1>
            <p style={{ color: "#64748b", fontSize: "0.85rem" }}>
              Enter your registered username or email to receive a secure recovery code.
            </p>
          </div>

          {error && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "0.6rem",
                padding: "0.75rem 1rem",
                borderRadius: "8px",
                backgroundColor: "#fef2f2",
                border: "1px solid #fecaca",
                color: "#991b1b",
                fontSize: "0.84rem",
                marginBottom: "1.25rem",
              }}
            >
              <AlertCircle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          {!result ? (
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div>
                <label style={{ display: "block", fontSize: "0.84rem", fontWeight: 600, color: "#334155", marginBottom: "0.4rem" }}>
                  Username or Registered Email
                </label>
                <div style={{ position: "relative" }}>
                  <Mail size={16} style={{ position: "absolute", left: "0.85rem", top: "50%", transform: "translateY(-50%)", color: "#94a3b8" }} />
                  <input
                    type="text"
                    required
                    value={identifier}
                    onChange={(e) => setIdentifier(e.target.value)}
                    placeholder="e.g. ramesh.oraon or email@tribal.gov.in"
                    style={{
                      width: "100%",
                      padding: "0.65rem 0.85rem 0.65rem 2.4rem",
                      backgroundColor: "#ffffff",
                      border: "1px solid #cbd5e1",
                      borderRadius: "8px",
                      color: "#0f172a",
                      fontSize: "0.88rem",
                      outline: "none",
                    }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#0f3b7a",
                  color: "#ffffff",
                  fontSize: "0.92rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  cursor: loading ? "not-allowed" : "pointer",
                  boxShadow: "0 2px 6px rgba(15, 59, 122, 0.25)",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="spin" />
                    <span>Processing Request...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Recovery Code</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              <div
                style={{
                  padding: "1rem",
                  borderRadius: "8px",
                  backgroundColor: "#ecfdf5",
                  border: "1px solid #a7f3d0",
                  color: "#065f46",
                  fontSize: "0.86rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "0.6rem",
                }}
              >
                <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
                <span>{result.message}</span>
              </div>

              {result.code && (
                <div
                  style={{
                    padding: "1.25rem",
                    borderRadius: "8px",
                    backgroundColor: "#f8fafc",
                    border: "1px dashed #cbd5e1",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: "0.75rem", color: "#64748b", textTransform: "uppercase", fontWeight: 700, marginBottom: "0.25rem" }}>
                    Verification Code Generated
                  </div>
                  <div style={{ fontSize: "1.8rem", fontWeight: 900, letterSpacing: "0.2em", color: "#0f3b7a" }}>
                    {result.code}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "#64748b", marginTop: "0.35rem" }}>
                    Valid for {result.expires_in_minutes || 15} minutes
                  </div>
                </div>
              )}

              <button
                type="button"
                onClick={handleProceedToReset}
                style={{
                  width: "100%",
                  padding: "0.75rem 1rem",
                  borderRadius: "8px",
                  border: "none",
                  backgroundColor: "#0f3b7a",
                  color: "#ffffff",
                  fontSize: "0.92rem",
                  fontWeight: 700,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "0.5rem",
                  cursor: "pointer",
                  boxShadow: "0 2px 6px rgba(15, 59, 122, 0.25)",
                }}
              >
                <span>Proceed to Set New Password</span>
                <ArrowRight size={18} />
              </button>
            </div>
          )}

          <div
            style={{
              marginTop: "1.75rem",
              paddingTop: "1.25rem",
              borderTop: "1px solid #f1f5f9",
              textAlign: "center",
              fontSize: "0.84rem",
              color: "#64748b",
            }}
          >
            Remembered your credentials?{" "}
            <Link to="/login" style={{ color: "#0f3b7a", fontWeight: 700, textDecoration: "none" }}>
              Sign In
            </Link>
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
