import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import GoogleAuthModal from '../components/GoogleAuthModal';
import { 
  ShieldCheck, Mail, User, KeyRound, Sparkles, ArrowRight, CheckCircle2, 
  ShieldAlert, Sun, Moon, Lock, Building2, TrendingUp, Cpu, Award,
  Clock, DollarSign, Check, Zap, Shield, Eye, EyeOff, Smartphone, RefreshCw, ArrowLeft, AlertOctagon
} from 'lucide-react';

export default function LoginPage() {
  const { login, loginWithGoogle, verifyOtp, resendOtp, bindPhoneAndSendOtp, switchRole, config, theme, toggleTheme, sessionError } = useAuth();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // 2FA OTP Challenge State
  const [mfaChallenge, setMfaChallenge] = useState(null); // { tempToken, maskedPhone, userEmail, requiresPhone }
  const [phoneInput, setPhoneInput] = useState('+91 98765 43210');
  const [otpInput, setOtpInput] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');

  // Google SSO Selection Modal State
  const [isGoogleModalOpen, setIsGoogleModalOpen] = useState(false);

  React.useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mfaRequired = params.get('mfaRequired');
    const requiresPhone = params.get('requiresPhone');
    const tempToken = params.get('tempToken');
    const maskedPhone = params.get('maskedPhone');
    const userEmail = params.get('email');
    const authError = params.get('error');

    if (authError) {
      setError(decodeURIComponent(authError));
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (mfaRequired && tempToken) {
      setMfaChallenge({
        mfaRequired: true,
        requiresPhone: requiresPhone === 'true',
        tempToken,
        maskedPhone: maskedPhone ? decodeURIComponent(maskedPhone) : '',
        userEmail: userEmail ? decodeURIComponent(userEmail) : ''
      });
      setOtpInput('');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await login(email, password);
      if (res && res.mfaRequired) {
        setMfaChallenge(res);
        setOtpInput('');
      }
    } catch (err) {
      setError(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  const handleBindPhoneSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await bindPhoneAndSendOtp(mfaChallenge.tempToken, phoneInput);
      setMfaChallenge(res);
      setOtpInput('');
    } catch (err) {
      setError(err.message || 'Failed to send OTP to mobile phone number.');
    } finally {
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResendSuccess('');
    setLoading(true);

    try {
      await verifyOtp(mfaChallenge.tempToken, otpInput);
    } catch (err) {
      setError(err.message || 'Invalid OTP code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    setResendSuccess('');
    setError('');
    setResendLoading(true);

    try {
      const res = await resendOtp(mfaChallenge.tempToken);
      setResendSuccess(res.message || 'New OTP sent to your phone.');
    } catch (err) {
      setError(err.message || 'Failed to resend OTP.');
    } finally {
      setResendLoading(false);
    }
  };

  const handleGoogleAuth = () => {
    setError('');
    const baseUrl = import.meta.env.VITE_API_URL || '/api';
    const targetUrl = baseUrl.endsWith('/api') ? `${baseUrl}/auth/google` : `${baseUrl}/api/auth/google`;
    window.location.href = targetUrl;
  };

  const isAccountSuspended = (error || sessionError || '').toLowerCase().includes('suspend');

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '1.75rem' }}>
      
      {/* Top Header Bar */}
      <header style={{ maxWidth: '1350px', margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ width: '46px', height: '46px', borderRadius: '14px', background: 'var(--accent-blue-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', boxShadow: '0 8px 24px var(--accent-blue-glow)', flexShrink: 0 }}>
            <ShieldCheck size={28} />
          </div>
          <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800, letterSpacing: '-0.03em', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              FinVanguard <span style={{ color: '#38bdf8', fontSize: '0.82rem', fontWeight: 700, padding: '0.15rem 0.55rem', background: 'rgba(56, 189, 248, 0.15)', borderRadius: '6px' }}>NBFC</span>
            </h1>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>License No: {config.system.rbiLicenseNo}</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
          <button
            onClick={toggleTheme}
            className="btn-secondary"
            style={{ padding: '0.5rem 0.9rem', fontSize: '0.85rem', gap: '0.45rem' }}
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
          >
            {theme === 'dark' ? <Sun size={17} style={{ color: '#facc15' }} /> : <Moon size={17} style={{ color: '#38bdf8' }} />}
            <span style={{ fontWeight: 600 }}>{theme === 'dark' ? 'Light Mode' : 'Dark Mode'}</span>
          </button>

          <div className="trust-badge">
            <CheckCircle2 size={13} /> RBI Regulated
          </div>
          <div className="trust-badge" style={{ background: 'var(--accent-blue-glow)', borderColor: 'rgba(56, 189, 248, 0.35)', color: 'var(--accent-blue)' }}>
            <Lock size={12} /> 256-Bit SSL
          </div>
        </div>
      </header>

      {/* Main Split Showcase */}
      <main style={{ maxWidth: '1350px', margin: '2.5rem auto', width: '100%', display: 'grid', gridTemplateColumns: '1.15fr 1fr', gap: '3.5rem', alignItems: 'center' }}>
        
        {/* Left Column: Brand Hero & Key Feature Highlights */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
          
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.85rem', background: 'var(--surface-hover)', border: '1px solid var(--surface-glass-border)', borderRadius: '9999px', width: 'fit-content', fontSize: '0.82rem', fontWeight: 600, color: 'var(--accent-blue)' }}>
            <Zap size={15} /> Instant Digital Loan Processing System
          </div>

          <h1 style={{ fontSize: '3rem', fontWeight: 800, lineHeight: 1.15, letterSpacing: '-0.03em', color: 'var(--text-primary)' }}>
            Automated Credit Evaluation & <span style={{ background: 'linear-gradient(135deg, #38bdf8 0%, #818cf8 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Instant Loan Disbursal</span>
          </h1>

          <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.6, maxWidth: '580px' }}>
            Next-generation Non-Banking Financial Company platform with automated CIBIL bureau fetch, multi-tier RBAC underwriting, and instant bank disbursement.
          </p>

          {/* Key Feature Highlight Cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '0.5rem' }}>
            
            <div className="glass-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--accent-emerald-glow)', border: '1px solid rgba(16, 185, 129, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-emerald)', flexShrink: 0 }}>
                <CheckCircle2 size={24} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>Instant CIBIL & KYC Bureau Fetch</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Automated credit scoring and document verification within seconds.</p>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--accent-blue-glow)', border: '1px solid rgba(56, 189, 248, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-blue)', flexShrink: 0 }}>
                <Shield size={24} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>Multi-Tier RBAC Underwriting Workflow</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Strict role segregation for Loan Officers, Credit Analysts, and Managers.</p>
              </div>
            </div>

            <div className="glass-card" style={{ padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'var(--accent-gold-glow)', border: '1px solid rgba(251, 191, 36, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent-gold)', flexShrink: 0 }}>
                <Zap size={24} />
              </div>
              <div>
                <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-primary)' }}>Real-Time Disbursal Engine</h4>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>Direct NEFT/RTGS bank disbursal upon manager sanction approval.</p>
              </div>
            </div>

          </div>

          {/* Stats Ticker */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginTop: '0.5rem' }}>
            <div className="glass-card" style={{ padding: '1rem 1.15rem' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>₹500Cr+</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Total Disbursed</div>
            </div>
            <div className="glass-card" style={{ padding: '1rem 1.15rem' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>15 Mins</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Avg Approval Speed</div>
            </div>
            <div className="glass-card" style={{ padding: '1rem 1.15rem' }}>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-gold)', fontFamily: 'var(--font-mono)' }}>99.8%</div>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>RBAC Compliance</div>
            </div>
          </div>

        </div>

        {/* Right Column: Glass Auth Container */}
        <div className="glass-panel" style={{ padding: '2.25rem', boxShadow: 'var(--shadow-md), var(--shadow-glow)' }}>
          
          {/* Account Suspended Banner */}
          {isAccountSuspended ? (
            <div style={{ 
              padding: '1.25rem', 
              background: 'rgba(239, 68, 68, 0.15)', 
              border: '2px solid rgba(239, 68, 68, 0.5)', 
              borderRadius: '16px', 
              color: '#f87171',
              marginBottom: '1.5rem', 
              boxShadow: '0 8px 24px rgba(239, 68, 68, 0.2)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '1.1rem', fontWeight: 800, color: '#f87171', marginBottom: '0.5rem' }}>
                <AlertOctagon size={24} /> Account Suspended
              </div>
              <p style={{ fontSize: '0.88rem', lineHeight: 1.5, color: '#fca5a5' }}>
                {error || sessionError || "This account has been suspended due to 3 consecutive failed OTP attempts. Please contact your NBFC Administrator to reactivate your access."}
              </p>
              <button
                onClick={() => { setError(''); setMfaChallenge(null); }}
                className="btn-secondary"
                style={{ marginTop: '1rem', padding: '0.4rem 0.85rem', fontSize: '0.8rem', gap: '0.4rem' }}
              >
                <ArrowLeft size={15} /> Back to Login
              </button>
            </div>
          ) : mfaChallenge && mfaChallenge.requiresPhone ? (
            /* STEP 1.5: PHONE NUMBER BINDING FOR GOOGLE SSO */
            <div>
              <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
                  <Smartphone size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>Link Mobile Phone</h2>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Google SSO Verified: Register phone for 2FA OTP</p>
                </div>
              </div>

              <div style={{ padding: '0.85rem 1rem', background: 'var(--surface-hover)', border: '1px solid var(--surface-glass-border)', borderRadius: '12px', marginBottom: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span>Verified Google Account: </span>
                <span style={{ color: '#38bdf8', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{mfaChallenge.userEmail}</span>
              </div>

              {error && (
                <div style={{ 
                  padding: '0.85rem 1rem', 
                  background: 'rgba(244, 63, 94, 0.15)', 
                  border: '1px solid rgba(244, 63, 94, 0.45)', 
                  borderRadius: '12px', 
                  color: 'var(--accent-rose)', 
                  fontSize: '0.85rem', 
                  fontWeight: 600,
                  marginBottom: '1.25rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.6rem'
                }}>
                  <ShieldAlert size={18} style={{ flexShrink: 0 }} /> 
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleBindPhoneSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Mobile Phone Number (for 2FA SMS OTP)
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+91 98765 43210"
                    value={phoneInput}
                    onChange={(e) => setPhoneInput(e.target.value)}
                    className="glass-input"
                    style={{ fontSize: '1.05rem', fontWeight: 700, padding: '0.75rem' }}
                    autoFocus
                  />
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem' }}>
                    🔒 We will send a 6-digit SMS OTP code to this mobile number for 2-Step Authentication.
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || !phoneInput.trim()}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {loading ? 'Sending SMS OTP...' : 'Send 2FA SMS OTP'} <ArrowRight size={17} />
                </button>
              </form>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--surface-glass-border)' }}>
                <button
                  type="button"
                  onClick={() => { setMfaChallenge(null); setError(''); }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <ArrowLeft size={15} /> Cancel Login
                </button>
              </div>
            </div>
          ) : mfaChallenge ? (
            /* STEP 2: 6-DIGIT SMS OTP VERIFICATION CARD */
            <div>
              <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <div style={{ width: '40px', height: '40px', borderRadius: '12px', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#38bdf8' }}>
                  <Smartphone size={22} />
                </div>
                <div>
                  <h2 style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)' }}>2FA SMS Verification</h2>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>Step 2: Enter 6-digit authentication OTP</p>
                </div>
              </div>

              <div style={{ padding: '0.85rem 1rem', background: 'var(--surface-hover)', border: '1px solid var(--surface-glass-border)', borderRadius: '12px', marginBottom: '1.25rem', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                <span>OTP code sent to mobile number: </span>
                <span style={{ color: '#38bdf8', fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{mfaChallenge.maskedPhone}</span>
              </div>

              {error && (
                <div style={{ 
                  padding: '0.85rem 1rem', 
                  background: 'rgba(244, 63, 94, 0.15)', 
                  border: '1px solid rgba(244, 63, 94, 0.45)', 
                  borderRadius: '12px', 
                  color: 'var(--accent-rose)', 
                  fontSize: '0.85rem', 
                  fontWeight: 600,
                  marginBottom: '1.25rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.6rem'
                }}>
                  <ShieldAlert size={18} style={{ flexShrink: 0 }} /> 
                  <span>{error}</span>
                </div>
              )}

              {resendSuccess && (
                <div style={{ 
                  padding: '0.85rem 1rem', 
                  background: 'rgba(16, 185, 129, 0.15)', 
                  border: '1px solid rgba(16, 185, 129, 0.45)', 
                  borderRadius: '12px', 
                  color: 'var(--accent-emerald)', 
                  fontSize: '0.85rem', 
                  fontWeight: 600,
                  marginBottom: '1.25rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.6rem'
                }}>
                  <CheckCircle2 size={18} style={{ flexShrink: 0 }} /> 
                  <span>{resendSuccess}</span>
                </div>
              )}

              <form onSubmit={handleOtpSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
                    Enter 6-Digit Code
                  </label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="000000"
                    value={otpInput}
                    onChange={(e) => setOtpInput(e.target.value.replace(/\D/g, ''))}
                    className="glass-input"
                    style={{ 
                      textAlign: 'center', 
                      letterSpacing: '0.5em', 
                      fontSize: '1.6rem', 
                      fontWeight: 800,
                      fontFamily: 'var(--font-mono)',
                      padding: '0.75rem'
                    }}
                    autoFocus
                  />
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.4rem', textAlign: 'center' }}>
                    ⚠️ Account will auto-suspend after 3 consecutive invalid attempts.
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading || otpInput.length !== 6}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center' }}
                >
                  {loading ? 'Verifying OTP...' : 'Verify & Log In'} <ArrowRight size={17} />
                </button>
              </form>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--surface-glass-border)' }}>
                <button
                  type="button"
                  onClick={() => { setMfaChallenge(null); setError(''); setOtpInput(''); }}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.82rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <ArrowLeft size={15} /> Cancel Login
                </button>

                <button
                  type="button"
                  disabled={resendLoading}
                  onClick={handleResendOtp}
                  style={{ background: 'transparent', border: 'none', color: '#38bdf8', fontSize: '0.82rem', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                >
                  <RefreshCw size={15} className={resendLoading ? 'spin' : ''} /> {resendLoading ? 'Sending...' : 'Resend SMS OTP'}
                </button>
              </div>

            </div>
          ) : (
            /* STEP 1: INITIAL LOGIN FORM */
            <div>
              <div style={{ marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.35rem' }}>Portal Sign In</h2>
                <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)' }}>Sign in with your enterprise credentials or Google SSO.</p>
              </div>

              {(sessionError || error) && (
                <div style={{ 
                  padding: '0.9rem 1.1rem', 
                  background: 'rgba(244, 63, 94, 0.15)', 
                  border: '1px solid rgba(244, 63, 94, 0.45)', 
                  borderRadius: '12px', 
                  color: 'var(--accent-rose)', 
                  fontSize: '0.88rem', 
                  fontWeight: 600,
                  marginBottom: '1.25rem', 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '0.6rem',
                  boxShadow: '0 4px 14px rgba(244, 63, 94, 0.25)'
                }}>
                  <ShieldAlert size={18} style={{ flexShrink: 0 }} /> 
                  <span>{sessionError || error}</span>
                </div>
              )}

              {/* Sign In Form */}
              <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Work Email Address</label>
                  <div style={{ position: 'relative' }}>
                    <Mail size={17} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type="email"
                      required
                      placeholder="name@nbfc.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="glass-input"
                      style={{ paddingLeft: '2.75rem' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Password</label>
                  <div style={{ position: 'relative' }}>
                    <KeyRound size={17} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <input
                      type={showPassword ? 'text' : 'password'}
                      required
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="glass-input"
                      style={{ paddingLeft: '2.75rem', paddingRight: '2.75rem' }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '0.2rem', display: 'flex', alignItems: 'center' }}
                      title={showPassword ? 'Hide Password' : 'Show Password'}
                    >
                      {showPassword ? <EyeOff size={17} /> : <Eye size={17} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary"
                  style={{ width: '100%', marginTop: '0.5rem' }}
                >
                  {loading ? 'Authenticating...' : 'Sign In to Portal'} <ArrowRight size={17} />
                </button>
              </form>

              {/* Social Sign-in */}
              <div style={{ marginTop: '1.75rem', textAlign: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
                  <div style={{ flex: 1, height: '1px', background: 'var(--surface-glass-border)' }}></div>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700, letterSpacing: '0.05em' }}>Or Instant Access</span>
                  <div style={{ flex: 1, height: '1px', background: 'var(--surface-glass-border)' }}></div>
                </div>

                {/* Styled Google Single Sign-On Button */}
                <button
                  onClick={handleGoogleAuth}
                  className="btn-google"
                  style={{ marginBottom: '0.5rem' }}
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                  </svg>
                  <span>Continue with Google Single Sign-On</span>
                </button>
                <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
                  🔒 Google SSO is restricted to Applicant accounts only. Staff must log in via password.
                </div>

                {/* Quick Demo Role Switcher Chips */}
                <div style={{ textAlign: 'left', borderTop: '1px solid var(--surface-glass-border)', paddingTop: '1.25rem' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Sparkles size={13} color="#38bdf8" /> Demo Quick Persona Login:
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                    {Object.values(config.roles).map((r) => (
                      <button
                        key={r.id}
                        onClick={() => switchRole(r.id)}
                        style={{
                          padding: '0.4rem 0.85rem',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--surface-glass-border)',
                          borderRadius: '9999px',
                          color: r.color,
                          fontSize: '0.78rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                          transition: 'all 0.2s ease',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.35rem'
                        }}
                      >
                        <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: r.color }}></span>
                        {r.name}
                      </button>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

        </div>

      </main>

      {/* Footer Disclaimer */}
      <footer style={{ maxWidth: '1350px', margin: '0 auto', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--surface-glass-border)', paddingTop: '1.25rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        <div>© 2026 FinVanguard Finance (India) Ltd. All rights reserved. Registered NBFC under RBI.</div>
        <div style={{ display: 'flex', gap: '1.5rem' }}>
          <span>Privacy Policy</span>
          <span>Terms of Service</span>
          <span>RBI Fair Practice Code</span>
        </div>
      </footer>

      {/* Google SSO Selection Modal */}
      <GoogleAuthModal
        isOpen={isGoogleModalOpen}
        onClose={() => setIsGoogleModalOpen(false)}
        onMfaRequired={(mfaRes) => setMfaChallenge(mfaRes)}
      />

    </div>
  );
}
