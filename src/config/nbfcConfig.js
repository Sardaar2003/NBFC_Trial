/**
 * Single Source of Truth Configuration Store for FinVanguard NBFC
 * Supports live dynamic updates from the Frontend by Developer / Super Admin users.
 */

const STORAGE_KEY = 'nbfc_system_config_v1.5_6roles';

const DEFAULT_CONFIG = {
  system: {
    appName: "FinVanguard NBFC",
    version: "1.4.0-enterprise",
    rbiLicenseNo: "NBFC-IND-884920-A",
    environment: "production-cloud-ready",
    enableMFA: true,
    sessionTimeoutMinutes: 30,
    googleAuthEnabled: true,
    googleClientId: "884920-nbfc-finvanguard.apps.googleusercontent.com"
  },
  features: {
    enableAutoCibilFetch: true,
    enableDigitalSignature: true,
    enableInstantDisbursement: false,
    enableDeveloperDebugTools: true,
    enableLoadTestingSuite: true
  },
  businessLimits: {
    maxPersonalLoan: 2500000,
    maxBusinessLoan: 10000000,
    minCibilScore: 650,
    maxFOIRPercentage: 60,
    minTenureMonths: 6,
    maxTenureMonths: 60
  },
  permissionsList: [
    { id: "SYSTEM_ADMIN", name: "System Admin & Debug", description: "Full access to developer tools, raw configs, and system logs." },
    { id: "ROLE_MANAGE", name: "Role & UAM Management", description: "Create, edit, assign, and delete system roles & permissions." },
    { id: "USER_MANAGE", name: "User Directory Management", description: "Manage user accounts, assign roles, and toggle access status." },
    { id: "LOAN_APPLY", name: "Apply For Loans", description: "Submit personal or business loan applications and upload KYC." },
    { id: "VIEW_OWN_LOAN", name: "View Own Application", description: "Track applicant's own loan applications & e-sign terms." },
    { id: "LOAN_VERIFY", name: "Document Verification", description: "Verify applicant identity, income documents, and KYC completeness." },
    { id: "DOC_REVIEW", name: "Document Review & Screening", description: "Audit applicant income statements, bank records, and flag discrepancies." },
    { id: "LOAN_UNDERWRITE", name: "Credit Underwriting", description: "Perform credit risk scoring, FOIR/LTV calculations, and risk ratings." },
    { id: "CREDIT_APPROVE", name: "Credit Risk Approval", description: "Approve or reject credit risk assessments and override risk flags." },
    { id: "LOAN_SANCTION", name: "Credit Sanction Authority", description: "Issue formal sanction letters and grant final approval." },
    { id: "DISBURSAL_AUTH", name: "Disbursement Authorization", description: "Authorize bank transfers and fund disbursements." },
    { id: "MANAGE_STAFF", name: "Staff Operations Management", description: "Manage branch staff permissions, performance metrics, and UAM." },
    { id: "VIEW_ALL_LOANS", name: "Global Loan Register", description: "Inspect all loan applications across the NBFC platform." },
    { id: "VIEW_REPORTS", name: "Executive Analytics & Reports", description: "View branch analytics, portfolio health, and audit trails." }
  ],
  roles: {
    DEVELOPER: {
      id: "DEVELOPER",
      name: "Developer / Super Admin",
      description: "Unrestricted system access, UAM manager, live config editor & diagnostic log inspector.",
      isSystem: true,
      color: "#8b5cf6",
      permissions: ["*"]
    },
    APPLICANT: {
      id: "APPLICANT",
      name: "Applicant",
      description: "Submit loan applications, upload documents, track status & e-sign sanction terms.",
      isSystem: true,
      color: "#3b82f6",
      permissions: ["LOAN_APPLY", "VIEW_OWN_LOAN"]
    },
    REVIEWER: {
      id: "REVIEWER",
      name: "Document Reviewer",
      description: "Perform initial application screening, KYC document verification, and income audits.",
      isSystem: true,
      color: "#f59e0b",
      permissions: ["LOAN_VERIFY", "DOC_REVIEW"]
    },
    APPROVER: {
      id: "APPROVER",
      name: "Credit Risk Approver",
      description: "Assess credit risk, CIBIL scoring, FOIR/LTV calculations, and credit approvals.",
      isSystem: true,
      color: "#10b981",
      permissions: ["LOAN_UNDERWRITE", "CREDIT_APPROVE"]
    },
    SANCTIONING_OFFICER: {
      id: "SANCTIONING_OFFICER",
      name: "Sanctioning Officer",
      description: "Final approval authority for high-value sanctions and issuing formal sanction letters.",
      isSystem: true,
      color: "#ec4899",
      permissions: ["LOAN_SANCTION", "DISBURSAL_AUTH"]
    },
    MANAGER: {
      id: "MANAGER",
      name: "Branch & Operations Manager",
      description: "Oversee branch loan register, staff UAM operations, and executive portfolio analytics.",
      isSystem: true,
      color: "#06b6d4",
      permissions: ["MANAGE_STAFF", "VIEW_ALL_LOANS", "VIEW_REPORTS"]
    }
  },
  users: [
    {
      id: "usr_dev_1",
      name: "Alex Vance (Lead Engineer)",
      email: "developer@finvanguard.nbfc",
      role: "DEVELOPER",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      status: "ACTIVE",
      joinedAt: "2026-01-10"
    },
    {
      id: "usr_app_1",
      name: "Priya Sharma",
      email: "priya.sharma@example.com",
      role: "APPLICANT",
      avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=150&q=80",
      status: "ACTIVE",
      joinedAt: "2026-08-15"
    },
    {
      id: "usr_rev_1",
      name: "Rahul Verma (Verification Lead)",
      email: "reviewer@finvanguard.nbfc",
      role: "REVIEWER",
      avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=150&q=80",
      status: "ACTIVE",
      joinedAt: "2026-03-12"
    },
    {
      id: "usr_appr_1",
      name: "Ananya Sen (Credit Risk Approver)",
      email: "approver@finvanguard.nbfc",
      role: "APPROVER",
      avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=150&q=80",
      status: "ACTIVE",
      joinedAt: "2026-02-20"
    },
    {
      id: "usr_sanc_1",
      name: "Vikramaditya Roy (Sanctioning Officer)",
      email: "sanctioning.officer@finvanguard.nbfc",
      role: "SANCTIONING_OFFICER",
      avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=150&q=80",
      status: "ACTIVE",
      joinedAt: "2026-01-15"
    },
    {
      id: "usr_mgr_1",
      name: "Sunita Mehta (Operations Manager)",
      email: "manager@finvanguard.nbfc",
      role: "MANAGER",
      avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=150&q=80",
      status: "ACTIVE",
      joinedAt: "2026-01-05"
    }
  ]
};

// Internal config memory state
let currentConfig = loadInitialConfig();
const listeners = new Set();

function loadInitialConfig() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      const validRoleKeys = Object.keys(DEFAULT_CONFIG.roles);
      const cleanRoles = {};
      if (parsed.roles) {
        Object.keys(parsed.roles).forEach(rk => {
          if (validRoleKeys.includes(rk)) {
            cleanRoles[rk] = parsed.roles[rk];
          }
        });
      }
      return { 
        ...DEFAULT_CONFIG, 
        ...parsed, 
        roles: Object.keys(cleanRoles).length > 0 ? cleanRoles : DEFAULT_CONFIG.roles 
      };
    }
  } catch (err) {
    console.warn("Failed to load config from storage, using defaults:", err);
  }
  return DEFAULT_CONFIG;
}

export function getConfig() {
  return currentConfig;
}

export function updateConfig(newPartialConfig) {
  currentConfig = {
    ...currentConfig,
    ...newPartialConfig,
    system: { ...currentConfig.system, ...(newPartialConfig.system || {}) },
    features: { ...currentConfig.features, ...(newPartialConfig.features || {}) },
    businessLimits: { ...currentConfig.businessLimits, ...(newPartialConfig.businessLimits || {}) },
    roles: { ...currentConfig.roles, ...(newPartialConfig.roles || {}) }
  };
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(currentConfig));
  } catch (e) {
    console.error("Failed to save config to localStorage:", e);
  }
  
  notifyListeners();
  return currentConfig;
}

export function resetConfigToDefaults() {
  currentConfig = DEFAULT_CONFIG;
  localStorage.removeItem(STORAGE_KEY);
  notifyListeners();
  return currentConfig;
}

export function subscribeConfig(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners() {
  listeners.forEach((listener) => listener(currentConfig));
}
