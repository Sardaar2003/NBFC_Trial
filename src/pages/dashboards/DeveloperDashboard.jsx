import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import Sidebar from '../../components/Sidebar';
import { runLoadTest } from '../../utils/loadTester';
import CreateRoleModal from '../../components/CreateRoleModal';
import CreateUserModal from '../../components/CreateUserModal';
import DeveloperConfigModal from '../../components/DeveloperConfigModal';
import ResetPasswordModal from '../../components/ResetPasswordModal';
import { api } from '../../services/api';
import { 
  Shield, Users, Key, Trash2, Plus, CheckCircle, 
  Settings, Gauge, Code, UserPlus, AlertCircle, Activity, Server,
  Cpu, HardDrive, Wifi, Lock, Sparkles, Briefcase, Globe, User, RefreshCw,
  ChevronLeft, ChevronRight, Save, Eye, EyeOff, Copy, Check
} from 'lucide-react';

import CustomSelect from '../../components/CustomSelect';
import ConfirmModal from '../../components/ConfirmModal';
import MessageModal from '../../components/MessageModal';

import { getLogs as getClientLogs } from '../../utils/logger';

export default function DeveloperDashboard() {
  const { 
    config, assignUserRole, setUserStatus, deleteUser, deleteRole, 
    currentUser, updateSystemConfig, getEnvConfig, updateEnvConfig 
  } = useAuth();
  
  const [activeTab, setActiveTab] = useState('config'); // 'config' | 'users' | 'roles' | 'performance' | 'security'
  const [modalState, setModalState] = useState({ isOpen: false, title: '', message: '', type: 'info', details: null });
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  
  // Load Testing State
  const [vuCount, setVuCount] = useState(100);
  const [isTestRunning, setIsTestRunning] = useState(false);
  const [testProgress, setTestProgress] = useState(0);
  const [testResults, setTestResults] = useState(null);

  // System Configuration Form State
  const [configForm, setConfigForm] = useState({
    system: {
      appName: config?.system?.appName || "FinVanguard NBFC",
      rbiLicenseNo: config?.system?.rbiLicenseNo || "NBFC-IND-884920-A",
      version: config?.system?.version || "1.4.0-enterprise",
      environment: config?.system?.environment || "production-cloud-ready",
      enableMFA: config?.system?.enableMFA !== undefined ? config?.system?.enableMFA : true,
      googleAuthEnabled: config?.system?.googleAuthEnabled !== undefined ? config?.system?.googleAuthEnabled : true
    },
    businessLimits: {
      maxPersonalLoan: config?.businessLimits?.maxPersonalLoan || 2500000,
      maxBusinessLoan: config?.businessLimits?.maxBusinessLoan || 10000000,
      minCibilScore: config?.businessLimits?.minCibilScore || 650,
      maxFOIRPercentage: config?.businessLimits?.maxFOIRPercentage || 60
    }
  });

  const [savingConfig, setSavingConfig] = useState(false);
  const [configSaveSuccess, setConfigSaveSuccess] = useState(false);

  React.useEffect(() => {
    if (config) {
      setConfigForm({
        system: {
          appName: config.system?.appName || "FinVanguard NBFC",
          rbiLicenseNo: config.system?.rbiLicenseNo || "NBFC-IND-884920-A",
          version: config.system?.version || "1.4.0-enterprise",
          environment: config.system?.environment || "production-cloud-ready",
          enableMFA: config.system?.enableMFA !== undefined ? config.system.enableMFA : true,
          googleAuthEnabled: config.system?.googleAuthEnabled !== undefined ? config.system.googleAuthEnabled : true
        },
        businessLimits: {
          maxPersonalLoan: config.businessLimits?.maxPersonalLoan || 2500000,
          maxBusinessLoan: config.businessLimits?.maxBusinessLoan || 10000000,
          minCibilScore: config.businessLimits?.minCibilScore || 650,
          maxFOIRPercentage: config.businessLimits?.maxFOIRPercentage || 60
        }
      });
    }
  }, [config]);

  const handleSaveConfig = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSavingConfig(true);
    setConfigSaveSuccess(false);
    try {
      await updateSystemConfig(configForm);
      setConfigSaveSuccess(true);
      setTimeout(() => setConfigSaveSuccess(false), 3500);
    } catch (err) {
      setModalState({
        isOpen: true,
        title: 'System Config Update Failed',
        message: 'Could not save system configuration changes.',
        details: err.message,
        type: 'error'
      });
    } finally {
      setSavingConfig(false);
    }
  };

  // Infrastructure Environment Variables (.env) State & Handlers
  const [envForm, setEnvForm] = useState({
    PORT: '5000',
    NODE_ENV: 'production',
    MONGODB_URI: '',
    JWT_SECRET: '',
    GOOGLE_CLIENT_ID: '',
    GOOGLE_CLIENT_SECRET: '',
    GOOGLE_CALLBACK_URL: '',
    TWILIO_ACCOUNT_SID: '',
    TWILIO_API_KEY: '',
    TWILIO_API_SECRET: '',
    TWILIO_AUTH_TOKEN: '',
    TWILIO_PHONE_NUMBER: ''
  });

  const [showSecrets, setShowSecrets] = useState({});
  const [copiedKeys, setCopiedKeys] = useState({});
  const [savingEnv, setSavingEnv] = useState(false);
  const [envSaveSuccess, setEnvSaveSuccess] = useState(false);

  const toggleShowSecret = (key) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleCopyEnvKey = (key, val) => {
    if (!val) return;
    navigator.clipboard.writeText(val);
    setCopiedKeys(prev => ({ ...prev, [key]: true }));
    setTimeout(() => {
      setCopiedKeys(prev => ({ ...prev, [key]: false }));
    }, 2000);
  };

  const fetchEnvConfig = async () => {
    try {
      const data = await getEnvConfig();
      if (data && Object.keys(data).length > 0) {
        setEnvForm(prev => ({ ...prev, ...data }));
      }
    } catch (err) {
      console.warn("Failed to load env config:", err.message);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'config') {
      fetchEnvConfig();
    }
  }, [activeTab]);

  const handleSaveEnvConfig = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setSavingEnv(true);
    setEnvSaveSuccess(false);
    try {
      await updateEnvConfig(envForm);
      setEnvSaveSuccess(true);
      setTimeout(() => setEnvSaveSuccess(false), 3500);
    } catch (err) {
      setModalState({
        isOpen: true,
        title: 'Environment Config Update Failed',
        message: 'Could not save environment variable updates.',
        details: err.message,
        type: 'error'
      });
    } finally {
      setSavingEnv(false);
    }
  };

  // User & Role Deletion & Reset Confirm State
  const [userToDelete, setUserToDelete] = useState(null);
  const [userToReset, setUserToReset] = useState(null);
  const [roleToDelete, setRoleToDelete] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // User Management Sub-Tab ('employees' vs 'applicants')
  const [userSubTab, setUserSubTab] = useState('employees');

  // Audit Telemetry Logs State & Pagination
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [logPage, setLogPage] = useState(1);
  const [logRowsPerPage, setLogRowsPerPage] = useState(10);

  const fetchLogs = async () => {
    setLoadingLogs(true);
    try {
      const liveLogs = await api.getLogs();
      if (Array.isArray(liveLogs) && liveLogs.length > 0) {
        setLogs(liveLogs);
        return;
      }
    } catch (err) {
      console.warn("Failed to fetch server audit logs (falling back to client telemetry):", err.message);
    }
    // Fallback to local client telemetry logs
    setLogs(getClientLogs());
    setLoadingLogs(false);
  };

  React.useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
      setLogPage(1);
    }
  }, [activeTab]);

  // Audit Logs Pagination Slice
  const totalLogPages = Math.ceil(logs.length / logRowsPerPage) || 1;
  const paginatedLogs = logs.slice((logPage - 1) * logRowsPerPage, logPage * logRowsPerPage);

  // User Search
  const [userSearch, setUserSearch] = useState('');

  const vuOptions = [
    { value: 100, label: '100 Concurrent Requests' },
    { value: 500, label: '500 Concurrent Requests' },
    { value: 1000, label: '1,000 Concurrent Requests' }
  ];

  const roleOptions = Object.values(config.roles).map(r => ({
    value: r.id,
    label: `${r.name} (${r.id})`
  }));


  const filteredUsers = config.users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.email.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.role.toLowerCase().includes(userSearch.toLowerCase());

    if (!matchesSearch) return false;

    if (userSubTab === 'employees') {
      return u.role !== 'APPLICANT';
    } else {
      return u.role === 'APPLICANT';
    }
  });

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    setIsDeleting(true);
    try {
      await deleteUser(userToDelete.id);
      setUserToDelete(null);
    } catch (err) {
      console.error("Error deleting user:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleConfirmDeleteRole = async () => {
    if (!roleToDelete) return;
    setIsDeleting(true);
    try {
      await deleteRole(roleToDelete.id);
      setRoleToDelete(null);
    } catch (err) {
      console.error("Error deleting role:", err);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleRunLoadTest = async () => {
    setIsTestRunning(true);
    setTestProgress(0);
    setTestResults(null);
    try {
      const results = await runLoadTest(vuCount, (progress) => {
        setTestProgress(progress);
      });
      setTestResults(results);
    } catch (err) {
      setModalState({
        isOpen: true,
        title: 'Load Test Failed',
        message: 'An error occurred while running the system stress test.',
        details: err.message,
        type: 'error'
      });
    } finally {
      setIsTestRunning(false);
    }
  };

  // Dynamic Header Configuration per Active Sidebar Tab
  const tabHeaderData = {
    telemetry: {
      badge: 'Developer & Super Admin Console',
      badgeIcon: Shield,
      title: 'System Operations & Telemetry',
      description: 'Inspect live environment health, trigger stress benchmarks, and monitor active sessions & system metrics.',
      actions: [
        { label: 'Add User', icon: UserPlus, onClick: () => setIsCreateUserOpen(true), variant: 'secondary' },
        { label: 'Create Role', icon: Plus, onClick: () => setIsCreateRoleOpen(true), variant: 'primary' }
      ]
    },
    users: {
      badge: 'User Access Management (UAM)',
      badgeIcon: Users,
      title: 'User Access & Staff Management',
      description: 'Manage employee & applicant accounts, provision staff, suspend accounts, override credentials, and assign RBAC roles.',
      actions: [
        { label: 'Add User', icon: UserPlus, onClick: () => setIsCreateUserOpen(true), variant: 'primary' }
      ]
    },
    roles: {
      badge: 'Role-Based Access Control',
      badgeIcon: Key,
      title: 'RBAC Roles & Privilege Matrix',
      description: 'Construct dynamic RBAC permission matrices, manage custom role privileges, and inspect system permissions.',
      actions: [
        { label: 'Create Role', icon: Plus, onClick: () => setIsCreateRoleOpen(true), variant: 'primary' }
      ]
    },
    loans: {
      badge: 'Loan Origination Engine',
      badgeIcon: Briefcase,
      title: 'Global Loan Portfolio & Applications',
      description: 'Review live loan applications, monitor risk underwriting pipelines, and inspect sanction workflows across all accounts.',
      actions: []
    },
    logs: {
      badge: 'Security & Regulatory Audit Stream',
      badgeIcon: Shield,
      title: 'Real-Time System Audit Trail',
      description: 'Immutable system telemetry & security compliance logs recording user logins, 2FA events, password resets, status changes, and UAM operations.',
      actions: [
        { label: loadingLogs ? 'Refreshing...' : 'Refresh Logs', icon: RefreshCw, onClick: fetchLogs, variant: 'secondary', spin: loadingLogs }
      ]
    },
    config: {
      badge: 'Core System Configuration',
      badgeIcon: Settings,
      title: 'System Configuration & Parameters',
      description: 'Configure core NBFC lending thresholds, CIBIL score requirements, FOIR ratios, interest rates, and environment parameters.',
      actions: [
        { label: savingConfig ? 'Persisting...' : 'Save Configuration', icon: Save, onClick: handleSaveConfig, variant: 'primary', spin: savingConfig }
      ]
    }
  };

  const currentHeader = tabHeaderData[activeTab] || tabHeaderData.telemetry;
  const HeaderBadgeIcon = currentHeader.badgeIcon;

  return (
    <div className="app-layout-wrapper">
      {/* Collapsible Left Sidebar */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        onOpenDeveloperConfig={() => setIsConfigOpen(true)}
      />

      {/* Main Console Content */}
      <main className="app-main-content" style={{ padding: '2rem' }}>
        
        {/* Dynamic Header Banner */}
        <div className="glass-panel" style={{ padding: '2rem', marginBottom: '2rem', background: 'radial-gradient(at 0% 0%, rgba(192, 132, 252, 0.18) 0px, transparent 60%), var(--surface-glass)', border: '1px solid rgba(192, 132, 252, 0.3)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div className="role-badge role-developer" style={{ marginBottom: '0.65rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                <HeaderBadgeIcon size={14} /> {currentHeader.badge}
              </div>
              <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.35rem', color: 'var(--text-primary)' }}>
                {currentHeader.title}
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', maxWidth: '750px' }}>
                {currentHeader.description}
              </p>
            </div>

            {currentHeader.actions.length > 0 && (
              <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
                {currentHeader.actions.map((act, i) => {
                  const IconComp = act.icon;
                  return (
                    <button
                      key={i}
                      onClick={act.onClick}
                      disabled={act.spin}
                      className={act.variant === 'primary' ? 'btn-primary' : 'btn-secondary'}
                      style={act.variant === 'primary' ? { background: 'var(--accent-purple-gradient)' } : { borderColor: 'var(--accent-blue)', color: 'var(--accent-blue)' }}
                    >
                      <IconComp size={16} className={act.spin ? 'spin' : ''} /> {act.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* TELEMETRY DASHBOARD */}
        {activeTab === 'telemetry' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            
            {/* System Metrics Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>API Ping Latency</span>
                  <Activity size={18} color="#10b981" />
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>12 ms</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Health Status: Optimal</div>
              </div>

              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Active User Sessions</span>
                  <Users size={18} color="#38bdf8" />
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>{config.users.length} Active</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>RBAC Enforced</div>
              </div>

              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>SQLite Database</span>
                  <Server size={18} color="#c084fc" />
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: '#c084fc', fontFamily: 'var(--font-mono)' }}>Connected</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Storage: 14.2 MB</div>
              </div>

              <div className="glass-card" style={{ padding: '1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 600 }}>Security Engine</span>
                  <Lock size={18} color="#fbbf24" />
                </div>
                <div style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--accent-gold)', fontFamily: 'var(--font-mono)' }}>JWT Enabled</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>Helmet.js Active</div>
              </div>
            </div>

            {/* Load Tester Box */}
            <div className="glass-panel" style={{ padding: '2rem' }}>
              <div style={{ marginBottom: '1.25rem' }}>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>System Load Benchmark</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Run real-time API stress test simulations across concurrent users.</p>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', flexWrap: 'wrap', background: 'var(--bg-secondary)', padding: '1.25rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--surface-glass-border)' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>Virtual Users (VU)</label>
                  <CustomSelect
                    value={vuCount}
                    onChange={(val) => setVuCount(Number(val))}
                    options={vuOptions}
                    style={{ width: '240px' }}
                  />
                </div>

                <button
                  onClick={handleRunLoadTest}
                  disabled={isTestRunning}
                  className="btn-primary btn-emerald"
                  style={{ padding: '0.85rem 1.75rem' }}
                >
                  {isTestRunning ? `Benchmarking (${testProgress}%)...` : `Run Stress Benchmark`}
                </button>
              </div>

              {testResults && (
                <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: 'var(--accent-emerald-glow)', border: '1px solid rgba(16, 185, 129, 0.3)', borderRadius: 'var(--border-radius-sm)' }}>
                  <div style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--accent-emerald)', marginBottom: '0.75rem' }}>
                    Benchmark Completed Successfully
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Average Latency</span>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>{testResults.avgLatencyMs} ms</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Throughput</span>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: '#38bdf8', fontFamily: 'var(--font-mono)' }}>{testResults.requestsPerSec} RPS</div>
                    </div>
                    <div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Error Rate</span>
                      <div style={{ fontSize: '1.35rem', fontWeight: 800, color: 'var(--accent-emerald)', fontFamily: 'var(--font-mono)' }}>{testResults.errorRate}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}

        {/* TAB 2: USER ACCESS MANAGEMENT */}
        {activeTab === 'users' && (
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', gap: '1rem', flexWrap: 'wrap' }}>
              <div>
                <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>User Directory & Identity Governance</h2>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>Segregated employee UAM & applicant access rules.</div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input
                  type="text"
                  className="glass-input"
                  placeholder="Filter users..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  style={{ width: '240px' }}
                />
                <button onClick={() => setIsCreateUserOpen(true)} className="btn-primary" style={{ padding: '0.5rem 1rem', fontSize: '0.85rem' }}>
                  <UserPlus size={15} /> Provision Employee
                </button>
              </div>
            </div>

            {/* Sub-Tabs: Employees vs Applicants */}
            <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid var(--surface-glass-border)', paddingBottom: '0.85rem' }}>
              <button
                type="button"
                onClick={() => setUserSubTab('employees')}
                style={{
                  padding: '0.55rem 1.15rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  borderRadius: '10px',
                  border: '1px solid var(--surface-glass-border)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: userSubTab === 'employees' ? 'var(--accent-purple-gradient)' : 'var(--bg-secondary)',
                  color: userSubTab === 'employees' ? '#fff' : 'var(--text-secondary)'
                }}
              >
                <Briefcase size={16} /> Staff & Employees ({config.users.filter(u => u.role !== 'APPLICANT').length})
              </button>

              <button
                type="button"
                onClick={() => setUserSubTab('applicants')}
                style={{
                  padding: '0.55rem 1.15rem',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  borderRadius: '10px',
                  border: '1px solid var(--surface-glass-border)',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: userSubTab === 'applicants' ? 'var(--accent-blue-gradient)' : 'var(--bg-secondary)',
                  color: userSubTab === 'applicants' ? '#fff' : 'var(--text-secondary)'
                }}
              >
                <User size={16} /> Borrowers & Applicants ({config.users.filter(u => u.role === 'APPLICANT').length})
              </button>
            </div>

            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>User Profile</th>
                    <th>Current Role</th>
                    <th>Allowed Auth Method</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Last Online</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map(user => {
                    const isCurrentDev = user.id === currentUser.id;
                    return (
                      <tr key={user.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <img src={user.avatar} alt={user.name} style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                            <div>
                              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{user.name}</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{user.email}</div>
                            </div>
                          </div>
                        </td>

                        <td>
                          <CustomSelect
                            options={Object.values(config.roles).map(r => ({ value: r.id, label: `${r.name} (${r.id})` }))}
                            value={user.role}
                            onChange={(val) => assignUserRole(user.id, val)}
                            style={{ width: '220px' }}
                          />
                        </td>

                        <td>
                          {user.role !== 'APPLICANT' ? (
                            <span style={{ padding: '0.3rem 0.6rem', background: 'rgba(139, 92, 246, 0.15)', border: '1px solid rgba(139, 92, 246, 0.35)', color: '#a78bfa', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                              <Lock size={12} /> Work Email & Password
                            </span>
                          ) : (
                            <span style={{ padding: '0.3rem 0.6rem', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.35)', color: '#38bdf8', borderRadius: '6px', fontSize: '0.72rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                              <Globe size={12} /> Google SSO / Password
                            </span>
                          )}
                        </td>

                        <td>
                          <span className={`status-pill ${user.status === 'ACTIVE' ? 'status-approved' : 'status-rejected'}`}>
                            {user.status}
                          </span>
                        </td>

                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          {user.joinedAt}
                        </td>

                        <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: user.lastLogin ? 'var(--accent-emerald)' : 'var(--text-muted)' }}>
                          {user.lastLogin ? new Date(user.lastLogin).toLocaleString() : 'Never logged in'}
                        </td>

                        <td style={{ textAlign: 'right' }}>
                          {!isCurrentDev && (
                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.4rem' }}>
                              <button
                                onClick={() => setUserStatus(user.id, user.status === 'ACTIVE' ? 'DISABLED' : 'ACTIVE')}
                                className="btn-secondary"
                                style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                              >
                                {user.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                              </button>
                              <button
                                onClick={() => setUserToReset(user)}
                                className="btn-secondary"
                                style={{ padding: '0.35rem 0.55rem', background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', border: '1px solid rgba(139, 92, 246, 0.35)' }}
                                title="Generate & Override Password"
                              >
                                <Key size={14} />
                              </button>
                              <button
                                onClick={() => setUserToDelete({ id: user.id, name: user.name })}
                                className="btn-danger"
                                style={{ padding: '0.35rem 0.5rem' }}
                                title="Delete User Account"
                              >
                                <Trash2 size={14} />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: ROLES */}
        {activeTab === 'roles' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)' }}>Configured RBAC Roles</h2>
              <button onClick={() => setIsCreateRoleOpen(true)} className="btn-primary" style={{ background: 'var(--accent-purple-gradient)' }}>
                <Plus size={16} /> Create Custom Role
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.25rem' }}>
              {Object.values(config.roles).map(role => (
                <div key={role.id} className="glass-card" style={{ borderLeft: `4px solid ${role.color}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <div style={{ fontSize: '1.15rem', fontWeight: 800, color: 'var(--text-primary)' }}>{role.name}</div>
                      <div style={{ fontSize: '0.75rem', color: role.color, fontFamily: 'var(--font-mono)', fontWeight: 700 }}>ROLE: {role.id}</div>
                    </div>
                    {!role.isSystem && (
                      <button onClick={() => setRoleToDelete({ id: role.id, name: role.name })} className="btn-danger" style={{ padding: '0.25rem 0.4rem' }} title="Delete Custom Role">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1rem' }}>{role.description}</p>
                  <div style={{ borderTop: '1px solid var(--surface-glass-border)', paddingTop: '0.75rem' }}>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 700, marginBottom: '0.5rem' }}>PERMISSIONS:</div>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
                      {role.permissions.map(p => (
                        <span key={p} style={{ padding: '0.25rem 0.55rem', background: 'var(--bg-tertiary)', borderRadius: '4px', fontSize: '0.72rem', fontFamily: 'var(--font-mono)' }}>
                          {p}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: ALL LOANS */}
        {activeTab === 'loans' && (
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <h2 style={{ fontSize: '1.3rem', fontWeight: 800, marginBottom: '1rem', color: 'var(--text-primary)' }}>Global System Loan Register</h2>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>Full read/write authority across all loan applications.</p>
          </div>
        )}

        {/* TAB 5: AUDIT LOGS */}
        {activeTab === 'logs' && (
          <div className="glass-panel" style={{ padding: '1.75rem' }}>
            <div className="data-table-container" style={{ border: '1px solid var(--surface-glass-border)', borderRadius: '12px', background: 'var(--surface-card)', overflow: 'hidden' }}>
              <table className="glass-table" style={{ width: '100%' }}>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Level</th>
                    <th>Category</th>
                    <th>Action Detail</th>
                    <th>User</th>
                    <th>Role</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ textAlign: 'center', padding: '2.5rem', color: 'var(--text-muted)' }}>
                        No audit telemetry records found. Perform actions (login, OTP, user management) to generate logs.
                      </td>
                    </tr>
                  ) : (
                    paginatedLogs.map((log, idx) => {
                      const isWarn = log.level === 'WARN' || log.level === 'SECURITY';
                      return (
                        <tr key={log.id || idx} style={{ borderBottom: '1px solid var(--surface-glass-border)' }}>
                          <td style={{ padding: '1.1rem 1.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                            {log.timestamp ? new Date(log.timestamp).toLocaleString() : 'N/A'}
                          </td>
                          <td style={{ padding: '1.1rem 1.25rem' }}>
                            <span style={{
                              padding: '0.3rem 0.75rem',
                              borderRadius: '9999px',
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              fontFamily: 'var(--font-mono)',
                              background: isWarn ? 'rgba(244, 63, 94, 0.15)' : 'rgba(56, 189, 248, 0.15)',
                              color: isWarn ? 'var(--accent-rose)' : '#38bdf8',
                              border: `1px solid ${isWarn ? 'rgba(244, 63, 94, 0.35)' : 'rgba(56, 189, 248, 0.35)'}`
                            }}>
                              {log.level}
                            </span>
                          </td>
                          <td style={{ padding: '1.1rem 1.25rem' }}>
                            <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '0.82rem' }}>
                              {log.category}
                            </span>
                          </td>
                          <td style={{ padding: '1.1rem 1.25rem', fontWeight: 600, color: 'var(--text-primary)', fontSize: '0.9rem' }}>
                            {log.action}
                          </td>
                          <td style={{ padding: '1.1rem 1.25rem', fontFamily: 'var(--font-mono)', fontSize: '0.84rem', color: 'var(--text-primary)' }}>
                            {log.user || 'system'}
                          </td>
                          <td style={{ padding: '1.1rem 1.25rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--accent-purple)' }}>
                              {log.role || 'SYSTEM'}
                            </span>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {logs.length > 0 && (
              <div style={{
                display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center',
                padding: '1.25rem 0.5rem 0.25rem 0.5rem', gap: '1rem', borderTop: '1px solid var(--surface-glass-border)'
              }}>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Showing <strong style={{ color: 'var(--text-primary)' }}>{(logPage - 1) * logRowsPerPage + 1}</strong> to <strong style={{ color: 'var(--text-primary)' }}>{Math.min(logPage * logRowsPerPage, logs.length)}</strong> of <strong style={{ color: 'var(--text-primary)' }}>{logs.length}</strong> records
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    <span>Rows per page:</span>
                    <CustomSelect
                      options={[5, 10, 15, 20, 25, 30, 35].map(size => ({ value: size, label: String(size) }))}
                      value={logRowsPerPage}
                      onChange={(val) => {
                        setLogRowsPerPage(Number(val));
                        setLogPage(1);
                      }}
                      style={{ width: '85px' }}
                    />
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <button
                      onClick={() => setLogPage(p => Math.max(1, p - 1))}
                      disabled={logPage === 1}
                      className="btn-secondary"
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.25rem', opacity: logPage === 1 ? 0.4 : 1 }}
                    >
                      <ChevronLeft size={14} /> Prev
                    </button>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', padding: '0 0.4rem', fontFamily: 'var(--font-mono)' }}>
                      Page {logPage} of {totalLogPages}
                    </span>
                    <button
                      onClick={() => setLogPage(p => Math.min(totalLogPages, p + 1))}
                      disabled={logPage >= totalLogPages}
                      className="btn-secondary"
                      style={{ padding: '0.3rem 0.6rem', fontSize: '0.78rem', display: 'flex', alignItems: 'center', gap: '0.25rem', opacity: logPage >= totalLogPages ? 0.4 : 1 }}
                    >
                      Next <ChevronRight size={14} />
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 6: SYSTEM CONFIG */}
        {activeTab === 'config' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <form onSubmit={handleSaveConfig} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
            {configSaveSuccess && (
              <div style={{
                padding: '1rem 1.25rem', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.35)',
                borderRadius: '12px', color: '#34d399', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600
              }}>
                <CheckCircle size={20} />
                <span>System configuration updated and persisted to MongoDB Atlas successfully!</span>
              </div>
            )}

            {/* Section 1: General System & Compliance Metadata */}
            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(139, 92, 246, 0.15)', color: '#a78bfa', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Shield size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>General System & Compliance Metadata</h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>Core platform branding, license tags, and authentication security policies.</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Application Name</label>
                  <input
                    type="text"
                    className="glass-input"
                    value={configForm.system.appName}
                    onChange={(e) => setConfigForm({ ...configForm, system: { ...configForm.system, appName: e.target.value } })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.9rem' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>RBI License Number</label>
                  <input
                    type="text"
                    className="glass-input"
                    value={configForm.system.rbiLicenseNo}
                    onChange={(e) => setConfigForm({ ...configForm, system: { ...configForm.system, rbiLicenseNo: e.target.value } })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.9rem' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Platform Build Version</label>
                  <input
                    type="text"
                    className="glass-input"
                    value={configForm.system.version}
                    onChange={(e) => setConfigForm({ ...configForm, system: { ...configForm.system, version: e.target.value } })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.9rem' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Deployment Environment</label>
                  <input
                    type="text"
                    className="glass-input"
                    value={configForm.system.environment}
                    onChange={(e) => setConfigForm({ ...configForm, system: { ...configForm.system, environment: e.target.value } })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.9rem' }}
                    required
                  />
                </div>
              </div>

              {/* Security Toggles */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem', marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>Mandatory SMS 2FA</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Require 6-digit SMS OTP verification</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={configForm.system.enableMFA}
                    onChange={(e) => setConfigForm({ ...configForm, system: { ...configForm.system, enableMFA: e.target.checked } })}
                    style={{ width: '18px', height: '18px', accentColor: '#8b5cf6', cursor: 'pointer' }}
                  />
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'rgba(255, 255, 255, 0.03)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-primary)' }}>Google OAuth SSO</div>
                    <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Allow single sign-on for borrowers</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={configForm.system.googleAuthEnabled}
                    onChange={(e) => setConfigForm({ ...configForm, system: { ...configForm.system, googleAuthEnabled: e.target.checked } })}
                    style={{ width: '18px', height: '18px', accentColor: '#38bdf8', cursor: 'pointer' }}
                  />
                </div>
              </div>
            </div>

            {/* Section 2: Credit Underwriting & Business Limits */}
            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.15)', color: '#34d399', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Gauge size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Credit Risk Engine & Business Limits</h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>Automated underwriting parameters, maximum sanction thresholds, and CIBIL filters.</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Max Personal Loan Limit (₹)</label>
                  <input
                    type="number"
                    className="glass-input"
                    value={configForm.businessLimits.maxPersonalLoan}
                    onChange={(e) => setConfigForm({ ...configForm, businessLimits: { ...configForm.businessLimits, maxPersonalLoan: Number(e.target.value) } })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Max Business Loan Limit (₹)</label>
                  <input
                    type="number"
                    className="glass-input"
                    value={configForm.businessLimits.maxBusinessLoan}
                    onChange={(e) => setConfigForm({ ...configForm, businessLimits: { ...configForm.businessLimits, maxBusinessLoan: Number(e.target.value) } })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Min CIBIL Score Requirement</label>
                  <input
                    type="number"
                    className="glass-input"
                    value={configForm.businessLimits.minCibilScore}
                    onChange={(e) => setConfigForm({ ...configForm, businessLimits: { ...configForm.businessLimits, minCibilScore: Number(e.target.value) } })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>Max FOIR Ratio Percentage (%)</label>
                  <input
                    type="number"
                    className="glass-input"
                    value={configForm.businessLimits.maxFOIRPercentage}
                    onChange={(e) => setConfigForm({ ...configForm, businessLimits: { ...configForm.businessLimits, maxFOIRPercentage: Number(e.target.value) } })}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', fontSize: '0.9rem', fontFamily: 'var(--font-mono)' }}
                    required
                  />
                </div>
              </div>
            </div>

            {/* Submit Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button
                type="submit"
                className="btn-primary"
                disabled={savingConfig}
                style={{
                  padding: '0.75rem 2rem', fontSize: '0.92rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  background: 'var(--accent-purple-gradient, linear-gradient(135deg, #8b5cf6, #6366f1))'
                }}
              >
                <Save size={18} className={savingConfig ? 'spin' : ''} />
                {savingConfig ? 'Persisting to MongoDB...' : 'Save System Configuration'}
              </button>
            </div>
          </form>

          {/* Section 3: Infrastructure Environment Variables & Gateway Credentials (.env) */}
          <form onSubmit={handleSaveEnvConfig} style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem', marginTop: '1rem' }}>
            {envSaveSuccess && (
              <div style={{
                padding: '1rem 1.25rem', background: 'rgba(56, 189, 248, 0.15)', border: '1px solid rgba(56, 189, 248, 0.35)',
                borderRadius: '12px', color: '#38bdf8', fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.75rem', fontWeight: 600
              }}>
                <CheckCircle size={20} />
                <span>Environment variables (.env) written to disk & process memory reloaded successfully!</span>
              </div>
            )}

            <div className="glass-panel" style={{ padding: '1.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', paddingBottom: '1rem' }}>
                <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.15)', color: '#38bdf8', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Server size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Infrastructure Environment Variables & Gateway Secrets (.env)</h3>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>Inspect & manage active server credentials, Twilio SMS API keys, Google OAuth tokens, and MongoDB URIs.</p>
                </div>
              </div>

              {/* Group A: Database & Core Server */}
              <div style={{ marginBottom: '1.5rem' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#38bdf8', marginBottom: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Database & Runtime Infrastructure
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                      MongoDB Connection URI <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#a78bfa' }}>(MONGODB_URI)</span>
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type={showSecrets['MONGODB_URI'] ? 'text' : 'password'}
                        className="glass-input"
                        value={envForm.MONGODB_URI || ''}
                        onChange={(e) => setEnvForm({ ...envForm, MONGODB_URI: e.target.value })}
                        placeholder="mongodb+srv://user:pass@cluster.mongodb.net/"
                        style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.85rem', padding: '0.6rem 0.85rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => toggleShowSecret('MONGODB_URI')}
                        className="btn-secondary"
                        style={{ padding: '0.6rem 0.75rem' }}
                        title={showSecrets['MONGODB_URI'] ? "Mask URI" : "Reveal URI"}
                      >
                        {showSecrets['MONGODB_URI'] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyEnvKey('MONGODB_URI', envForm.MONGODB_URI)}
                        className="btn-secondary"
                        style={{ padding: '0.6rem 0.75rem' }}
                      >
                        {copiedKeys['MONGODB_URI'] ? <Check size={16} color="#34d399" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                      Server Port <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#a78bfa' }}>(PORT)</span>
                    </label>
                    <input
                      type="text"
                      className="glass-input"
                      value={envForm.PORT || '5000'}
                      onChange={(e) => setEnvForm({ ...envForm, PORT: e.target.value })}
                      style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', padding: '0.6rem 0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                      Node Environment <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#a78bfa' }}>(NODE_ENV)</span>
                    </label>
                    <input
                      type="text"
                      className="glass-input"
                      value={envForm.NODE_ENV || 'production'}
                      onChange={(e) => setEnvForm({ ...envForm, NODE_ENV: e.target.value })}
                      style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', padding: '0.6rem 0.85rem' }}
                    />
                  </div>
                </div>
              </div>

              {/* Group B: Authentication & Token Secrets */}
              <div style={{ marginBottom: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#a78bfa', marginBottom: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Authentication Secrets & OAuth Credentials
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                      JWT Secret Key <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#a78bfa' }}>(JWT_SECRET)</span>
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type={showSecrets['JWT_SECRET'] ? 'text' : 'password'}
                        className="glass-input"
                        value={envForm.JWT_SECRET || ''}
                        onChange={(e) => setEnvForm({ ...envForm, JWT_SECRET: e.target.value })}
                        style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.85rem', padding: '0.6rem 0.85rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => toggleShowSecret('JWT_SECRET')}
                        className="btn-secondary"
                        style={{ padding: '0.6rem 0.75rem' }}
                      >
                        {showSecrets['JWT_SECRET'] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyEnvKey('JWT_SECRET', envForm.JWT_SECRET)}
                        className="btn-secondary"
                        style={{ padding: '0.6rem 0.75rem' }}
                      >
                        {copiedKeys['JWT_SECRET'] ? <Check size={16} color="#34d399" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                      Google Client ID <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#a78bfa' }}>(GOOGLE_CLIENT_ID)</span>
                    </label>
                    <input
                      type="text"
                      className="glass-input"
                      value={envForm.GOOGLE_CLIENT_ID || ''}
                      onChange={(e) => setEnvForm({ ...envForm, GOOGLE_CLIENT_ID: e.target.value })}
                      placeholder="xyz.apps.googleusercontent.com"
                      style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '0.82rem', padding: '0.6rem 0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                      Google Client Secret <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#a78bfa' }}>(GOOGLE_CLIENT_SECRET)</span>
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type={showSecrets['GOOGLE_CLIENT_SECRET'] ? 'text' : 'password'}
                        className="glass-input"
                        value={envForm.GOOGLE_CLIENT_SECRET || ''}
                        onChange={(e) => setEnvForm({ ...envForm, GOOGLE_CLIENT_SECRET: e.target.value })}
                        placeholder="GOCSPX-..."
                        style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.85rem', padding: '0.6rem 0.85rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => toggleShowSecret('GOOGLE_CLIENT_SECRET')}
                        className="btn-secondary"
                        style={{ padding: '0.6rem 0.75rem' }}
                      >
                        {showSecrets['GOOGLE_CLIENT_SECRET'] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyEnvKey('GOOGLE_CLIENT_SECRET', envForm.GOOGLE_CLIENT_SECRET)}
                        className="btn-secondary"
                        style={{ padding: '0.6rem 0.75rem' }}
                      >
                        {copiedKeys['GOOGLE_CLIENT_SECRET'] ? <Check size={16} color="#34d399" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Group C: Twilio Universal 2FA SMS Credentials */}
              <div style={{ paddingTop: '1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.06)' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 800, color: '#f59e0b', marginBottom: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Twilio Universal 2FA SMS Gateway Credentials
                </h4>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                      Twilio Account SID <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#f59e0b' }}>(TWILIO_ACCOUNT_SID)</span>
                    </label>
                    <input
                      type="text"
                      className="glass-input"
                      value={envForm.TWILIO_ACCOUNT_SID || ''}
                      onChange={(e) => setEnvForm({ ...envForm, TWILIO_ACCOUNT_SID: e.target.value })}
                      placeholder="ACxxxxxxxxxxxxxxxx"
                      style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', padding: '0.6rem 0.85rem' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                      Twilio Auth Token <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#f59e0b' }}>(TWILIO_AUTH_TOKEN)</span>
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <input
                        type={showSecrets['TWILIO_AUTH_TOKEN'] ? 'text' : 'password'}
                        className="glass-input"
                        value={envForm.TWILIO_AUTH_TOKEN || ''}
                        onChange={(e) => setEnvForm({ ...envForm, TWILIO_AUTH_TOKEN: e.target.value })}
                        placeholder="32-char token"
                        style={{ flex: 1, fontFamily: 'var(--font-mono)', fontSize: '0.85rem', padding: '0.6rem 0.85rem' }}
                      />
                      <button
                        type="button"
                        onClick={() => toggleShowSecret('TWILIO_AUTH_TOKEN')}
                        className="btn-secondary"
                        style={{ padding: '0.6rem 0.75rem' }}
                      >
                        {showSecrets['TWILIO_AUTH_TOKEN'] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopyEnvKey('TWILIO_AUTH_TOKEN', envForm.TWILIO_AUTH_TOKEN)}
                        className="btn-secondary"
                        style={{ padding: '0.6rem 0.75rem' }}
                      >
                        {copiedKeys['TWILIO_AUTH_TOKEN'] ? <Check size={16} color="#34d399" /> : <Copy size={16} />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.4rem' }}>
                      Twilio Outbound Phone Number <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: '#f59e0b' }}>(TWILIO_PHONE_NUMBER)</span>
                    </label>
                    <input
                      type="text"
                      className="glass-input"
                      value={envForm.TWILIO_PHONE_NUMBER || ''}
                      onChange={(e) => setEnvForm({ ...envForm, TWILIO_PHONE_NUMBER: e.target.value })}
                      placeholder="+15017122661"
                      style={{ width: '100%', fontFamily: 'var(--font-mono)', fontSize: '0.85rem', padding: '0.6rem 0.85rem' }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Submit Footer for .env Credentials */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
              <button
                type="submit"
                className="btn-primary"
                disabled={savingEnv}
                style={{
                  padding: '0.75rem 2rem', fontSize: '0.92rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem',
                  background: 'linear-gradient(135deg, #0284c7, #2563eb)'
                }}
              >
                <Save size={18} className={savingEnv ? 'spin' : ''} />
                {savingEnv ? 'Writing to .env File...' : 'Save Environment Credentials (.env)'}
              </button>
            </div>
          </form>
        </div>
      )}

        {/* Modals */}
        <CreateRoleModal isOpen={isCreateRoleOpen} onClose={() => setIsCreateRoleOpen(false)} />
        <CreateUserModal isOpen={isCreateUserOpen} onClose={() => setIsCreateUserOpen(false)} />
        <DeveloperConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
        <ResetPasswordModal isOpen={!!userToReset} onClose={() => setUserToReset(null)} user={userToReset} />

        <ConfirmModal
          isOpen={!!userToDelete}
          onClose={() => setUserToDelete(null)}
          onConfirm={handleConfirmDeleteUser}
          title="Permanently Remove Account"
          message={userToDelete ? `Are you sure you want to permanently delete user "${userToDelete.name}"? This action cannot be undone and will revoke all portal access immediately.` : ''}
          confirmText="Permanently Remove User"
          loading={isDeleting}
        />

        <ConfirmModal
          isOpen={!!roleToDelete}
          onClose={() => setRoleToDelete(null)}
          onConfirm={handleConfirmDeleteRole}
          title="Delete Custom RBAC Role"
          message={roleToDelete ? `Are you sure you want to delete the custom role "${roleToDelete.name}" (${roleToDelete.id})?` : ''}
          confirmText="Delete Role"
          loading={isDeleting}
        />

        <MessageModal
          isOpen={modalState.isOpen}
          onClose={() => setModalState(prev => ({ ...prev, isOpen: false }))}
          title={modalState.title}
          message={modalState.message}
          type={modalState.type}
          details={modalState.details}
        />

      </main>
    </div>
  );
}
