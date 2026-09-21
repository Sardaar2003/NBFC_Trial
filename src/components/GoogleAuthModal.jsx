import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowRight, UserCheck, PlusCircle, Lock } from 'lucide-react';

export default function GoogleAuthModal({ isOpen, onClose, onMfaRequired }) {
  const { loginWithGoogle, config } = useAuth();
  const [selectedEmail, setSelectedEmail] = useState('');
  const [selectedName, setSelectedName] = useState('');
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');
  const [isCustom, setIsCustom] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  // Preset Google Demo Accounts
  const demoGoogleAccounts = [
    {
      name: "Priya Sharma",
      email: "priya.sharma@example.com",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      role: "APPLICANT"
    },
    {
      name: "Rahul Verma",
      email: "rahul.v@example.com",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      role: "APPLICANT"
    },
    {
      name: "Alex Vance (Staff - Will Block)",
      email: "developer@finvanguard.nbfc",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
      role: "DEVELOPER"
    }
  ];

  const handleSelectAccount = async (email, name) => {
    setError('');
    setLoading(true);
    try {
      const res = await loginWithGoogle(email, name);
      if (res && res.mfaRequired && onMfaRequired) {
        onMfaRequired(res);
      }
      onClose();
    } catch (err) {
      setError(err.message || "Google Single Sign-On failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleCustomSubmit = async (e) => {
    e.preventDefault();
    if (!customEmail) {
      setError("Please enter a valid Google email address.");
      return;
    }
    const nameToUse = customName || customEmail.split('@')[0];
    await handleSelectAccount(customEmail, nameToUse);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '460px', padding: '2rem' }}>
        
        {/* Google Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '48px', height: '48px', borderRadius: '50%', background: 'var(--bg-secondary)', border: '1px solid var(--surface-glass-border)', marginBottom: '0.75rem', boxShadow: 'var(--shadow-sm)' }}>
            <svg width="24" height="24" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
          </div>
          <h3 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>Choose a Google Account</h3>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
            to continue to <strong style={{ color: 'var(--text-primary)' }}>FinVanguard NBFC Portal</strong>
          </p>
        </div>

        {error && (
          <div style={{ padding: '0.85rem 1rem', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.4)', borderRadius: 'var(--border-radius-sm)', color: 'var(--accent-rose)', fontSize: '0.83rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'flex-start', gap: '0.5rem' }}>
            <ShieldAlert size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
            <div>{error}</div>
          </div>
        )}

        {!isCustom ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
            {demoGoogleAccounts.map((acc) => (
              <div
                key={acc.email}
                onClick={() => handleSelectAccount(acc.email, acc.name)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.85rem',
                  padding: '0.85rem 1rem',
                  borderRadius: '12px',
                  background: 'var(--bg-secondary)',
                  border: '1px solid var(--surface-glass-border)',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                className="hover-card"
              >
                <img src={acc.avatar} alt={acc.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary)' }}>{acc.name}</div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>{acc.email}</div>
                </div>
                {acc.role === 'APPLICANT' ? (
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-emerald)', background: 'var(--accent-emerald-glow)', padding: '0.2rem 0.5rem', borderRadius: '9999px' }}>Applicant</span>
                ) : (
                  <span style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--accent-rose)', background: 'rgba(244,63,94,0.15)', padding: '0.2rem 0.5rem', borderRadius: '9999px' }}>Staff</span>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={() => {
                const baseUrl = import.meta.env.VITE_API_URL || '/api';
                const targetUrl = baseUrl.endsWith('/api') ? `${baseUrl}/auth/passport-google` : `${baseUrl}/api/auth/passport-google`;
                window.location.href = targetUrl;
              }}
              className="btn-primary"
              style={{
                width: '100%',
                padding: '0.85rem',
                fontSize: '0.88rem',
                marginTop: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              <span>Initiate Passport.js Google OAuth</span> <ArrowRight size={16} />
            </button>

            <button
              type="button"
              onClick={() => setIsCustom(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '12px',
                background: 'transparent',
                border: '1px dashed var(--surface-glass-border-glow)',
                color: 'var(--accent-blue)',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
                justifyContent: 'center'
              }}
            >
              <PlusCircle size={17} /> Use another Google Account
            </button>
          </div>
        ) : (
          <form onSubmit={handleCustomSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Google Email Address</label>
              <input
                type="email"
                required
                placeholder="your.email@gmail.com"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                className="glass-input"
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>Full Name (Optional)</label>
              <input
                type="text"
                placeholder="John Doe"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="glass-input"
              />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={() => setIsCustom(false)} className="btn-secondary" style={{ flex: 1 }}>Back</button>
              <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1 }}>
                {loading ? 'Authenticating...' : 'Sign In'}
              </button>
            </div>
          </form>
        )}

        <div style={{ borderTop: '1px solid var(--surface-glass-border)', paddingTop: '0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Protected by RBI & SSL Security</span>
          <button type="button" onClick={onClose} className="btn-secondary" style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem' }}>Cancel</button>
        </div>

      </div>
    </div>
  );
}
