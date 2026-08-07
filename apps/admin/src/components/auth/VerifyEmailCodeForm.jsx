import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useController, useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";

import Button from "../ui/button/Button.jsx";
import {
  clearAdminEmailVerificationFeedback,
  clearAdminEmailVerificationRequestFeedback,
  clearAdminEmailVerificationState,
  resendAdminEmailVerificationThunk,
  selectAdminEmailVerificationError,
  selectAdminEmailVerificationResendError,
  selectAdminEmailVerificationResendSuccessMessage,
  selectIsAdminEmailVerificationPending,
  selectIsAdminEmailVerificationResendPending,
  verifyAdminEmailSucceeded,
  verifyAdminEmailThunk,
} from "../../features/auth/authSlice.js";
import { verifyEmailSchema } from "../../schemas/auth/verifyEmailSchema.js";
import { clearAdminEmailVerificationSession } from "../../utils/storage/adminEmailVerificationSession.js";
import { ChevronLeftIcon } from "../../icons/index.js";

const OTP_LENGTH = 6;

function createEmptyOtpDigits() {
  return Array(OTP_LENGTH).fill("");
}

function getSecondsRemaining(resendAvailableAt) {
  if (typeof resendAvailableAt !== "number") {
    return 0;
  }

  return Math.max(0, Math.ceil((resendAvailableAt - Date.now()) / 1000));
}

function formatCountdown(seconds) {
  const minutes = Math.floor(seconds / 60)
    .toString()
    .padStart(2, "0");

  const remainingSeconds = (seconds % 60).toString().padStart(2, "0");

  return `${minutes}:${remainingSeconds}`;
}

function VerifyEmailCodeForm({ verificationContext, maskedEmail }) {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const otpInputRefs = useRef([]);

  const verificationError = useSelector(selectAdminEmailVerificationError);
  const resendError = useSelector(selectAdminEmailVerificationResendError);
  const resendSuccessMessage = useSelector(
    selectAdminEmailVerificationResendSuccessMessage
  );
  const isVerificationPending = useSelector(
    selectIsAdminEmailVerificationPending
  );
  const isResendPending = useSelector(
    selectIsAdminEmailVerificationResendPending
  );

  const [secondsRemaining, setSecondsRemaining] = useState(() =>
    getSecondsRemaining(verificationContext?.resendAvailableAt)
  );

  const {
    control,
    handleSubmit,
    reset,
    resetField,
    setFocus,
    setValue,
  } = useForm({
    resolver: zodResolver(verifyEmailSchema),
    defaultValues: {
      otp: "",
    },
  });

  const {
    field: otpField,
    fieldState: { error: otpError },
  } = useController({
    name: "otp",
    control,
  });

  const otpDigits = createEmptyOtpDigits().map(
    (_, index) => otpField.value?.[index] || ""
  );

  const isBusy = isVerificationPending || isResendPending;

  useEffect(() => {
    dispatch(clearAdminEmailVerificationFeedback());
  }, [dispatch]);

  useEffect(() => {
    if (!resendSuccessMessage) {
      return;
    }

    resetField("otp", { defaultValue: "" });
    setFocus("otp");
  }, [resendSuccessMessage, resetField, setFocus]);

  useEffect(() => {
    const resendAvailableAt = verificationContext?.resendAvailableAt;

    function updateCountdown() {
      setSecondsRemaining(getSecondsRemaining(resendAvailableAt));
    }

    updateCountdown();

    if (!resendAvailableAt || resendAvailableAt <= Date.now()) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      const nextSecondsRemaining = getSecondsRemaining(resendAvailableAt);

      setSecondsRemaining(nextSecondsRemaining);

      if (nextSecondsRemaining === 0) {
        window.clearInterval(intervalId);
      }
    }, 1000);

    return () => window.clearInterval(intervalId);
  }, [verificationContext?.resendAvailableAt]);

  function updateOtp(nextOtpDigits, shouldValidate = false) {
    setValue("otp", nextOtpDigits.join(""), {
      shouldDirty: true,
      shouldValidate,
    });

    if (verificationError) {
      dispatch(clearAdminEmailVerificationRequestFeedback());
    }
  }

  function handleOtpDigitChange(index, event) {
    const enteredDigits = event.target.value.replace(/\D/g, "");

    if (enteredDigits.length > 1) {
      const nextDigits = [...otpDigits];
      const availableDigits = enteredDigits.slice(0, OTP_LENGTH - index);

      availableDigits.split("").forEach((digit, offset) => {
        nextDigits[index + offset] = digit;
      });

      updateOtp(nextDigits, nextDigits.every(Boolean));

      const focusIndex = Math.min(
        index + availableDigits.length,
        OTP_LENGTH - 1
      );

      otpInputRefs.current[focusIndex]?.focus();
      return;
    }

    const nextDigits = [...otpDigits];
    const digit = enteredDigits.slice(-1);

    nextDigits[index] = digit;
    updateOtp(nextDigits);

    if (digit && index < OTP_LENGTH - 1) {
      otpInputRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpKeyDown(index, event) {
    if (event.key === "Backspace" && !otpDigits[index] && index > 0) {
      const nextDigits = [...otpDigits];

      nextDigits[index - 1] = "";
      updateOtp(nextDigits);
      otpInputRefs.current[index - 1]?.focus();
      return;
    }

    if (event.key === "ArrowLeft" && index > 0) {
      event.preventDefault();
      otpInputRefs.current[index - 1]?.focus();
      return;
    }

    if (event.key === "ArrowRight" && index < OTP_LENGTH - 1) {
      event.preventDefault();
      otpInputRefs.current[index + 1]?.focus();
    }
  }

  function handleOtpPaste(event) {
    const normalizedOtp = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    if (!normalizedOtp) {
      return;
    }

    event.preventDefault();
    const nextDigits = createEmptyOtpDigits();

    normalizedOtp.split("").forEach((digit, index) => {
      nextDigits[index] = digit;
    });

    updateOtp(nextDigits, normalizedOtp.length === OTP_LENGTH);

    const focusIndex = Math.min(normalizedOtp.length, OTP_LENGTH - 1);

    otpInputRefs.current[focusIndex]?.focus();
  }

  async function handleVerifyAccount({ otp }) {
    if (isBusy) {
      return;
    }

    const resultAction = await dispatch(
      verifyAdminEmailThunk({
        userId: verificationContext.userId,
        otp,
      })
    );

    if (!verifyAdminEmailSucceeded.match(resultAction)) {
      return;
    }

    reset({ otp: "" });
    clearAdminEmailVerificationSession();
    navigate("/admin/dashboard", { replace: true });
  }

  function handleResendCode() {
    if (isBusy || secondsRemaining > 0) {
      return;
    }

    dispatch(
      resendAdminEmailVerificationThunk({
        userId: verificationContext.userId,
      })
    );
  }

  function handleBackToSignIn() {
    if (isBusy) {
      return;
    }

    reset({ otp: "" });
    clearAdminEmailVerificationSession();
    dispatch(clearAdminEmailVerificationState());
    navigate("/admin/sign-in", { replace: true });
  }

  const otpDescriptionIds = [
    otpError ? "admin-email-verification-validation-error" : null,
    verificationError ? "admin-email-verification-api-error" : null,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <>
      <button
        type="button"
        onClick={handleBackToSignIn}
        disabled={isBusy}
        className="mb-7 inline-flex cursor-pointer items-center gap-2 rounded-sm text-sm font-medium text-gray-500 transition-colors hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-400 dark:hover:text-gray-300 dark:focus-visible:outline-brand-400"
      >
        <ChevronLeftIcon className="size-5 shrink-0" />
        Back to Sign In
      </button>

      <div className="mb-8">
        <h1 className="mb-2 text-title-sm font-semibold text-gray-800 dark:text-white/90 sm:text-title-md">
          Verify Your Email
        </h1>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          Enter the 6-digit verification code sent to{" "}
          <span className="break-all font-medium text-gray-700 dark:text-gray-300">
            {maskedEmail}
          </span>
          .
        </p>
      </div>

      <form onSubmit={handleSubmit(handleVerifyAccount)} noValidate>
        <div className="space-y-6">
          <fieldset aria-describedby={otpDescriptionIds || undefined}>
            <legend className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Verification Code
            </legend>

            <div className="grid grid-cols-6 gap-1.5 sm:gap-3">
              {otpDigits.map((digit, index) => (
                <div key={index} className="min-w-0">
                  <label
                    className="sr-only"
                    htmlFor={`admin-email-verification-code-${index}`}
                  >
                    Verification code digit {index + 1} of {OTP_LENGTH}
                  </label>

                  <input
                    ref={(inputElement) => {
                      otpInputRefs.current[index] = inputElement;

                      if (index === 0) {
                        otpField.ref(inputElement);
                      }
                    }}
                    id={`admin-email-verification-code-${index}`}
                    name={`admin-email-verification-digit-${index + 1}`}
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    autoComplete={index === 0 ? "one-time-code" : "off"}
                    maxLength={OTP_LENGTH}
                    value={digit}
                    disabled={isBusy}
                    aria-invalid={
                      Boolean(otpError || verificationError) || undefined
                    }
                    aria-describedby={otpDescriptionIds || undefined}
                    onChange={(event) => handleOtpDigitChange(index, event)}
                    onKeyDown={(event) => handleOtpKeyDown(index, event)}
                    onPaste={handleOtpPaste}
                    onBlur={otpField.onBlur}
                    onFocus={(event) => event.currentTarget.select()}
                    className={`h-14 w-full rounded-lg border bg-transparent text-center text-xl font-semibold text-gray-800 transition focus-visible:outline-hidden focus-visible:ring-3 disabled:cursor-not-allowed disabled:opacity-50 dark:text-white/90 ${
                      otpError || verificationError
                        ? "border-error-500 focus-visible:border-error-500 focus-visible:ring-error-500/30 dark:border-error-500 dark:focus-visible:border-error-400 dark:focus-visible:ring-error-400/30"
                        : "border-gray-300 focus-visible:border-brand-400 focus-visible:ring-brand-500/30 dark:border-gray-700 dark:focus-visible:border-brand-400 dark:focus-visible:ring-brand-400/30"
                    }`}
                  />
                </div>
              ))}
            </div>

            {otpError?.message && (
              <p
                id="admin-email-verification-validation-error"
                className="mt-1.5 text-xs text-error-600 dark:text-error-400"
              >
                {otpError.message}
              </p>
            )}
          </fieldset>

          {verificationError && (
            <p
              id="admin-email-verification-api-error"
              role="alert"
              className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400"
            >
              {verificationError}
            </p>
          )}

          {resendError && (
            <p
              role="alert"
              className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400"
            >
              {resendError}
            </p>
          )}

          {resendSuccessMessage && (
            <p
              role="status"
              aria-live="polite"
              className="rounded-lg border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400"
            >
              {resendSuccessMessage}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isBusy}>
            {isVerificationPending ? "Verifying..." : "Verify account"}
          </Button>
        </div>
      </form>

      <div className="mt-4 flex min-h-5 flex-wrap items-center justify-center gap-x-1 gap-y-1 text-center text-sm text-gray-500 dark:text-gray-400">
        <span>Didn&apos;t receive the code?</span>

        <button
          type="button"
          onClick={handleResendCode}
          disabled={secondsRemaining > 0 || isBusy}
          className="w-32 shrink-0 cursor-pointer rounded-sm text-center font-medium tabular-nums text-brand-500 hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:text-gray-400 sm:text-left dark:text-brand-400 dark:hover:text-brand-300 dark:focus-visible:outline-brand-400 dark:disabled:text-gray-600"
        >
          {isResendPending
            ? "Resending..."
            : secondsRemaining > 0
              ? `Resend in ${formatCountdown(secondsRemaining)}`
              : "Resend code"}
        </button>
      </div>
    </>
  );
}

export default VerifyEmailCodeForm;
