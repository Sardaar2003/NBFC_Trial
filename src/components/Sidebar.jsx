import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  ShieldCheck, LayoutDashboard, FileText, CheckSquare, 
  Users, Shield, Activity, Sun, Moon, LogOut, ChevronLeft, ChevronRight,
  Database, UserCheck, Layers, Settings, FileSearch, Sparkles
} from 'lucide-react';

export default function Sidebar({ activeTab, setActiveTab, onOpenAuditLogs, onOpenDeveloperConfig }) {
  const { currentUser, logout, theme, toggleTheme, config } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const getNavItems = () => {
    const role = currentUser?.role;

    if (role === 'DEVELOPER') {
      return [
        { id: 'telemetry', label: 'System Health', icon: Activity },
        { id: 'users', label: 'User Management', icon: Users },
        { id: 'roles', label: 'RBAC Roles', icon: Shield },
        { id: 'loans', label: 'All Applications', icon: FileText },
        { id: 'logs', label: 'Audit Trail', icon: FileSearch },
        { id: 'config', label: 'System Config', icon: Settings },
      ];
    }

    if (role === 'MANAGER') {
      return [
        { id: 'overview', label: 'Branch Overview', icon: LayoutDashboard },
        { id: 'loans', label: 'Global Loan Register', icon: FileText },
        { id: 'staff', label: 'Staff Directory & UAM', icon: Users },
        { id: 'reports', label: 'Executive Analytics', icon: Activity },
        { id: 'logs', label: 'Audit Trail', icon: FileSearch },
      ];
    }

    if (role === 'SANCTIONING_OFFICER') {
      return [
        { id: 'sanction_queue', label: 'Sanction Queue', icon: CheckSquare, badge: '3' },
        { id: 'high_value', label: 'High-Value Approvals', icon: Shield },
        { id: 'disbursal', label: 'Disbursal Authorizations', icon: Layers },
        { id: 'logs', label: 'Audit Trail', icon: FileSearch },
      ];
    }

    if (role === 'APPROVER') {
      return [
        { id: 'underwriting', label: 'Underwriting Queue', icon: FileText, badge: '5' },
        { id: 'cibil_scoring', label: 'CIBIL & FOIR Analyzer', icon: Activity },
        { id: 'approvals', label: 'Credit Approvals', icon: CheckSquare },
        { id: 'logs', label: 'Audit Trail', icon: FileSearch },
      ];
    }

    if (role === 'REVIEWER') {
      return [
        { id: 'verification', label: 'Verification Queue', icon: FileSearch, badge: '4' },
        { id: 'doc_audit', label: 'KYC & Bank Audits', icon: FileText },
        { id: 'field_checks', label: 'Discrepancy Flags', icon: CheckSquare },
        { id: 'logs', label: 'Audit Trail', icon: FileSearch },
      ];
    }

    // Default: APPLICANT (Borrower)
    return [
      { id: 'my_loans', label: 'My Applications', icon: LayoutDashboard },
      { id: 'apply', label: 'Apply For Loan', icon: FileText },
      { id: 'documents', label: 'Document Vault', icon: Layers },
      { id: 'sanction_terms', label: 'Sanction Terms & e-Sign', icon: CheckSquare },
    ];
  };

  const navItems = getNavItems();

  return (
    <aside className={`sidebar-container ${collapsed ? 'collapsed' : ''}`}>
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="sidebar-brand-icon">
          <ShieldCheck size={24} color="#ffffff" />
        </div>
        {!collapsed && (
          <div className="sidebar-brand-text">
            <span className="brand-name">FinVanguard</span>
            <span className="brand-sub">NBFC PORTAL</span>
          </div>
        )}
        <button 
          className="sidebar-toggle-btn"
          onClick={() => setCollapsed(!collapsed)}
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* Role Badge */}
      {!collapsed && (
        <div className="sidebar-role-badge">
          <span className={`role-badge role-${currentUser?.role?.toLowerCase() || 'staff'}`}>
            <Sparkles size={12} style={{ marginRight: '4px' }} />
            {currentUser?.role?.replace('_', ' ')}
          </span>
          <span className="license-tag">RBI #{config?.system?.rbiLicenseNo || 'N-14.03281'}</span>
        </div>
      )}

      {/* Navigation Links */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              className={`sidebar-nav-item ${isActive ? 'active' : ''}`}
              onClick={() => {
                if (item.id === 'audit' && onOpenAuditLogs) {
                  onOpenAuditLogs();
                } else {
                  setActiveTab(item.id);
                }
              }}
              title={collapsed ? item.label : undefined}
            >
              <Icon size={20} className="nav-icon" />
              {!collapsed && <span className="nav-label">{item.label}</span>}
              {!collapsed && item.badge && (
                <span className="nav-badge">{item.badge}</span>
              )}
            </button>
          );
        })}


      </nav>

      {/* Footer / Profile Section */}
      <div className="sidebar-footer">
        <div className="sidebar-user-info">
          <div className="user-avatar">
            {currentUser?.name?.charAt(0) || 'U'}
          </div>
          {!collapsed && (
            <div className="user-details">
              <span className="user-name">{currentUser?.name}</span>
              <span className="user-email">{currentUser?.email}</span>
            </div>
          )}
        </div>

        <div className="sidebar-actions">
          <button
            onClick={toggleTheme}
            className="sidebar-action-btn"
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun size={18} color="#facc15" /> : <Moon size={18} color="#38bdf8" />}
          </button>
          <button
            onClick={logout}
            className="sidebar-action-btn logout-btn"
            title="Sign Out"
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>
    </aside>
  );
}
