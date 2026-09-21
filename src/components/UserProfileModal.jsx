import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Shield, Calendar, Trash2, AlertTriangle, X, Check } from 'lucide-react';

export default function UserProfileModal({ isOpen, onClose }) {
  const { currentUser, deleteUser, logout, config } = useAuth();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen || !currentUser) return null;

  const roleObj = config.roles[currentUser.role] || { name: currentUser.role, color: '#38bdf8' };

  const handleDeleteAccount = async () => {
    setLoading(true);
    try {
      await deleteUser(currentUser.id);
      onClose();
    } catch (err) {
      setError("Error deleting account: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" style={{ zIndex: 1100 }}>
      <div className="modal-content" style={{ maxWidth: '440px', padding: '2rem' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', borderBottom: '1px solid var(--surface-glass-border)', paddingBottom: '1rem' }}>
          <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <User size={20} color="var(--accent-blue)" /> Account Profile
          </h3>
          <button onClick={() => { setConfirmDelete(false); onClose(); }} className="btn-secondary" style={{ padding: '0.3rem 0.6rem' }}>
            <X size={16} />
          </button>
        </div>

        {/* Profile Card */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: '1.5rem', background: 'var(--bg-secondary)', padding: '1.5rem', borderRadius: '14px', border: '1px solid var(--surface-glass-border)' }}>
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            style={{ width: '72px', height: '72px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--accent-blue)', marginBottom: '0.85rem' }}
          />
          <h4 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>{currentUser.name}</h4>
          <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)', marginBottom: '0.75rem' }}>{currentUser.email}</div>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.3rem 0.75rem', borderRadius: '9999px', background: 'var(--accent-blue-glow)', color: roleObj.color, fontSize: '0.78rem', fontWeight: 700 }}>
            <Shield size={13} /> {roleObj.name}
          </div>
        </div>

        {/* Metadata Details */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', marginBottom: '1.75rem', fontSize: '0.85rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.85rem', background: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--surface-glass-border)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Account ID:</span>
            <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{currentUser.id}</strong>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0.85rem', background: 'var(--bg-tertiary)', borderRadius: '8px', border: '1px solid var(--surface-glass-border)' }}>
            <span style={{ color: 'var(--text-muted)' }}>Joined Date:</span>
            <strong style={{ color: 'var(--text-primary)' }}>{currentUser.joinedAt || '2026-09-10'}</strong>
          </div>
        </div>

        {/* Delete Account Section */}
        {!confirmDelete ? (
          <div style={{ borderTop: '1px solid var(--surface-glass-border)', paddingTop: '1.25rem', textAlign: 'center' }}>
            <button
              onClick={() => setConfirmDelete(true)}
              className="btn-danger"
              style={{ width: '100%', padding: '0.75rem', fontSize: '0.9rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
            >
              <Trash2 size={16} /> Delete My Account
            </button>
            <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
              Permanently delete your profile, documents, and loan records.
            </div>
          </div>
        ) : (
          <div style={{ padding: '1.25rem', background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.4)', borderRadius: '12px', textAlign: 'center' }}>
            <div style={{ color: 'var(--accent-rose)', fontWeight: 800, fontSize: '1rem', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem' }}>
              <AlertTriangle size={18} /> Confirm Account Deletion
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '1rem', lineHeight: 1.4 }}>
              Are you sure you want to permanently delete your account (<strong>{currentUser.email}</strong>)? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '0.65rem' }}>
              <button
                type="button"
                onClick={() => setConfirmDelete(false)}
                className="btn-secondary"
                style={{ flex: 1, padding: '0.6rem' }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={loading}
                className="btn-danger"
                style={{ flex: 1, padding: '0.6rem', fontWeight: 700 }}
              >
                {loading ? 'Deleting...' : 'Yes, Delete'}
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
