import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import DeveloperDashboard from './pages/dashboards/DeveloperDashboard';
import ApplicantDashboard from './pages/dashboards/ApplicantDashboard';
import StaffDashboard from './pages/dashboards/StaffDashboard';
import AuditLogDrawer from './components/AuditLogDrawer';
import DeveloperConfigModal from './components/DeveloperConfigModal';
import ForcePasswordResetModal from './components/ForcePasswordResetModal';

function MainAppContent() {
  const { currentUser } = useAuth();
  const [isAuditDrawerOpen, setIsAuditDrawerOpen] = useState(false);
  const [isDeveloperConfigOpen, setIsDeveloperConfigOpen] = useState(false);

  if (!currentUser) {
    return <LoginPage />;
  }

  const isApplicant = currentUser.role === 'APPLICANT';

  const renderDashboard = () => {
    switch (currentUser.role) {
      case 'DEVELOPER':
        return (
          <ProtectedRoute requiredRole="DEVELOPER">
            <DeveloperDashboard />
          </ProtectedRoute>
        );
      case 'APPLICANT':
        return (
          <ProtectedRoute requiredRole="APPLICANT">
            <ApplicantDashboard />
          </ProtectedRoute>
        );
      case 'REVIEWER':
      case 'APPROVER':
      case 'SANCTIONING_OFFICER':
      case 'MANAGER':
      case 'LOAN_OFFICER':
      case 'CREDIT_ANALYST':
      case 'CREDIT_MANAGER':
      case 'OPS_DISBURSEMENT':
      default:
        return (
          <ProtectedRoute>
            <StaffDashboard />
          </ProtectedRoute>
        );
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {isApplicant && (
        <Navbar
          onOpenAuditLogs={() => setIsAuditDrawerOpen(true)}
          onOpenDeveloperConfig={() => setIsDeveloperConfigOpen(true)}
        />
      )}

      <main style={{ flexGrow: 1 }}>
        {renderDashboard()}
      </main>

      <AuditLogDrawer
        isOpen={isAuditDrawerOpen}
        onClose={() => setIsAuditDrawerOpen(false)}
      />

      <DeveloperConfigModal
        isOpen={isDeveloperConfigOpen}
        onClose={() => setIsDeveloperConfigOpen(false)}
      />

      <ForcePasswordResetModal
        isOpen={Boolean(currentUser?.mustChangePassword)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainAppContent />
    </AuthProvider>
  );
}
