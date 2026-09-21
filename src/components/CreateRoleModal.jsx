import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, ShieldPlus, Check, AlertCircle } from 'lucide-react';

export default function CreateRoleModal({ isOpen, onClose }) {
  const { config, createRole } = useAuth();
  const [roleId, setRoleId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#8b5cf6');
  const [selectedPermissions, setSelectedPermissions] = useState([]);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const handleTogglePermission = (permId) => {
    if (selectedPermissions.includes(permId)) {
      setSelectedPermissions(selectedPermissions.filter(p => p !== permId));
    } else {
      setSelectedPermissions([...selectedPermissions, permId]);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');

    if (!roleId || !name) {
      setError('Role Identifier and Role Name are required.');
      return;
    }

    try {
      createRole({
        roleId: roleId.trim(),
        name: name.trim(),
        description: description.trim(),
        color,
        permissions: selectedPermissions
      });
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create custom role.');
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '620px' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--surface-glass-border)', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.2)', color: 'var(--accent-purple)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldPlus size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Create New Custom RBAC Role</h3>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Define role metadata and assign system permissions</div>
            </div>
          </div>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '0.35rem' }}>
            <X size={18} />
          </button>
        </div>

        {error && (
          <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: 'var(--accent-rose)', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Role Identifier (Code) *
              </label>
              <input
                type="text"
                className="glass-input"
                placeholder="e.g. AUDITOR"
                value={roleId}
                onChange={(e) => setRoleId(e.target.value.toUpperCase())}
                required
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Display Name *
              </label>
              <input
                type="text"
                className="glass-input"
                placeholder="e.g. Chief Compliance Auditor"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              Role Description
            </label>
            <input
              type="text"
              className="glass-input"
              placeholder="Brief description of responsibilities and scope"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
              Assign Permissions Matrix
            </label>
            <div style={{ background: 'var(--bg-secondary)', border: '1px solid var(--surface-glass-border)', borderRadius: '8px', padding: '0.75rem', maxHeight: '200px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {config.permissionsList.map((perm) => {
                const isSelected = selectedPermissions.includes(perm.id);
                return (
                  <label
                    key={perm.id}
                    onClick={() => handleTogglePermission(perm.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.65rem',
                      padding: '0.6rem 0.75rem',
                      borderRadius: '6px',
                      background: isSelected ? 'rgba(139, 92, 246, 0.15)' : 'var(--surface-hover)',
                      border: `1px solid ${isSelected ? 'rgba(139, 92, 246, 0.4)' : 'var(--surface-glass-border)'}`,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}}
                      style={{ marginTop: '0.25rem', accentColor: 'var(--accent-purple)' }}
                    />
                    <div>
                      <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {perm.name} <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>[{perm.id}]</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{perm.description}</div>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" style={{ background: 'var(--accent-purple-gradient)' }}>
              <Check size={16} /> Create Role & Save
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
