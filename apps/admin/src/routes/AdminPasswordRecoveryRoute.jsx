import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { matchPath, Navigate, Outlet, useLocation } from "react-router";

import {
  completeAdminPasswordRecoveryNavigation,
  endAdminPasswordResetSecretSession,
  repairAdminPasswordRecoveryState,
  selectAdminPasswordRecovery,
} from "../features/auth/authSlice.js";
import { getAdminPasswordResetSecretExpiresAt } from "../features/auth/adminPasswordResetSecret.js";
import {
  ADMIN_PASSWORD_RECOVERY_PHASE,
  getSafeAdminPasswordRecoveryPhase,
  isAdminPasswordRecoveryStateValid,
} from "../features/auth/authConstants.js";

const ADMIN_AUTH_ROUTE = {
  SIGN_IN: {
    id: "signIn",
    path: "/admin/sign-in",
  },
  FORGOT_PASSWORD: {
    id: "forgotPassword",
    path: "/admin/forgot-password",
  },
  VERIFY_RESET_CODE: {
    id: "verifyResetCode",
    path: "/admin/verify-reset-code",
  },
  CREATE_NEW_PASSWORD: {
    id: "createNewPassword",
    path: "/admin/create-new-password",
  },
};

const TERMINAL_PHASES = new Set([
  ADMIN_PASSWORD_RECOVERY_PHASE.CANCELLED,
  ADMIN_PASSWORD_RECOVERY_PHASE.RESET_SUCCEEDED,
]);

function getMatchedAdminAuthRoute(pathname) {
  return (
    Object.values(ADMIN_AUTH_ROUTE).find(({ path }) =>
      matchPath({ path, caseSensitive: false, end: true }, pathname)
    ) || null
  );
}

function getRecoveryRedirect(routeId, phase) {
  if (TERMINAL_PHASES.has(phase)) {
    return routeId === ADMIN_AUTH_ROUTE.SIGN_IN.id
      ? null
      : ADMIN_AUTH_ROUTE.SIGN_IN.path;
  }

  if (routeId === ADMIN_AUTH_ROUTE.SIGN_IN.id) {
    return null;
  }

  if (routeId === ADMIN_AUTH_ROUTE.FORGOT_PASSWORD.id) {
    if (phase === ADMIN_PASSWORD_RECOVERY_PHASE.CODE_VERIFIED) {
      return ADMIN_AUTH_ROUTE.CREATE_NEW_PASSWORD.path;
    }

    if (phase === ADMIN_PASSWORD_RECOVERY_PHASE.CODE_REQUESTED) {
      return ADMIN_AUTH_ROUTE.VERIFY_RESET_CODE.path;
    }

    return null;
  }

  if (routeId === ADMIN_AUTH_ROUTE.VERIFY_RESET_CODE.id) {
    if (phase === ADMIN_PASSWORD_RECOVERY_PHASE.CODE_VERIFIED) {
      return ADMIN_AUTH_ROUTE.CREATE_NEW_PASSWORD.path;
    }

    return phase === ADMIN_PASSWORD_RECOVERY_PHASE.CODE_REQUESTED
      ? null
      : ADMIN_AUTH_ROUTE.FORGOT_PASSWORD.path;
  }

  if (routeId === ADMIN_AUTH_ROUTE.CREATE_NEW_PASSWORD.id) {
    if (phase === ADMIN_PASSWORD_RECOVERY_PHASE.CODE_VERIFIED) {
      return null;
    }

    return phase === ADMIN_PASSWORD_RECOVERY_PHASE.CODE_REQUESTED
      ? ADMIN_AUTH_ROUTE.VERIFY_RESET_CODE.path
      : ADMIN_AUTH_ROUTE.FORGOT_PASSWORD.path;
  }

  return ADMIN_AUTH_ROUTE.SIGN_IN.path;
}

function AdminPasswordRecoveryRoute() {
  const dispatch = useDispatch();
  const { pathname } = useLocation();
  const passwordRecovery = useSelector(selectAdminPasswordRecovery);
  const matchedRoute = getMatchedAdminAuthRoute(pathname);
  const safePhase = getSafeAdminPasswordRecoveryPhase(passwordRecovery);
  const isRecoveryStateValid =
    isAdminPasswordRecoveryStateValid(passwordRecovery);
  const isVerifiedRecoverySession =
    safePhase === ADMIN_PASSWORD_RECOVERY_PHASE.CODE_VERIFIED &&
    isRecoveryStateValid;
  const resetSecretExpiresAt = isVerifiedRecoverySession
    ? getAdminPasswordResetSecretExpiresAt(passwordRecovery.userId)
    : null;
  const isResetSecretMissing =
    isVerifiedRecoverySession && resetSecretExpiresAt === null;
  const routablePhase = isResetSecretMissing
    ? ADMIN_PASSWORD_RECOVERY_PHASE.CODE_REQUESTED
    : safePhase;

  const redirectPath = getRecoveryRedirect(matchedRoute?.id, routablePhase);

  useEffect(() => {
    if (!isRecoveryStateValid) {
      dispatch(repairAdminPasswordRecoveryState());
    }
  }, [dispatch, isRecoveryStateValid]);

  useEffect(() => {
    if (isResetSecretMissing) {
      dispatch(endAdminPasswordResetSecretSession());
    }
  }, [dispatch, isResetSecretMissing]);

  useEffect(() => {
    if (!isVerifiedRecoverySession || resetSecretExpiresAt === null) {
      return undefined;
    }

    let timeoutId = null;
    let isCancelled = false;

    function scheduleExpiryCheck(expiresAt) {
      const remainingDuration = Math.max(0, expiresAt - Date.now());

      timeoutId = window.setTimeout(() => {
        if (isCancelled) {
          return;
        }

        const currentExpiresAt = getAdminPasswordResetSecretExpiresAt(
          passwordRecovery.userId
        );

        if (currentExpiresAt === null) {
          dispatch(endAdminPasswordResetSecretSession());
          return;
        }

        scheduleExpiryCheck(currentExpiresAt);
      }, remainingDuration);
    }

    scheduleExpiryCheck(resetSecretExpiresAt);

    return () => {
      isCancelled = true;

      if (timeoutId !== null) {
        window.clearTimeout(timeoutId);
      }
    };
  }, [
    dispatch,
    isVerifiedRecoverySession,
    passwordRecovery.userId,
    resetSecretExpiresAt,
  ]);

  useEffect(() => {
    if (
      matchedRoute?.id === ADMIN_AUTH_ROUTE.SIGN_IN.id &&
      TERMINAL_PHASES.has(safePhase)
    ) {
      dispatch(completeAdminPasswordRecoveryNavigation());
    }
  }, [dispatch, matchedRoute?.id, safePhase]);

  return redirectPath ? <Navigate to={redirectPath} replace /> : <Outlet />;
}

export default AdminPasswordRecoveryRoute;
