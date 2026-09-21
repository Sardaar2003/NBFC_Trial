import React from 'react';

export default function ToggleSwitch({ checked, onChange, label, description, icon: Icon, disabled = false }) {
  return (
    <div 
      onClick={() => !disabled && onChange(!checked)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justify: 'space-between',
        gap: '0.85rem',
        padding: '0.9rem 1.1rem',
        borderRadius: '12px',
        background: checked ? 'var(--accent-blue-glow)' : 'var(--bg-secondary)',
        border: `1.5px solid ${checked ? 'var(--accent-blue)' : 'var(--surface-glass-border)'}`,
        cursor: disabled ? 'not-allowed' : 'pointer',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        opacity: disabled ? 0.6 : 1,
        userSelect: 'none'
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flex: 1, minWidth: 0 }}>
        {Icon && (
          <div style={{
            width: '38px',
            height: '38px',
            borderRadius: '10px',
            background: checked ? 'var(--accent-blue-gradient)' : 'var(--surface-hover)',
            color: checked ? '#ffffff' : 'var(--text-muted)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            boxShadow: checked ? '0 4px 12px var(--accent-blue-glow)' : 'none',
            transition: 'all 0.2s ease'
          }}>
            <Icon size={19} />
          </div>
        )}
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
          <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', lineHeight: 1.25 }}>{label}</div>
          {description && (
            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', marginTop: '0.2rem', lineHeight: 1.3 }}>{description}</div>
          )}
        </div>
      </div>

      {/* Sliding Pill Toggle Switch */}
      <div 
        style={{
          width: '44px',
          height: '24px',
          borderRadius: '9999px',
          background: checked ? 'var(--accent-emerald)' : 'var(--text-muted)',
          padding: '2px',
          display: 'flex',
          alignItems: 'center',
          transition: 'background-color 0.25s ease',
          flexShrink: 0
        }}
      >
        <div 
          style={{
            width: '20px',
            height: '20px',
            borderRadius: '50%',
            background: '#ffffff',
            boxShadow: '0 2px 5px rgba(0,0,0,0.3)',
            transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
            transform: checked ? 'translateX(20px)' : 'translateX(0px)'
          }}
        />
      </div>
    </div>
  );
}
