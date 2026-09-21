// Centralized REST API Service Client for FinVanguard NBFC
const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

function getAuthHeaders() {
  let token = localStorage.getItem('nbfc_jwt_token');
  if (!token) {
    try {
      const savedSession = localStorage.getItem('nbfc_active_session');
      if (savedSession) {
        const u = JSON.parse(savedSession);
        fetch(`${API_BASE_URL}/auth/demo-switch`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ role: u.role, email: u.email })
        }).then(res => res.json()).then(data => {
          if (data && data.token) {
            localStorage.setItem('nbfc_jwt_token', data.token);
          }
        }).catch(() => null);
      }
    } catch {
      // ignore
    }
    token = localStorage.getItem('nbfc_jwt_token');
  }
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {})
  };
}

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    if (response.status === 401 && (data.code === 'DUAL_LOGIN_EVICTED' || data.code === 'SESSION_EXPIRED' || data.code === 'EXPIRED_TOKEN')) {
      localStorage.removeItem('nbfc_jwt_token');
      window.dispatchEvent(new CustomEvent('nbfc_session_terminated', { 
        detail: { 
          message: data.error || 'Your session has expired. Please sign in again.',
          code: data.code
        } 
      }));
    }
    if (response.status === 413) {
      throw new Error("File size exceeds maximum upload limit. Please upload a document smaller than 10MB.");
    }
    throw new Error(data.error || `Server Request Failed (${response.status})`);
  }
  return data;
}

export const api = {
  // 1. Health Check
  async getHealth() {
    const res = await fetch(`${API_BASE_URL}/health`);
    return handleResponse(res);
  },

  // 2. Auth: Password Login
  async login(email, password) {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });
    const data = await handleResponse(res);
    if (data.token) {
      localStorage.setItem('nbfc_jwt_token', data.token);
    }
    return data;
  },

  // 2a. Auth: Demo Persona Switcher Token Generator
  async demoSwitchPersona(role, email) {
    const res = await fetch(`${API_BASE_URL}/auth/demo-switch`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role, email })
    });
    const data = await handleResponse(res);
    if (data.token) {
      localStorage.setItem('nbfc_jwt_token', data.token);
    }
    return data;
  },

  // 2b. Auth: Explicit Session Logout
  async logout() {
    const res = await fetch(`${API_BASE_URL}/auth/logout`, {
      method: 'POST',
      headers: getAuthHeaders()
    }).catch(() => null);
    localStorage.removeItem('nbfc_jwt_token');
    return res ? handleResponse(res).catch(() => ({})) : {};
  },

  // 2b. Auth: Change Password (saves in MongoDB)
  async changePassword(passwordHash, newPassword) {
    const res = await fetch(`${API_BASE_URL}/auth/change-password`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ passwordHash, newPassword })
    });
    return handleResponse(res);
  },

  // 3. Auth: Google OAuth Login / Register (Applicant Restricted)
  async loginGoogle(email, name) {
    const res = await fetch(`${API_BASE_URL}/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, name })
    });
    const data = await handleResponse(res);
    if (data.token) {
      localStorage.setItem('nbfc_jwt_token', data.token);
    }
    return data;
  },

  // 3b. Auth: Verify 2FA SMS OTP
  async verifyOtp(tempToken, otp) {
    const res = await fetch(`${API_BASE_URL}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tempToken, otp })
    });
    const data = await handleResponse(res);
    if (data.token) {
      localStorage.setItem('nbfc_jwt_token', data.token);
    }
    return data;
  },

  // 3c. Auth: Resend 2FA SMS OTP
  async resendOtp(tempToken) {
    const res = await fetch(`${API_BASE_URL}/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tempToken })
    });
    return handleResponse(res);
  },

  // 3d. Auth: Bind Phone & Send 2FA SMS OTP (Google SSO)
  async bindPhoneAndSendOtp(tempToken, phone) {
    const res = await fetch(`${API_BASE_URL}/auth/bind-phone-and-send-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tempToken, phone })
    });
    return handleResponse(res);
  },

  // 4. Config: Fetch Single Config
  async getConfig() {
    const res = await fetch(`${API_BASE_URL}/config`);
    return handleResponse(res);
  },

  // 5. Config: Update Single Config (SYSTEM_ADMIN)
  async updateConfig(configData) {
    const res = await fetch(`${API_BASE_URL}/config`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(configData)
    });
    return handleResponse(res);
  },

  // 5b. Config: Fetch .env Variables
  async getEnvConfig() {
    const res = await fetch(`${API_BASE_URL}/admin/env-config`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // 5c. Config: Update .env Variables
  async updateEnvConfig(envData) {
    const res = await fetch(`${API_BASE_URL}/admin/env-config`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(envData)
    });
    return handleResponse(res);
  },

  // 6. UAM: Provision New User
  async createUser(userData) {
    const res = await fetch(`${API_BASE_URL}/uam/users`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(userData)
    });
    return handleResponse(res);
  },

  // 7. UAM: Delete User
  async deleteUser(userId) {
    const res = await fetch(`${API_BASE_URL}/uam/users/${userId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // 8. UAM: Update User Role
  async updateUserRole(userId, newRole) {
    const res = await fetch(`${API_BASE_URL}/uam/users/${userId}/role`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ newRole })
    });
    return handleResponse(res);
  },

  // 8b. UAM: Update User Status (ACTIVE / DISABLED)
  async updateUserStatus(userId, status) {
    const res = await fetch(`${API_BASE_URL}/uam/users/${userId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status })
    });
    return handleResponse(res);
  },

  // 8c. UAM: Reset / Override User Password
  async resetUserPassword(userId, newPassword) {
    const res = await fetch(`${API_BASE_URL}/uam/users/${userId}/reset-password`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ newPassword })
    });
    return handleResponse(res);
  },

  // 9. UAM: Create Custom Role
  async createRole(roleData) {
    const res = await fetch(`${API_BASE_URL}/uam/roles`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(roleData)
    });
    return handleResponse(res);
  },

  // 10. UAM: Delete Custom Role
  async deleteRole(roleId) {
    const res = await fetch(`${API_BASE_URL}/uam/roles/${roleId}`, {
      method: 'DELETE',
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // 11. Loans: Fetch Loans List
  async getLoans() {
    const res = await fetch(`${API_BASE_URL}/loans`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // 12. Loans: Submit Application
  async createLoan(loanData) {
    const res = await fetch(`${API_BASE_URL}/loans`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(loanData)
    });
    return handleResponse(res);
  },

  // 13. Loans: Update Status
  async updateLoanStatus(appId, newStatus, actionTitle) {
    const res = await fetch(`${API_BASE_URL}/loans/${appId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ status: newStatus, actionTitle })
    });
    return handleResponse(res);
  },

  // 13b. DigiLocker: Get Auth URL
  async getDigiLockerAuthUrl(loanId) {
    const res = await fetch(`${API_BASE_URL}/loans/digilocker/auth-url?loanId=${encodeURIComponent(loanId || '')}`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  },

  // 13c. DigiLocker: Execute Instant e-KYC Verification & Archive to GCS Storage Vault
  async verifyDigiLockerKYC(loanId, panNumber, aadhaarNumber) {
    const res = await fetch(`${API_BASE_URL}/loans/digilocker/verify`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ loanId, panNumber, aadhaarNumber })
    });
    return handleResponse(res);
  },

  // 13d. GCS Vault: Upload Document to Google Cloud Storage
  async uploadDocumentToVault(loanId, docType, fileName, fileData, mimeType) {
    const res = await fetch(`${API_BASE_URL}/loans/${loanId}/documents`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ docType, fileName, fileData, mimeType })
    });
    return handleResponse(res);
  },

  // 13e. GCS Vault: Get V4 Signed URL
  async getDocumentSignedUrl(docObject) {
    const res = await fetch(`${API_BASE_URL}/loans/document-signed-url`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ docObject })
    });
    return handleResponse(res);
  },

  // 13f. Document Vault Status Update (Reviewer)
  async updateDocumentStatus(loanId, docId, verificationStatus) {
    const res = await fetch(`${API_BASE_URL}/loans/${loanId}/documents/${docId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ verificationStatus })
    });
    return handleResponse(res);
  },

  // 13g. Underwriting Credit Metrics Update (Approver)
  async underwriteLoan(loanId, metrics) {
    const res = await fetch(`${API_BASE_URL}/loans/${loanId}/underwrite`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(metrics)
    });
    return handleResponse(res);
  },

  // 13h. Issue Digital Sanction Letter (Sanctioning Officer)
  async issueSanction(loanId, sanctionData) {
    const res = await fetch(`${API_BASE_URL}/loans/${loanId}/sanction`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(sanctionData)
    });
    return handleResponse(res);
  },

  // 14. Audit Logs: Fetch Telemetry Stream
  async getLogs() {
    const res = await fetch(`${API_BASE_URL}/logs`, {
      headers: getAuthHeaders()
    });
    return handleResponse(res);
  }
};

export default api;
