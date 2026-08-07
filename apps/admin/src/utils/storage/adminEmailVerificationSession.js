import {
  ADMIN_EMAIL_VERIFICATION_ROLE,
  ADMIN_EMAIL_VERIFICATION_SESSION_LIFETIME_MS,
} from "../../features/auth/adminEmailVerificationConstants.js";

const ADMIN_EMAIL_VERIFICATION_SESSION_KEY =
  "sellora.admin.emailVerification";

function getSessionStorage() {
  try {
    return typeof window !== "undefined" ? window.sessionStorage : null;
  } catch {
    return null;
  }
}

function normalizeEmail(value) {
  return typeof value === "string" ? value.trim().toLowerCase() : "";
}

function normalizeTimestamp(value) {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

export function normalizeAdminEmailVerificationSession(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }

  const userId =
    typeof value.userId === "string" ? value.userId.trim() : "";
  const email = normalizeEmail(value.email);
  const role =
    typeof value.role === "string" ? value.role.trim().toLowerCase() : "";
  const createdAt = normalizeTimestamp(value.createdAt);
  const expiresAt = normalizeTimestamp(value.expiresAt);
  const resendAvailableAt =
    value.resendAvailableAt == null
      ? null
      : normalizeTimestamp(value.resendAvailableAt);

  if (
    !userId ||
    !email ||
    role !== ADMIN_EMAIL_VERIFICATION_ROLE ||
    createdAt == null ||
    expiresAt == null ||
    expiresAt <= createdAt ||
    (value.resendAvailableAt != null && resendAvailableAt == null)
  ) {
    return null;
  }

  return {
    userId,
    email,
    role: ADMIN_EMAIL_VERIFICATION_ROLE,
    createdAt,
    expiresAt,
    resendAvailableAt,
  };
}

export function isAdminEmailVerificationSessionValid(
  value,
  currentTime = Date.now()
) {
  const session = normalizeAdminEmailVerificationSession(value);

  return Boolean(
    session &&
      typeof currentTime === "number" &&
      Number.isFinite(currentTime) &&
      session.expiresAt > currentTime
  );
}

export function createAdminEmailVerificationSession(
  verificationContext,
  currentTime = Date.now()
) {
  const createdAt = normalizeTimestamp(currentTime);

  if (createdAt == null) {
    return null;
  }

  return normalizeAdminEmailVerificationSession({
    userId: verificationContext?.userId,
    email: verificationContext?.email,
    role: verificationContext?.role,
    createdAt,
    expiresAt: createdAt + ADMIN_EMAIL_VERIFICATION_SESSION_LIFETIME_MS,
    resendAvailableAt: null,
  });
}

export function readAdminEmailVerificationSession() {
  const storage = getSessionStorage();

  if (!storage) {
    return null;
  }

  try {
    const storedValue = storage.getItem(
      ADMIN_EMAIL_VERIFICATION_SESSION_KEY
    );

    if (!storedValue) {
      return null;
    }

    const session = normalizeAdminEmailVerificationSession(
      JSON.parse(storedValue)
    );

    if (!isAdminEmailVerificationSessionValid(session)) {
      storage.removeItem(ADMIN_EMAIL_VERIFICATION_SESSION_KEY);
      return null;
    }

    return session;
  } catch {
    try {
      storage.removeItem(ADMIN_EMAIL_VERIFICATION_SESSION_KEY);
    } catch {
      // Ignore unavailable browser storage.
    }

    return null;
  }
}

export function writeAdminEmailVerificationSession(value) {
  const session = normalizeAdminEmailVerificationSession(value);
  const storage = getSessionStorage();

  if (!session || !isAdminEmailVerificationSessionValid(session)) {
    clearAdminEmailVerificationSession();
    return null;
  }

  if (!storage) {
    return session;
  }

  try {
    storage.setItem(
      ADMIN_EMAIL_VERIFICATION_SESSION_KEY,
      JSON.stringify(session)
    );
  } catch {
    // The in-memory workflow remains usable when browser storage is blocked.
  }

  return session;
}

export function updateAdminEmailVerificationSession(updates) {
  const currentSession = readAdminEmailVerificationSession();

  if (!currentSession) {
    return null;
  }

  return writeAdminEmailVerificationSession({
    ...currentSession,
    ...(updates && typeof updates === "object" && !Array.isArray(updates)
      ? updates
      : {}),
    userId: currentSession.userId,
    email: currentSession.email,
    role: currentSession.role,
    createdAt: currentSession.createdAt,
  });
}

export function clearAdminEmailVerificationSession() {
  const storage = getSessionStorage();

  if (!storage) {
    return;
  }

  try {
    storage.removeItem(ADMIN_EMAIL_VERIFICATION_SESSION_KEY);
  } catch {
    // Ignore unavailable browser storage.
  }
}
