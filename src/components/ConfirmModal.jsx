import React from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';

export default function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  confirmText = "Delete Permanently",
  confirmVariant = "danger",
  loading = false
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 1200 }}>
      <div 
        className="modal-content" 
        style={{ 
          maxWidth: '440px', 
          padding: '1.75rem', 
          borderRadius: '18px',
          background: 'var(--surface-glass-bg)',
          backdropFilter: 'blur(24px)',
          border: '1px solid var(--surface-glass-border)',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.7)'
        }}
      >
        {/* Header Icon & Close */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'rgba(244, 63, 94, 0.15)',
            border: '1px solid rgba(244, 63, 94, 0.35)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-rose)',
            boxShadow: '0 0 20px rgba(244, 63, 94, 0.25)'
          }}>
            <AlertTriangle size={24} />
          </div>

          <button 
            onClick={onClose} 
            className="btn-secondary" 
            style={{ padding: '0.35rem 0.6rem', borderRadius: '8px' }}
            disabled={loading}
          >
            <X size={16} />
          </button>
        </div>

        {/* Title & Description Message */}
        <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
          {title}
        </h3>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.5, marginBottom: '1.75rem' }}>
          {message}
        </p>

        {/* Modal Actions */}
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary"
            style={{ padding: '0.65rem 1.25rem', fontSize: '0.88rem', fontWeight: 600 }}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={confirmVariant === 'danger' ? 'btn-danger' : 'btn-primary'}
            style={{ 
              padding: '0.65rem 1.25rem', 
              fontSize: '0.88rem', 
              fontWeight: 700,
              display: 'flex', 
              alignItems: 'center', 
              gap: '0.5rem',
              boxShadow: confirmVariant === 'danger' ? '0 4px 14px rgba(244, 63, 94, 0.4)' : '0 4px 14px rgba(59, 130, 246, 0.4)'
            }}
            disabled={loading}
          >
            {confirmVariant === 'danger' && <Trash2 size={16} />}
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
