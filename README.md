# FinVanguard NBFC Loan Portal & REST API

A digital lending portal built with React, Vite, Node.js, Express, and MongoDB.

## Features
- **Borrower & Staff Portals**: Role-based access control (Applicant, Reviewer, Approver, Sanctioning Officer, System Admin).
- **DigiLocker e-KYC Integration**: Verification of e-Aadhaar and PAN.
- **Document Vault**: File storage integration with local fallback / Google Cloud Storage.
- **2FA & OAuth**: Google SSO & OTP SMS verification.

## Local Development

### 1. Backend Server
```bash
cd server
npm install
npm run dev
```

### 2. Frontend Application
```bash
npm install
npm run dev
```

## Deployment on Render
This project is configured for single-service Web Service deployment on Render:
- **Build Command**: `npm run render-build`
- **Start Command**: `npm start`
