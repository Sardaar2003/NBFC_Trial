import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { X, UserPlus, Check, AlertCircle, Copy, KeyRound, ShieldCheck, Sparkles, Eye, EyeOff } from 'lucide-react';

export default function CreateUserModal({ isOpen, onClose }) {
  const { config, createUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+91 98765 43210');
  const [role, setRole] = useState('LOAN_OFFICER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [createdUserCredentials, setCreatedUserCredentials] = useState(null);
  const [copied, setCopied] = useState(false);
  const [showPassword, setShowPassword] = useState(true);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!name || !email) {
      setError('Name and Email are required.');
      setLoading(false);
      return;
    }

    try {
      const result = await createUser({
        name: name.trim(),
        email: email.trim(),
        phone: phone ? phone.trim() : '+91 98765 43210',
        role
      });

      setCreatedUserCredentials({
        name: result.name,
        email: result.email,
        role: result.role,
        tempPassword: result.plainTempPassword
      });

      setName('');
      setEmail('');
    } catch (err) {
      setError(err.message || 'Failed to create user account.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyPasswordOnly = () => {
    if (!createdUserCredentials) return;
    // Copies ONLY the password string to clipboard per user request
    navigator.clipboard.writeText(createdUserCredentials.tempPassword);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCloseAll = () => {
    setCreatedUserCredentials(null);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '580px' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--surface-glass-border)', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--accent-blue-glow)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UserPlus size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Provision New Employee Account</h3>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Developer UAM: High-entropy encrypted credential generation</div>
            </div>
          </div>
          <button onClick={handleCloseAll} className="btn-secondary" style={{ padding: '0.35rem' }}>
            <X size={18} />
          </button>
        </div>

        {/* Successful Provision Credentials Card */}
        {createdUserCredentials ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            
            <div style={{ padding: '1rem', background: 'var(--accent-emerald-glow)', border: '1px solid rgba(16, 185, 129, 0.4)', borderRadius: 'var(--border-radius-sm)', color: 'var(--accent-emerald)', fontSize: '0.9rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <ShieldCheck size={20} />
              <span>Employee Account Provisioned & Encrypted (SHA-256)</span>
            </div>

            <div className="glass-card" style={{ padding: '1.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--surface-glass-border-glow)' }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '0.05em' }}>
                Issued Temporary Credentials:
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem', fontSize: '0.9rem' }}>
                <div><span style={{ color: 'var(--text-muted)' }}>Full Name:</span> <strong style={{ color: 'var(--text-primary)' }}>{createdUserCredentials.name}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Work Email:</span> <strong style={{ color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>{createdUserCredentials.email}</strong></div>
                <div><span style={{ color: 'var(--text-muted)' }}>Assigned Role:</span> <strong style={{ color: 'var(--accent-purple)' }}>{createdUserCredentials.role}</strong></div>
                
                <div style={{ marginTop: '0.5rem', padding: '0.85rem 1rem', background: 'var(--bg-primary)', border: '1px solid var(--surface-glass-border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>Auto-Generated Password (First-Login Reset Enabled)</div>
                    <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--accent-gold)', fontFamily: 'var(--font-mono)', letterSpacing: '0.05em', marginTop: '0.15rem' }}>
                      {showPassword ? createdUserCredentials.tempPassword : '••••••••••••••••'}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.35rem' }}
                      title={showPassword ? 'Hide Password' : 'Show Password'}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                    <KeyRound size={20} color="var(--accent-gold)" />
                  </div>
                </div>
              </div>

              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.85rem' }}>
                🔒 Stored as SHA-256 Hash. Employee will be forced to change this password upon first login.
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
              <button onClick={handleCopyPasswordOnly} className="btn-primary btn-emerald">
                <Copy size={16} /> {copied ? 'Password Copied!' : 'Copy Password to Clipboard'}
              </button>
              <button onClick={handleCloseAll} className="btn-secondary">
                Done
              </button>
            </div>

          </div>
        ) : (
          /* Account Provisioning Form */
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
            
            {error && (
              <div style={{ padding: '0.75rem 1rem', background: 'rgba(239, 68, 68, 0.15)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '8px', color: 'var(--accent-rose)', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Full Legal Name *
                </label>
                <input
                  type="text"
                  className="glass-input"
                  placeholder="e.g. Srikant Verma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                  Corporate Email Address *
                </label>
                <input
                  type="email"
                  className="glass-input"
                  placeholder="srikant.verma@finvanguard.nbfc"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Mobile Phone Number (for 2FA SMS OTP) *
              </label>
              <input
                type="text"
                className="glass-input"
                placeholder="+91 98765 43210"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            {/* Interactive Role Card Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                Assign Employee Role Persona *
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.6rem' }}>
                {Object.values(config.roles).map((r) => {
                  const isSelected = role === r.id;
                  return (
                    <div
                      key={r.id}
                      onClick={() => setRole(r.id)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justify: 'space-between',
                        padding: '0.75rem 0.9rem',
                        borderRadius: '12px',
                        background: isSelected ? 'var(--accent-blue-glow)' : 'var(--bg-secondary)',
                        border: `1.5px solid ${isSelected ? 'var(--accent-blue)' : 'var(--surface-glass-border)'}`,
                        cursor: 'pointer',
                        transition: 'all 0.2s ease'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', overflow: 'hidden' }}>
                        <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: r.color, flexShrink: 0 }}></span>
                        <div style={{ overflow: 'hidden' }}>
                          <div style={{ fontWeight: 700, fontSize: '0.85rem', color: isSelected ? 'var(--accent-blue)' : 'var(--text-primary)', whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                            {r.name}
                          </div>
                          <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                            {r.id}
                          </div>
                        </div>
                      </div>

                      {isSelected && <Check size={16} color="var(--accent-blue)" style={{ flexShrink: 0 }} />}
                    </div>
                  );
                })}
              </div>
            </div>

            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', background: 'var(--bg-secondary)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid var(--surface-glass-border)' }}>
              ⚡ A secure 16-character temporary password will be auto-generated and hashed using SHA-256 encryption.
            </div>

            <div style={{ fontSize: '0.78rem', color: '#a78bfa', background: 'rgba(139, 92, 246, 0.12)', padding: '0.75rem 1rem', borderRadius: '8px', border: '1px solid rgba(139, 92, 246, 0.35)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={16} style={{ flexShrink: 0 }} />
              <span><strong>Auth Compliance Policy</strong>: Staff accounts are restricted to Work Email & Password login only. Google SSO is disabled for staff roles.</span>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button type="button" onClick={handleCloseAll} className="btn-secondary">
                Cancel
              </button>
              <button type="submit" disabled={loading} className="btn-primary">
                <Check size={16} /> {loading ? 'Provisioning...' : 'Provision Employee Account'}
              </button>
            </div>

          </form>
        )}

      </div>
    </div>
  );
}
