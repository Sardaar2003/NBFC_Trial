import React from 'react';
import { AlertOctagon, CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

export default function MessageModal({
  isOpen,
  onClose,
  title = "Notification",
  message = "",
  type = "info", // "error" | "success" | "warning" | "info"
  details = null,
  buttonText = "Acknowledge"
}) {
  if (!isOpen) return null;

  const config = {
    error: {
      icon: AlertOctagon,
      color: '#f43f5e',
      bgIcon: 'rgba(244, 63, 94, 0.15)',
      borderIcon: 'rgba(244, 63, 94, 0.35)',
      glow: '0 0 25px rgba(244, 63, 94, 0.25)',
      btnStyle: { background: 'linear-gradient(135deg, #f43f5e, #e11d48)', color: '#ffffff', border: 'none' }
    },
    success: {
      icon: CheckCircle2,
      color: '#34d399',
      bgIcon: 'rgba(16, 185, 129, 0.15)',
      borderIcon: 'rgba(16, 185, 129, 0.35)',
      glow: '0 0 25px rgba(16, 185, 129, 0.25)',
      btnStyle: { background: 'linear-gradient(135deg, #10b981, #059669)', color: '#ffffff', border: 'none' }
    },
    warning: {
      icon: AlertTriangle,
      color: '#f59e0b',
      bgIcon: 'rgba(245, 158, 11, 0.15)',
      borderIcon: 'rgba(245, 158, 11, 0.35)',
      glow: '0 0 25px rgba(245, 158, 11, 0.25)',
      btnStyle: { background: 'linear-gradient(135deg, #f59e0b, #d97706)', color: '#ffffff', border: 'none' }
    },
    info: {
      icon: Info,
      color: '#38bdf8',
      bgIcon: 'rgba(56, 189, 248, 0.15)',
      borderIcon: 'rgba(56, 189, 248, 0.35)',
      glow: '0 0 25px rgba(56, 189, 248, 0.25)',
      btnStyle: { background: 'linear-gradient(135deg, #0284c7, #2563eb)', color: '#ffffff', border: 'none' }
    }
  };

  const styleConfig = config[type] || config.info;
  const IconComponent = styleConfig.icon;

  return (
    <div 
      className="modal-overlay" 
      style={{ 
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        backdropFilter: 'blur(8px)',
        WebkitBackdropFilter: 'blur(8px)',
        zIndex: 2000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem'
      }} 
      onClick={onClose}
    >
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
        style={{ 
          maxWidth: '460px', 
          width: '100%',
          padding: '1.85rem', 
          borderRadius: '20px',
          background: 'var(--surface-glass-bg, #0f172a)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid var(--surface-glass-border, rgba(255, 255, 255, 0.12))',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.85)',
          color: 'var(--text-primary)'
        }}
      >
        {/* Header Icon & Close button */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.25rem' }}>
          <div style={{
            width: '52px',
            height: '52px',
            borderRadius: '16px',
            background: styleConfig.bgIcon,
            border: `1px solid ${styleConfig.borderIcon}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: styleConfig.color,
            boxShadow: styleConfig.glow
          }}>
            <IconComponent size={26} />
          </div>

          <button 
            type="button"
            onClick={onClose} 
            className="btn-secondary" 
            style={{ padding: '0.4rem 0.65rem', borderRadius: '10px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Title & Description Message */}
        <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.5rem', letterSpacing: '-0.02em' }}>
          {title}
        </h3>
        
        <p style={{ fontSize: '0.92rem', color: 'var(--text-secondary)', lineHeight: 1.55, marginBottom: details ? '1rem' : '1.75rem' }}>
          {message}
        </p>

        {/* Optional Technical Details Box */}
        {details && (
          <div style={{
            padding: '0.75rem 1rem',
            background: 'rgba(0, 0, 0, 0.3)',
            borderRadius: '10px',
            border: '1px solid var(--surface-glass-border, rgba(255, 255, 255, 0.1))',
            fontSize: '0.78rem',
            fontFamily: 'var(--font-mono, monospace)',
            color: 'var(--text-muted)',
            marginBottom: '1.75rem',
            wordBreak: 'break-word',
            maxHeight: '120px',
            overflowY: 'auto'
          }}>
            {details}
          </div>
        )}

        {/* Modal Action Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            type="button"
            onClick={onClose}
            style={{ 
              padding: '0.7rem 1.75rem', 
              fontSize: '0.9rem', 
              fontWeight: 700,
              borderRadius: '10px',
              cursor: 'pointer',
              boxShadow: '0 4px 14px rgba(0, 0, 0, 0.3)',
              ...styleConfig.btnStyle
            }}
          >
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
}
