import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { Link, useLocation, useNavigate } from "react-router";

import Label from "../../components/form/Label.jsx";
import InputField from "../../components/form/input/InputField.jsx";
import Button from "../../components/ui/button/Button.jsx";
import AuthFormContainer from "../../components/layout/auth/AuthFormContainer.jsx";

import {
  abandonAdminSignInRequest,
  clearAdminEmailVerificationState,
  clearAdminSignInRequestFeedback,
  consumeAdminPasswordResetSuccessMessage,
  consumeAdminSessionInvalidationNotice,
  createAdminSignInRequestId,
  selectAdminPasswordRecovery,
  selectAdminPasswordResetCompletionMessage,
  selectAdminSessionInvalidationNotice,
  selectAdminSignInError,
  selectIsAdminSignInPending,
  setAdminEmailVerificationContext,
  setAdminPasswordRecoveryEmail,
  signInAdminFailed,
  signInAdminThunk,
} from "../../features/auth/authSlice.js";
import { ADMIN_AUTH_REJECTION_KIND } from "../../features/auth/adminEmailVerificationConstants.js";

import { EyeCloseIcon, EyeIcon, GoogleIcon, XIcon } from "../../icons/index.js";

import { signInSchema } from "../../schemas/auth/signInSchema.js";
import {
  clearAdminEmailVerificationSession,
  createAdminEmailVerificationSession,
  writeAdminEmailVerificationSession,
} from "../../utils/storage/adminEmailVerificationSession.js";

function SignInPage() {
  const dispatch = useDispatch();
  const location = useLocation();
  const navigate = useNavigate();

  const isCurrentPageRef = useRef(false);
  const activeSignInRequestIdRef = useRef(null);

  const [showPassword, setShowPassword] = useState(false);

  const passwordResetCompletionMessage = useSelector(
    selectAdminPasswordResetCompletionMessage
  );

  const sessionInvalidationMessage = useSelector(
    selectAdminSessionInvalidationNotice
  );

  const [passwordResetSuccessNotice, setPasswordResetSuccessNotice] = useState(
    () =>
      passwordResetCompletionMessage
        ? {
            entryKey: location.key,
            message: passwordResetCompletionMessage,
          }
        : null
  );

  const passwordResetSuccessMessage =
    passwordResetSuccessNotice?.entryKey === location.key
      ? passwordResetSuccessNotice.message
      : null;

  const [sessionInvalidationNotice, setSessionInvalidationNotice] = useState(
    () =>
      sessionInvalidationMessage
        ? {
            entryKey: location.key,
            message: sessionInvalidationMessage,
          }
        : null
  );

  const visibleSessionInvalidationMessage =
    sessionInvalidationNotice?.entryKey === location.key
      ? sessionInvalidationNotice.message
      : null;

  const [emailVerificationSessionNotice, setEmailVerificationSessionNotice] =
    useState(() => {
      const message = location.state?.emailVerificationNotice;

      return typeof message === "string" && message.trim()
        ? message.trim()
        : null;
    });

  const { email: savedEmail } = useSelector(selectAdminPasswordRecovery);

  const isAdminSignInPending = useSelector(selectIsAdminSignInPending);

  const adminSignInError = useSelector(selectAdminSignInError);

  const {
    register,
    handleSubmit,
    getValues,
    resetField,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(signInSchema),

    defaultValues: {
      email: savedEmail || "",
      password: "",
    },
  });

  useEffect(() => {
    isCurrentPageRef.current = true;
    clearAdminEmailVerificationSession();
    dispatch(clearAdminEmailVerificationState());
    dispatch(clearAdminSignInRequestFeedback());

    return () => {
      isCurrentPageRef.current = false;

      const requestId = activeSignInRequestIdRef.current;
      activeSignInRequestIdRef.current = null;

      if (requestId) {
        dispatch(abandonAdminSignInRequest({ requestId }));
      }
    };
  }, [dispatch]);

  useEffect(() => {
    if (passwordResetCompletionMessage) {
      // The reset request may finish after browser Back has already mounted
      // Sign In. Capture that late one-shot notice on the current entry before
      // removing it from Redux.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setPasswordResetSuccessNotice({
        entryKey: location.key,
        message: passwordResetCompletionMessage,
      });
      dispatch(consumeAdminPasswordResetSuccessMessage());
      return;
    }

    // Leaving the entry permanently consumes its local message. Returning to
    // the entry with browser Forward must not replay it.
    setPasswordResetSuccessNotice((currentNotice) =>
      currentNotice?.entryKey === location.key ? currentNotice : null
    );
  }, [dispatch, location.key, passwordResetCompletionMessage]);

  useEffect(() => {
    if (sessionInvalidationMessage) {
      // Capture the one-shot Redux notice on this Sign In history entry before
      // consuming it, so ordinary rerenders keep it visible without replaying
      // it after this page instance is left.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSessionInvalidationNotice({
        entryKey: location.key,
        message: sessionInvalidationMessage,
      });
      dispatch(consumeAdminSessionInvalidationNotice());
      return;
    }

    setSessionInvalidationNotice((currentNotice) =>
      currentNotice?.entryKey === location.key ? currentNotice : null
    );
  }, [dispatch, location.key, sessionInvalidationMessage]);

  function dismissSignInFeedback() {
    setPasswordResetSuccessNotice(null);
    setSessionInvalidationNotice(null);
    setEmailVerificationSessionNotice(null);
    dispatch(clearAdminSignInRequestFeedback());
  }

  async function handleSignIn(formData) {
    dismissSignInFeedback();

    const normalizedEmail = formData.email.trim().toLowerCase();
    const requestId = createAdminSignInRequestId();

    activeSignInRequestIdRef.current = requestId;

    const resultAction = await dispatch(
      signInAdminThunk(
        {
          email: normalizedEmail,
          password: formData.password,
        },
        { requestId }
      )
    );

    if (
      !isCurrentPageRef.current ||
      activeSignInRequestIdRef.current !== requestId
    ) {
      return;
    }

    activeSignInRequestIdRef.current = null;

    if (
      !signInAdminFailed.match(resultAction) ||
      resultAction.payload?.kind !==
        ADMIN_AUTH_REJECTION_KIND.EMAIL_VERIFICATION_REQUIRED
    ) {
      return;
    }

    const verificationSession = createAdminEmailVerificationSession(
      resultAction.payload.verificationContext
    );

    if (!verificationSession) {
      return;
    }

    resetField("password", { defaultValue: "" });
    writeAdminEmailVerificationSession(verificationSession);
    dispatch(setAdminEmailVerificationContext(verificationSession));
    navigate("/admin/verify-email", { replace: true });
  }

  function handleSignInSubmit(event) {
    return handleSubmit(handleSignIn)(event);
  }

  function handleOpenForgotPassword() {
    dismissSignInFeedback();

    const currentEmail = getValues("email").trim();

    dispatch(setAdminPasswordRecoveryEmail(currentEmail));
  }

  return (
    <AuthFormContainer>
      <div className="mb-8">
        <h1 className="mb-2 text-title-sm font-semibold text-gray-800 dark:text-white/90 sm:text-title-md">
          Sign In
        </h1>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          Enter your email and password to sign in.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          disabled
          title="Google sign in is not available yet"
          className="inline-flex h-11 w-full cursor-not-allowed items-center justify-center gap-3 rounded-lg bg-gray-100 px-4 py-3 text-sm font-normal text-gray-700 dark:bg-white/5 dark:text-white/90"
        >
          <GoogleIcon className="size-5 shrink-0" />
          Google — Coming soon
        </button>

        <button
          type="button"
          disabled
          title="X sign in is not available yet"
          className="inline-flex h-11 w-full cursor-not-allowed items-center justify-center gap-3 rounded-lg bg-gray-100 px-4 py-3 text-sm font-normal text-gray-700 dark:bg-white/5 dark:text-white/90"
        >
          <XIcon className="size-5 shrink-0" />
          X — Coming soon
        </button>
      </div>

      <div className="relative py-6">
        <div className="absolute inset-0 flex items-center">
          <div className="w-full border-t border-gray-200 dark:border-gray-800" />
        </div>

        <div className="relative flex justify-center">
          <span className="bg-white px-3 text-sm text-gray-400 dark:bg-gray-900">
            Or
          </span>
        </div>
      </div>

      <form
        className="space-y-5"
        onSubmit={handleSignInSubmit}
        onFocusCapture={dismissSignInFeedback}
        onChangeCapture={dismissSignInFeedback}
        noValidate
      >
        <div>
          <Label htmlFor="email">
            Email <span className="text-error-500">*</span>
          </Label>

          <InputField
            type="email"
            id="email"
            placeholder="info@gmail.com"
            autoComplete="email"
            disabled={isAdminSignInPending}
            error={Boolean(errors.email)}
            hint={errors.email?.message}
            {...register("email")}
          />
        </div>

        <div>
          <Label htmlFor="password">
            Password <span className="text-error-500">*</span>
          </Label>

          <div className="relative">
            <InputField
              type={showPassword ? "text" : "password"}
              id="password"
              placeholder="Enter your password"
              autoComplete="current-password"
              className="pr-11"
              disabled={isAdminSignInPending}
              error={Boolean(errors.password)}
              hint={errors.password?.message}
              {...register("password")}
            />

            <button
              type="button"
              onClick={() => {
                dismissSignInFeedback();
                setShowPassword((currentValue) => !currentValue);
              }}
              disabled={isAdminSignInPending}
              className="absolute top-0 right-0 z-30 flex size-11 cursor-pointer items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:outline-brand-400"
            >
              {showPassword ? (
                <EyeIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
              ) : (
                <EyeCloseIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
              )}

              <span className="sr-only">
                {showPassword ? "Hide password" : "Show password"}
              </span>
            </button>
          </div>
        </div>

        <div className="flex justify-end">
          <Link
            to="/admin/forgot-password"
            onClick={(event) => {
              if (isAdminSignInPending) {
                event.preventDefault();
                return;
              }

              handleOpenForgotPassword();
            }}
            aria-disabled={isAdminSignInPending || undefined}
            className={`rounded-sm text-sm text-brand-500 hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:text-brand-400 dark:focus-visible:outline-brand-400 ${
              isAdminSignInPending
                ? "pointer-events-none opacity-50"
                : ""
            }`}
          >
            Forgot password?
          </Link>
        </div>

        {passwordResetSuccessMessage && (
          <p
            role="status"
            aria-live="polite"
            className="rounded-lg border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400"
          >
            {passwordResetSuccessMessage}
          </p>
        )}

        {emailVerificationSessionNotice && (
          <p
            role="status"
            aria-live="polite"
            className="rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-400"
          >
            {emailVerificationSessionNotice}
          </p>
        )}

        {visibleSessionInvalidationMessage && (
          <p
            role="status"
            aria-live="polite"
            className="rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-sm text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-400"
          >
            {visibleSessionInvalidationMessage}
          </p>
        )}

        {adminSignInError && (
          <p
            role="alert"
            className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400"
          >
            {adminSignInError}
          </p>
        )}

        <Button
          type="submit"
          disabled={isAdminSignInPending}
          className="w-full"
        >
          {isAdminSignInPending ? "Signing in..." : "Sign in"}
        </Button>
      </form>
    </AuthFormContainer>
  );
}

export default SignInPage;
