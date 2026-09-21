import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import api from '../../services/api';
import { logEvent } from '../../utils/logger';
import { 
  Shield, FileCheck, Calculator, CheckCircle2, XCircle, ArrowRight, 
  AlertTriangle, Landmark, Send, Search, Filter, Eye, Activity, Sparkles,
  TrendingUp, Gauge, UserCheck
} from 'lucide-react';

export default function StaffDashboard() {
  const { currentUser, config } = useAuth();
  const currentRoleObj = config.roles[currentUser.role] || { name: currentUser.role };

  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedLoan, setSelectedLoan] = useState(null);

  const [queue, setQueue] = useState([
    {
      id: "LN-2026-8849",
      applicantName: "Priya Sharma",
      applicantEmail: "priya.sharma@example.com",
      type: "Personal Loan",
      amount: 500000,
      tenureMonths: 36,
      monthlyIncome: 95000,
      existingObligations: 15000,
      cibilScore: 785,
      status: "UNDERWRITING", // SUBMITTED, DOC_VERIFIED, UNDERWRITING, SANCTIONED, DISBURSED
      kycVerified: true,
      foir: 32, // %
      riskGrade: "LOW",
      actionTaken: null
    },
    {
      id: "LN-2026-9102",
      applicantName: "Rahul Verma",
      applicantEmail: "rahul.v@example.com",
      type: "Business Loan",
      amount: 2500000,
      tenureMonths: 48,
      monthlyIncome: 350000,
      existingObligations: 120000,
      cibilScore: 690,
      status: "SUBMITTED",
      kycVerified: false,
      foir: 52,
      riskGrade: "MEDIUM",
      actionTaken: null
    },
    {
      id: "LN-2026-7451",
      applicantName: "Vikram Malhotra",
      applicantEmail: "vikram.m@example.com",
      type: "Home Renovation",
      amount: 1200000,
      tenureMonths: 60,
      monthlyIncome: 180000,
      existingObligations: 45000,
      cibilScore: 810,
      status: "SANCTIONED",
      kycVerified: true,
      foir: 28,
      riskGrade: "LOW",
      actionTaken: "Sanction Letter Issued"
    }
  ]);

  useEffect(() => {
    const fetchQueue = async () => {
      try {
        const data = await api.getLoans();
        if (Array.isArray(data) && data.length > 0) {
          setQueue(data);
        }
      } catch (err) {
        console.warn("Using local queue fallback", err);
      }
    };
    fetchQueue();
  }, []);

  const handleAction = async (appId, newStatus, actionTitle) => {
    try {
      await api.updateLoanStatus(appId, newStatus, actionTitle);
    } catch (err) {
      console.warn("API update status failed, updating locally:", err);
    }
    setQueue(queue.map(q => q.id === appId ? { ...q, status: newStatus, actionTaken: actionTitle } : q));
    logEvent("INFO", "WORKFLOW", `Loan ${appId}: ${actionTitle}`, { appId, newStatus, role: currentUser.role }, currentUser.email, currentUser.role);
    setSelectedLoan(null);
  };

  const filteredQueue = queue.filter(item => {
    const matchesSearch = item.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          item.id.toLowerCase().includes(searchTerm.toLowerCase());
    if (!matchesSearch) return false;
    if (activeTab === 'pending') return item.status === 'SUBMITTED' || item.status === 'DOC_VERIFIED' || item.status === 'UNDERWRITING';
    if (activeTab === 'approved') return item.status === 'SANCTIONED';
    if (activeTab === 'disbursed') return item.status === 'DISBURSED';
    return true;
  });

  return (
    <div className="app-layout-wrapper">
      {/* Collapsible Left Sidebar */}
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Main Workbench Body */}
      <main className="app-main-content" style={{ padding: '2rem' }}>
        
        {/* Top Header Banner */}
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', background: 'radial-gradient(at 0% 0%, rgba(251, 191, 36, 0.15) 0px, transparent 60%), var(--surface-glass)', border: '1px solid rgba(251, 191, 36, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div className="role-badge role-staff" style={{ marginBottom: '0.65rem' }}>
                <Shield size={14} style={{ marginRight: '4px' }} />
                {currentRoleObj.name} Workbench
              </div>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                Loan Processing & Credit Assessment
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '700px' }}>
                Verify credit bureau metrics, inspect FOIR debt service ratios, issue sanction letters, and execute bank disbursements.
              </p>
            </div>

            {/* Quick Metrics */}
            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ background: 'var(--bg-secondary)', padding: '0.85rem 1.25rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--surface-glass-border)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>{queue.length}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Total Queue</div>
              </div>
              <div style={{ background: 'var(--bg-secondary)', padding: '0.85rem 1.25rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--surface-glass-border)', textAlign: 'center' }}>
                <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--accent-gold)', fontFamily: 'var(--font-mono)' }}>2</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Pending Review</div>
              </div>
            </div>
          </div>
        </div>

        {/* Search & Filter Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', width: '320px' }}>
            <Search size={17} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder="Search Applicant or Loan ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="glass-input"
              style={{ paddingLeft: '2.75rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.5rem' }}>
            {['overview', 'pending', 'approved', 'disbursed'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  padding: '0.55rem 1rem',
                  borderRadius: 'var(--border-radius-sm)',
                  background: activeTab === tab ? 'var(--accent-blue-gradient)' : 'var(--surface-hover)',
                  color: activeTab === tab ? '#fff' : 'var(--text-secondary)',
                  border: '1px solid var(--surface-glass-border)',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  cursor: 'pointer',
                  textTransform: 'capitalize'
                }}
              >
                {tab === 'overview' ? 'All Queue' : tab}
              </button>
            ))}
          </div>
        </div>

        {/* Loan Applications Queue Table */}
        <div className="glass-panel" style={{ padding: '1.5rem' }}>
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Applicant & ID</th>
                  <th>Facility Type</th>
                  <th>Sanction Amount</th>
                  <th>CIBIL & FOIR</th>
                  <th>Workflow Stage</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredQueue.map(item => (
                  <tr key={item.id}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{item.applicantName}</div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>{item.id}</div>
                    </td>

                    <td style={{ fontWeight: 600 }}>{item.type}</td>

                    <td style={{ fontWeight: 800, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)', fontSize: '1rem' }}>
                      ₹{item.amount.toLocaleString('en-IN')}
                    </td>

                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{
                          padding: '0.2rem 0.55rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          background: item.cibilScore >= config.businessLimits.minCibilScore ? 'var(--accent-emerald-glow)' : 'rgba(244, 63, 94, 0.15)',
                          color: item.cibilScore >= config.businessLimits.minCibilScore ? 'var(--accent-emerald)' : 'var(--accent-rose)'
                        }}>
                          CIBIL {item.cibilScore}
                        </span>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                          FOIR {item.foir}%
                        </span>
                      </div>
                    </td>

                    <td>
                      <span className={`status-pill status-${item.status.toLowerCase()}`}>
                        {item.status}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                        <button
                          onClick={() => setSelectedLoan(item)}
                          className="btn-secondary"
                          style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem', gap: '0.35rem' }}
                        >
                          <Eye size={14} /> Inspect
                        </button>

                        {(currentUser.role === 'REVIEWER' || currentUser.role === 'LOAN_OFFICER') && (
                          <button
                            onClick={() => handleAction(item.id, 'DOC_VERIFIED', 'KYC & Income Documents Verified')}
                            className="btn-primary"
                            style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                          >
                            <FileCheck size={14} /> Verify Documents
                          </button>
                        )}

                        {(currentUser.role === 'APPROVER' || currentUser.role === 'CREDIT_ANALYST') && (
                          <button
                            onClick={() => handleAction(item.id, 'UNDERWRITING', 'Credit Risk Underwriting Completed')}
                            className="btn-primary btn-emerald"
                            style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                          >
                            <Calculator size={14} /> Underwrite & Approve
                          </button>
                        )}

                        {(currentUser.role === 'SANCTIONING_OFFICER' || currentUser.role === 'CREDIT_MANAGER') && (
                          <button
                            onClick={() => handleAction(item.id, 'SANCTIONED', 'Sanction Letter Issued')}
                            className="btn-primary"
                            style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem', background: 'var(--accent-purple-gradient)' }}
                          >
                            <Send size={14} /> Issue Sanction Letter
                          </button>
                        )}

                        {(currentUser.role === 'MANAGER' || currentUser.role === 'OPS_DISBURSEMENT') && (
                          <button
                            onClick={() => handleAction(item.id, 'DISBURSED', 'Funds Disbursed to Bank Account via NEFT')}
                            className="btn-primary btn-emerald"
                            style={{ padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                          >
                            <Landmark size={14} /> Authorize & Disburse
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Loan Inspection Modal */}
        {selectedLoan && (
          <div className="modal-overlay">
            <div className="modal-content" style={{ maxWidth: '680px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid var(--surface-glass-border)', paddingBottom: '1rem' }}>
                <div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--accent-blue)', fontFamily: 'var(--font-mono)' }}>{selectedLoan.id}</div>
                  <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-primary)' }}>Applicant Dossier: {selectedLoan.applicantName}</h3>
                </div>
                <button onClick={() => setSelectedLoan(null)} className="btn-secondary" style={{ padding: '0.35rem 0.75rem' }}>✕</button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--surface-glass-border)' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>CIBIL Bureau Credit Score</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: selectedLoan.cibilScore >= 750 ? 'var(--accent-emerald)' : 'var(--accent-gold)', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
                      {selectedLoan.cibilScore} / 900
                    </div>
                  </div>

                  <div style={{ background: 'var(--bg-secondary)', padding: '1rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--surface-glass-border)' }}>
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>FOIR Debt Service Ratio</div>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: selectedLoan.foir <= 50 ? 'var(--accent-emerald)' : 'var(--accent-rose)', fontFamily: 'var(--font-mono)', marginTop: '0.2rem' }}>
                      {selectedLoan.foir}%
                    </div>
                  </div>
                </div>

                <div style={{ background: 'var(--bg-tertiary)', padding: '1.15rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--surface-glass-border)' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.65rem' }}>Financial Summary</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.88rem' }}>
                    <div><span style={{ color: 'var(--text-muted)' }}>Monthly Income:</span> <strong>₹{selectedLoan.monthlyIncome.toLocaleString('en-IN')}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Existing EMI Debt:</span> <strong>₹{selectedLoan.existingObligations.toLocaleString('en-IN')}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Loan Facility:</span> <strong>{selectedLoan.type}</strong></div>
                    <div><span style={{ color: 'var(--text-muted)' }}>Sanction Amount:</span> <strong style={{ color: 'var(--accent-emerald)' }}>₹{selectedLoan.amount.toLocaleString('en-IN')}</strong></div>
                  </div>
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button onClick={() => setSelectedLoan(null)} className="btn-secondary">Close Dossier</button>
                  <button
                    onClick={() => handleAction(selectedLoan.id, 'SANCTIONED', 'Approved via Dossier Modal')}
                    className="btn-primary"
                  >
                    Authorize Sanction
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

      </main>
    </div>
  );
}
