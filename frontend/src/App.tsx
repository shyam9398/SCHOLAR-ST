import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// Public Pages
import { LandingPage } from "./pages/LandingPage";
import Login from "./pages/Login";
import Register from "./pages/Register";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import Unauthorized from "./pages/Unauthorized";

// Protected Route Guard
import ProtectedRoute from "./components/ProtectedRoute";

// Layout
import { ScholarLayout } from "./components/layout/ScholarLayout";

// Applicant Portal Pages
import ApplicantDashboard from "./pages/applicant/ApplicantDashboard";
import CasteValidationPage from "./pages/applicant/CasteValidationPage";
import SchemeCataloguePage from "./pages/applicant/SchemeCataloguePage";
import ApplicationWizard from "./pages/applicant/ApplicationWizard";
import ApplicationDetailPage from "./pages/applicant/ApplicationDetailPage";
import ApplicantApplicationsPage from "./pages/applicant/ApplicantApplicationsPage";
import ApplicantProfilePage from "./pages/applicant/ApplicantProfilePage";
import DocumentVerificationPage from "./pages/applicant/DocumentVerificationPage";
import EvidenceVerificationReportPage from "./pages/applicant/EvidenceVerificationReportPage";
import CrossSchemeIntelligencePage from "./pages/applicant/CrossSchemeIntelligencePage";
import ApplicantNotificationsPage from "./pages/applicant/ApplicantNotificationsPage";

// Officer Portal Pages
import OfficerDashboard from "./pages/officer/OfficerDashboard";
import OfficerQueue from "./pages/officer/OfficerQueue";
import VerificationWorkbench from "./pages/officer/VerificationWorkbench";
import OfficerDossiers from "./pages/officer/OfficerDossiers";
import OfficerDeficienciesPage from "./pages/officer/OfficerDeficienciesPage";

// Admin Portal Pages
import AdminDashboard from "./pages/admin/AdminDashboard";
import { AdminSchemes } from "./pages/admin/AdminSchemes";
import { AdminRules } from "./pages/admin/AdminRules";
import { AdminOfficers } from "./pages/admin/AdminOfficers";
import { AdminAnalytics } from "./pages/admin/AdminAnalytics";
import { AdminLogs } from "./pages/admin/AdminLogs";
import AdminUsersPage from "./pages/admin/AdminUsersPage";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* ========================================================= */}
        {/* PUBLIC AUTH & LANDING ROUTES                              */}
        {/* ========================================================= */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/unauthorized" element={<Unauthorized />} />

        {/* ========================================================= */}
        {/* PROTECTED SCHOLAR-ST PORTAL WITH ROLE-BASED ACCESS CONTROL */}
        {/* ========================================================= */}
        <Route element={<ScholarLayout />}>
          {/* APPLICANT PORTAL - STRICTLY APPLICANT ROLE */}
          <Route element={<ProtectedRoute allowedRole="applicant" />}>
            <Route path="/applicant" element={<ApplicantDashboard />} />
            <Route path="/applicant/caste-validation" element={<CasteValidationPage />} />
            <Route path="/applicant/documents" element={<DocumentVerificationPage />} />
            <Route path="/applicant/document-verification" element={<DocumentVerificationPage />} />
            <Route path="/applicant/schemes" element={<SchemeCataloguePage />} />
            <Route path="/applicant/cross-scheme-intelligence" element={<CrossSchemeIntelligencePage />} />
            <Route path="/applicant/apply" element={<ApplicationWizard />} />
            <Route path="/applicant/applications" element={<ApplicantApplicationsPage />} />
            <Route path="/applicant/applications/:id" element={<ApplicationDetailPage />} />
            <Route path="/applicant/applications/:id/verification-report" element={<EvidenceVerificationReportPage />} />
            <Route path="/applicant/profile" element={<ApplicantProfilePage />} />
            <Route path="/applicant/notifications" element={<ApplicantNotificationsPage />} />
          </Route>

          {/* VERIFICATION OFFICER WORKBENCH - OFFICER / INSPECTOR ROLE */}
          <Route element={<ProtectedRoute allowedRoles={["officer", "inspector"]} />}>
            <Route path="/officer" element={<OfficerDashboard />} />
            <Route path="/officer/pending" element={<OfficerQueue />} />
            <Route path="/officer/applications" element={<OfficerQueue />} />
            <Route path="/officer/queue" element={<OfficerQueue />} />
            <Route path="/officer/deficiencies" element={<OfficerDeficienciesPage />} />
            <Route path="/officer/reports" element={<OfficerDossiers />} />
            <Route path="/officer/verify/:id" element={<VerificationWorkbench />} />
            <Route path="/officer/verify/:id/report" element={<EvidenceVerificationReportPage />} />
            <Route path="/officer/applications/:id/verification-report" element={<EvidenceVerificationReportPage />} />
            <Route path="/officer/completed" element={<OfficerQueue />} />
            <Route path="/officer/dossiers" element={<OfficerDossiers />} />
            <Route path="/officer/guidelines" element={<SchemeCataloguePage />} />
          </Route>

          {/* SHARED VERIFICATION REPORT ROUTE */}
          <Route path="/applications/:id/verification-report" element={<EvidenceVerificationReportPage />} />

          {/* ADMIN GOVERNANCE PORTAL - STRICTLY ADMIN ROLE */}
          <Route element={<ProtectedRoute allowedRole="admin" />}>
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/schemes" element={<AdminSchemes />} />
            <Route path="/admin/rules" element={<AdminRules />} />
            <Route path="/admin/users" element={<AdminUsersPage />} />
            <Route path="/admin/officers" element={<AdminOfficers />} />
            <Route path="/admin/analytics" element={<AdminAnalytics />} />
            <Route path="/admin/rule-history" element={<AdminLogs />} />
            <Route path="/admin/logs" element={<AdminLogs />} />
          </Route>
        </Route>

        {/* ========================================================= */}
        {/* BACKWARD COMPATIBILITY / REDIRECTS                       */}
        {/* ========================================================= */}
        <Route path="/inspector/*" element={<Navigate to="/officer" replace />} />
        <Route path="/inspector" element={<Navigate to="/officer" replace />} />
        <Route path="/user/*" element={<Navigate to="/applicant" replace />} />
        <Route path="/user" element={<Navigate to="/applicant" replace />} />
        <Route path="/dashboard" element={<Navigate to="/applicant" replace />} />

        {/* Catch All */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;