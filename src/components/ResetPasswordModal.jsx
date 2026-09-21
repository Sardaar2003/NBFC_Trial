import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, Key, Sparkles, Copy, Check, ShieldAlert, CheckCircle } from 'lucide-react';

export default function ResetPasswordModal({ isOpen, onClose, user }) {
  const { resetUserPassword } = useAuth();
  const [newPassword, setNewPassword] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    const pwd = Array.from({ length: 12 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
    setNewPassword(pwd);
    setIsCopied(false);
    setErrorMsg('');
  };

  useEffect(() => {
    if (isOpen) {
      generateRandomPassword();
      setSuccessMsg('');
      setErrorMsg('');
    }
  }, [isOpen, user]);

  if (!isOpen || !user) return null;

  const handleCopy = () => {
    if (!newPassword) return;
    navigator.clipboard.writeText(newPassword);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('Password must be at least 6 characters long.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await resetUserPassword(user.id, newPassword);
      if (res && res.success) {
        setSuccessMsg(`Password overridden successfully! User must change password upon next login.`);
        setTimeout(() => {
          onClose();
        }, 1800);
      } else {
        setErrorMsg(res?.error || 'Failed to override password.');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Error occurred while resetting password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', inset: 0, backgroundColor: 'rgba(15, 23, 42, 0.75)',
      backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 1100, padding: '1rem'
    }}>
      <div className="glass-card" style={{
        width: '100%', maxWidth: '480px', borderRadius: '16px', border: '1px solid rgba(255, 255, 255, 0.12)',
        background: 'var(--bg-card, #1e293b)', color: '#fff', padding: '1.75rem', position: 'relative',
        boxShadow: '0 20px 25px -5px rgba(0,0,0,0.5), 0 8px 10px -6px rgba(0,0,0,0.5)'
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'none',
            border: 'none', color: 'var(--text-muted, #94a3b8)', cursor: 'pointer'
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{
            width: '42px', height: '42px', borderRadius: '12px', background: 'rgba(139, 92, 246, 0.2)',
            border: '1px solid rgba(139, 92, 246, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: '#a78bfa'
          }}>
            <Key size={22} />
          </div>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, margin: 0, color: 'var(--text-primary, #f8fafc)' }}>
              Override Staff Password
            </h3>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-muted, #94a3b8)', margin: 0 }}>
              Generate or assign a new password for staff account
            </p>
          </div>
        </div>

        {/* User Card Summary */}
        <div style={{
          padding: '0.85rem 1rem', background: 'rgba(255, 255, 255, 0.04)', borderRadius: '10px',
          border: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', gap: '0.75rem',
          marginBottom: '1.25rem'
        }}>
          {user.avatar ? (
            <img src={user.avatar} alt={user.name} style={{ width: '40px', height: '40px', borderRadius: '50%' }} />
          ) : (
            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#6366f1', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>
              {user.name?.charAt(0) || 'U'}
            </div>
          )}
          <div>
            <div style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--text-primary, #f8fafc)' }}>{user.name}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted, #94a3b8)' }}>{user.email} • <span style={{ color: '#a78bfa', fontWeight: 700 }}>{user.role}</span></div>
          </div>
        </div>

        {successMsg ? (
          <div style={{
            padding: '1rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.35)',
            borderRadius: '10px', color: '#34d399', fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: '0.6rem'
          }}>
            <CheckCircle size={20} />
            <span>{successMsg}</span>
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            {errorMsg && (
              <div style={{
                padding: '0.75rem 1rem', background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.35)',
                borderRadius: '8px', color: '#f43f5e', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.5rem'
              }}>
                <ShieldAlert size={16} />
                <span>{errorMsg}</span>
              </div>
            )}

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <label style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary, #cbd5e1)' }}>
                  New Temporary Password
                </label>
                <button
                  type="button"
                  onClick={generateRandomPassword}
                  className="btn-secondary"
                  style={{
                    padding: '0.25rem 0.6rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem',
                    background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', border: '1px solid rgba(139, 92, 246, 0.35)'
                  }}
                >
                  <Sparkles size={13} /> Auto-Generate
                </button>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="glass-input"
                  placeholder="Enter or generate temporary password"
                  style={{
                    flex: 1, fontFamily: 'var(--font-mono, monospace)', letterSpacing: '0.5px',
                    fontSize: '0.92rem', padding: '0.6rem 0.85rem'
                  }}
                  required
                />
                <button
                  type="button"
                  onClick={handleCopy}
                  className="btn-secondary"
                  style={{ padding: '0.6rem 0.85rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}
                  title="Copy password to clipboard"
                >
                  {isCopied ? <Check size={16} color="#34d399" /> : <Copy size={16} />}
                  <span style={{ fontSize: '0.78rem' }}>{isCopied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
            </div>

            <div style={{
              fontSize: '0.75rem', color: 'var(--text-muted, #94a3b8)', background: 'rgba(255, 255, 255, 0.03)',
              padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid rgba(255, 255, 255, 0.06)'
            }}>
              ⚠️ Overriding the password will replace the stored bcrypt hash in MongoDB. The user will be required to change this temporary password upon their next login.
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                type="button"
                onClick={onClose}
                className="btn-secondary"
                disabled={loading}
                style={{ padding: '0.55rem 1.1rem', fontSize: '0.85rem' }}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn-primary"
                disabled={loading || !newPassword}
                style={{
                  padding: '0.55rem 1.25rem', fontSize: '0.85rem', background: 'var(--accent-purple-gradient, linear-gradient(135deg, #8b5cf6, #6366f1))'
                }}
              >
                {loading ? 'Updating Password...' : 'Override Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
