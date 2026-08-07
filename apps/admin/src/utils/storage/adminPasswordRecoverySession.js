import {
  ADMIN_PASSWORD_RECOVERY_PHASE,
  getSafeAdminPasswordRecoveryPhase,
} from "../../features/auth/authConstants.js";

const ADMIN_PASSWORD_RECOVERY_SESSION_KEY = "sellora.admin.passwordRecovery";

function normalizePasswordRecoverySession(value) {
  if (
    value?.phase === ADMIN_PASSWORD_RECOVERY_PHASE.CANCELLED ||
    value?.phase === ADMIN_PASSWORD_RECOVERY_PHASE.RESET_SUCCEEDED
  ) {
    return null;
  }

  const email = typeof value?.email === "string" ? value.email.trim() : "";

  if (!email) {
    return null;
  }

  const userId =
    typeof value?.userId === "string" && value.userId.trim()
      ? value.userId.trim()
      : null;

  const resendAvailableAt =
    userId &&
    typeof value?.resendAvailableAt === "number" &&
    Number.isFinite(value.resendAvailableAt)
      ? value.resendAvailableAt
      : null;

  const shouldInferLegacyPhase = value?.phase == null;

  const phase = getSafeAdminPasswordRecoveryPhase(
    {
      email,
      userId,
      resendAvailableAt,
      phase: value?.phase,
    },
    {
      inferLegacyPhase: shouldInferLegacyPhase,
    }
  );

  if (phase === ADMIN_PASSWORD_RECOVERY_PHASE.IDLE) {
    return {
      email,
      userId: null,
      resendAvailableAt: null,
      phase,
    };
  }

  return {
    email,
    userId,
    resendAvailableAt,
    phase,
  };
}

export function readAdminPasswordRecoverySession() {
  try {
    const storedValue = window.sessionStorage.getItem(
      ADMIN_PASSWORD_RECOVERY_SESSION_KEY
    );

    if (!storedValue) {
      return null;
    }

    const parsedValue = JSON.parse(storedValue);

    const normalizedSession = normalizePasswordRecoverySession(parsedValue);

    if (!normalizedSession) {
      clearAdminPasswordRecoverySession();
      return null;
    }

    if (Object.hasOwn(parsedValue, "verifiedOtp")) {
      window.sessionStorage.setItem(
        ADMIN_PASSWORD_RECOVERY_SESSION_KEY,
        JSON.stringify(normalizedSession)
      );
    }

    return normalizedSession;
  } catch {
    clearAdminPasswordRecoverySession();
    return null;
  }
}

export function writeAdminPasswordRecoverySession(passwordRecovery) {
  try {
    const normalizedSession =
      normalizePasswordRecoverySession(passwordRecovery);

    if (!normalizedSession) {
      clearAdminPasswordRecoverySession();
      return;
    }

    window.sessionStorage.setItem(
      ADMIN_PASSWORD_RECOVERY_SESSION_KEY,
      JSON.stringify(normalizedSession)
    );
  } catch {
    // Storage can be unavailable because of browser privacy settings.
    // The recovery flow will still work until the page is reloaded.
  }
}

export function clearAdminPasswordRecoverySession() {
  try {
    window.sessionStorage.removeItem(ADMIN_PASSWORD_RECOVERY_SESSION_KEY);
  } catch {
    // Ignore unavailable browser storage.
  }
}
