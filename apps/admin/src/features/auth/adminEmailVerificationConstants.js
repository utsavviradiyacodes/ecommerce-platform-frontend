export const ADMIN_AUTH_REJECTION_KIND = {
  EMAIL_VERIFICATION_REQUIRED: "email-verification-required",
};

export const ADMIN_EMAIL_VERIFICATION_ROLE = "admin";

export const ADMIN_EMAIL_VERIFICATION_SESSION_LIFETIME_MS = 10 * 60 * 1000;

export const ADMIN_EMAIL_VERIFICATION_RESEND_COOLDOWN_MS = 60 * 1000;

export const ADMIN_EMAIL_VERIFICATION_RESEND_SUCCESS_MESSAGE =
  "A new verification code was requested. Use the latest code sent to your email.";

export const ADMIN_EMAIL_VERIFICATION_MISSING_SESSION_MESSAGE =
  "Your verification session is missing or expired. Sign in again.";

export const ADMIN_EMAIL_VERIFICATION_UNEXPECTED_RESPONSE_MESSAGE =
  "Received an unexpected response. Please try again.";
