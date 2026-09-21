import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateConfig } from '../config/nbfcConfig';
import { logEvent } from '../utils/logger';
import ToggleSwitch from './ToggleSwitch';
import { X, Settings, Save, RefreshCw, CheckCircle2, Lock, Globe, Shield } from 'lucide-react';

export default function DeveloperConfigModal({ isOpen, onClose }) {
  const { config, currentUser } = useAuth();
  
  const [appName, setAppName] = useState(config.system.appName);
  const [rbiLicense, setRbiLicense] = useState(config.system.rbiLicenseNo);
  const [maxPersonalLoan, setMaxPersonalLoan] = useState(config.businessLimits.maxPersonalLoan);
  const [maxBusinessLoan, setMaxBusinessLoan] = useState(config.businessLimits.maxBusinessLoan);
  const [minCibilScore, setMinCibilScore] = useState(config.businessLimits.minCibilScore);
  const [maxFOIR, setMaxFOIR] = useState(config.businessLimits.maxFOIRPercentage);
  const [enableMFA, setEnableMFA] = useState(config.system.enableMFA);
  const [enableGoogleAuth, setEnableGoogleAuth] = useState(config.system.googleAuthEnabled);
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = (e) => {
    e.preventDefault();
    
    updateConfig({
      system: {
        ...config.system,
        appName,
        rbiLicenseNo: rbiLicense,
        enableMFA,
        googleAuthEnabled: enableGoogleAuth
      },
      businessLimits: {
        ...config.businessLimits,
        maxPersonalLoan: Number(maxPersonalLoan),
        maxBusinessLoan: Number(maxBusinessLoan),
        minCibilScore: Number(minCibilScore),
        maxFOIRPercentage: Number(maxFOIR)
      }
    });

    logEvent("CONFIG_CHANGE", "CONFIG", `System Config parameters updated by Developer`, {
      maxPersonalLoan,
      maxBusinessLoan,
      minCibilScore,
      maxFOIR
    }, currentUser?.email, currentUser?.role);

    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 800);
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '650px' }}>
        
        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: '1rem', borderBottom: '1px solid var(--surface-glass-border)', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--accent-blue-glow)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Settings size={22} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--text-primary)' }}>Single Config Engine Editor</h3>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Modify system business limits & security parameters live</div>
            </div>
          </div>
          <button onClick={onClose} className="btn-secondary" style={{ padding: '0.35rem' }}>
            <X size={18} />
          </button>
        </div>

        {savedSuccess && (
          <div style={{ padding: '0.75rem 1rem', background: 'var(--accent-emerald-glow)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: '8px', color: 'var(--accent-emerald)', fontSize: '0.85rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={16} />
            <span>Configuration updated and synchronized live!</span>
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Application Brand Name
              </label>
              <input
                type="text"
                className="glass-input"
                value={appName}
                onChange={(e) => setAppName(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                RBI License Number
              </label>
              <input
                type="text"
                className="glass-input"
                value={rbiLicense}
                onChange={(e) => setRbiLicense(e.target.value)}
              />
            </div>
          </div>

          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-gold)', borderBottom: '1px solid var(--surface-glass-border)', paddingBottom: '0.35rem' }}>
            Underwriting & Financial Business Limits
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Max Personal Loan (₹)
              </label>
              <input
                type="number"
                className="glass-input"
                value={maxPersonalLoan}
                onChange={(e) => setMaxPersonalLoan(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Max Business Loan (₹)
              </label>
              <input
                type="number"
                className="glass-input"
                value={maxBusinessLoan}
                onChange={(e) => setMaxBusinessLoan(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Minimum CIBIL Score Threshold
              </label>
              <input
                type="number"
                className="glass-input"
                value={minCibilScore}
                onChange={(e) => setMinCibilScore(e.target.value)}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                Maximum FOIR Ratio (%)
              </label>
              <input
                type="number"
                className="glass-input"
                value={maxFOIR}
                onChange={(e) => setMaxFOIR(e.target.value)}
              />
            </div>
          </div>

          <div style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--accent-blue)', borderBottom: '1px solid var(--surface-glass-border)', paddingBottom: '0.35rem', marginTop: '0.25rem' }}>
            Security & Authentication Features
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem' }}>
            <ToggleSwitch
              checked={enableMFA}
              onChange={setEnableMFA}
              label="Multi-Factor Auth (MFA)"
              description="Require OTP challenge on login"
              icon={Shield}
            />

            <ToggleSwitch
              checked={enableGoogleAuth}
              onChange={setEnableGoogleAuth}
              label="Google OAuth Single Sign-On"
              description="Allow 1-click Google OAuth access"
              icon={Globe}
            />
          </div>

          {/* Action Buttons */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.75rem' }}>
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary">
              <Save size={16} /> Save & Broadcast Config
            </button>
          </div>

        </form>

      </div>
    </div>
  );
}
