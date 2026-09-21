import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const envFilePath = path.join(__dirname, '.env');

export function getEnvVariables() {
  const envKeys = [
    'PORT', 'NODE_ENV', 'MONGODB_URI',
    'JWT_SECRET', 'GOOGLE_CLIENT_ID', 'GOOGLE_CLIENT_SECRET', 'GOOGLE_CALLBACK_URL',
    'GCS_BUCKET_NAME', 'GOOGLE_APPLICATION_CREDENTIALS', 'GCP_PROJECT_ID',
    'TWILIO_ACCOUNT_SID', 'TWILIO_API_KEY', 'TWILIO_API_SECRET', 'TWILIO_AUTH_TOKEN', 'TWILIO_PHONE_NUMBER'
  ];

  let fileContent = {};
  if (fs.existsSync(envFilePath)) {
    const raw = fs.readFileSync(envFilePath, 'utf-8');
    raw.split('\n').forEach(line => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const eqIdx = trimmed.indexOf('=');
        if (eqIdx > 0) {
          const key = trimmed.substring(0, eqIdx).trim();
          const val = trimmed.substring(eqIdx + 1).trim();
          fileContent[key] = val;
        }
      }
    });
  }

  const result = {};
  envKeys.forEach(k => {
    result[k] = fileContent[k] !== undefined ? fileContent[k] : (process.env[k] || '');
  });

  return result;
}

export function updateEnvVariables(updates) {
  if (!updates || typeof updates !== 'object') return getEnvVariables();

  let envLines = [];
  if (fs.existsSync(envFilePath)) {
    envLines = fs.readFileSync(envFilePath, 'utf-8').split('\n');
  }

  const updatedKeys = new Set();

  const newLines = envLines.map(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#')) {
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx > 0) {
        const key = trimmed.substring(0, eqIdx).trim();
        if (Object.prototype.hasOwnProperty.call(updates, key)) {
          updatedKeys.add(key);
          const newVal = updates[key];
          process.env[key] = String(newVal);
          return `${key}=${newVal}`;
        }
      }
    }
    return line;
  });

  Object.keys(updates).forEach(k => {
    if (!updatedKeys.has(k)) {
      const newVal = updates[k];
      process.env[k] = String(newVal);
      newLines.push(`${k}=${newVal}`);
    }
  });

  fs.writeFileSync(envFilePath, newLines.join('\n'), 'utf-8');
  return getEnvVariables();
}
