import React, { useEffect, useState } from "react";
import { Users, PlusCircle, CheckCircle2, Shield, Lock } from "lucide-react";
import { scholarService } from "../../services/scholarService";

export function AdminOfficers() {
  const [officers, setOfficers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  // New Officer Form
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [department, setDepartment] = useState("Tribal Welfare Directorate");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    scholarService.getVerificationOfficers().then((data) => {
      setOfficers(data);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleCreateOfficer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password || !fullName) return;

    setSaving(true);
    try {
      const created = await scholarService.createVerificationOfficer({
        username,
        password,
        full_name: fullName,
        phone,
        department,
        designation: "Verification Officer"
      });
      setOfficers((prev) => [...prev, created]);
      setShowModal(false);
      setUsername("");
      setPassword("");
      setFullName("");
      alert("Verification Officer account created successfully!");
    } catch (err: any) {
      alert(err?.message || "Failed to create officer account");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ maxWidth: "1150px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: 800, color: "#0f172a", marginBottom: "0.35rem" }}>
            Verification Officers &amp; Inspectors
          </h1>
          <p style={{ color: "#64748b", fontSize: "0.92rem" }}>
            Authorized officers empowered to perform statutory document inspections and make binding scholarship decisions.
          </p>
        </div>
        <button
          onClick={() => setShowModal(true)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.45rem",
            padding: "0.65rem 1.25rem",
            borderRadius: "8px",
            backgroundColor: "#2563eb",
            color: "#ffffff",
            fontSize: "0.86rem",
            fontWeight: 700,
            border: "none",
            cursor: "pointer"
          }}
        >
          <PlusCircle size={18} />
          <span>Register New Officer</span>
        </button>
      </div>

      <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", border: "1px solid #e2e8f0", padding: "1.5rem" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid #e2e8f0", color: "#64748b", textAlign: "left" }}>
              <th style={{ padding: "0.75rem" }}>Officer Username</th>
              <th style={{ padding: "0.75rem" }}>Full Name</th>
              <th style={{ padding: "0.75rem" }}>Role</th>
              <th style={{ padding: "0.75rem" }}>Department</th>
              <th style={{ padding: "0.75rem" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {officers.map((off) => (
              <tr key={off.id} style={{ borderBottom: "1px solid #f1f5f9" }}>
                <td style={{ padding: "0.75rem", fontWeight: 700, color: "#0f172a" }}>
                  <code>{off.username}</code>
                </td>
                <td style={{ padding: "0.75rem" }}>{off.full_name}</td>
                <td style={{ padding: "0.75rem", textTransform: "capitalize" }}>{off.role}</td>
                <td style={{ padding: "0.75rem", color: "#475569" }}>{off.department || "Tribal Welfare"}</td>
                <td style={{ padding: "0.75rem" }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: 700, padding: "0.15rem 0.5rem", borderRadius: "4px", backgroundColor: "#ecfdf5", color: "#065f46" }}>
                    Active
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ backgroundColor: "#ffffff", borderRadius: "12px", padding: "2rem", width: "100%", maxWidth: "450px" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: 800, marginBottom: "1rem" }}>Register Verification Officer</h3>
            <form onSubmit={handleCreateOfficer} style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
              <input
                type="text"
                placeholder="Username (e.g. officer.ins)"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                style={{ padding: "0.55rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
              />
              <input
                type="password"
                placeholder="Initial Password (min 8 chars)"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{ padding: "0.55rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
              />
              <input
                type="text"
                placeholder="Officer Full Name"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                style={{ padding: "0.55rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
              />
              <input
                type="text"
                placeholder="Department"
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                style={{ padding: "0.55rem", borderRadius: "6px", border: "1px solid #cbd5e1" }}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.75rem", marginTop: "0.5rem" }}>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  style={{ padding: "0.5rem 1rem", borderRadius: "6px", border: "1px solid #cbd5e1", background: "none", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  style={{ padding: "0.5rem 1.25rem", borderRadius: "6px", border: "none", backgroundColor: "#2563eb", color: "#ffffff", fontWeight: 700, cursor: "pointer" }}
                >
                  Create Officer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
