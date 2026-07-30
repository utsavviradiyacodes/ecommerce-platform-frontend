const ADMIN_PASSWORD_RECOVERY_SESSION_KEY = "sellora.admin.passwordRecovery";

function normalizePasswordRecoverySession(value) {
  const email = typeof value?.email === "string" ? value.email.trim() : "";

  if (!email) {
    return null;
  }

  const userId =
    typeof value?.userId === "string" && value.userId ? value.userId : null;

  const resendAvailableAt =
    userId &&
    typeof value?.resendAvailableAt === "number" &&
    Number.isFinite(value.resendAvailableAt)
      ? value.resendAvailableAt
      : null;

  return {
    email,
    userId,
    resendAvailableAt,
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
