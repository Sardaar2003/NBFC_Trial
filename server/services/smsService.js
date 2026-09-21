import twilio from 'twilio';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const LOG_FILE = path.join(__dirname, '..', 'logs', 'auth.log');

// Ensure log directory exists
const logDir = path.dirname(LOG_FILE);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

/**
 * Initializes Twilio Client using either API Key/Secret or Account SID/Auth Token.
 */
function getTwilioClient() {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const apiKey = process.env.TWILIO_API_KEY;
  const apiSecret = process.env.TWILIO_API_SECRET;
  const authToken = process.env.TWILIO_AUTH_TOKEN;

  if (accountSid && apiKey && apiSecret) {
    return twilio(apiKey, apiSecret, { accountSid });
  } else if (accountSid && authToken) {
    return twilio(accountSid, authToken);
  }
  return null;
}

/**
 * Sends a 6-digit SMS OTP code to the target phone number.
 * Uses Twilio SDK if credentials exist, with fallback console & log file logging.
 *
 * @param {string} toPhone Target recipient phone number (e.g., +919876543210 or +15017122661)
 * @param {string} otpCode 6-digit numeric OTP code
 * @param {string} userEmail Associated user email for audit log
 * @returns {Promise<{ sent: boolean, mode: string, messageSid?: string, error?: string }>}
 */
export async function sendSmsOtp(toPhone, otpCode, userEmail = 'unknown') {
  const messageBody = `Your FinVanguard NBFC authentication OTP is ${otpCode}. Valid for 5 minutes. Do not share this with anyone.`;
  const timestamp = new Date().toISOString();
  
  const logEntry = `[${timestamp}] SMS OTP SENT | User: ${userEmail} | Phone: ${toPhone || 'NOT_PROVIDED'} | OTP: ${otpCode}\n`;
  try {
    fs.appendFileSync(LOG_FILE, logEntry);
  } catch (e) {
    console.error('Failed to write to auth.log:', e.message);
  }

  console.log(`\n==================================================`);
  console.log(`[SMS SERVICE] 📲 Sending 2FA SMS OTP`);
  console.log(`[SMS SERVICE] Recipient: ${toPhone || 'NO_PHONE_SET'}`);
  console.log(`[SMS SERVICE] User Email: ${userEmail}`);
  console.log(`[SMS SERVICE] OTP Code: *** ${otpCode} ***`);
  console.log(`==================================================\n`);

  const client = getTwilioClient();
  const fromPhone = process.env.TWILIO_PHONE_NUMBER;

  if (!fromPhone) {
    console.warn(`[SMS SERVICE WARNING] TWILIO_PHONE_NUMBER is missing in server/.env! Cannot send live SMS without a Twilio sender phone number. Falling back to console/auth.log.`);
  }

  if (client && fromPhone && toPhone) {
    try {
      const message = await client.messages.create({
        body: messageBody,
        from: fromPhone,
        to: toPhone
      });
      console.log(`[Twilio Success] 🚀 Real SMS sent via Twilio! Message SID: ${message.sid} to ${toPhone}`);
      return { sent: true, mode: 'twilio', messageSid: message.sid };
    } catch (err) {
      console.error(`[Twilio API Error] ❌ Failed to send SMS via Twilio: ${err.message}`);
      return { sent: true, mode: 'console_fallback', error: err.message };
    }
  }

  return { sent: true, mode: 'console_fallback' };
}
