import React, { useEffect, useState } from "react";
import {
  Users,
  Search,
  Filter,
  UserCheck,
  UserX,
  Shield,
  RefreshCw,
  Mail,
  Phone,
  CheckCircle2,
  XCircle
} from "lucide-react";
import { scholarService } from "../../services/scholarService";
import type { AdminUserItem } from "../../types/scholar";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRole, setSelectedRole] = useState("ALL");

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      const data = await scholarService.getAdminUsers();
      setUsers(data || []);
    } catch (err) {
      console.error("Failed to load users:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleUserStatus = async (user: AdminUserItem) => {
    const newStatus = !user.is_active;
    try {
      await scholarService.toggleUserStatus(user.id, newStatus);
      setUsers((prev) =>
        prev.map((u) => (u.id === user.id ? { ...u, is_active: newStatus } : u))
      );
    } catch (err) {
      alert("Failed to update user status");
    }
  };

  const filteredUsers = users.filter((u) => {
    if (selectedRole !== "ALL" && (u.role || "").toLowerCase() !== selectedRole.toLowerCase()) {
      return false;
    }
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = u.full_name?.toLowerCase().includes(q);
      const matchEmail = u.email?.toLowerCase().includes(q);
      const matchUser = u.username?.toLowerCase().includes(q);
      return matchName || matchEmail || matchUser;
    }
    return true;
  });

  return (
    <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ marginBottom: "1.75rem" }}>
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
            System Governance
          </span>
        </div>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 800, color: "#0f3b7a", margin: 0 }}>
          User Identity &amp; Access Directory
        </h1>
        <p style={{ fontSize: "0.85rem", color: "#64748b", margin: "0.25rem 0 0 0" }}>
          Manage enrolled ST scholarship applicants, verification officers, and portal governance administrators
        </p>
      </div>

      {/* Controls Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          backgroundColor: "#ffffff",
          padding: "0.85rem 1.25rem",
          borderRadius: "10px",
          border: "1px solid #e2e8f0",
          marginBottom: "1.5rem",
          flexWrap: "wrap",
          gap: "1rem"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
          <div style={{ position: "relative", minWidth: "260px" }}>
            <Search size={15} style={{ position: "absolute", left: "10px", top: "10px", color: "#94a3b8" }} />
            <input
              type="text"
              placeholder="Search user by name, email, or username..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%",
                padding: "0.45rem 0.75rem 0.45rem 2rem",
                borderRadius: "6px",
                border: "1px solid #cbd5e1",
                fontSize: "0.82rem",
                outline: "none"
              }}
            />
          </div>

          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            style={{
              padding: "0.45rem 0.75rem",
              borderRadius: "6px",
              border: "1px solid #cbd5e1",
              fontSize: "0.82rem",
              backgroundColor: "#ffffff",
              color: "#334155"
            }}
          >
            <option value="ALL">All Roles</option>
            <option value="applicant">ST Applicants</option>
            <option value="officer">Verification Officers</option>
            <option value="admin">Administrators</option>
          </select>
        </div>

        <button
          onClick={loadUsers}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "0.4rem",
            padding: "0.45rem 0.85rem",
            borderRadius: "6px",
            border: "1px solid #e2e8f0",
            backgroundColor: "#ffffff",
            color: "#475569",
            fontSize: "0.8rem",
            cursor: "pointer"
          }}
        >
          <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Users Table */}
      <div
        style={{
          backgroundColor: "#ffffff",
          borderRadius: "12px",
          border: "1px solid #e2e8f0",
          overflow: "hidden",
          boxShadow: "0 1px 3px rgba(0,0,0,0.03)"
        }}
      >
        {loading ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
            Loading user directory...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div style={{ padding: "3rem", textAlign: "center", color: "#64748b" }}>
            <Users size={36} style={{ color: "#94a3b8", margin: "0 auto 0.75rem auto" }} />
            <h3 style={{ fontSize: "1.05rem", fontWeight: 700, color: "#0f172a", marginBottom: "0.25rem" }}>
              No Users Found
            </h3>
            <p style={{ fontSize: "0.82rem", margin: 0 }}>
              No user records match the query and filter criteria.
            </p>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
              <thead>
                <tr style={{ backgroundColor: "#f8fafc", textAlign: "left", color: "#475569", borderBottom: "1px solid #e2e8f0" }}>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 700 }}>User / Name</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 700 }}>Contact Info</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 700 }}>System Role</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 700 }}>Profile Details</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 700 }}>Status</th>
                  <th style={{ padding: "0.75rem 1rem", fontWeight: 700, textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u, idx) => {
                  const role = (u.role || "applicant").toLowerCase();
                  const isOfficerRole = role === "officer" || role === "inspector";
                  const isAdminRole = role === "admin";

                  return (
                    <tr
                      key={u.id || idx}
                      style={{
                        borderBottom: "1px solid #f1f5f9",
                        backgroundColor: idx % 2 === 0 ? "#ffffff" : "#fcfdfe"
                      }}
                    >
                      <td style={{ padding: "0.75rem 1rem" }}>
                        <div style={{ fontWeight: 700, color: "#0f172a" }}>
                          {u.full_name || u.username || "Anonymous"}
                        </div>
                        <div style={{ fontSize: "0.72rem", color: "#64748b" }}>
                          @{u.username || "no-username"}
                        </div>
                      </td>

                      <td style={{ padding: "0.75rem 1rem", color: "#475569" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "0.35rem" }}>
                          <Mail size={13} style={{ color: "#94a3b8" }} />
                          <span>{u.email || "—"}</span>
                        </div>
                        {u.phone && (
                          <div style={{ display: "flex", alignItems: "center", gap: "0.35rem", fontSize: "0.74rem", color: "#64748b", marginTop: "0.2rem" }}>
                            <Phone size={12} style={{ color: "#94a3b8" }} />
                            <span>{u.phone}</span>
                          </div>
                        )}
                      </td>

                      <td style={{ padding: "0.75rem 1rem" }}>
                        <span
                          style={{
                            fontSize: "0.7rem",
                            fontWeight: 800,
                            padding: "0.15rem 0.5rem",
                            borderRadius: "4px",
                            textTransform: "uppercase",
                            backgroundColor: isAdminRole ? "#eff6ff" : isOfficerRole ? "#f0fdf4" : "#f8fafc",
                            color: isAdminRole ? "#0f3b7a" : isOfficerRole ? "#15803d" : "#475569",
                            border: `1px solid ${isAdminRole ? "#bfdbfe" : isOfficerRole ? "#bbf7d0" : "#cbd5e1"}`
                          }}
                        >
                          {isAdminRole ? "Admin" : isOfficerRole ? "Officer" : "Applicant"}
                        </span>
                      </td>

                      <td style={{ padding: "0.75rem 1rem", color: "#475569", fontSize: "0.76rem" }}>
                        {u.tribe_name && (
                          <div>
                            <strong>Tribe:</strong> {u.tribe_name}
                          </div>
                        )}
                        {u.designation && (
                          <div>
                            <strong>Designation:</strong> {u.designation}
                          </div>
                        )}
                        {u.state_of_domicile && (
                          <div style={{ color: "#64748b" }}>
                            {u.state_of_domicile}
                          </div>
                        )}
                        {!u.tribe_name && !u.designation && <span style={{ color: "#94a3b8" }}>Standard Profile</span>}
                      </td>

                      <td style={{ padding: "0.75rem 1rem" }}>
                        <span
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "0.25rem",
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            color: u.is_active !== false ? "#15803d" : "#b91c1c",
                            backgroundColor: u.is_active !== false ? "#f0fdf4" : "#fef2f2",
                            padding: "0.15rem 0.45rem",
                            borderRadius: "4px"
                          }}
                        >
                          {u.is_active !== false ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                          <span>{u.is_active !== false ? "Active" : "Suspended"}</span>
                        </span>
                      </td>

                      <td style={{ padding: "0.75rem 1rem", textAlign: "right" }}>
                        <button
                          onClick={() => handleToggleUserStatus(u)}
                          style={{
                            padding: "0.35rem 0.65rem",
                            borderRadius: "5px",
                            border: "1px solid #cbd5e1",
                            backgroundColor: "#ffffff",
                            color: u.is_active !== false ? "#b91c1c" : "#15803d",
                            fontSize: "0.75rem",
                            fontWeight: 600,
                            cursor: "pointer"
                          }}
                        >
                          {u.is_active !== false ? "Suspend" : "Activate"}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
