/**
 * Single Centralized MongoDB Initialization & Access Engine for FinVanguard NBFC
 */
import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/nbfc_loan_db';

// --- MONGOOSE SCHEMAS ---

const UserSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  role: { type: String, required: true, default: 'APPLICANT' },
  avatar: { type: String, default: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80' },
  status: { type: String, enum: ['ACTIVE', 'DISABLED'], default: 'ACTIVE' },
  passwordHash: { type: String, default: null },
  mustChangePassword: { type: Boolean, default: false },
  joinedAt: { type: String, default: () => new Date().toISOString().split('T')[0] },
  lastLogin: { type: String, default: null },
  activeSessionId: { type: String, default: null },
  sessionExpiresAt: { type: String, default: null },
  phone: { type: String, default: null },
  tempMfaToken: { type: String, default: null },
  otpCode: { type: String, default: null },
  otpExpiresAt: { type: String, default: null },
  otpAttempts: { type: Number, default: 0 }
});

const RoleSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  description: { type: String },
  isSystem: { type: Boolean, default: false },
  color: { type: String, default: '#8b5cf6' },
  permissions: [{ type: String }]
});

const SystemConfigSchema = new mongoose.Schema({
  key: { type: String, default: 'main_config', unique: true },
  system: {
    appName: { type: String, default: "FinVanguard NBFC" },
    version: { type: String, default: "1.4.0-mongodb-enterprise" },
    rbiLicenseNo: { type: String, default: "NBFC-IND-884920-A" },
    environment: { type: String, default: "production-cloud-ready" },
    googleAuthEnabled: { type: Boolean, default: true },
    enableMFA: { type: Boolean, default: true }
  },
  businessLimits: {
    maxPersonalLoan: { type: Number, default: 2500000 },
    maxBusinessLoan: { type: Number, default: 10000000 },
    minCibilScore: { type: Number, default: 650 },
    maxFOIRPercentage: { type: Number, default: 60 }
  }
});

const LoanSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  applicantName: { type: String, required: true },
  applicantEmail: { type: String, required: true },
  type: { type: String, required: true },
  amount: { type: Number, required: true },
  tenureMonths: { type: Number, default: 36 },
  emi: { type: Number },
  status: { type: String, default: 'SUBMITTED' }, // SUBMITTED, DOC_VERIFIED, UNDERWRITING, SANCTIONED, DISBURSED, REJECTED
  cibilScore: { type: Number, default: 750 },
  foir: { type: Number, default: 35 },
  riskGrade: { type: String, default: 'LOW' },
  appliedDate: { type: String, default: () => new Date().toISOString().split('T')[0] },
  
  applicantDetails: { type: Object, default: {} },
  employmentDetails: { type: Object, default: {} },
  bankingDetails: { type: Object, default: {} },
  liabilitiesDetails: { type: Object, default: {} },
  creditMetrics: { type: Object, default: {} },
  documentVault: { type: Array, default: [] },
  digilocker: { type: Object, default: { enabled: false } },
  sanction: { type: Object, default: {} }
});

const AuditLogSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  timestamp: { type: String, default: () => new Date().toISOString() },
  level: { type: String, required: true },
  category: { type: String, required: true },
  action: { type: String, required: true },
  user: { type: String, default: 'system' },
  role: { type: String, default: 'SYSTEM' },
  details: { type: Object, default: {} }
});

// --- MODELS ---
export const UserModel = mongoose.model('User', UserSchema);
export const RoleModel = mongoose.model('Role', RoleSchema);
export const SystemConfigModel = mongoose.model('SystemConfig', SystemConfigSchema);
export const LoanModel = mongoose.model('Loan', LoanSchema);
export const AuditLogModel = mongoose.model('AuditLog', AuditLogSchema);

// In-Memory Failover Cache (if local MongoDB service is unavailable)
let isConnectedToMongo = false;
let memoryStore = {
  config: {
    system: { appName: "FinVanguard NBFC", version: "1.4.0-mongodb", rbiLicenseNo: "NBFC-IND-884920-A", googleAuthEnabled: true },
    businessLimits: { maxPersonalLoan: 2500000, maxBusinessLoan: 10000000, minCibilScore: 650, maxFOIRPercentage: 60 }
  },
  roles: {
    DEVELOPER: { id: "DEVELOPER", name: "Developer / Super Admin", permissions: ["*"], isSystem: true, color: "#8b5cf6" },
    APPLICANT: { id: "APPLICANT", name: "Applicant", permissions: ["LOAN_APPLY", "VIEW_OWN_LOAN"], isSystem: true, color: "#3b82f6" },
    REVIEWER: { id: "REVIEWER", name: "Document Reviewer", permissions: ["LOAN_VERIFY", "DOC_REVIEW"], isSystem: true, color: "#f59e0b" },
    APPROVER: { id: "APPROVER", name: "Credit Risk Approver", permissions: ["LOAN_UNDERWRITE", "CREDIT_APPROVE"], isSystem: true, color: "#10b981" },
    SANCTIONING_OFFICER: { id: "SANCTIONING_OFFICER", name: "Sanctioning Officer", permissions: ["LOAN_SANCTION", "DISBURSAL_AUTH"], isSystem: true, color: "#ec4899" },
    MANAGER: { id: "MANAGER", name: "Branch & Operations Manager", permissions: ["MANAGE_STAFF", "VIEW_ALL_LOANS", "VIEW_REPORTS"], isSystem: true, color: "#06b6d4" }
  },
  users: [
    { id: "usr_dev_1", name: "Alex Vance (Lead Engineer)", email: "developer@finvanguard.nbfc", role: "DEVELOPER", status: "ACTIVE", phone: "+91 98765 43210", joinedAt: "2026-01-10" },
    { id: "usr_app_1", name: "Priya Sharma", email: "applicant@finvanguard.nbfc", role: "APPLICANT", status: "ACTIVE", phone: "+91 98765 12345", joinedAt: "2026-08-15" },
    { id: "usr_rev_1", name: "Rahul Verma (Verification Lead)", email: "reviewer@finvanguard.nbfc", role: "REVIEWER", status: "ACTIVE", phone: "+91 98765 22334", joinedAt: "2026-03-12" },
    { id: "usr_appr_1", name: "Ananya Sen (Credit Risk Approver)", email: "approver@finvanguard.nbfc", role: "APPROVER", status: "ACTIVE", phone: "+91 98765 33445", joinedAt: "2026-02-20" },
    { id: "usr_sanc_1", name: "Vikramaditya Roy (Sanctioning Officer)", email: "sanctioning.officer@finvanguard.nbfc", role: "SANCTIONING_OFFICER", status: "ACTIVE", phone: "+91 98765 44556", joinedAt: "2026-01-15" },
    { id: "usr_mgr_1", name: "Sunita Mehta (Operations Manager)", email: "manager@finvanguard.nbfc", role: "MANAGER", status: "ACTIVE", phone: "+91 98765 55667", joinedAt: "2026-01-05" }
  ],
  loans: [
    { id: "LN-2026-8849", applicantName: "Priya Sharma", applicantEmail: "priya.sharma@example.com", type: "Personal Loan", amount: 500000, tenureMonths: 36, emi: 16250, status: "UNDERWRITING", cibilScore: 785, foir: 32 }
  ],
  logs: []
};

// --- INITIALIZATION & CONNECTION ---
export async function initializeDatabase() {
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 2500 });
    isConnectedToMongo = true;
    console.log(`[MongoDB] Connected successfully to ${MONGODB_URI}`);

    // Seed default data if database is empty
    await seedDefaultData();
  } catch (err) {
    console.warn(`[MongoDB Warning] Could not connect to Mongo URI (${MONGODB_URI}). Operating in High-Availability Memory Mode:`, err.message);
    isConnectedToMongo = false;
  }
}

async function seedDefaultData() {
  if (!isConnectedToMongo) return;

  const configCount = await SystemConfigModel.countDocuments();
  if (configCount === 0) {
    await SystemConfigModel.create({});
  }

  // Synchronize official 6 system roles and purge legacy roles
  const validRoleIds = Object.keys(memoryStore.roles);
  await RoleModel.deleteMany({ id: { $nin: validRoleIds } });
  for (const role of Object.values(memoryStore.roles)) {
    await RoleModel.updateOne({ id: role.id }, { $set: role }, { upsert: true });
  }

  // Ensure default demo users exist for each of the 6 roles
  for (const user of memoryStore.users) {
    const existing = await UserModel.findOne({ id: user.id });
    if (!existing) {
      await UserModel.create(user);
    }
  }

  const loanCount = await LoanModel.countDocuments();
  if (loanCount === 0) {
    await LoanModel.insertMany(memoryStore.loans);
  }

  console.log(`[MongoDB Seed] Default collections initialized successfully.`);
}

// --- ACCESS METHODS ---

// Config
export async function getSystemConfig() {
  if (isConnectedToMongo) {
    let conf = await SystemConfigModel.findOne({ key: 'main_config' }).lean();
    const rolesArr = await RoleModel.find({}).lean();
    const rolesObj = {};
    rolesArr.forEach(r => rolesObj[r.id] = r);
    const usersArr = await UserModel.find({}).lean();
    return {
      system: conf.system,
      businessLimits: conf.businessLimits,
      roles: rolesObj,
      users: usersArr
    };
  }
  return memoryStore;
}

export async function updateSystemConfig(newConfig) {
  if (isConnectedToMongo) {
    await SystemConfigModel.updateOne({ key: 'main_config' }, { $set: newConfig }, { upsert: true });
    return getSystemConfig();
  }
  memoryStore.config = { ...memoryStore.config, ...newConfig };
  return memoryStore;
}

// Users
export async function findUserByEmail(email) {
  if (!email) return null;
  const cleanEmail = String(email).trim();
  const escapedEmail = cleanEmail.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
  
  if (isConnectedToMongo) {
    const mongoUser = await UserModel.findOne({ email: new RegExp(`^${escapedEmail}$`, 'i') }).lean();
    if (mongoUser) return mongoUser;
  }
  return memoryStore.users.find(u => u.email && u.email.toLowerCase() === cleanEmail.toLowerCase()) || null;
}

export async function createUser(userData) {
  const cleanData = {
    ...userData,
    email: userData.email ? String(userData.email).trim() : userData.email
  };

  if (isConnectedToMongo) {
    const user = new UserModel(cleanData);
    await user.save();
    const obj = user.toObject();
    // Keep memory cache in sync
    const idx = memoryStore.users.findIndex(u => u.id === obj.id);
    if (idx >= 0) memoryStore.users[idx] = obj;
    else memoryStore.users.push(obj);
    return obj;
  }
  memoryStore.users.push(cleanData);
  return cleanData;
}

export async function updateUserRole(userId, newRole) {
  if (isConnectedToMongo) {
    return await UserModel.findOneAndUpdate({ id: userId }, { role: newRole }, { new: true }).lean();
  }
  memoryStore.users = memoryStore.users.map(u => u.id === userId ? { ...u, role: newRole } : u);
  return memoryStore.users.find(u => u.id === userId);
}

export async function updateUserStatus(userId, status) {
  if (isConnectedToMongo) {
    return await UserModel.findOneAndUpdate({ id: userId }, { status }, { new: true }).lean();
  }
  memoryStore.users = memoryStore.users.map(u => u.id === userId ? { ...u, status } : u);
  return memoryStore.users.find(u => u.id === userId);
}

export async function updateUserPassword(userId, passwordHash, mustChangePassword = false) {
  if (isConnectedToMongo) {
    return await UserModel.findOneAndUpdate({ id: userId }, { passwordHash, mustChangePassword }, { new: true }).lean();
  }
  memoryStore.users = memoryStore.users.map(u => u.id === userId ? { ...u, passwordHash, mustChangePassword } : u);
  return memoryStore.users.find(u => u.id === userId);
}

export async function updateUserLastLogin(userId) {
  const now = new Date().toISOString();
  if (isConnectedToMongo) {
    return await UserModel.findOneAndUpdate({ id: userId }, { lastLogin: now }, { new: true }).lean();
  }
  memoryStore.users = memoryStore.users.map(u => u.id === userId ? { ...u, lastLogin: now } : u);
  return memoryStore.users.find(u => u.id === userId);
}

export async function updateUserPhone(userId, phone) {
  const cleanPhone = String(phone).trim();
  if (isConnectedToMongo) {
    return await UserModel.findOneAndUpdate({ id: userId }, { phone: cleanPhone }, { new: true }).lean();
  }
  memoryStore.users = memoryStore.users.map(u => u.id === userId ? { ...u, phone: cleanPhone } : u);
  return memoryStore.users.find(u => u.id === userId);
}

export async function createSession(userId, sessionId, durationMs = 8 * 60 * 60 * 1000) {
  const now = Date.now();
  const expiresAt = new Date(now + durationMs).toISOString();
  if (isConnectedToMongo) {
    return await UserModel.findOneAndUpdate({ id: userId }, { activeSessionId: sessionId, sessionExpiresAt: expiresAt }, { new: true }).lean();
  }
  memoryStore.users = memoryStore.users.map(u => u.id === userId ? { ...u, activeSessionId: sessionId, sessionExpiresAt: expiresAt } : u);
  return memoryStore.users.find(u => u.id === userId);
}

export async function invalidateSession(userId) {
  if (isConnectedToMongo) {
    return await UserModel.findOneAndUpdate({ id: userId }, { activeSessionId: null, sessionExpiresAt: null }, { new: true }).lean();
  }
  memoryStore.users = memoryStore.users.map(u => u.id === userId ? { ...u, activeSessionId: null, sessionExpiresAt: null } : u);
  return memoryStore.users.find(u => u.id === userId);
}

export async function validateSession(userId, sessionId) {
  let user = null;
  if (isConnectedToMongo) {
    user = await UserModel.findOne({ id: userId }).lean();
  } else {
    user = memoryStore.users.find(u => u.id === userId);
  }

  if (!user) {
    return { valid: false, reason: "User record not found" };
  }

  if (!user.activeSessionId || user.activeSessionId !== sessionId) {
    return { valid: false, reason: "DUAL_LOGIN_EVICTED" };
  }

  if (user.sessionExpiresAt && new Date(user.sessionExpiresAt).getTime() < Date.now()) {
    return { valid: false, reason: "SESSION_EXPIRED" };
  }

  return { valid: true, user };
}

export async function saveOtpChallenge(userId, tempToken, otpCode, durationMinutes = 5) {
  const expiresAt = new Date(Date.now() + durationMinutes * 60 * 1000).toISOString();
  const updateData = {
    tempMfaToken: tempToken,
    otpCode: String(otpCode),
    otpExpiresAt: expiresAt,
    otpAttempts: 0
  };
  if (isConnectedToMongo) {
    return await UserModel.findOneAndUpdate({ id: userId }, updateData, { new: true }).lean();
  }
  memoryStore.users = memoryStore.users.map(u => u.id === userId ? { ...u, ...updateData } : u);
  return memoryStore.users.find(u => u.id === userId);
}

export async function findUserByTempToken(tempToken) {
  if (!tempToken) return null;
  if (isConnectedToMongo) {
    return await UserModel.findOne({ tempMfaToken: tempToken }).lean();
  }
  return memoryStore.users.find(u => u.tempMfaToken === tempToken) || null;
}

export async function clearOtpChallenge(userId) {
  const updateData = {
    tempMfaToken: null,
    otpCode: null,
    otpExpiresAt: null,
    otpAttempts: 0
  };
  if (isConnectedToMongo) {
    return await UserModel.findOneAndUpdate({ id: userId }, updateData, { new: true }).lean();
  }
  memoryStore.users = memoryStore.users.map(u => u.id === userId ? { ...u, ...updateData } : u);
  return memoryStore.users.find(u => u.id === userId);
}

export async function verifyOtpChallenge(tempToken, submittedOtp) {
  let user = await findUserByTempToken(tempToken);
  if (!user) {
    return { success: false, reason: 'INVALID_SESSION' };
  }

  if (user.status === 'DISABLED') {
    return { success: false, reason: 'ACCOUNT_SUSPENDED', user };
  }

  if (user.otpExpiresAt && new Date(user.otpExpiresAt).getTime() < Date.now()) {
    return { success: false, reason: 'OTP_EXPIRED', user };
  }

  const cleanSubmitted = String(submittedOtp || '').trim();
  const isCorrect = user.otpCode && cleanSubmitted === String(user.otpCode).trim();

  if (isCorrect) {
    await clearOtpChallenge(user.id);
    return { success: true, user };
  }

  // Failed attempt -> Increment counter
  const newAttempts = (user.otpAttempts || 0) + 1;

  if (newAttempts >= 3) {
    // AUTO-SUSPEND ACCOUNT
    if (isConnectedToMongo) {
      await UserModel.findOneAndUpdate(
        { id: user.id },
        { status: 'DISABLED', tempMfaToken: null, otpCode: null, otpExpiresAt: null, otpAttempts: newAttempts }
      );
    } else {
      memoryStore.users = memoryStore.users.map(u => 
        u.id === user.id ? { ...u, status: 'DISABLED', tempMfaToken: null, otpCode: null, otpExpiresAt: null, otpAttempts: newAttempts } : u
      );
    }
    
    // Save Audit Log for suspension
    await saveAuditLog({
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
      level: 'WARN',
      category: 'AUTH_SECURITY',
      action: 'ACCOUNT_AUTO_SUSPENDED',
      user: user.email,
      role: user.role,
      details: { reason: '3 consecutive invalid OTP attempts during 2FA' }
    });

    return {
      success: false,
      reason: 'ACCOUNT_SUSPENDED',
      attemptsLeft: 0,
      suspended: true,
      user: { ...user, status: 'DISABLED' }
    };
  }

  // Update attempts count
  if (isConnectedToMongo) {
    await UserModel.findOneAndUpdate({ id: user.id }, { otpAttempts: newAttempts });
  } else {
    memoryStore.users = memoryStore.users.map(u => u.id === user.id ? { ...u, otpAttempts: newAttempts } : u);
  }

  return {
    success: false,
    reason: 'INVALID_OTP',
    attemptsLeft: 3 - newAttempts
  };
}

export async function deleteUser(userId) {
  if (isConnectedToMongo) {
    await UserModel.deleteOne({ id: userId });
    return { success: true };
  }
  memoryStore.users = memoryStore.users.filter(u => u.id !== userId);
  return { success: true };
}

// Roles
export async function createRole(roleData) {
  if (isConnectedToMongo) {
    const role = new RoleModel(roleData);
    await role.save();
    return role.toObject();
  }
  memoryStore.roles[roleData.id] = roleData;
  return roleData;
}

export async function deleteRole(roleId) {
  if (isConnectedToMongo) {
    await RoleModel.deleteOne({ id: roleId });
    return { success: true };
  }
  delete memoryStore.roles[roleId];
  return { success: true };
}

// Loans
export async function getLoans(filter = {}) {
  if (isConnectedToMongo) {
    return await LoanModel.find(filter).lean();
  }
  if (filter.applicantEmail) {
    return memoryStore.loans.filter(l => l.applicantEmail === filter.applicantEmail);
  }
  return memoryStore.loans;
}

export async function createLoan(loanData) {
  if (isConnectedToMongo) {
    const loan = new LoanModel(loanData);
    await loan.save();
    return loan.toObject();
  }
  memoryStore.loans.unshift(loanData);
  return loanData;
}

export async function updateLoanStatus(id, status, actionTitle) {
  if (isConnectedToMongo) {
    return await LoanModel.findOneAndUpdate({ id }, { status, actionTaken: actionTitle }, { new: true }).lean();
  }
  memoryStore.loans = memoryStore.loans.map(l => l.id === id ? { ...l, status, actionTaken: actionTitle } : l);
  return memoryStore.loans.find(l => l.id === id);
}

export async function attachDocumentToLoan(id, docObj) {
  if (isConnectedToMongo) {
    return await LoanModel.findOneAndUpdate(
      { id },
      { $push: { documentVault: docObj } },
      { new: true }
    ).lean();
  }
  memoryStore.loans = memoryStore.loans.map(l => {
    if (l.id === id) {
      const vault = l.documentVault || [];
      return { ...l, documentVault: [...vault, docObj] };
    }
    return l;
  });
  return memoryStore.loans.find(l => l.id === id);
}

export async function updateDocumentStatus(loanId, docId, verificationStatus) {
  if (isConnectedToMongo) {
    const loan = await LoanModel.findOne({ id: loanId });
    if (loan && loan.documentVault) {
      loan.documentVault = loan.documentVault.map(d => d.docId === docId ? { ...d, verificationStatus } : d);
      await loan.save();
      return loan.toObject();
    }
  }
  memoryStore.loans = memoryStore.loans.map(l => {
    if (l.id === loanId && l.documentVault) {
      const updatedVault = l.documentVault.map(d => d.docId === docId ? { ...d, verificationStatus } : d);
      return { ...l, documentVault: updatedVault };
    }
    return l;
  });
  return memoryStore.loans.find(l => l.id === loanId);
}

export async function updateLoanUnderwriting(id, underwritingData) {
  const { cibilScore, foir, riskGrade, status } = underwritingData;
  const updateObj = { cibilScore, foir, riskGrade };
  if (status) updateObj.status = status;

  if (isConnectedToMongo) {
    return await LoanModel.findOneAndUpdate({ id }, { $set: updateObj }, { new: true }).lean();
  }
  memoryStore.loans = memoryStore.loans.map(l => l.id === id ? { ...l, ...updateObj } : l);
  return memoryStore.loans.find(l => l.id === id);
}

export async function saveSanctionDetails(id, sanctionData) {
  const updateObj = { sanction: sanctionData, status: 'SANCTIONED' };
  if (isConnectedToMongo) {
    return await LoanModel.findOneAndUpdate({ id }, { $set: updateObj }, { new: true }).lean();
  }
  memoryStore.loans = memoryStore.loans.map(l => l.id === id ? { ...l, ...updateObj } : l);
  return memoryStore.loans.find(l => l.id === id);
}

// Logs
export async function saveAuditLog(logData) {
  if (isConnectedToMongo) {
    const log = new AuditLogModel(logData);
    await log.save();
    return log.toObject();
  }
  memoryStore.logs.unshift(logData);
  return logData;
}

export async function getAuditLogs() {
  if (isConnectedToMongo) {
    return await AuditLogModel.find({}).sort({ timestamp: -1 }).limit(200).lean();
  }
  return memoryStore.logs;
}
