import React, { useState, useEffect } from 'react';
import { getLogs, subscribeLogs, clearLogs } from '../utils/logger';
import { X, Activity, Search, Trash2, ShieldAlert, CheckCircle, Info, AlertTriangle, Terminal } from 'lucide-react';

export default function AuditLogDrawer({ isOpen, onClose }) {
  const [logs, setLogs] = useState(getLogs());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLevel, setSelectedLevel] = useState('ALL');
  const [expandedLogId, setExpandedLogId] = useState(null);

  useEffect(() => {
    const unsubscribe = subscribeLogs((updatedLogs) => {
      setLogs([...updatedLogs]);
    });
    return unsubscribe;
  }, []);

  if (!isOpen) return null;

  const filteredLogs = logs.filter(log => {
    const matchesLevel = selectedLevel === 'ALL' || log.level === selectedLevel;
    const matchesSearch = 
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.user.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.category.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesLevel && matchesSearch;
  });

  const getBadgeStyle = (level) => {
    switch (level) {
      case 'SECURITY': return { bg: 'rgba(236, 72, 153, 0.15)', color: '#f472b6', icon: ShieldAlert };
      case 'CONFIG_CHANGE': return { bg: 'var(--accent-emerald-glow)', color: 'var(--accent-emerald)', icon: CheckCircle };
      case 'ERROR': return { bg: 'rgba(239, 68, 68, 0.15)', color: 'var(--accent-rose)', icon: AlertTriangle };
      case 'WARN': return { bg: 'var(--accent-gold-glow)', color: 'var(--accent-gold)', icon: AlertTriangle };
      default: return { bg: 'var(--accent-blue-glow)', color: 'var(--accent-blue)', icon: Info };
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 1100, display: 'flex', justifyContent: 'flex-end', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '620px', height: '100vh', borderRadius: 0, display: 'flex', flexDirection: 'column', padding: '1.5rem', background: 'var(--bg-secondary)', borderLeft: '1px solid var(--surface-glass-border)' }}>
        
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1.25rem', borderBottom: '1px solid var(--surface-glass-border)', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: 'var(--accent-blue-glow)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Activity size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-primary)' }}>Audit Telemetry Logs</h3>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Real-time audit events, UAM changes & security guards</div>
            </div>
          </div>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '0.35rem' }}>
            <X size={18} />
          </button>
        </div>

        {/* Controls */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ position: 'relative' }}>
            <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              className="glass-input"
              placeholder="Search logs by action, user, or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ paddingLeft: '2.5rem', fontSize: '0.88rem' }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap' }}>
              {['ALL', 'SECURITY', 'CONFIG_CHANGE', 'INFO', 'WARN', 'ERROR'].map(lvl => (
                <button
                  key={lvl}
                  onClick={() => setSelectedLevel(lvl)}
                  style={{
                    padding: '0.3rem 0.65rem',
                    fontSize: '0.75rem',
                    fontWeight: 700,
                    borderRadius: '6px',
                    border: '1px solid var(--surface-glass-border)',
                    cursor: 'pointer',
                    background: selectedLevel === lvl ? 'var(--accent-blue-gradient)' : 'var(--surface-hover)',
                    color: selectedLevel === lvl ? '#ffffff' : 'var(--text-secondary)'
                  }}
                >
                  {lvl}
                </button>
              ))}
            </div>

            <button
              onClick={clearLogs}
              style={{ background: 'transparent', border: 'none', color: 'var(--accent-rose)', fontSize: '0.88rem', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600 }}
            >
              <Trash2 size={14} /> Clear
            </button>
          </div>
        </div>

        {/* Log Entries */}
        <div style={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          {filteredLogs.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No audit logs matching search parameters.
            </div>
          ) : (
            filteredLogs.map(log => {
              const badge = getBadgeStyle(log.level);
              const Icon = badge.icon;
              const isExpanded = expandedLogId === log.id;

              return (
                <div
                  key={log.id}
                  onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                  style={{
                    background: 'var(--bg-tertiary)',
                    border: `1px solid ${isExpanded ? 'var(--surface-glass-border-glow)' : 'var(--surface-glass-border)'}`,
                    borderRadius: '8px',
                    padding: '0.85rem',
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.35rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span style={{ padding: '0.2rem 0.55rem', borderRadius: '4px', background: badge.bg, color: badge.color, fontSize: '0.7rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                        <Icon size={12} /> {log.level}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>[{log.category}]</span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
                    {log.action}
                  </div>

                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span>By: <strong style={{ color: 'var(--text-secondary)' }}>{log.user}</strong></span>
                    <span>Role: <strong style={{ color: 'var(--text-secondary)' }}>{log.role}</strong></span>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && log.details && (
                    <div style={{ marginTop: '0.75rem', paddingTop: '0.6rem', borderTop: '1px solid var(--surface-glass-border)' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '0.25rem', fontFamily: 'var(--font-mono)' }}>EVENT DETAILS PAYLOAD:</div>
                      <pre style={{ background: 'var(--bg-primary)', padding: '0.65rem', borderRadius: '6px', fontSize: '0.75rem', color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)', overflowX: 'auto', whiteSpace: 'pre-wrap', border: '1px solid var(--surface-glass-border)' }}>
                        {JSON.stringify(log.details, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

      </div>
    </div>
  );
}
