# System Architecture Document - NBFC Loan Approval & Lifecycle Platform

## 1. Executive Summary
This document specifies the enterprise architecture for the Non-Banking Financial Company (NBFC) Loan Processing & Lifecycle Management System. The architecture is engineered around a **Decoupled 2-Tier Client-Server Architecture** with a **Single Centralized MongoDB Database Access Engine (`server/db.js`)**, zero-trust security, dynamic Role-Based Access Control (RBAC), User Access Management (UAM), Google OAuth 2.0 SSO, real-time audit logging, load scalability, and cloud-agnostic deployment readiness (AWS, GCP, Azure, Docker).

---

## 2. Decoupled 2-Tier Architecture & MongoDB Engine Overview

```
+---------------------------------------------------------------------------------------------------+
|                                  FRONTEND LAYER (Client SPA)                                      |
|  - Framework: React 18 + Vite (Port 5173 / Production Nginx)                                      |
|  - Theme: Light & Dark Mode Glassmorphism Theme (Vanilla CSS)                                     |
|  - Dynamic Views: Login/Register, Developer UAM Dashboard, Borrower Portal, Staff Workbench       |
+---------------------------------------------------------------------------------------------------+
                                                 |
                                     HTTPS REST API (JWT Tokens)
                                                 v
+---------------------------------------------------------------------------------------------------+
|                                  BACKEND LAYER (REST API Server)                                  |
|  - Framework: Node.js + Express Microservice (Port 5000)                                          |
|  - Security: JWT Bearer Tokens, CORS Guard, Helmet Security Headers, Rate Limiter                 |
|  - API Modules: /api/auth, /api/uam, /api/config, /api/loans, /api/logs                          |
+---------------------------------------------------------------------------------------------------+
                                                 |
                                                 v
+---------------------------------------------------------------------------------------------------+
|                        SINGLE MONGODB DATABASE ENGINE (server/db.js)                              |
|  - Object Data Modeling: Mongoose 8.x                                                             |
|  - Single Initializer File: e:/NBFC_Website/server/db.js                                          |
|  - Collections: User, Role, SystemConfig, Loan, AuditLog                                          |
|  - Availability: Native Mongo Connection + Failover Cache + Auto-Seeding                         |
+---------------------------------------------------------------------------------------------------+
```

---

## 3. MongoDB Schemas & Single Access Layer (`server/db.js`)

All database interactions pass through the single `db.js` access layer:

1. `UserModel`: Stores `id`, `name`, `email`, `role`, `status`, `avatar`, `joinedAt`.
2. `RoleModel`: Stores `id`, `name`, `description`, `isSystem`, `color`, `permissions`.
3. `SystemConfigModel`: Stores system parameters, RBI license number, feature flags, and underwriting business limits.
4. `LoanModel`: Stores loan applications (`id`, `applicantName`, `type`, `amount`, `status`, `cibilScore`, `foir`).
5. `AuditLogModel`: Stores immutable audit telemetry logs (`level`, `category`, `action`, `user`, `details`).

---

## 4. REST API Endpoint Matrix

| Method | Endpoint | Access Requirement | Database Model |
| :--- | :--- | :--- | :--- |
| `POST` | `/api/auth/login` | Public | `UserModel` |
| `POST` | `/api/auth/google` | Public | `UserModel` (Auto-provisions `APPLICANT`) |
| `GET` | `/api/config` | Authenticated | `SystemConfigModel`, `RoleModel`, `UserModel` |
| `PUT` | `/api/config` | `DEVELOPER` | `SystemConfigModel` |
| `POST` | `/api/uam/users` | `USER_MANAGE` | `UserModel` (Developer provisioning) |
| `DELETE` | `/api/uam/users/:id` | `USER_MANAGE` | `UserModel` (Developer user deletion) |
| `POST` | `/api/uam/roles` | `ROLE_MANAGE` | `RoleModel` |
| `DELETE` | `/api/uam/roles/:id` | `ROLE_MANAGE` | `RoleModel` |
| `GET` | `/api/loans` | Authenticated | `LoanModel` |
| `POST` | `/api/loans` | `LOAN_APPLY` | `LoanModel` |
| `GET` | `/api/logs` | `SYSTEM_ADMIN` | `AuditLogModel` |

---

*Last Updated: 2026-09-16 | Maintained by System Architecture & Security Operations*
