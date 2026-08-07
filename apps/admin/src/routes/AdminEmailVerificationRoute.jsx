import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Navigate, Outlet } from "react-router";

import AdminSessionInitializationScreen from "../components/common/AdminSessionInitializationScreen.jsx";
import {
  clearAdminEmailVerificationState,
  selectAdminEmailVerificationContext,
  selectIsAdminAuthenticated,
  selectIsAdminEmailVerificationPending,
  selectIsAdminEmailVerificationResendPending,
  selectIsAdminSessionInitializationPending,
} from "../features/auth/authSlice.js";
import { ADMIN_EMAIL_VERIFICATION_MISSING_SESSION_MESSAGE } from "../features/auth/adminEmailVerificationConstants.js";
import { isAdminEmailVerificationSessionValid } from "../utils/storage/adminEmailVerificationSession.js";

function AdminEmailVerificationRoute() {
  const dispatch = useDispatch();
  const isSessionInitializationPending = useSelector(
    selectIsAdminSessionInitializationPending
  );
  const isAdminAuthenticated = useSelector(selectIsAdminAuthenticated);
  const isVerificationPending = useSelector(
    selectIsAdminEmailVerificationPending
  );
  const isResendPending = useSelector(
    selectIsAdminEmailVerificationResendPending
  );
  const verificationContext = useSelector(
    selectAdminEmailVerificationContext
  );
  const isVerificationContextValid =
    isAdminEmailVerificationSessionValid(verificationContext);

  useEffect(() => {
    if (isSessionInitializationPending) {
      return undefined;
    }

    if (isAdminAuthenticated) {
      dispatch(clearAdminEmailVerificationState());
      return undefined;
    }

    if (!isVerificationContextValid) {
      if (!isVerificationPending && !isResendPending) {
        dispatch(clearAdminEmailVerificationState());
      }

      return undefined;
    }

    if (isVerificationPending || isResendPending) {
      return undefined;
    }

    const expiresIn = Math.max(
      0,
      verificationContext.expiresAt - Date.now()
    );
    const expiryTimerId = window.setTimeout(() => {
      dispatch(clearAdminEmailVerificationState());
    }, expiresIn);

    return () => window.clearTimeout(expiryTimerId);
  }, [
    dispatch,
    isAdminAuthenticated,
    isResendPending,
    isSessionInitializationPending,
    isVerificationContextValid,
    isVerificationPending,
    verificationContext,
  ]);

  if (isSessionInitializationPending) {
    return <AdminSessionInitializationScreen isPending />;
  }

  if (isAdminAuthenticated) {
    return <Navigate to="/admin/dashboard" replace />;
  }

  if (
    !isVerificationContextValid &&
    !isVerificationPending &&
    !isResendPending
  ) {
    return (
      <Navigate
        to="/admin/sign-in"
        replace
        state={{
          emailVerificationNotice:
            ADMIN_EMAIL_VERIFICATION_MISSING_SESSION_MESSAGE,
        }}
      />
    );
  }

  return <Outlet />;
}

export default AdminEmailVerificationRoute;
