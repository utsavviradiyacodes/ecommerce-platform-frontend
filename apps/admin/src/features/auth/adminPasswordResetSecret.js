const ADMIN_PASSWORD_RESET_SECRET_LIFETIME_MS = 10 * 60 * 1000;

let passwordResetSecret = null;

function normalizeUserId(value) {
  return typeof value === "string" ? value.trim() : "";
}

function isSixDigitOtp(value) {
  return typeof value === "string" && /^\d{6}$/.test(value);
}

function normalizeCurrentTime(value) {
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : Date.now();
}

export function setAdminPasswordResetSecret(
  { userId, otp } = {},
  currentTime = Date.now()
) {
  const normalizedUserId = normalizeUserId(userId);
  const normalizedCurrentTime = normalizeCurrentTime(currentTime);

  if (!normalizedUserId || !isSixDigitOtp(otp)) {
    clearAdminPasswordResetSecret();
    return false;
  }

  passwordResetSecret = {
    userId: normalizedUserId,
    otp,
    expiresAt:
      normalizedCurrentTime + ADMIN_PASSWORD_RESET_SECRET_LIFETIME_MS,
  };

  return true;
}

export function readAdminPasswordResetSecret(
  expectedUserId,
  currentTime = Date.now()
) {
  const normalizedExpectedUserId = normalizeUserId(expectedUserId);
  const normalizedCurrentTime = normalizeCurrentTime(currentTime);
  const secret = passwordResetSecret;

  if (
    !secret ||
    !normalizedExpectedUserId ||
    secret.userId !== normalizedExpectedUserId ||
    !isSixDigitOtp(secret.otp) ||
    typeof secret.expiresAt !== "number" ||
    !Number.isFinite(secret.expiresAt) ||
    secret.expiresAt <= normalizedCurrentTime
  ) {
    clearAdminPasswordResetSecret();
    return null;
  }

  return {
    userId: secret.userId,
    otp: secret.otp,
    expiresAt: secret.expiresAt,
  };
}

export function hasValidAdminPasswordResetSecret(
  expectedUserId,
  currentTime = Date.now()
) {
  return Boolean(
    readAdminPasswordResetSecret(expectedUserId, currentTime)
  );
}

export function getAdminPasswordResetSecretExpiresAt(
  expectedUserId,
  currentTime = Date.now()
) {
  return (
    readAdminPasswordResetSecret(expectedUserId, currentTime)?.expiresAt ??
    null
  );
}

export function clearAdminPasswordResetSecret() {
  passwordResetSecret = null;
}
