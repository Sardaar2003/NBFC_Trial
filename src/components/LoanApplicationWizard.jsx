import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import CustomSelect from './CustomSelect';
import MessageModal from './MessageModal';
import { 
  FileText, ShieldCheck, CheckCircle2, User, Briefcase, Landmark, 
  UploadCloud, Calculator, ArrowRight, ArrowLeft, Sparkles, AlertCircle, File
} from 'lucide-react';

export default function LoanApplicationWizard({ onComplete }) {
  const { currentUser, config } = useAuth();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [submittedLoan, setSubmittedLoan] = useState(null);

  // Form State across 5 Steps
  const [formData, setFormData] = useState({
    // Step 1: Personal & KYC
    fullName: currentUser?.name || 'Mantej Singh',
    dob: '2003-07-01',
    gender: 'MALE',
    phone: currentUser?.phone || '+91 98765 43210',
    email: currentUser?.email || 'mantej.singh@example.com',
    currentAddress: 'House No 45, Civil Lines, Cyber City, Gurgaon, Haryana - 122002',
    panNumber: 'ABCPS1234F',
    aadhaarNumber: '987654321012',

    // Step 2: Employment & Income
    employmentType: 'SALARIED',
    employerName: 'FinVanguard Technologies Ltd',
    designation: 'Senior Software Engineer',
    totalExperienceYears: 4,
    monthlyIncome: 95000,

    // Step 3: Banking & Liabilities
    bankName: 'HDFC Bank',
    accountNumber: '501002348849',
    ifscCode: 'HDFC0001234',
    existingEMIs: 15000,

    // Step 4: Loan Requirement
    type: 'Personal Loan',
    amount: 500000,
    tenureMonths: 36,
    purpose: 'Home Renovation & Asset Purchase'
  });

  // Uploaded Files & Error State
  const [uploadedDocs, setUploadedDocs] = useState([]);
  const [uploadingDocType, setUploadingDocType] = useState('');
  const [wizardError, setWizardError] = useState('');
  const [uploadError, setUploadError] = useState('');
  const [modalState, setModalState] = useState({ isOpen: false, title: '', message: '', type: 'info', details: null });

  // Calculate Real-Time EMI & FOIR
  const requestedAmount = Number(formData.amount || 500000);
  const months = Number(formData.tenureMonths || 36);
  const monthlyRate = 0.12 / 12;
  const calculatedEmi = Math.round(
    (requestedAmount * monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1)
  );
  const netIncome = Number(formData.monthlyIncome || 95000);
  const existingObligations = Number(formData.existingEMIs || 15000);
  const calculatedFoir = Math.round(((existingObligations + calculatedEmi) / netIncome) * 100);

  // Upload file to Document Vault
  const handleFileUpload = async (e, docType) => {
    setUploadError('');
    const file = e.target.files[0];
    if (!file) return;

    if (!submittedLoan?.id) {
      setUploadError("Please complete loan application details before uploading documents.");
      return;
    }

    setUploadingDocType(docType);
    const reader = new FileReader();
    reader.onload = async () => {
      const base64Data = reader.result;
      try {
        const res = await api.uploadDocumentToVault(
          submittedLoan.id,
          docType,
          file.name,
          base64Data,
          file.type
        );
        if (res.success && res.document) {
          setUploadedDocs(prev => [...prev, res.document]);
          setUploadError('');
        }
      } catch (err) {
        const errorMsg = err.message || 'Failed to upload document.';
        setUploadError(errorMsg);
        setModalState({
          isOpen: true,
          title: 'Document Upload Failed',
          message: `Unable to upload file "${file.name}".`,
          details: errorMsg,
          type: 'error'
        });
      } finally {
        setUploadingDocType('');
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit Application
  const handleSubmitApplication = async () => {
    setWizardError('');
    setSubmitting(true);
    try {
      const payload = {
        type: formData.type,
        amount: formData.amount,
        tenureMonths: formData.tenureMonths,
        purpose: formData.purpose,
        applicantDetails: {
          fullName: formData.fullName,
          dob: formData.dob,
          gender: formData.gender,
          phone: formData.phone,
          email: formData.email,
          currentAddress: formData.currentAddress,
          panNumber: formData.panNumber,
          aadhaarNumber: formData.aadhaarNumber
        },
        employmentDetails: {
          employmentType: formData.employmentType,
          employerName: formData.employerName,
          designation: formData.designation,
          totalExperienceYears: formData.totalExperienceYears,
          monthlyIncome: formData.monthlyIncome
        },
        bankingDetails: {
          bankName: formData.bankName,
          accountNumber: formData.accountNumber,
          ifscCode: formData.ifscCode
        },
        liabilitiesDetails: {
          existingEMIs: formData.existingEMIs
        },
        cibilScore: 785,
        foir: calculatedFoir,
        riskGrade: calculatedFoir > 55 ? 'MEDIUM' : 'LOW'
      };

      const res = await api.createLoan(payload);
      if (res.success && res.loan) {
        setSubmittedLoan(res.loan);
        setStep(5); // Move to Document Vault Upload
      }
    } catch (err) {
      setWizardError("Application Submission Note: " + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Wizard Header Progress Indicator */}
      <div className="glass-panel" style={{ padding: '1.5rem 2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {[
            { s: 1, title: 'Personal & KYC', icon: User },
            { s: 2, title: 'Employment', icon: Briefcase },
            { s: 3, title: 'Banking', icon: Landmark },
            { s: 4, title: 'Loan Terms', icon: Calculator },
            { s: 5, title: 'Document Vault', icon: UploadCloud }
          ].map(({ s, title, icon: Icon }) => {
            const isActive = step === s;
            const isCompleted = step > s;
            return (
              <div key={s} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem', opacity: isActive || isCompleted ? 1 : 0.4 }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '50%',
                  background: isCompleted ? '#34d399' : isActive ? 'var(--accent-blue-gradient)' : 'rgba(255,255,255,0.1)',
                  color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800
                }}>
                  {isCompleted ? <CheckCircle2 size={20} /> : <Icon size={18} />}
                </div>
                <span style={{ fontSize: '0.76rem', fontWeight: 700, color: isActive ? 'var(--accent-blue)' : 'var(--text-secondary)' }}>
                  {title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* STEP 1: Personal Details & DigiLocker e-KYC */}
      {step === 1 && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ borderBottom: '1px solid var(--surface-glass-border)', paddingBottom: '1rem', marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>1. Basic Applicant Information & KYC</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: 0 }}>RBI-compliant identity verification & Customer Due Diligence (CDD).</p>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Full Name (as per PAN)</label>
              <input type="text" className="glass-input" value={formData.fullName} onChange={(e) => setFormData({ ...formData, fullName: e.target.value })} required />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Date of Birth</label>
              <input type="date" className="glass-input" value={formData.dob} onChange={(e) => setFormData({ ...formData, dob: e.target.value })} required />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Mobile Number</label>
              <input type="text" className="glass-input" value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} required />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>PAN Number</label>
              <input type="text" className="glass-input" value={formData.panNumber} onChange={(e) => setFormData({ ...formData, panNumber: e.target.value.toUpperCase() })} required style={{ fontFamily: 'var(--font-mono)' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Aadhaar Number (12 Digits)</label>
              <input type="text" className="glass-input" value={formData.aadhaarNumber} onChange={(e) => setFormData({ ...formData, aadhaarNumber: e.target.value })} required style={{ fontFamily: 'var(--font-mono)' }} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Current Residential Address</label>
              <input type="text" className="glass-input" value={formData.currentAddress} onChange={(e) => setFormData({ ...formData, currentAddress: e.target.value })} required />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button type="button" onClick={() => setStep(2)} className="btn-primary" style={{ padding: '0.7rem 1.75rem', gap: '0.5rem' }}>
              Next: Employment <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 2: Employment & Income Details */}
      {step === 2 && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>2. Employment & Income Profile</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Employment Category</label>
              <CustomSelect
                options={[
                  { value: 'SALARIED', label: 'Salaried Employee' },
                  { value: 'SELF_EMPLOYED', label: 'Self-Employed / MSME Owner' }
                ]}
                value={formData.employmentType}
                onChange={(val) => setFormData({ ...formData, employmentType: val })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Employer / Business Name</label>
              <input type="text" className="glass-input" value={formData.employerName} onChange={(e) => setFormData({ ...formData, employerName: e.target.value })} required />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Designation / Designation</label>
              <input type="text" className="glass-input" value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} required />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Net Monthly Income (₹)</label>
              <input type="number" className="glass-input" value={formData.monthlyIncome} onChange={(e) => setFormData({ ...formData, monthlyIncome: Number(e.target.value) })} required style={{ fontFamily: 'var(--font-mono)' }} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
            <button type="button" onClick={() => setStep(1)} className="btn-secondary" style={{ padding: '0.7rem 1.5rem', gap: '0.5rem' }}>
              <ArrowLeft size={16} /> Back
            </button>
            <button type="button" onClick={() => setStep(3)} className="btn-primary" style={{ padding: '0.7rem 1.75rem', gap: '0.5rem' }}>
              Next: Banking <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 3: Banking & Liabilities */}
      {step === 3 && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>3. Banking & Existing Monthly Liabilities</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Bank Name</label>
              <input type="text" className="glass-input" value={formData.bankName} onChange={(e) => setFormData({ ...formData, bankName: e.target.value })} required />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Account Number</label>
              <input type="text" className="glass-input" value={formData.accountNumber} onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })} required style={{ fontFamily: 'var(--font-mono)' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>IFSC Code</label>
              <input type="text" className="glass-input" value={formData.ifscCode} onChange={(e) => setFormData({ ...formData, ifscCode: e.target.value.toUpperCase() })} required style={{ fontFamily: 'var(--font-mono)' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Existing Monthly Loan EMIs (₹)</label>
              <input type="number" className="glass-input" value={formData.existingEMIs} onChange={(e) => setFormData({ ...formData, existingEMIs: Number(e.target.value) })} required style={{ fontFamily: 'var(--font-mono)' }} />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
            <button type="button" onClick={() => setStep(2)} className="btn-secondary" style={{ padding: '0.7rem 1.5rem', gap: '0.5rem' }}>
              <ArrowLeft size={16} /> Back
            </button>
            <button type="button" onClick={() => setStep(4)} className="btn-primary" style={{ padding: '0.7rem 1.75rem', gap: '0.5rem' }}>
              Next: Loan Terms <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 4: Loan Terms & Real-Time Underwriting Preview */}
      {step === 4 && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--text-primary)' }}>4. Loan Facility Requirements</h2>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Facility Type</label>
              <CustomSelect
                options={[
                  { value: 'Personal Loan', label: 'Personal Loan' },
                  { value: 'Business Loan', label: 'Business / MSME Loan' },
                  { value: 'Home Renovation', label: 'Home Renovation Loan' },
                  { value: 'Medical Loan', label: 'Medical Loan' }
                ]}
                value={formData.type}
                onChange={(val) => setFormData({ ...formData, type: val })}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Requested Loan Amount (₹)</label>
              <input type="number" className="glass-input" value={formData.amount} onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })} required style={{ fontFamily: 'var(--font-mono)' }} />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Tenure (Months)</label>
              <CustomSelect
                options={[
                  { value: 12, label: '12 Months (1 Year)' },
                  { value: 24, label: '24 Months (2 Years)' },
                  { value: 36, label: '36 Months (3 Years)' },
                  { value: 48, label: '48 Months (4 Years)' },
                  { value: 60, label: '60 Months (5 Years)' }
                ]}
                value={formData.tenureMonths}
                onChange={(val) => setFormData({ ...formData, tenureMonths: Number(val) })}
              />
            </div>
          </div>

          {/* Underwriting Preview Card */}
          <div style={{ marginTop: '1.75rem', padding: '1.25rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px solid var(--surface-glass-border)', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', textAlign: 'center' }}>
            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Estimated Monthly EMI</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>₹{calculatedEmi.toLocaleString('en-IN')}</div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Calculated FOIR Capacity</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: calculatedFoir <= 55 ? '#34d399' : '#f43f5e', fontFamily: 'var(--font-mono)' }}>{calculatedFoir}%</div>
            </div>

            <div>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>FOIR Limit Policy</div>
              <div style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-primary)', marginTop: '0.2rem' }}>Max {config?.businessLimits?.maxFOIRPercentage || 55}%</div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
            <button type="button" onClick={() => setStep(3)} className="btn-secondary" style={{ padding: '0.7rem 1.5rem', gap: '0.5rem' }}>
              <ArrowLeft size={16} /> Back
            </button>
            <button type="button" onClick={handleSubmitApplication} disabled={submitting} className="btn-primary" style={{ padding: '0.7rem 1.75rem', gap: '0.5rem' }}>
              {submitting ? 'Submitting Application...' : 'Create Application & Open Vault'} <ArrowRight size={16} />
            </button>
          </div>
        </div>
      )}

      {/* STEP 5: Verification Document Upload */}
      {step === 5 && submittedLoan && (
        <div className="glass-panel" style={{ padding: '2rem' }}>
          <div style={{ padding: '1rem 1.25rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: '12px', color: '#34d399', fontSize: '0.9rem', fontWeight: 600, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <CheckCircle2 size={22} />
            <span>Loan Application Created Successfully! Application ID: <strong style={{ fontFamily: 'var(--font-mono)' }}>{submittedLoan.id}</strong>. Now upload your mandatory verification documents.</span>
          </div>

          <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1.25rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UploadCloud size={20} color="#38bdf8" /> Upload Verification Documents
          </h2>

          {uploadError && (
            <div style={{ padding: '0.85rem 1.1rem', background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)', borderRadius: '10px', color: '#f43f5e', fontSize: '0.85rem', fontWeight: 600, marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <AlertCircle size={18} />
              <span>{uploadError}</span>
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
            {[
              { type: 'PAN_CARD', label: 'PAN Card Copy (PDF/JPG)' },
              { type: 'AADHAAR_CARD', label: 'Aadhaar Card / OVD (PDF/JPG)' },
              { type: 'SALARY_SLIP', label: 'Last 3 Months Salary Slips (PDF)' },
              { type: 'BANK_STATEMENT', label: 'Last 6 Months Bank Statement (PDF)' },
              { type: 'ITR_RETURNS', label: 'Form 16 / ITR Returns (PDF)' }
            ].map((doc) => (
              <div key={doc.type} style={{ padding: '1.25rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '12px', border: '1px solid var(--surface-glass-border)' }}>
                <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)', marginBottom: '0.5rem' }}>{doc.label}</div>
                <input
                  type="file"
                  onChange={(e) => handleFileUpload(e, doc.type)}
                  disabled={uploadingDocType === doc.type}
                  style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}
                />
                {uploadingDocType === doc.type && (
                  <div style={{ fontSize: '0.75rem', color: '#38bdf8', marginTop: '0.4rem', fontWeight: 600 }}>
                    Uploading Document...
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Uploaded Files Summary List */}
          {uploadedDocs.length > 0 && (
            <div style={{ marginTop: '1.75rem', paddingTop: '1.25rem', borderTop: '1px solid var(--surface-glass-border)' }}>
              <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)', marginBottom: '0.85rem' }}>
                Uploaded Documents ({uploadedDocs.length})
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem' }}>
                {uploadedDocs.map(d => (
                  <div key={d.docId || d.fileName} style={{ padding: '0.5rem 0.85rem', background: 'rgba(56, 189, 248, 0.1)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '8px', fontSize: '0.8rem', color: '#38bdf8', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <File size={14} />
                    <span>{d.fileName}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button
              type="button"
              onClick={() => {
                if (onComplete) onComplete(submittedLoan);
                else setStep(1);
              }}
              className="btn-primary"
              style={{ padding: '0.75rem 2rem' }}
            >
              Finish & Return to My Applications Dashboard
            </button>
          </div>
        </div>
      )}

      <MessageModal
        isOpen={modalState.isOpen}
        onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
        title={modalState.title}
        message={modalState.message}
        type={modalState.type}
        details={modalState.details}
      />
    </div>
  );
}
