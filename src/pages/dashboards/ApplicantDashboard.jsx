import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import api from '../../services/api';
import { 
  FileText, PlusCircle, Clock, CheckCircle2, AlertCircle, ArrowUpRight, 
  Upload, DollarSign, ShieldCheck, Calculator, FileCheck, FileSpreadsheet,
  AlertTriangle, ArrowRight, Sparkles, ChevronRight, Check
} from 'lucide-react';

import CustomSelect from '../../components/CustomSelect';

import LoanApplicationWizard from '../../components/LoanApplicationWizard';
import DocumentVaultViewer from '../../components/DocumentVaultViewer';

export default function ApplicantDashboard() {
  const { currentUser, config } = useAuth();

  const [applications, setApplications] = useState([]);
  const [showWizard, setShowWizard] = useState(false);
  const [selectedLoanForVault, setSelectedLoanForVault] = useState(null);

  const fetchLoans = async () => {
    try {
      const data = await api.getLoans();
      if (Array.isArray(data)) {
        setApplications(data);
      }
    } catch (err) {
      console.warn("Using fallback local applications list", err);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  return (
    <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '2rem 1.5rem' }}>
      
      {/* Show Loan Wizard if active */}
      {showWizard ? (
        <div>
          <button
            onClick={() => setShowWizard(false)}
            className="btn-secondary"
            style={{ marginBottom: '1.5rem', padding: '0.6rem 1.25rem' }}
          >
            ← Back to Dashboard
          </button>
          <LoanApplicationWizard onComplete={() => { setShowWizard(false); fetchLoans(); }} />
        </div>
      ) : (
        <>
          {/* Welcome Banner */}
          <div className="glass-panel" style={{ padding: '2.25rem', marginBottom: '2.25rem', background: 'radial-gradient(at 0% 0%, rgba(2, 132, 199, 0.18) 0px, transparent 60%), var(--surface-glass)', border: '1px solid var(--surface-glass-border-glow)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
              <div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', padding: '0.35rem 0.85rem', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.35)', borderRadius: '9999px', color: '#38bdf8', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.85rem' }}>
                  <ShieldCheck size={15} /> RBI Verified Borrower Portal
                </div>
                <h1 style={{ fontSize: '2.2rem', fontWeight: 800, marginBottom: '0.4rem', color: 'var(--text-primary)' }}>
                  Welcome back, {currentUser.name}!
                </h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '650px', lineHeight: 1.5 }}>
                  Track your real-time loan approval pipeline, DigiLocker e-KYC status, and secure document vault.
                </p>
              </div>

              <button onClick={() => setShowWizard(true)} className="btn-primary" style={{ padding: '0.95rem 1.85rem', fontSize: '1rem' }}>
                <PlusCircle size={20} /> Apply For New Loan
              </button>
            </div>
          </div>

      {/* Applications List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h2 style={{ fontSize: '1.45rem', fontWeight: 800, color: 'var(--text-primary)' }}>Your Active Credit Facilities</h2>
          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>Showing {applications.length} Active Application(s)</span>
        </div>

        {applications.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '3.5rem 2rem' }}>
            <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'var(--accent-blue-glow)', color: 'var(--accent-blue)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1.25rem auto' }}>
              <FileText size={30} />
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem' }}>No Active Credit Facilities</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '480px', margin: '0 auto 1.5rem auto' }}>
              Welcome! You currently have no active credit applications. Submit your first digital loan request to get instant NBFC credit.
            </p>
            <button onClick={() => setShowNewLoanModal(true)} className="btn-primary" style={{ padding: '0.85rem 1.75rem' }}>
              <PlusCircle size={18} /> Apply For First Loan
            </button>
          </div>
        ) : (
          applications.map(app => (
          <div key={app.id} className="glass-card" style={{ padding: '2rem' }}>
            
            {/* Application Card Top Bar */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.25rem', borderBottom: '1px solid var(--surface-glass-border)', paddingBottom: '1.25rem', marginBottom: '1.5rem' }}>
              <div>
                <div style={{ fontSize: '0.82rem', color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <FileText size={15} /> APP ID: {app.id}
                </div>
                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>{app.type}</h3>
              </div>

              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Sanction Amount Requested</div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-emerald)', fontFamily: 'var(--font-heading)' }}>
                  ₹{Number(app.amount || app.loanRequirement?.amount || 0).toLocaleString('en-IN')}
                </div>
              </div>
            </div>

            {/* Visual 5-Stage Loan Status Stepper */}
            <div style={{ marginBottom: '2rem' }}>
              <div style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Sparkles size={14} color="#38bdf8" /> Real-Time Approval Pipeline:
              </div>

              <div className="stepper-container">
                <div className="stepper-connector">
                  <div 
                    className="stepper-connector-fill" 
                    style={{ 
                      width: app.status === 'SUBMITTED' || app.stage === 'SUBMITTED' ? '0%' : 
                             app.status === 'DOC_VERIFIED' || app.stage === 'DOC_VERIFIED' ? '25%' : 
                             app.status === 'UNDERWRITING' || app.stage === 'UNDERWRITING' ? '50%' : 
                             app.status === 'SANCTIONED' || app.stage === 'SANCTIONED' ? '75%' : '100%' 
                    }}
                  />
                </div>

                {[
                  { step: 'Application', desc: 'Submitted', key: 'SUBMITTED', num: '1' },
                  { step: 'Documents', desc: 'KYC Verified', key: 'DOC_VERIFIED', num: '2' },
                  { step: 'Underwriting', desc: 'Bureau Fetch', key: 'UNDERWRITING', num: '3' },
                  { step: 'Credit Manager', desc: 'Sanction Approval', key: 'SANCTIONED', num: '4' },
                  { step: 'Disbursal', desc: 'Bank Transfer', key: 'DISBURSED', num: '5' }
                ].map((s, idx) => {
                  const statusOrder = ['SUBMITTED', 'DOC_VERIFIED', 'UNDERWRITING', 'SANCTIONED', 'DISBURSED'];
                  const currentStatus = app.status || app.stage || 'SUBMITTED';
                  const appIdx = statusOrder.indexOf(currentStatus);
                  const isCompleted = appIdx > idx;
                  const isCurrent = currentStatus === s.key;

                  return (
                    <div 
                      key={s.key} 
                      className={`stepper-step ${isCompleted ? 'completed' : ''} ${isCurrent ? 'current' : ''}`}
                    >
                      <div className="step-bubble">
                        {isCompleted ? <CheckCircle2 size={22} /> : s.num}
                      </div>
                      <div className="step-label">
                        <div>{s.step}</div>
                        <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 500 }}>{s.desc}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Application Info Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
              <div style={{ background: 'var(--bg-secondary)', padding: '1.1rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--surface-glass-border)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Monthly Installment (EMI)</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
                  ₹{Number(app.emi || app.sanctionDetails?.monthlyEmi || Math.round((Number(app.amount || 500000) * 0.01 * Math.pow(1.01, Number(app.tenureMonths || 36))) / (Math.pow(1.01, Number(app.tenureMonths || 36)) - 1)) || 0).toLocaleString('en-IN')} <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>/ mo</span>
                </div>
              </div>

              <div style={{ background: 'var(--bg-secondary)', padding: '1.1rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--surface-glass-border)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Tenure Duration</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                  {app.tenureMonths || app.loanRequirement?.tenureMonths || 36} Months ({app.interestRate || '10.5%'} p.a.)
                </div>
              </div>

              <div style={{ background: 'var(--bg-secondary)', padding: '1.1rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--surface-glass-border)' }}>
                <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>Application Date</span>
                <div style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', marginTop: '0.2rem', fontFamily: 'var(--font-mono)' }}>
                  {app.appliedDate || app.createdAt ? new Date(app.appliedDate || app.createdAt).toLocaleDateString('en-IN') : '19-Sep-2026'}
                </div>
              </div>
            </div>

            {/* Document Vault Section */}
            <div style={{ borderTop: '1px solid var(--surface-glass-border)', paddingTop: '1.25rem' }}>
              <button
                onClick={() => setSelectedLoanForVault(selectedLoanForVault === app.id ? null : app.id)}
                className="btn-secondary"
                style={{ padding: '0.5rem 1rem', fontSize: '0.82rem', marginBottom: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
              >
                <FileCheck size={16} color="#38bdf8" />
                {selectedLoanForVault === app.id ? 'Hide Document Vault' : 'View Document Vault'}
              </button>

              {selectedLoanForVault === app.id && (
                <DocumentVaultViewer loan={app} onUpdate={fetchLoans} />
              )}
            </div>

          </div>
        ))
        )}
      </div>
    </>
  )}
</div>
  );
}
