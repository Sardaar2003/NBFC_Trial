import React, { useState } from 'react';
import { FileText, CheckCircle2, XCircle, AlertTriangle, ExternalLink, ShieldCheck, Eye, UploadCloud, Lock, Sparkles, RefreshCw } from 'lucide-react';
import api from '../services/api';
import MessageModal from './MessageModal';

export default function DocumentVaultViewer({ loan, onUpdate }) {
  const [loadingDocId, setLoadingDocId] = useState(null);
  const [updatingDocId, setUpdatingDocId] = useState(null);
  const [modalState, setModalState] = useState({ isOpen: false, title: '', message: '', type: 'info', details: null });

  if (!loan) return null;

  const docs = loan.documentVault || [];
  const digilockerInfo = loan.digilocker || {};

  const handleOpenSignedUrl = async (docObj) => {
    setLoadingDocId(docObj.docId);
    try {
      const res = await api.getDocumentSignedUrl(docObj);
      if (res.signedUrl) {
        window.open(res.signedUrl, '_blank', 'noopener,noreferrer');
      } else {
        setModalState({
          isOpen: true,
          title: "Preview Unavailable",
          message: "Could not generate secure preview URL for this document.",
          type: "warning"
        });
      }
    } catch (err) {
      console.error("Failed to generate preview URL:", err);
      setModalState({
        isOpen: true,
        title: "Document Preview Error",
        message: "Failed to open secure document preview.",
        details: err.message,
        type: "error"
      });
    } finally {
      setLoadingDocId(null);
    }
  };

  const handleToggleStatus = async (docId, status) => {
    setUpdatingDocId(docId);
    try {
      await api.updateDocumentStatus(loan.id, docId, status);
      if (onUpdate) onUpdate();
    } catch (err) {
      setModalState({
        isOpen: true,
        title: "Status Update Error",
        message: "Failed to update document verification status.",
        details: err.message,
        type: "error"
      });
    } finally {
      setUpdatingDocId(null);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Header Banner */}
      <div style={{
        padding: '1.25rem 1.5rem',
        background: 'linear-gradient(135deg, rgba(14, 165, 233, 0.12), rgba(99, 102, 241, 0.12))',
        border: '1px solid rgba(56, 189, 248, 0.3)',
        borderRadius: '12px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <UploadCloud size={22} />
          </div>
          <div>
            <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              Secure Document Vault
              <span style={{ fontSize: '0.72rem', background: 'rgba(56, 189, 248, 0.2)', color: '#38bdf8', padding: '0.15rem 0.6rem', borderRadius: '9999px', fontWeight: 600 }}>
                256-Bit Encrypted Storage
              </span>
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              Encrypted document repository for application <strong style={{ color: 'var(--text-primary)' }}>{loan.id}</strong> ({loan.applicantName})
            </div>
          </div>
        </div>

        {digilockerInfo.digilockerVerified && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.85rem',
            background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: '9999px',
            color: '#34d399', fontSize: '0.78rem', fontWeight: 800
          }}>
            <ShieldCheck size={16} />
            <span>DigiLocker Verified e-KYC</span>
          </div>
        )}
      </div>

      {/* Document List Table */}
      {docs.length === 0 ? (
        <div style={{ padding: '2rem', textAlign: 'center', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '12px', border: '1px solid var(--surface-glass-border)', color: 'var(--text-muted)' }}>
          No documents uploaded yet. Use the Loan Application Wizard to upload PAN, Aadhaar, Salary Slips & Bank Statements.
        </div>
      ) : (
        <div className="data-table-container" style={{ border: '1px solid var(--surface-glass-border)', borderRadius: '12px', background: 'var(--surface-card)', overflow: 'hidden' }}>
          <table className="glass-table" style={{ width: '100%' }}>
            <thead>
              <tr>
                <th>Document Type</th>
                <th>File Name & Size</th>
                <th>Storage Reference</th>
                <th>Upload Timestamp</th>
                <th>Verification Status</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {docs.map((doc) => {
                const isVerified = doc.verificationStatus === 'VERIFIED';
                const isRejected = doc.verificationStatus === 'REJECTED';
                const isDiscrepancy = doc.verificationStatus === 'DISCREPANCY';

                return (
                  <tr key={doc.docId}>
                    <td>
                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <FileText size={16} color="#38bdf8" />
                        {doc.docType?.replace(/_/g, ' ')}
                      </div>
                    </td>

                    <td>
                      <div style={{ fontWeight: 600, fontSize: '0.84rem', color: 'var(--text-primary)' }}>{doc.fileName}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        {(doc.fileSize / 1024).toFixed(1)} KB ({doc.mimeType})
                      </div>
                    </td>

                    <td>
                      <div style={{ fontFamily: 'var(--font-mono)', fontSize: '0.74rem', color: '#a78bfa', background: 'rgba(167, 139, 250, 0.1)', padding: '0.25rem 0.5rem', borderRadius: '4px', display: 'inline-block', maxWidth: '240px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {doc.docId ? `DOC-REF-${doc.docId.slice(-8)}` : `DOC-SEC-${doc.fileName}`}
                      </div>
                    </td>

                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                      {doc.uploadedAt ? new Date(doc.uploadedAt).toLocaleString() : 'N/A'}
                    </td>

                    <td>
                      <span style={{
                        padding: '0.25rem 0.65rem',
                        borderRadius: '9999px',
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        fontFamily: 'var(--font-mono)',
                        background: isVerified ? 'rgba(16, 185, 129, 0.15)' : isRejected ? 'rgba(244, 63, 94, 0.15)' : isDiscrepancy ? 'rgba(245, 158, 11, 0.15)' : 'rgba(148, 163, 184, 0.15)',
                        color: isVerified ? '#34d399' : isRejected ? '#f43f5e' : isDiscrepancy ? '#f59e0b' : '#94a3b8',
                        border: `1px solid ${isVerified ? 'rgba(16, 185, 129, 0.35)' : isRejected ? 'rgba(244, 63, 94, 0.35)' : isDiscrepancy ? 'rgba(245, 158, 11, 0.35)' : 'rgba(148, 163, 184, 0.35)'}`
                      }}>
                        {doc.verificationStatus || 'PENDING'}
                      </span>
                    </td>

                    <td style={{ textAlign: 'right' }}>
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                        <button
                          onClick={() => handleOpenSignedUrl(doc)}
                          disabled={loadingDocId === doc.docId}
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                          title="Securely Preview Document"
                        >
                          <ExternalLink size={14} />
                          {loadingDocId === doc.docId ? 'Opening...' : 'Inspect'}
                        </button>

                        <button
                          onClick={() => handleToggleStatus(doc.docId, 'VERIFIED')}
                          disabled={updatingDocId === doc.docId}
                          className="btn-primary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', background: 'rgba(16, 185, 129, 0.2)', border: '1px solid rgba(16, 185, 129, 0.4)', color: '#34d399' }}
                          title="Mark Document as Verified"
                        >
                          <CheckCircle2 size={14} />
                        </button>

                        <button
                          onClick={() => handleToggleStatus(doc.docId, 'DISCREPANCY')}
                          disabled={updatingDocId === doc.docId}
                          className="btn-secondary"
                          style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', color: '#f59e0b', border: '1px solid rgba(245, 158, 11, 0.4)' }}
                          title="Flag Discrepancy"
                        >
                          <AlertTriangle size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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
