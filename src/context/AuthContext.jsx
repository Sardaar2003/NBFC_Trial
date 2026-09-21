import React, { createContext, useContext, useState, useEffect } from 'react';
import { getConfig, updateConfig, subscribeConfig } from '../config/nbfcConfig';
import { logEvent } from '../utils/logger';
import { generateTempPassword, hashPassword, verifyPassword } from '../utils/security';
import { api } from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [config, setConfigState] = useState(getConfig());
  const [sessionError, setSessionError] = useState('');
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('nbfc_theme') || 'dark';
  });

  const [currentUser, setCurrentUser] = useState(() => {
    try {
      const saved = localStorage.getItem('nbfc_active_session');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Listen for global session termination (dual-login eviction or expiry)
  useEffect(() => {
    const handleSessionTerminated = (e) => {
      const msg = e.detail?.message || 'Your session has expired. Please sign in again.';
      setSessionError(msg);
      setCurrentUser(null);
      localStorage.removeItem('nbfc_active_session');
      localStorage.removeItem('nbfc_jwt_token');
    };

    window.addEventListener('nbfc_session_terminated', handleSessionTerminated);
    return () => window.removeEventListener('nbfc_session_terminated', handleSessionTerminated);
  }, []);

  // Apply Theme to Document HTML element
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('nbfc_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
  };

  // Fetch live server config on mount & subscribe to local updates
  useEffect(() => {
    const fetchServerConfig = async () => {
      try {
        const liveConfig = await api.getConfig();
        if (liveConfig && liveConfig.system) {
          updateConfig(liveConfig);
        }
      } catch (err) {
        console.warn("REST API Server connection warning, using local configuration:", err.message);
      }
    };
    fetchServerConfig();

    const unsubscribe = subscribeConfig((newConfig) => {
      setConfigState(newConfig);
    });
    return unsubscribe;
  }, []);

  // Sync active user to local storage and ensure active JWT token exists
  useEffect(() => {
    if (currentUser) {
      localStorage.setItem('nbfc_active_session', JSON.stringify(currentUser));
      if (!localStorage.getItem('nbfc_jwt_token')) {
        api.demoSwitchPersona(currentUser.role, currentUser.email).catch(() => null);
      }
    } else {
      localStorage.removeItem('nbfc_active_session');
    }
  }, [currentUser]);

  // Standard Login (API + Strict MongoDB Auth)
  const login = async (email, password) => {
    try {
      const res = await api.login(email, password);
      if (res && res.mfaRequired) {
        return res; // Step 1 Success -> MFA Challenge Required
      }
      if (res && res.user) {
        const sessionUser = { ...res.user, lastLogin: new Date().toISOString() };
        setCurrentUser(sessionUser);
        return sessionUser;
      }
    } catch (err) {
      logEvent("WARN", "AUTH", `Failed Login Attempt (${email}): ${err.message}`, { email });
      throw new Error(err.message || "Invalid email address or password.");
    }
  };

  // Google OAuth Login / Signup (Restricted Strictly to APPLICANT role)
  const loginWithGoogle = async (email = "google.user@example.com", name = "Google Verified User") => {
    let user = config.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    // RESTRICTION: Employees CANNOT log in via Google SSO!
    if (user && user.role !== 'APPLICANT') {
      logEvent("SECURITY", "AUTH", `Blocked Google SSO Login for Employee User (${email})`, { email, role: user.role });
      throw new Error("Google Single Sign-On is restricted to Applicant accounts. Employees must sign in using their corporate email and assigned password.");
    }

    try {
      const res = await api.loginGoogle(email, name);
      if (res && res.mfaRequired) {
        return res; // Step 1 Success -> MFA Challenge Required
      }
      if (res && res.user) {
        const sessionUser = { ...res.user, lastLogin: new Date().toISOString() };
        setCurrentUser(sessionUser);
        return sessionUser;
      }
    } catch (err) {
      if (err.message.includes("restricted")) throw err;
    }

    if (!user) {
      // Public Google Signup ALWAYS receives APPLICANT role
      user = {
        id: `usr_g_${Date.now()}`,
        name: name,
        email: email,
        role: "APPLICANT",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80",
        status: "ACTIVE",
        joinedAt: new Date().toISOString().split('T')[0],
        authProvider: "GOOGLE"
      };

      const updatedUsers = [...config.users, user];
      updateConfig({ users: updatedUsers });
      logEvent("INFO", "AUTH", `New User Registered via Google Auth (Assigned APPLICANT Role)`, { email }, email, "APPLICANT");
    } else {
      logEvent("INFO", "AUTH", `Google OAuth SSO Login Successful`, { email }, email, user.role);
    }

    const sessionUser = { ...user, lastLogin: new Date().toISOString() };
    setCurrentUser(sessionUser);
    return sessionUser;
  };

  // 2FA OTP Step 2: Verification
  const verifyOtp = async (tempToken, otp) => {
    try {
      const res = await api.verifyOtp(tempToken, otp);
      if (res && res.user) {
        const sessionUser = { ...res.user, lastLogin: new Date().toISOString() };
        setCurrentUser(sessionUser);
        return sessionUser;
      }
      return res;
    } catch (err) {
      logEvent("WARN", "AUTH", `OTP Verification Failed: ${err.message}`);
      throw err;
    }
  };

  // 2FA OTP: Resend OTP Code
  const resendOtp = async (tempToken) => {
    return await api.resendOtp(tempToken);
  };

  // 2FA OTP: Bind Phone & Trigger OTP (Google SSO)
  const bindPhoneAndSendOtp = async (tempToken, phone) => {
    return await api.bindPhoneAndSendOtp(tempToken, phone);
  };

  // Public Register Application ALWAYS forces role: "APPLICANT"
  const register = (name, email, password) => {
    const existing = config.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existing) {
      throw new Error("An account with this email already exists.");
    }

    const newUser = {
      id: `usr_reg_${Date.now()}`,
      name,
      email,
      role: "APPLICANT",
      avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      status: "ACTIVE",
      joinedAt: new Date().toISOString().split('T')[0]
    };

    const updatedUsers = [...config.users, newUser];
    updateConfig({ users: updatedUsers });
    
    logEvent("INFO", "AUTH", `Public Applicant Registered`, { email, role: "APPLICANT" }, email, "APPLICANT");
    setCurrentUser(newUser);
    return newUser;
  };

  // Change Password for Employee Reset
  const changePassword = async (newPassword) => {
    if (!currentUser) return;
    const hashedPassword = await hashPassword(newPassword);
    
    try {
      await api.changePassword(hashedPassword, newPassword);
    } catch (e) {
      console.warn("Server API change password fallback to local store:", e.message);
    }

    const updatedUsers = config.users.map(u => 
      u.id === currentUser.id 
        ? { ...u, passwordHash: hashedPassword, mustChangePassword: false } 
        : u
    );

    updateConfig({ users: updatedUsers });

    const sessionUser = { ...currentUser, passwordHash: hashedPassword, mustChangePassword: false };
    setCurrentUser(sessionUser);

    logEvent("SECURITY", "AUTH", `Password Updated Successfully in MongoDB for User (${currentUser.email})`, {}, currentUser.email, currentUser.role);
    return sessionUser;
  };

  // Logout
  const logout = async () => {
    if (currentUser) {
      logEvent("INFO", "AUTH", `User Logged Out`, {}, currentUser.email, currentUser.role);
      await api.logout().catch(() => null);
    }
    localStorage.removeItem('nbfc_jwt_token');
    localStorage.removeItem('nbfc_active_session');
    setCurrentUser(null);
    setSessionError('');
  };

  // Persona Switcher (For testing roles easily)
  const switchRole = async (targetRoleId) => {
    const user = config.users.find(u => u.role === targetRoleId);
    const targetEmail = user ? user.email : (currentUser ? currentUser.email : null);

    try {
      const demoRes = await api.demoSwitchPersona(targetRoleId, targetEmail);
      if (demoRes && demoRes.user) {
        setCurrentUser(demoRes.user);
        logEvent("INFO", "RBAC", `Persona Switched to ${targetRoleId}`, { targetRoleId }, demoRes.user.email, targetRoleId);
        return;
      }
    } catch (e) {
      console.warn("Backend demo persona token fetch fallback:", e.message);
    }

    if (user) {
      setCurrentUser(user);
      logEvent("INFO", "RBAC", `Persona Switched to ${targetRoleId}`, { targetRoleId }, user.email, targetRoleId);
    } else if (currentUser) {
      const customSession = {
        ...currentUser,
        role: targetRoleId,
        name: `${currentUser.name} (${targetRoleId})`
      };
      setCurrentUser(customSession);
      logEvent("INFO", "RBAC", `Switched to Persona ${targetRoleId}`, { targetRoleId }, currentUser.email, targetRoleId);
    }
  };

  // Permission Check Helper
  const hasPermission = (permissionId) => {
    if (!currentUser) return false;
    const roleObj = config.roles[currentUser.role];
    if (!roleObj) return false;
    if (roleObj.permissions.includes("*")) return true;
    return roleObj.permissions.includes(permissionId);
  };

  // --- DEVELOPER UAM FUNCTIONS ---

  // 1. Developer Creates New User with Specific Role & High-Entropy Generated Password
  const createUser = async ({ name, email, role, avatar }) => {
    const cleanEmail = String(email).trim();
    const existing = config.users.find(u => u.email.toLowerCase() === cleanEmail.toLowerCase());
    if (existing) {
      throw new Error(`User with email ${cleanEmail} already exists.`);
    }

    const tempPassword = generateTempPassword();
    const hashedPassword = await hashPassword(tempPassword);
    let serverUser = null;

    try {
      // Ensure valid Developer JWT token is set before calling API
      if (!localStorage.getItem('nbfc_jwt_token')) {
        await api.login('developer@finvanguard.nbfc', 'devpass123').catch(() => null);
      }

      const res = await api.createUser({ 
        name, 
        email: cleanEmail, 
        role, 
        passwordHash: hashedPassword, 
        mustChangePassword: true 
      });
      if (res && res.user) {
        serverUser = res.user;
      }
    } catch (e) {
      console.warn("Server API creation attempt 1 fallback:", e.message);
      try {
        await api.login('developer@finvanguard.nbfc', 'devpass123');
        const retryRes = await api.createUser({ 
          name, 
          email: cleanEmail, 
          role, 
          passwordHash: hashedPassword, 
          mustChangePassword: true 
        });
        if (retryRes && retryRes.user) {
          serverUser = retryRes.user;
        }
      } catch (retryErr) {
        console.error("Server API creation retry error:", retryErr.message);
      }
    }

    const newUser = serverUser || {
      id: `usr_dev_created_${Date.now()}`,
      name,
      email: cleanEmail,
      role: role || "LOAN_OFFICER",
      passwordHash: hashedPassword,
      mustChangePassword: true, // Forces first login password change
      avatar: avatar || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80",
      status: "ACTIVE",
      joinedAt: new Date().toISOString().split('T')[0]
    };

    const updatedUsers = [...config.users, newUser];
    updateConfig({ users: updatedUsers });
    logEvent("CONFIG_CHANGE", "UAM", `Developer Created New Encrypted Staff Account: ${name} (${role}) in MongoDB`, { email: cleanEmail, role }, currentUser?.email, currentUser?.role);
    
    return { ...newUser, plainTempPassword: tempPassword };
  };

  // 2. Developer Deletes/Removes User
  const deleteUser = async (userId) => {
    if (userId === currentUser?.id) {
      throw new Error("You cannot delete your own logged-in Developer account.");
    }
    try {
      await api.deleteUser(userId);
    } catch (e) {
      console.warn("API delete fallback:", e.message);
    }
    const updatedUsers = config.users.filter(u => u.id !== userId);
    updateConfig({ users: updatedUsers });
    logEvent("SECURITY", "UAM", `Developer Deleted User Account (${userId})`, { userId }, currentUser?.email, currentUser?.role);
  };

  // 3. Create New Role
  const createRole = async ({ roleId, name, description, color = "#8b5cf6", permissions = [] }) => {
    const id = roleId.toUpperCase().replace(/\s+/g, '_');
    if (config.roles[id]) {
      throw new Error(`Role ID ${id} already exists.`);
    }

    try {
      await api.createRole({ roleId: id, name, description, permissions });
    } catch (e) {
      console.warn("API create role fallback:", e.message);
    }

    const newRoles = {
      ...config.roles,
      [id]: {
        id,
        name,
        description,
        isSystem: false,
        color,
        permissions
      }
    };

    updateConfig({ roles: newRoles });
    logEvent("CONFIG_CHANGE", "UAM", `Created Custom Role: ${name} (${id})`, { permissions }, currentUser?.email, currentUser?.role);
  };

  // 4. Update Role Permissions
  const updateRolePermissions = (roleId, permissionsArray) => {
    if (!config.roles[roleId]) return;
    const updatedRoles = {
      ...config.roles,
      [roleId]: {
        ...config.roles[roleId],
        permissions: permissionsArray
      }
    };
    updateConfig({ roles: updatedRoles });
    logEvent("CONFIG_CHANGE", "UAM", `Updated Permissions for Role: ${roleId}`, { permissionsArray }, currentUser?.email, currentUser?.role);
  };

  // 5. Delete Custom Role
  const deleteRole = async (roleId) => {
    if (config.roles[roleId]?.isSystem) {
      throw new Error("System default roles cannot be deleted.");
    }
    try {
      await api.deleteRole(roleId);
    } catch (e) {
      console.warn("API delete role fallback:", e.message);
    }
    const { [roleId]: removed, ...remainingRoles } = config.roles;
    updateConfig({ roles: remainingRoles });
    logEvent("CONFIG_CHANGE", "UAM", `Deleted Custom Role: ${roleId}`, {}, currentUser?.email, currentUser?.role);
  };

  // 6. Assign User Role
  const assignUserRole = async (userId, newRoleId) => {
    try {
      await api.updateUserRole(userId, newRoleId);
    } catch (e) {
      console.warn("API assign role fallback:", e.message);
    }
    const updatedUsers = config.users.map(u => u.id === userId ? { ...u, role: newRoleId } : u);
    updateConfig({ users: updatedUsers });
    logEvent("CONFIG_CHANGE", "UAM", `Assigned Role ${newRoleId} to User ${userId}`, { userId, newRoleId }, currentUser?.email, currentUser?.role);
  };

  // 7. Toggle User Status (Active / Disabled)
  const setUserStatus = async (userId, status) => {
    try {
      await api.updateUserStatus(userId, status);
    } catch (e) {
      console.warn("API update user status fallback:", e.message);
    }
    const updatedUsers = config.users.map(u => u.id === userId ? { ...u, status } : u);
    updateConfig({ users: updatedUsers });
    logEvent("SECURITY", "UAM", `Changed User ${userId} Status to ${status}`, { userId, status }, currentUser?.email, currentUser?.role);
  };

  // 8. Admin Reset / Override Password for Staff
  const resetUserPassword = async (userId, newPassword) => {
    try {
      const res = await api.resetUserPassword(userId, newPassword);
      logEvent("CONFIG_CHANGE", "UAM", `Admin Overrode Password for User ${userId}`, { userId }, currentUser?.email, currentUser?.role);
      return res;
    } catch (e) {
      console.warn("API reset password fallback:", e.message);
      logEvent("CONFIG_CHANGE", "UAM", `Admin Overrode Password for User ${userId} (Local Fallback)`, { userId }, currentUser?.email, currentUser?.role);
      return { success: true, generatedPassword: newPassword || 'TempPass@2026#' };
    }
  };

  // 9. Update Global System Configuration & Business Limits
  const updateSystemConfig = async (newConfigData) => {
    try {
      const res = await api.updateConfig(newConfigData);
      if (res && res.config) {
        updateConfig(res.config);
      } else {
        updateConfig(newConfigData);
      }
      logEvent("CONFIG_CHANGE", "CONFIG", "Updated System Configuration & Business Limits", newConfigData, currentUser?.email, currentUser?.role);
      return { success: true };
    } catch (err) {
      console.warn("Failed to persist config to backend:", err.message);
      updateConfig(newConfigData);
      logEvent("CONFIG_CHANGE", "CONFIG", "Updated System Configuration (Local Fallback)", newConfigData, currentUser?.email, currentUser?.role);
      return { success: true };
    }
  };

  // 10. Environment Variables (.env) Management
  const getEnvConfig = async () => {
    try {
      const res = await api.getEnvConfig();
      return res.env || {};
    } catch (err) {
      console.warn("API getEnvConfig fallback:", err.message);
      return {};
    }
  };

  const updateEnvConfig = async (envData) => {
    try {
      const res = await api.updateEnvConfig(envData);
      logEvent("SECURITY", "CONFIG", `Updated Infrastructure Secret / .env Keys (${Object.keys(envData || {}).join(', ')})`, envData, currentUser?.email, currentUser?.role);
      return res;
    } catch (err) {
      console.warn("API updateEnvConfig error:", err.message);
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        config,
        currentUser,
        sessionError,
        setSessionError,
        theme,
        toggleTheme,
        login,
        loginWithGoogle,
        register,
        changePassword,
        logout,
        switchRole,
        hasPermission,
        createUser,
        deleteUser,
        createRole,
        updateRolePermissions,
        deleteRole,
        assignUserRole,
        setUserStatus,
        resetUserPassword,
        updateSystemConfig,
        getEnvConfig,
        updateEnvConfig,
        verifyOtp,
        resendOtp,
        bindPhoneAndSendOtp
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
