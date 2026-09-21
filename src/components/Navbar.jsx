import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import UserProfileModal from './UserProfileModal';
import { ShieldCheck, UserCheck, LogOut, ChevronDown, Activity, Settings, Sun, Moon, Sparkles } from 'lucide-react';

export default function Navbar({ onOpenAuditLogs, onOpenDeveloperConfig }) {
  const { currentUser, logout, switchRole, config, theme, toggleTheme } = useAuth();
  const [showPersonaMenu, setShowPersonaMenu] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  if (!currentUser) return null;

  const currentRoleObj = config.roles[currentUser.role] || { name: currentUser.role, color: '#38bdf8' };
  const isDeveloper = currentUser.role === 'DEVELOPER';

  return (
    <nav className="top-header-bar">
      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'var(--accent-blue-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 6px 18px var(--accent-blue-glow)' }}>
          <ShieldCheck size={22} />
        </div>
        <div>
          <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 800, fontSize: '1.25rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            FinVanguard <span style={{ color: '#38bdf8', fontSize: '0.75rem', fontWeight: 700, padding: '0.15rem 0.5rem', background: 'rgba(56, 189, 248, 0.15)', borderRadius: '6px' }}>NBFC</span>
          </div>
          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            RBI Reg No: {config.system.rbiLicenseNo}
          </div>
        </div>
      </div>

      {/* Right Tools & Profile */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        
        {/* Light / Dark Theme Switcher Button */}
        <button
          onClick={toggleTheme}
          className="btn-secondary"
          style={{ padding: '0.5rem 0.85rem', fontSize: '0.85rem', gap: '0.4rem' }}
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={16} style={{ color: '#facc15' }} /> : <Moon size={16} style={{ color: '#38bdf8' }} />}
          <span style={{ fontWeight: 600 }}>{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>

        {/* Quick Persona Switcher Dropdown */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setShowPersonaMenu(!showPersonaMenu)}
            className="btn-secondary"
            style={{ fontSize: '0.85rem', padding: '0.5rem 0.9rem', gap: '0.55rem' }}
          >
            <UserCheck size={16} style={{ color: currentRoleObj.color }} />
            <span style={{ fontWeight: 600, color: currentRoleObj.color }}>{currentRoleObj.name}</span>
            <ChevronDown size={14} />
          </button>

          {showPersonaMenu && (
            <div className="glass-panel dropdown-menu" style={{ position: 'absolute', right: 0, top: '125%', width: '290px', padding: '0.85rem', zIndex: 1000 }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', paddingBottom: '0.6rem', borderBottom: '1px solid var(--surface-glass-border)', marginBottom: '0.6rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={13} color="#38bdf8" /> Switch RBAC Role
              </div>
              {Object.values(config.roles).map((role) => (
                <button
                  key={role.id}
                  onClick={() => {
                    switchRole(role.id);
                    setShowPersonaMenu(false);
                  }}
                  style={{
                    width: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.7rem',
                    padding: '0.65rem 0.7rem',
                    background: currentUser.role === role.id ? 'var(--surface-hover)' : 'transparent',
                    border: 'none',
                    borderRadius: '8px',
                    color: 'var(--text-primary)',
                    fontSize: '0.85rem',
                    cursor: 'pointer',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: role.color, flexShrink: 0 }}></span>
                  <div style={{ flexGrow: 1 }}>
                    <div style={{ fontWeight: 600, fontSize: '0.85rem' }}>{role.name}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{role.description}</div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Developer Config Trigger */}
        {isDeveloper && (
          <button
            onClick={onOpenDeveloperConfig}
            className="btn-secondary"
            style={{ fontSize: '0.85rem', padding: '0.5rem 0.85rem', gap: '0.45rem', borderColor: 'rgba(192, 132, 252, 0.4)', color: '#c084fc' }}
            title="Open Developer Engine Config"
          >
            <Settings size={15} />
            <span>Config Engine</span>
          </button>
        )}

        {/* Audit Logs Trigger (Staff & Admin only, hidden for Applicants) */}
        {currentUser.role !== 'APPLICANT' && (
          <button
            onClick={onOpenAuditLogs}
            className="btn-secondary"
            style={{ fontSize: '0.85rem', padding: '0.5rem 0.85rem', gap: '0.45rem' }}
            title="Inspect Audit Telemetry Logs"
          >
            <Activity size={15} style={{ color: '#38bdf8' }} />
            <span>Audit Logs</span>
          </button>
        )}

        {/* User Profile avatar */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', paddingLeft: '0.5rem', borderLeft: '1px solid var(--surface-glass-border)' }}>
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            onClick={() => setIsProfileOpen(true)}
            style={{ width: '36px', height: '36px', borderRadius: '50%', objectFit: 'cover', border: '1.5px solid var(--surface-glass-border-glow)', cursor: 'pointer' }}
            title="Click to view Profile & Account Settings"
          />
          <button
            onClick={logout}
            style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.35rem', borderRadius: '6px', display: 'flex', alignItems: 'center' }}
            title="Sign Out"
          >
            <LogOut size={16} />
          </button>
        </div>

      </div>

      {/* User Profile & Account Deletion Modal */}
      <UserProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)} 
      />

    </nav>
  );
}
