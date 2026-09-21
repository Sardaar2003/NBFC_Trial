import passport from 'passport';
import { Strategy as GoogleStrategy } from 'passport-google-oauth20';
import { findUserByEmail, createUser, saveAuditLog } from './db.js';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '884920-nbfc-finvanguard.apps.googleusercontent.com';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || 'GOCSPX-placeholder';
const GOOGLE_CALLBACK_URL = process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback';

export function setupPassport() {
  if (GOOGLE_CLIENT_SECRET && !GOOGLE_CLIENT_SECRET.includes('placeholder')) {
    passport.use(
      new GoogleStrategy(
        {
          clientID: GOOGLE_CLIENT_ID,
          clientSecret: GOOGLE_CLIENT_SECRET,
          callbackURL: GOOGLE_CALLBACK_URL
        },
        async (accessToken, refreshToken, profile, done) => {
          try {
            const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
            const name = profile.displayName || "Google User";
            const avatar = profile.photos && profile.photos[0] ? profile.photos[0].value : "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=150&q=80";

            if (!email) {
              return done(new Error("No email provided by Google OAuth"));
            }

            let user = await findUserByEmail(email);

            // SECURITY GUARD: Staff/Employee accounts CANNOT log in via Google SSO!
            if (user && user.role !== 'APPLICANT') {
              await saveAuditLog({
                id: `log_${Date.now()}`,
                level: "SECURITY",
                category: "AUTH",
                action: `Passport Google SSO Blocked for Staff Account (${email})`,
                user: email,
                role: user.role
              });
              return done(null, false, { message: 'GOOGLE_SSO_RESTRICTED_STAFF' });
            }

            if (!user) {
              user = await createUser({
                id: `usr_g_${Date.now()}`,
                name,
                email,
                role: 'APPLICANT',
                avatar,
                status: 'ACTIVE'
              });

              await saveAuditLog({
                id: `log_${Date.now()}`,
                level: "INFO",
                category: "AUTH",
                action: `New Borrower Provisioned via Passport Google Strategy`,
                user: email,
                role: 'APPLICANT'
              });
            } else {
              await saveAuditLog({
                id: `log_${Date.now()}`,
                level: "INFO",
                category: "AUTH",
                action: `Borrower Authenticated via Passport Google Strategy`,
                user: email,
                role: 'APPLICANT'
              });
            }

            return done(null, user);
          } catch (err) {
            return done(err);
          }
        }
      )
    );
    console.log(`[Passport.js] Google OAuth 2.0 Strategy Configured with Client ID: ${GOOGLE_CLIENT_ID}`);
  } else {
    console.log(`[Passport.js Note] Google Client Secret is default placeholder. Passport fallback mode active.`);
  }
}

export default passport;
