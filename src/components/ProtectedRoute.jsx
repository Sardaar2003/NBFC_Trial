import React from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, Lock, ArrowLeft } from 'lucide-react';
import { logEvent } from '../utils/logger';

export default function ProtectedRoute({ children, requiredPermission, requiredRole }) {
  const { currentUser, config } = useAuth();

  if (!currentUser) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="glass-panel" style={{ padding: '2.5rem', maxWidth: '480px', width: '100%', textAlign: 'center' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(244, 63, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto', color: '#f43f5e' }}>
            <Lock size={32} />
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '0.75rem', fontFamily: 'var(--font-heading)' }}>Authentication Required</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.75rem', lineHeight: 1.5 }}>
            Access to this NBFC banking resource is restricted. You must log in with valid credentials.
          </p>
          <a href="/" className="btn-primary" style={{ textDecoration: 'none', width: '100%', justifyContent: 'center' }}>
            <ArrowLeft size={18} /> Return to Login Page
          </a>
        </div>
      </div>
    );
  }

  const userRole = config.roles[currentUser.role];
  const isSuperAdmin = userRole?.permissions?.includes("*");

  let isAuthorized = true;
  if (requiredRole && currentUser.role !== requiredRole && !isSuperAdmin) {
    isAuthorized = false;
  }
  if (requiredPermission && !isSuperAdmin && !userRole?.permissions?.includes(requiredPermission)) {
    isAuthorized = false;
  }

  if (!isAuthorized) {
    logEvent("SECURITY", "RBAC", `Access Violation Blocked: ${currentUser.email} attempted accessing unauthorized route`, {
      userRole: currentUser.role,
      requiredRole,
      requiredPermission
    }, currentUser.email, currentUser.role);

    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
        <div className="glass-panel" style={{ padding: '2.5rem', maxWidth: '520px', width: '100%', textAlign: 'center', border: '1px solid rgba(244, 63, 94, 0.3)' }}>
          <div style={{ width: '64px', height: '64px', borderRadius: '50%', background: 'rgba(244, 63, 94, 0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.5rem auto', color: '#f43f5e' }}>
            <ShieldAlert size={36} />
          </div>
          <div className="trust-badge" style={{ background: 'rgba(244, 63, 94, 0.12)', borderColor: 'rgba(244, 63, 94, 0.3)', color: '#f43f5e', marginBottom: '1rem' }}>
            Zero-Trust Security Guard Block
          </div>
          <h2 style={{ fontSize: '1.6rem', fontWeight: 700, marginBottom: '0.75rem' }}>Access Denied (403)</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginBottom: '1.5rem', lineHeight: 1.6 }}>
            Your current assigned role <strong style={{ color: '#ffffff' }}>[{userRole?.name || currentUser.role}]</strong> does not possess the required RBAC security clearance.
          </p>
          <div style={{ background: 'rgba(15, 23, 42, 0.7)', padding: '1rem', borderRadius: '8px', fontSize: '0.85rem', fontFamily: 'var(--font-mono)', textAlign: 'left', marginBottom: '1.75rem', color: '#9ca3af', border: '1px solid rgba(255,255,255,0.08)' }}>
            <div>USER: {currentUser.email}</div>
            <div>ROLE: {currentUser.role}</div>
            <div>REQUIRED: {requiredRole || requiredPermission}</div>
            <div style={{ color: '#f43f5e', marginTop: '0.25rem' }}>STATUS: ACCESS_DENIED_AUDITED</div>
          </div>
          <a href="/" className="btn-secondary" style={{ textDecoration: 'none', width: '100%', justifyContent: 'center' }}>
            <ArrowLeft size={18} /> Back to Safe Dashboard
          </a>
        </div>
      </div>
    );
  }

  return children;
}
