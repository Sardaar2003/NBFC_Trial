import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { getEnvVariables, updateEnvVariables } from './envManager.js';
import { 
  initializeDatabase, 
  getSystemConfig, 
  updateSystemConfig, 
  findUserByEmail, 
  createUser, 
  updateUserRole, 
  updateUserStatus, 
  updateUserPassword,
  updateUserLastLogin,
  updateUserPhone,
  createSession,
  invalidateSession,
  saveOtpChallenge,
  verifyOtpChallenge,
  findUserByTempToken,
  clearOtpChallenge,
  deleteUser, 
  createRole, 
  deleteRole, 
  getLoans, 
  createLoan,
  updateLoanStatus,
  attachDocumentToLoan,
  updateDocumentStatus,
  updateLoanUnderwriting,
  saveSanctionDetails,
  saveAuditLog, 
  getAuditLogs 
} from './db.js';
import { sendSmsOtp } from './services/smsService.js';
import { uploadDocumentToVault, getDocumentSignedUrl } from './services/gcsStorageService.js';
import { getDigiLockerAuthUrl, processDigiLockerFetch } from './services/digilockerService.js';
import { authenticateToken, requirePermission } from './middleware/authMiddleware.js';
import passport, { setupPassport } from './passport.js';

function maskPhone(phone) {
  if (!phone) return '+91 ***** *****';
  const clean = String(phone).trim();
  if (clean.length < 8) return '****' + clean.slice(-4);
  return clean.substring(0, 3) + ' ' + '*'.repeat(Math.max(3, clean.length - 7)) + ' ' + clean.slice(-4);
}

const app = express();
const PORT = process.env.PORT || 5000;
const JWT_SECRET = process.env.JWT_SECRET || 'nbfc_finvanguard_secret_key_2026';

// Persistent Dual-Logger Configuration (Terminal + File)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOGS_DIR = path.join(__dirname, 'logs');
const AUTH_LOG_FILE = path.join(LOGS_DIR, 'auth.log');

if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

function logTerminal(tag, message, meta = {}) {
  const time = new Date().toLocaleTimeString();
  const isoTime = new Date().toISOString();

  // 1. Terminal Console Output
  console.log(`\n🔍 [${time}] [${tag}] ${message}`);
  if (Object.keys(meta).length > 0) {
    console.log(`   └─ Details:`, JSON.stringify(meta, null, 2));
  }

  // 2. Persistent Logger File Output (server/logs/auth.log)
  try {
    let fileEntry = `[${isoTime}] [${tag}] ${message}`;
    if (Object.keys(meta).length > 0) {
      fileEntry += ` | Details: ${JSON.stringify(meta)}`;
    }
    fileEntry += '\n';
    fs.appendFileSync(AUTH_LOG_FILE, fileEntry, 'utf8');
  } catch (err) {
    console.error(`❌ [LOGGER FILE ERROR] Could not write entry to auth.log:`, err.message);
  }
}

function hashPasswordSHA256(plainTextPassword) {
  if (!plainTextPassword) return '';
  return crypto.createHash('sha256').update(plainTextPassword + '_nbfc_salt_2026').digest('hex');
}

function verifyPasswordHash(plainTextPassword, storedHash) {
  if (!plainTextPassword || !storedHash) return false;
  const rawPass = String(plainTextPassword);
  const trimmedPass = rawPass.trim();

  if (storedHash.startsWith('$2a$') || storedHash.startsWith('$2b$')) {
    return bcrypt.compareSync(rawPass, storedHash) || bcrypt.compareSync(trimmedPass, storedHash);
  }

  const rawHash = hashPasswordSHA256(rawPass);
  const trimmedHash = hashPasswordSHA256(trimmedPass);

  const isMatch = rawHash === storedHash || trimmedHash === storedHash;
  if (!isMatch) {
    console.log(`   ⚠️ [PASSWORD MISMATCH] Raw Input Hash: "${rawHash.substring(0, 16)}..." | Trimmed Hash: "${trimmedHash.substring(0, 16)}..." vs Stored: "${storedHash.substring(0, 16)}..."`);
  }
  return isMatch;
}

// Middlewares
app.use(helmet());
app.use(cors({ origin: '*', credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));
app.use(morgan('dev'));
app.use(passport.initialize());

// Setup Passport Strategies
setupPassport();

// Initialize MongoDB Connection on Startup
initializeDatabase();

// --- REST API ENDPOINTS ---

// 1. Health Check
app.get('/api/health', async (req, res) => {
  const config = await getSystemConfig();
  res.json({
    status: "UP",
    app: config.system.appName,
    version: config.system.version,
    database: "MongoDB Engine Connected",
    timestamp: new Date().toISOString()
  });
});

// 2. Auth: Password Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const cleanEmail = email ? String(email).trim() : '';
  const cleanPassword = password ? String(password) : '';

  logTerminal('AUTH LOGIN REQUEST', `Attempting login for email: "${cleanEmail}"`, {
    rawEmail: email,
    cleanEmail,
    passwordLength: cleanPassword.length,
    passwordPreview: cleanPassword.length > 4 ? `${cleanPassword.substring(0, 3)}...${cleanPassword.substring(cleanPassword.length - 2)}` : '***'
  });

  let user = await findUserByEmail(cleanEmail);

  if (!user) {
    const sysConfig = await getSystemConfig();
    const memoryUser = sysConfig.users.find(u => u.email && u.email.toLowerCase() === cleanEmail.toLowerCase());
    if (memoryUser) {
      logTerminal('AUTH AUTO-PROVISION', `Found user in System Config, auto-provisioning to MongoDB: "${cleanEmail}"`);
      user = await createUser({
        id: memoryUser.id || `usr_sync_${Date.now()}`,
        name: memoryUser.name,
        email: memoryUser.email,
        role: memoryUser.role || 'APPLICANT',
        passwordHash: memoryUser.passwordHash || null,
        mustChangePassword: memoryUser.mustChangePassword !== undefined ? memoryUser.mustChangePassword : false,
        status: memoryUser.status || 'ACTIVE'
      });
    }
  }

  if (!user) {
    logTerminal('AUTH LOGIN FAIL', `User NOT found in database or config for email: "${cleanEmail}"`);
    await saveAuditLog({ id: `log_${Date.now()}`, level: "WARN", category: "AUTH", action: `Invalid Login Attempt (${cleanEmail})`, user: cleanEmail });
    return res.status(401).json({ error: "Invalid email address or password" });
  }

  logTerminal('AUTH USER FOUND', `User record retrieved from MongoDB/Store`, {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    hasPasswordHash: !!user.passwordHash,
    mustChangePassword: user.mustChangePassword
  });

  if (user.status === "DISABLED") {
    logTerminal('AUTH LOGIN BLOCKED', `Account is suspended/disabled: "${cleanEmail}"`);
    await saveAuditLog({ id: `log_${Date.now()}`, level: "SECURITY", category: "AUTH", action: `Blocked Login Attempt: Suspended Account (${cleanEmail})`, user: cleanEmail });
    return res.status(403).json({ error: "Account suspended by Administrator" });
  }

  // Password verification against MongoDB stored hash
  if (user.passwordHash) {
    const isValid = verifyPasswordHash(cleanPassword, user.passwordHash);
    if (!isValid) {
      logTerminal('AUTH LOGIN FAIL', `Password verification failed for: "${cleanEmail}"`);
      await saveAuditLog({ id: `log_${Date.now()}`, level: "WARN", category: "AUTH", action: `Failed Password Verification (${cleanEmail})`, user: cleanEmail });
      return res.status(401).json({ error: "Invalid email address or password" });
    }
    logTerminal('AUTH LOGIN SUCCESS', `Password verified successfully for: "${cleanEmail}"`);
  } else {
    // Initial login for seeded user: bind input password hash in MongoDB
    const newHash = hashPasswordSHA256(cleanPassword);
    logTerminal('AUTH INITIAL SEED HASH', `Seeding password hash for user: "${cleanEmail}"`);
    await updateUserPassword(user.id, newHash, false);
    user.passwordHash = newHash;
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const tempToken = `mfa_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

  await saveOtpChallenge(user.id, tempToken, otpCode, 5);
  await sendSmsOtp(user.phone || '+91 98765 43210', otpCode, user.email);

  logTerminal('AUTH MFA OTP ISSUED', `2FA OTP issued for user: "${user.email}" [TempToken: ${tempToken}]`);

  res.json({
    mfaRequired: true,
    tempToken,
    maskedPhone: maskPhone(user.phone || '+91 98765 43210'),
    userEmail: user.email,
    message: "6-digit OTP code sent to registered mobile number."
  });
});

// 2d. Auth: Verify 2FA SMS OTP
app.post('/api/auth/verify-otp', async (req, res) => {
  const { tempToken, otp } = req.body;
  
  if (!tempToken || !otp) {
    return res.status(400).json({ error: "Temporary token and 6-digit OTP are required." });
  }

  logTerminal('AUTH VERIFY OTP', `Attempting OTP verification for tempToken: "${tempToken}"`);

  const result = await verifyOtpChallenge(tempToken, otp);

  if (!result.success) {
    if (result.reason === 'ACCOUNT_SUSPENDED') {
      logTerminal('AUTH OTP SUSPENDED', `Account suspended due to 3 failed OTP attempts!`);
      return res.status(403).json({
        error: "Account auto-suspended due to 3 consecutive invalid OTP attempts. Please contact Administrator to unsuspend your account.",
        suspended: true
      });
    }

    if (result.reason === 'OTP_EXPIRED') {
      logTerminal('AUTH OTP EXPIRED', `OTP code expired for tempToken: "${tempToken}"`);
      return res.status(400).json({ error: "OTP has expired. Please click Resend OTP to get a new code." });
    }

    if (result.reason === 'INVALID_OTP') {
      logTerminal('AUTH OTP INVALID', `Invalid OTP entered. ${result.attemptsLeft} attempt(s) remaining.`);
      return res.status(400).json({
        error: `Invalid OTP code. ${result.attemptsLeft} attempt(s) remaining before account suspension.`,
        attemptsLeft: result.attemptsLeft
      });
    }

    logTerminal('AUTH OTP FAIL', `OTP verification failed: ${result.reason}`);
    return res.status(400).json({ error: "Invalid or expired 2FA session. Please log in again." });
  }

  let user = result.user;
  const config = await getSystemConfig();
  const roleObj = config.roles[user.role] || { permissions: [] };

  const sessionId = `sess_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  await createSession(user.id, sessionId, 8 * 60 * 60 * 1000);

  const token = jwt.sign(
    { userId: user.id, sessionId, name: user.name, email: user.email, role: user.role, permissions: roleObj.permissions },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  const updatedUser = await updateUserLastLogin(user.id);
  if (updatedUser) user = updatedUser;

  await saveAuditLog({ id: `log_${Date.now()}`, level: "INFO", category: "AUTH", action: `2FA OTP Verified & JWT Session Issued`, user: user.email, role: user.role });

  logTerminal('AUTH 2FA SUCCESS', `2FA OTP verified and JWT session generated for: "${user.email}" (${user.role}) [Session: ${sessionId}]`);
  res.json({ token, user: { ...user, permissions: roleObj.permissions } });
});

// 2e. Auth: Resend 2FA SMS OTP
app.post('/api/auth/resend-otp', async (req, res) => {
  const { tempToken } = req.body;
  if (!tempToken) {
    return res.status(400).json({ error: "Temporary token is required." });
  }

  const user = await findUserByTempToken(tempToken);
  if (!user) {
    return res.status(400).json({ error: "Session expired or invalid. Please log in again." });
  }

  if (user.status === 'DISABLED') {
    return res.status(403).json({ error: "Account suspended by Administrator." });
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  await saveOtpChallenge(user.id, tempToken, otpCode, 5);
  await sendSmsOtp(user.phone || '+91 98765 43210', otpCode, user.email);

  logTerminal('AUTH RESEND OTP', `New OTP resent to phone for user: "${user.email}"`);

  res.json({
    success: true,
    maskedPhone: maskPhone(user.phone || '+91 98765 43210'),
    message: "New 6-digit OTP code sent to your registered mobile number."
  });
});

// 2f. Auth: Bind Phone Number & Send 2FA SMS OTP (For Google SSO Users)
app.post('/api/auth/bind-phone-and-send-otp', async (req, res) => {
  const { tempToken, phone } = req.body;
  if (!tempToken || !phone) {
    return res.status(400).json({ error: "Temporary session token and mobile phone number are required." });
  }

  const cleanPhone = String(phone).trim();
  if (cleanPhone.length < 8) {
    return res.status(400).json({ error: "Please enter a valid mobile phone number." });
  }

  const user = await findUserByTempToken(tempToken);
  if (!user) {
    return res.status(400).json({ error: "Session expired or invalid. Please sign in with Google again." });
  }

  if (user.status === 'DISABLED') {
    return res.status(403).json({ error: "Account suspended by Administrator." });
  }

  // Save phone number in MongoDB for this user
  await updateUserPhone(user.id, cleanPhone);
  logTerminal('AUTH PHONE BOUND', `Mobile number bound to user: "${user.email}" -> "${cleanPhone}"`);

  // Generate 6-digit OTP code & send SMS
  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  await saveOtpChallenge(user.id, tempToken, otpCode, 5);
  await sendSmsOtp(cleanPhone, otpCode, user.email);

  logTerminal('AUTH OTP SENT', `2FA OTP sent to newly bound phone for user: "${user.email}"`);

  res.json({
    success: true,
    mfaRequired: true,
    requiresPhone: false,
    tempToken,
    maskedPhone: maskPhone(cleanPhone),
    userEmail: user.email,
    message: `6-digit OTP code sent to ${cleanPhone}.`
  });
});

// 2c. Auth: Instant Demo Persona Switch (Issues valid JWT token for demo user switching)
app.post('/api/auth/demo-switch', async (req, res) => {
  const { role, email } = req.body;
  const config = await getSystemConfig();
  let user = null;

  if (email) {
    user = await findUserByEmail(email);
  }
  if (!user && role) {
    const memoryUser = config.users.find(u => u.role === role);
    if (memoryUser) {
      user = await findUserByEmail(memoryUser.email);
      if (!user) {
        user = await createUser({
          id: memoryUser.id || `usr_sync_${Date.now()}`,
          name: memoryUser.name,
          email: memoryUser.email,
          role: memoryUser.role || role,
          status: 'ACTIVE'
        });
      }
    }
  }

  if (!user) {
    const fallbackUser = config.users[0];
    user = await findUserByEmail(fallbackUser.email);
  }

  if (!user) {
    return res.status(404).json({ error: "Persona user not found" });
  }

  const roleObj = config.roles[user.role] || { permissions: [] };
  const sessionId = `sess_demo_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
  await createSession(user.id, sessionId, 8 * 60 * 60 * 1000);

  const token = jwt.sign(
    { userId: user.id, sessionId, name: user.name, email: user.email, role: user.role, permissions: roleObj.permissions },
    JWT_SECRET,
    { expiresIn: '8h' }
  );

  logTerminal('AUTH DEMO SWITCH', `JWT token auto-issued for persona switch to "${user.email}" (${user.role})`);

  res.json({ success: true, token, user: { ...user, permissions: roleObj.permissions } });
});

// 2c. Auth: Explicit Session Logout
app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  if (req.user && req.user.userId) {
    await invalidateSession(req.user.userId);
    logTerminal('AUTH LOGOUT', `Explicit session logout for user: "${req.user.email}"`);
    await saveAuditLog({ id: `log_${Date.now()}`, level: "INFO", category: "AUTH", action: `User Logged Out & Session Invalidated`, user: req.user.email, role: req.user.role });
  }
  res.json({ success: true, message: "Logged out successfully" });
});

// 2b. Auth: Change Password (saves directly to MongoDB)
app.put('/api/auth/change-password', authenticateToken, async (req, res) => {
  const { newPassword, passwordHash } = req.body;
  const user = await findUserByEmail(req.user.email);
  if (!user) {
    return res.status(404).json({ error: "User record not found in database" });
  }

  const hashToSave = passwordHash || hashPasswordSHA256(newPassword);
  const updatedUser = await updateUserPassword(user.id, hashToSave, false);

  await saveAuditLog({
    id: `log_${Date.now()}`,
    level: "SECURITY",
    category: "AUTH",
    action: `Password Updated & Saved in MongoDB for User (${user.email})`,
    user: user.email,
    role: user.role
  });

  const config = await getSystemConfig();
  const roleObj = config.roles[user.role] || { permissions: [] };

  res.json({ success: true, user: { ...updatedUser, permissions: roleObj.permissions } });
});

// 3. Auth: Passport.js Google OAuth 2.0 Direct Strategy Trigger
app.get('/api/auth/google', (req, res, next) => {
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientSecret || clientSecret.includes('placeholder')) {
    return res.status(400).send(`
      <div style="font-family: sans-serif; padding: 2rem; max-width: 600px; margin: 40px auto; border: 1px solid #f43f5e; border-radius: 12px; background: #fff1f2; color: #9f1239;">
        <h2 style="margin-top: 0;">Passport.js Google OAuth Configuration Required</h2>
        <p>Your server is configured to use <strong>Passport.js</strong> for Google Single Sign-On, but <code>GOOGLE_CLIENT_SECRET</code> is missing or set to placeholder in <code>server/.env</code>.</p>
        <p>Please add your Google Client Secret to <code>server/.env</code>:</p>
        <pre style="background: #ffe4e6; padding: 10px; border-radius: 6px;">GOOGLE_CLIENT_ID=${process.env.GOOGLE_CLIENT_ID || 'your-client-id'}
GOOGLE_CLIENT_SECRET=your-actual-client-secret-from-google-console
GOOGLE_CALLBACK_URL=http://localhost:5000/api/auth/google/callback</pre>
        <p><a href="http://localhost:5173/" style="color: #2563eb; font-weight: bold;">← Return to NBFC Portal</a></p>
      </div>
    `);
  }
  passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
});

const handleGoogleCallback = async (err, user, info, req, res) => {
  if (err) {
    return res.redirect(`http://localhost:5173/?error=${encodeURIComponent(err.message)}`);
  }
  if (!user) {
    const errorMsg = info && info.message === 'GOOGLE_SSO_RESTRICTED_STAFF' 
      ? "Google Single Sign-On is restricted to Applicant accounts. Employees must sign in using their corporate email and assigned password." 
      : "Google Authentication failed.";
    return res.redirect(`http://localhost:5173/?error=${encodeURIComponent(errorMsg)}`);
  }

  if (user.status === 'DISABLED') {
    return res.redirect(`http://localhost:5173/?error=${encodeURIComponent('Account suspended by Administrator')}`);
  }

  if (!user.phone) {
    const tempToken = `mfa_phone_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    await saveOtpChallenge(user.id, tempToken, null, 10);
    return res.redirect(`http://localhost:5173/?mfaRequired=true&requiresPhone=true&tempToken=${tempToken}&email=${encodeURIComponent(user.email)}`);
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const tempToken = `mfa_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
  await saveOtpChallenge(user.id, tempToken, otpCode, 5);
  await sendSmsOtp(user.phone, otpCode, user.email);

  res.redirect(`http://localhost:5173/?mfaRequired=true&requiresPhone=false&tempToken=${tempToken}&maskedPhone=${encodeURIComponent(maskPhone(user.phone))}&email=${encodeURIComponent(user.email)}`);
};

// 3b. Passport Google OAuth 2.0 Callback Route
app.get('/api/auth/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user, info) => {
    handleGoogleCallback(err, user, info, req, res);
  })(req, res, next);
});

// 3c. Alias Callback Route (supports http://localhost:5000/auth/google/callback)
app.get('/auth/google/callback', (req, res, next) => {
  passport.authenticate('google', { session: false }, (err, user, info) => {
    handleGoogleCallback(err, user, info, req, res);
  })(req, res, next);
});

// 3d. Auth: Direct/Simulated Google Login & Registration (APPLICANT restricted)
app.post('/api/auth/google', async (req, res) => {
  const { email, name } = req.body;
  const cleanEmail = email ? String(email).trim() : '';
  
  if (!cleanEmail) {
    return res.status(400).json({ error: "Email is required for Google Authentication." });
  }

  logTerminal('AUTH GOOGLE REQUEST', `Google SSO authentication requested for: "${cleanEmail}"`, { email: cleanEmail, name });

  let user = await findUserByEmail(cleanEmail);

  if (user && user.status === 'DISABLED') {
    logTerminal('AUTH GOOGLE BLOCKED', `Suspended account blocked from Google SSO: "${cleanEmail}"`);
    await saveAuditLog({ id: `log_${Date.now()}`, level: "SECURITY", category: "AUTH", action: `Blocked Google SSO Attempt: Suspended Account (${cleanEmail})`, user: cleanEmail, role: user.role });
    return res.status(403).json({ error: "Account suspended by Administrator" });
  }

  // RESTRICTION: Employees CANNOT log in via Google SSO!
  if (user && user.role !== 'APPLICANT') {
    logTerminal('AUTH GOOGLE BLOCKED', `Employee account blocked from Google SSO: "${cleanEmail}" (${user.role})`);
    await saveAuditLog({ id: `log_${Date.now()}`, level: "SECURITY", category: "AUTH", action: `Blocked Google SSO Login for Employee (${cleanEmail})`, user: cleanEmail, role: user.role });
    return res.status(403).json({ error: "Google Single Sign-On is restricted to Applicant accounts. Employees must sign in using their corporate email and assigned password." });
  }

  if (!user) {
    logTerminal('AUTH GOOGLE REGISTER', `Auto-registering new Applicant via Google SSO: "${cleanEmail}"`);
    user = await createUser({
      id: `usr_g_${Date.now()}`,
      name: name || cleanEmail.split('@')[0],
      email: cleanEmail,
      role: 'APPLICANT',
      status: 'ACTIVE',
      passwordHash: null,
      mustChangePassword: false
    });
  }

  if (!user.phone) {
    const tempToken = `mfa_phone_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
    await saveOtpChallenge(user.id, tempToken, null, 10);

    logTerminal('AUTH GOOGLE PHONE REQUIRED', `Google SSO user requires mobile phone entry: "${cleanEmail}"`);
    return res.json({
      mfaRequired: true,
      requiresPhone: true,
      tempToken,
      userEmail: user.email,
      message: "First-time Google Sign-In: Please enter your mobile phone number for 2FA SMS verification."
    });
  }

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  const tempToken = `mfa_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

  await saveOtpChallenge(user.id, tempToken, otpCode, 5);
  await sendSmsOtp(user.phone, otpCode, user.email);

  logTerminal('AUTH GOOGLE MFA ISSUED', `Google SSO MFA OTP issued for: "${cleanEmail}" [TempToken: ${tempToken}]`);
  await saveAuditLog({ id: `log_${Date.now()}`, level: "INFO", category: "AUTH", action: `Google OAuth Pre-Auth Step 1 Success (${cleanEmail})`, user: cleanEmail, role: user.role });

  res.json({
    mfaRequired: true,
    requiresPhone: false,
    tempToken,
    maskedPhone: maskPhone(user.phone),
    userEmail: user.email,
    message: "6-digit OTP code sent to registered mobile number."
  });
});

// 3e. Alias for Passport Google Auth Trigger Triggered by UI Modal
app.get('/api/auth/passport-google', (req, res, next) => {
  res.redirect('/api/auth/google');
});

// 4. Config: Fetch Single Config
app.get('/api/config', async (req, res) => {
  const config = await getSystemConfig();
  res.json(config);
});

// 5. Config: Update Single Config (DEVELOPER only)
app.put('/api/config', authenticateToken, requirePermission('SYSTEM_ADMIN'), async (req, res) => {
  const updated = await updateSystemConfig(req.body);
  await saveAuditLog({ id: `log_${Date.now()}`, level: "CONFIG_CHANGE", category: "CONFIG", action: `Single Config Updated in MongoDB`, user: req.user.email, role: req.user.role });
  res.json({ success: true, config: updated });
});

// 5b. Infrastructure Secrets & .env Config: Fetch Active .env Variables (DEVELOPER only)
app.get('/api/admin/env-config', authenticateToken, requirePermission('SYSTEM_ADMIN'), async (req, res) => {
  const envVars = getEnvVariables();
  res.json({ success: true, env: envVars });
});

// 5c. Infrastructure Secrets & .env Config: Update .env File & Process Memory (DEVELOPER only)
app.put('/api/admin/env-config', authenticateToken, requirePermission('SYSTEM_ADMIN'), async (req, res) => {
  const updatedEnv = updateEnvVariables(req.body);
  logTerminal('ENV CONFIG UPDATE', `Server .env variables updated by Admin (${req.user.email})`, {
    updatedKeys: Object.keys(req.body || {}),
    user: req.user.email
  });
  await saveAuditLog({
    id: `log_${Date.now()}`,
    level: "SECURITY",
    category: "CONFIG",
    action: `Updated Infrastructure Secret / .env Keys (${Object.keys(req.body || {}).join(', ')})`,
    user: req.user.email,
    role: req.user.role
  });
  res.json({ success: true, env: updatedEnv, message: "Environment variables updated on disk and reloaded in process memory." });
});

// 6. UAM: Provision User (DEVELOPER only)
app.post('/api/uam/users', authenticateToken, requirePermission('USER_MANAGE'), async (req, res) => {
  const { name, email, role, passwordHash, mustChangePassword } = req.body;
  const cleanEmail = email ? String(email).trim() : '';

  logTerminal('UAM PROVISION REQUEST', `Provision user requested by Developer: "${name}" (${cleanEmail})`, {
    name,
    email: cleanEmail,
    role,
    hasPasswordHash: !!passwordHash,
    passwordHashPreview: passwordHash ? `${String(passwordHash).substring(0, 16)}...` : 'null',
    mustChangePassword
  });

  const existing = await findUserByEmail(cleanEmail);
  if (existing) {
    logTerminal('UAM PROVISION FAIL', `User email already exists in DB: "${cleanEmail}"`);
    return res.status(400).json({ error: `User with email ${cleanEmail} already exists.` });
  }

  const newUser = await createUser({
    id: `usr_dev_${Date.now()}`,
    name,
    email: cleanEmail,
    role: role || 'LOAN_OFFICER',
    passwordHash: passwordHash || null,
    mustChangePassword: mustChangePassword !== undefined ? mustChangePassword : true,
    status: 'ACTIVE'
  });

  logTerminal('UAM PROVISION SUCCESS', `New employee account created in MongoDB successfully`, {
    id: newUser.id,
    name: newUser.name,
    email: newUser.email,
    role: newUser.role,
    passwordHashStored: newUser.passwordHash ? `${newUser.passwordHash.substring(0, 16)}...` : 'null'
  });

  await saveAuditLog({ id: `log_${Date.now()}`, level: "CONFIG_CHANGE", category: "UAM", action: `Developer Provisioned User ${name} (${role}) in MongoDB with Encrypted Password`, user: req.user.email, role: req.user.role });
  res.status(201).json({ success: true, user: newUser });
});

// 7. UAM: Delete User Account (DEVELOPER only)
app.delete('/api/uam/users/:id', authenticateToken, requirePermission('USER_MANAGE'), async (req, res) => {
  const { id } = req.params;
  await deleteUser(id);
  await saveAuditLog({ id: `log_${Date.now()}`, level: "SECURITY", category: "UAM", action: `Developer Deleted User ${id} from MongoDB`, user: req.user.email, role: req.user.role });
  res.json({ success: true, deletedUserId: id });
});

// 8. UAM: Assign User Role
app.put('/api/uam/users/:id/role', authenticateToken, requirePermission('USER_MANAGE'), async (req, res) => {
  const { id } = req.params;
  const { newRole } = req.body;
  const updated = await updateUserRole(id, newRole);
  await saveAuditLog({ id: `log_${Date.now()}`, level: "CONFIG_CHANGE", category: "UAM", action: `Assigned Role ${newRole} to User ${id} in MongoDB`, user: req.user.email, role: req.user.role });
  res.json({ success: true, user: updated });
});

// 8b. UAM: Update User Status (ACTIVE / DISABLED)
app.put('/api/uam/users/:id/status', authenticateToken, requirePermission('USER_MANAGE'), async (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  const updated = await updateUserStatus(id, status);
  await saveAuditLog({ id: `log_${Date.now()}`, level: "SECURITY", category: "UAM", action: `Changed User ${id} Status to ${status} in MongoDB`, user: req.user.email, role: req.user.role });
  res.json({ success: true, user: updated });
});

// 8c. UAM: Admin Override / Reset User Password
app.post('/api/uam/users/:id/reset-password', authenticateToken, requirePermission('USER_MANAGE'), async (req, res) => {
  const { id } = req.params;
  let { newPassword } = req.body;

  // Auto-generate strong 12-char password if not provided
  if (!newPassword || typeof newPassword !== 'string' || newPassword.trim().length < 6) {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
    newPassword = Array.from({ length: 12 }, () => chars.charAt(Math.floor(Math.random() * chars.length))).join('');
  }

  const hashToSave = await bcrypt.hash(newPassword, 10);
  const updatedUser = await updateUserPassword(id, hashToSave, true);

  logTerminal('UAM PASSWORD OVERRIDE', `Password overridden by Admin (${req.user.email}) for User: "${id}"`, {
    userId: id,
    adminEmail: req.user.email,
    mustChangePassword: true
  });

  await saveAuditLog({ 
    id: `log_${Date.now()}`, 
    level: "CONFIG_CHANGE", 
    category: "UAM", 
    action: `Admin Overrode Password for User ${id} in MongoDB`, 
    user: req.user.email, 
    role: req.user.role 
  });

  res.json({ 
    success: true, 
    user: updatedUser,
    generatedPassword: newPassword,
    message: `Password successfully updated and set to change on next login.` 
  });
});

// 9. UAM: Create Custom Role
app.post('/api/uam/roles', authenticateToken, requirePermission('ROLE_MANAGE'), async (req, res) => {
  const { roleId, name, description, permissions } = req.body;
  const id = roleId.toUpperCase();
  const created = await createRole({ id, name, description, isSystem: false, color: '#8b5cf6', permissions: permissions || [] });
  await saveAuditLog({ id: `log_${Date.now()}`, level: "CONFIG_CHANGE", category: "UAM", action: `Created Custom Role ${id} in MongoDB`, user: req.user.email, role: req.user.role });
  res.status(201).json({ success: true, role: created });
});

// 10. UAM: Delete Custom Role
app.delete('/api/uam/roles/:id', authenticateToken, requirePermission('ROLE_MANAGE'), async (req, res) => {
  const { id } = req.params;
  await deleteRole(id);
  await saveAuditLog({ id: `log_${Date.now()}`, level: "CONFIG_CHANGE", category: "UAM", action: `Deleted Role ${id} from MongoDB`, user: req.user.email, role: req.user.role });
  res.json({ success: true, deletedRoleId: id });
});

// 11. Loans: Fetch Applications
app.get('/api/loans', authenticateToken, async (req, res) => {
  const filter = req.user.role === 'APPLICANT' ? { applicantEmail: req.user.email } : {};
  const loans = await getLoans(filter);
  res.json(loans);
});

// 12. Loans: Submit Full Application (14-Category Schema)
app.post('/api/loans', authenticateToken, requirePermission('LOAN_APPLY'), async (req, res) => {
  const { 
    type, amount, tenureMonths, purpose,
    applicantDetails, employmentDetails, bankingDetails, liabilitiesDetails,
    cibilScore, foir, riskGrade 
  } = req.body;

  const loanId = `LN-2026-${Math.floor(1000 + Math.random() * 9000)}`;
  const monthlyIncome = Number(employmentDetails?.monthlyIncome || 85000);
  const existingEMIs = Number(liabilitiesDetails?.existingEMIs || 15000);
  const requestedAmount = Number(amount || 500000);
  const months = Number(tenureMonths || 36);

  // EMI & FOIR calculation
  const monthlyInterestRate = 0.12 / 12; // 12% p.a.
  const calculatedEmi = Math.round(
    (requestedAmount * monthlyInterestRate * Math.pow(1 + monthlyInterestRate, months)) /
    (Math.pow(1 + monthlyInterestRate, months) - 1)
  );

  const calculatedFoir = Math.round(((existingEMIs + calculatedEmi) / monthlyIncome) * 100);

  const newLoan = await createLoan({
    id: loanId,
    applicantName: applicantDetails?.fullName || req.user.name,
    applicantEmail: req.user.email,
    type: type || 'Personal Loan',
    amount: requestedAmount,
    tenureMonths: months,
    emi: calculatedEmi,
    status: 'SUBMITTED',
    cibilScore: cibilScore || 765,
    foir: calculatedFoir,
    riskGrade: calculatedFoir > 55 ? 'MEDIUM' : 'LOW',
    applicantDetails: applicantDetails || {},
    employmentDetails: employmentDetails || {},
    bankingDetails: bankingDetails || {},
    liabilitiesDetails: liabilitiesDetails || {},
    creditMetrics: { cibilScore: cibilScore || 765, foir: calculatedFoir, emi: calculatedEmi },
    documentVault: [],
    digilocker: { enabled: false }
  });

  await saveAuditLog({ id: `log_${Date.now()}`, level: "INFO", category: "WORKFLOW", action: `Submitted New Loan Application ${loanId}`, user: req.user.email, role: req.user.role });
  res.status(201).json({ success: true, loan: newLoan });
});

// 12b. DigiLocker: Get OAuth Consent Auth URL
app.get('/api/loans/digilocker/auth-url', authenticateToken, (req, res) => {
  const { loanId } = req.query;
  const authUrl = getDigiLockerAuthUrl(loanId || 'NEW_APPLICATION', req.user.email);
  res.json({ success: true, authUrl });
});

// 12c. DigiLocker: Execute Instant e-KYC Verification & Archive to GCS Storage Vault
app.post('/api/loans/digilocker/verify', authenticateToken, async (req, res) => {
  const { loanId, panNumber, aadhaarNumber } = req.body;
  const result = await processDigiLockerFetch({
    loanId: loanId || `LN-2026-${Math.floor(1000 + Math.random() * 9000)}`,
    userEmail: req.user.email,
    panNumber,
    aadhaarNumber
  });

  if (loanId) {
    for (const doc of result.documents) {
      await attachDocumentToLoan(loanId, doc);
    }
  }

  await saveAuditLog({
    id: `log_${Date.now()}`,
    level: "INFO",
    category: "KYC_SECURITY",
    action: `Executed DigiLocker e-KYC Verification for ${req.user.email}`,
    user: req.user.email,
    role: req.user.role,
    details: { loanId, verifiedProfile: result.verifiedProfile }
  });

  res.json({ success: true, ...result });
});

// 12d. GCS Vault: Upload Document to Google Cloud Storage
app.post('/api/loans/:id/documents', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { docType, fileName, fileData, mimeType } = req.body; // fileData in base64 string format

  if (!fileName || !fileData) {
    return res.status(400).json({ error: "Missing document fileName or fileData payload" });
  }

  const fileBuffer = Buffer.from(fileData.replace(/^data:.*?;base64,/, ''), 'base64');
  const docObj = await uploadDocumentToVault({
    loanId: id,
    docType: docType || 'GENERAL_DOCUMENT',
    fileName,
    fileBuffer,
    mimeType: mimeType || 'application/pdf',
    uploadedBy: req.user.email
  });

  const updatedLoan = await attachDocumentToLoan(id, docObj);

  await saveAuditLog({
    id: `log_${Date.now()}`,
    level: "INFO",
    category: "DOCUMENT_VAULT",
    action: `Uploaded Document ${fileName} to GCS Bucket (${docObj.gcsUri})`,
    user: req.user.email,
    role: req.user.role,
    details: { loanId: id, gcsUri: docObj.gcsUri, storageMode: docObj.storageMode }
  });

  res.json({ success: true, document: docObj, loan: updatedLoan });
});

// 12e. GCS Vault: Get V4 Signed URL for In-Browser Inspection
app.post('/api/loans/document-signed-url', authenticateToken, async (req, res) => {
  const { docObject } = req.body;
  if (!docObject) return res.status(400).json({ error: "Missing docObject" });

  const signedUrl = await getDocumentSignedUrl(docObject, 30);
  res.json({ success: true, signedUrl });
});

// 12f. Document Vault Verification Status Update (Reviewer/Approver)
app.put('/api/loans/:id/documents/:docId/status', authenticateToken, requirePermission('LOAN_VERIFY'), async (req, res) => {
  const { id, docId } = req.params;
  const { verificationStatus } = req.body; // VERIFIED, REJECTED, DISCREPANCY

  const updated = await updateDocumentStatus(id, docId, verificationStatus);
  await saveAuditLog({
    id: `log_${Date.now()}`,
    level: "INFO",
    category: "KYC_AUDIT",
    action: `Reviewer Set Document ${docId} Status to ${verificationStatus}`,
    user: req.user.email,
    role: req.user.role,
    details: { loanId: id, docId, verificationStatus }
  });

  res.json({ success: true, loan: updated });
});

// 12g. Underwriting Credit Metrics Update (Approver)
app.put('/api/loans/:id/underwrite', authenticateToken, requirePermission('LOAN_UNDERWRITE'), async (req, res) => {
  const { id } = req.params;
  const { cibilScore, foir, riskGrade, decisionStatus } = req.body;

  const updated = await updateLoanUnderwriting(id, {
    cibilScore: Number(cibilScore),
    foir: Number(foir),
    riskGrade: riskGrade || (foir > 55 ? 'HIGH' : 'LOW'),
    status: decisionStatus || 'UNDERWRITING'
  });

  await saveAuditLog({
    id: `log_${Date.now()}`,
    level: "INFO",
    category: "CREDIT_UNDERWRITING",
    action: `Approver Completed Underwriting for Loan ${id} (FOIR: ${foir}%, CIBIL: ${cibilScore})`,
    user: req.user.email,
    role: req.user.role,
    details: { loanId: id, cibilScore, foir, riskGrade }
  });

  res.json({ success: true, loan: updated });
});

// 12h. Sanction Letter Issuance (Sanctioning Officer)
app.post('/api/loans/:id/sanction', authenticateToken, requirePermission('LOAN_SANCTION'), async (req, res) => {
  const { id } = req.params;
  const { approvedAmount, interestRate, tenureMonths } = req.body;

  const sanctionData = {
    letterId: `SANC_${id}_${Date.now()}`,
    approvedAmount: Number(approvedAmount || 500000),
    interestRate: Number(interestRate || 11.5),
    tenureMonths: Number(tenureMonths || 36),
    issuedAt: new Date().toISOString(),
    issuedBy: req.user.email,
    eSigned: false
  };

  const updated = await saveSanctionDetails(id, sanctionData);

  await saveAuditLog({
    id: `log_${Date.now()}`,
    level: "INFO",
    category: "CREDIT_SANCTION",
    action: `Issued Digital Sanction Letter for Loan ${id} (Approved Amount: Rs.${sanctionData.approvedAmount})`,
    user: req.user.email,
    role: req.user.role,
    details: { loanId: id, sanctionData }
  });

  res.json({ success: true, sanction: sanctionData, loan: updated });
});

// 13. Loans: Update Status
app.put('/api/loans/:id/status', authenticateToken, async (req, res) => {
  const { id } = req.params;
  const { status, actionTitle } = req.body;
  const updated = await updateLoanStatus(id, status, actionTitle);
  await saveAuditLog({ 
    id: `log_${Date.now()}`, 
    level: "INFO", 
    category: "WORKFLOW", 
    action: `Loan ${id}: ${actionTitle || status}`, 
    user: req.user.email, 
    role: req.user.role,
    details: { appId: id, newStatus: status }
  });
  res.json({ success: true, loan: updated });
});

// 14. Audit Logs Stream
app.get('/api/logs', authenticateToken, requirePermission('SYSTEM_ADMIN'), async (req, res) => {
  const logs = await getAuditLogs();
  res.json(logs);
});

// 15. Production Static Frontend Serving (Vite build dist)
const DIST_DIR = path.join(__dirname, '../dist');
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
}

// Start Server
const server = app.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`  FinVanguard NBFC REST API Server Live on Port ${PORT} `);
  console.log(`  Database Engine: MongoDB Centralized Access (db.js)   `);
  console.log(`  Health Check: http://localhost:${PORT}/api/health    `);
  console.log(`=======================================================`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`\n❌ [PORT CONFLICT] Port ${PORT} is already in use by another running process.`);
    console.error(`👉 To free Port ${PORT} on Windows, run this in PowerShell:`);
    console.error(`   Get-Process -Id (Get-NetTCPConnection -LocalPort ${PORT}).OwningProcess | Stop-Process -Force\n`);
  } else {
    console.error(`❌ Server Error:`, err.message);
  }
});
