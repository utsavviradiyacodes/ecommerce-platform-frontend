export const PASSWORD_RESET_OTP_RESEND_COOLDOWN_MS = 60 * 1000;

export const ADMIN_PASSWORD_RECOVERY_PHASE = {
  IDLE: "idle",
  CODE_REQUESTED: "codeRequested",
  CODE_VERIFIED: "codeVerified",
  CANCELLED: "cancelled",
  RESET_SUCCEEDED: "resetSucceeded",
};

export const ADMIN_PASSWORD_RECOVERY_NOTICE = {
  OTP_REPLACED:
    "The verification code expired or changed. Enter the latest code or request a new one.",
  SECURE_RESET_SESSION_ENDED:
    "Your secure reset session ended. Request and verify a new code.",
};

export const ADMIN_PASSWORD_RECOVERY_UNEXPECTED_RESPONSE_MESSAGE =
  "Received an unexpected response. Please try again.";

const TERMINAL_PASSWORD_RECOVERY_PHASES = new Set([
  ADMIN_PASSWORD_RECOVERY_PHASE.CANCELLED,
  ADMIN_PASSWORD_RECOVERY_PHASE.RESET_SUCCEEDED,
]);

export function isNonEmptyString(value) {
  return typeof value === "string" && Boolean(value.trim());
}

function hasPasswordRecoveryRequestData(passwordRecovery) {
  return (
    isNonEmptyString(passwordRecovery?.email) &&
    isNonEmptyString(passwordRecovery?.userId)
  );
}

export function isAdminPasswordRecoveryStateValid(passwordRecovery) {
  switch (passwordRecovery?.phase) {
    case ADMIN_PASSWORD_RECOVERY_PHASE.IDLE:
      return (
        typeof passwordRecovery.email === "string" &&
        passwordRecovery.userId == null &&
        passwordRecovery.resendAvailableAt == null
      );

    case ADMIN_PASSWORD_RECOVERY_PHASE.CODE_REQUESTED:
      return hasPasswordRecoveryRequestData(passwordRecovery);

    case ADMIN_PASSWORD_RECOVERY_PHASE.CODE_VERIFIED:
      return hasPasswordRecoveryRequestData(passwordRecovery);

    case ADMIN_PASSWORD_RECOVERY_PHASE.CANCELLED:
    case ADMIN_PASSWORD_RECOVERY_PHASE.RESET_SUCCEEDED:
      return true;

    default:
      return false;
  }
}

export function getSafeAdminPasswordRecoveryPhase(
  passwordRecovery,
  { inferLegacyPhase = false } = {}
) {
  if (TERMINAL_PASSWORD_RECOVERY_PHASES.has(passwordRecovery?.phase)) {
    return passwordRecovery.phase;
  }

  const hasRequestData = hasPasswordRecoveryRequestData(passwordRecovery);

  if (inferLegacyPhase) {
    return hasRequestData
      ? ADMIN_PASSWORD_RECOVERY_PHASE.CODE_REQUESTED
      : ADMIN_PASSWORD_RECOVERY_PHASE.IDLE;
  }

  if (
    passwordRecovery?.phase === ADMIN_PASSWORD_RECOVERY_PHASE.CODE_VERIFIED
  ) {
    return hasRequestData
      ? ADMIN_PASSWORD_RECOVERY_PHASE.CODE_VERIFIED
      : ADMIN_PASSWORD_RECOVERY_PHASE.IDLE;
  }

  if (
    passwordRecovery?.phase === ADMIN_PASSWORD_RECOVERY_PHASE.CODE_REQUESTED
  ) {
    return hasRequestData
      ? ADMIN_PASSWORD_RECOVERY_PHASE.CODE_REQUESTED
      : ADMIN_PASSWORD_RECOVERY_PHASE.IDLE;
  }

  return ADMIN_PASSWORD_RECOVERY_PHASE.IDLE;
}
