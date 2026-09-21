/**
 * Audit Telemetry & Diagnostic Logging Framework for FinVanguard NBFC
 */

const LOG_STORAGE_KEY = 'nbfc_audit_telemetry_logs_v1';
const MAX_IN_MEMORY_LOGS = 250;

let logs = loadInitialLogs();
const listeners = new Set();

function loadInitialLogs() {
  try {
    const saved = localStorage.getItem(LOG_STORAGE_KEY);
    if (saved) {
      return JSON.parse(saved);
    }
  } catch (err) {
    console.warn("Failed to load logs:", err);
  }
  return [
    {
      id: `log_init_1`,
      timestamp: new Date().toISOString(),
      level: "INFO",
      category: "SYSTEM",
      user: "system",
      role: "SYSTEM",
      action: "NBFC Platform Initialized",
      details: { version: "1.4.0-enterprise", environment: "production-cloud-ready" }
    }
  ];
}

function persistLogs() {
  try {
    localStorage.setItem(LOG_STORAGE_KEY, JSON.stringify(logs.slice(0, MAX_IN_MEMORY_LOGS)));
  } catch (err) {
    console.warn("Failed to persist logs:", err);
  }
}

export function logEvent(level, category, action, details = {}, user = "system", role = "SYSTEM") {
  const newLog = {
    id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
    timestamp: new Date().toISOString(),
    level: level.toUpperCase(), // INFO, WARN, ERROR, DEBUG, SECURITY, CONFIG_CHANGE
    category: category.toUpperCase(), // AUTH, RBAC, UAM, CONFIG, SYSTEM, LOAD_TEST
    user,
    role,
    action,
    details
  };

  logs.unshift(newLog);
  if (logs.length > MAX_IN_MEMORY_LOGS) {
    logs = logs.slice(0, MAX_IN_MEMORY_LOGS);
  }

  // Also output clean console log for developers
  const colorMap = {
    INFO: "#3b82f6",
    WARN: "#f59e0b",
    ERROR: "#ef4444",
    DEBUG: "#8b5cf6",
    SECURITY: "#ec4899",
    CONFIG_CHANGE: "#10b981"
  };
  console.log(
    `%c[NBFC Audit - ${newLog.level}]%c ${newLog.action} (${user})`,
    `color: ${colorMap[newLog.level] || '#fff'}; font-weight: bold;`,
    "color: inherit;",
    details
  );

  persistLogs();
  notifyListeners();
  return newLog;
}

export function getLogs() {
  return logs;
}

export function clearLogs() {
  logs = [];
  persistLogs();
  notifyListeners();
}

export function subscribeLogs(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function notifyListeners() {
  listeners.forEach((listener) => listener(logs));
}
