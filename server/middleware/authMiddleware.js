import jwt from 'jsonwebtoken';
import { validateSession } from '../db.js';

const JWT_SECRET = process.env.JWT_SECRET || 'nbfc_finvanguard_secret_key_2026';

// Middleware to verify JWT token and validate active session in MongoDB
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: "Access Denied: Missing Authorization Header" });
  }

  jwt.verify(token, JWT_SECRET, async (err, payload) => {
    if (err) {
      return res.status(401).json({ error: "Forbidden: Invalid or Expired Token", code: "EXPIRED_TOKEN" });
    }

    if (payload.userId && payload.sessionId) {
      const sessionCheck = await validateSession(payload.userId, payload.sessionId);
      if (!sessionCheck.valid) {
        if (sessionCheck.reason === "DUAL_LOGIN_EVICTED") {
          return res.status(401).json({ 
            error: "Session Terminated: Your account was signed in from another device or browser.",
            code: "DUAL_LOGIN_EVICTED"
          });
        }
        if (sessionCheck.reason === "SESSION_EXPIRED") {
          return res.status(401).json({ 
            error: "Session Expired: Your active session has expired due to inactivity.",
            code: "SESSION_EXPIRED"
          });
        }
        return res.status(401).json({ error: "Unauthorized: Invalid Session", code: "INVALID_SESSION" });
      }
    }

    req.user = payload;
    next();
  });
}

// Middleware to enforce RBAC permissions server-side
export function requirePermission(permissionId) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { permissions, role } = req.user;

    if (role === 'DEVELOPER' || (permissions && permissions.includes('*'))) {
      return next();
    }

    if (permissions && permissions.includes(permissionId)) {
      return next();
    }

    return res.status(403).json({
      error: `Access Denied (403): Role '${role}' lacks required permission '${permissionId}'`
    });
  };
}
