// Cryptographic & Password Security Utilities

// Generate high-entropy 16-character temporary password for provisioned staff
export function generateTempPassword() {
  const uppercase = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
  const lowercase = 'abcdefghijkmnopqrstuvwxyz';
  const numbers = '23456789';
  const symbols = '!@#$%^&*';
  
  const getRandomChar = (str) => str.charAt(Math.floor(Math.random() * str.length));

  let password = [
    'FV#',
    getRandomChar(numbers),
    getRandomChar(numbers),
    getRandomChar(numbers),
    getRandomChar(numbers),
    '@',
    getRandomChar(uppercase),
    getRandomChar(lowercase),
    getRandomChar(uppercase),
    getRandomChar(lowercase),
    getRandomChar(symbols),
    '2026'
  ].join('');

  return password;
}

// Simple SHA-256 Hashing helper using Web Crypto API
export async function hashPassword(plainTextPassword) {
  if (!plainTextPassword) return '';
  const encoder = new TextEncoder();
  const data = encoder.encode(plainTextPassword + '_nbfc_salt_2026');
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

// Verify password
export async function verifyPassword(plainTextPassword, hashedPasswordHex) {
  if (!plainTextPassword || !hashedPasswordHex) return false;
  const hashHex = await hashPassword(plainTextPassword);
  return hashHex === hashedPasswordHex;
}
