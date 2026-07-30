import { useEffect, useRef, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useLocation, useNavigate } from "react-router";

import AuthFormContainer from "../../components/layout/auth/AuthFormContainer.jsx";
import Label from "../../components/form/Label.jsx";
import Button from "../../components/ui/button/Button.jsx";

import {
  clearAdminPasswordResetOtpResendFeedback,
  clearAdminPasswordResetOtpVerificationFeedback,
  resendAdminPasswordResetOtpThunk,
  selectAdminPasswordRecovery,
  selectAdminPasswordResetOtpResendError,
  selectAdminPasswordResetOtpResendSuccessMessage,
  selectAdminPasswordResetOtpVerificationError,
  selectIsAdminPasswordResetOtpResendPending,
  selectIsAdminPasswordResetOtpVerificationPending,
  setAdminPasswordRecoveryEmail,
  verifyAdminPasswordResetOtpThunk,
} from "../../features/auth/authSlice.js";

import { verifyResetCodeSchema } from "../../schemas/auth/verifyResetCodeSchema.js";

const OTP_LENGTH = 6;

function createEmptyOtpDigits() {
  return Array(OTP_LENGTH).fill("");
}

function calculateSecondsRemaining(resendAvailableAt) {
  if (!resendAvailableAt) {
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

function VerifyResetCodePage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  const otpInputRefs = useRef([]);

  const { email, userId, resendAvailableAt } = useSelector(
    selectAdminPasswordRecovery
  );

  const isVerificationPending = useSelector(
    selectIsAdminPasswordResetOtpVerificationPending
  );

  const verificationError = useSelector(
    selectAdminPasswordResetOtpVerificationError
  );

  const isResendPending = useSelector(
    selectIsAdminPasswordResetOtpResendPending
  );

  const resendError = useSelector(selectAdminPasswordResetOtpResendError);

  const resendSuccessMessage = useSelector(
    selectAdminPasswordResetOtpResendSuccessMessage
  );

  const [otpDigits, setOtpDigits] = useState(createEmptyOtpDigits);

  const [secondsRemaining, setSecondsRemaining] = useState(0);

  const cameFromForgotPassword =
    location.state?.from === "admin-forgot-password";

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(verifyResetCodeSchema),

    defaultValues: {
      otp: "",
    },
  });

  const isBusy = isVerificationPending || isResendPending;

  useEffect(() => {
    if (!email || !userId) {
      navigate("/admin/forgot-password", {
        replace: true,
      });
    }
  }, [email, userId, navigate]);

  useEffect(() => {
    dispatch(clearAdminPasswordResetOtpResendFeedback());
    dispatch(clearAdminPasswordResetOtpVerificationFeedback());
  }, [dispatch]);

  useEffect(() => {
    const updateCountdown = () => {
      setSecondsRemaining(calculateSecondsRemaining(resendAvailableAt));
    };

    updateCountdown();

    if (!resendAvailableAt || resendAvailableAt <= Date.now()) {
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      const nextSecondsRemaining = calculateSecondsRemaining(resendAvailableAt);

      setSecondsRemaining(nextSecondsRemaining);

      if (nextSecondsRemaining === 0) {
        window.clearInterval(intervalId);
      }
    }, 1000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [resendAvailableAt]);

  function updateOtp(nextOtpDigits, shouldValidate = false) {
    setOtpDigits(nextOtpDigits);

    setValue("otp", nextOtpDigits.join(""), {
      shouldDirty: true,
      shouldValidate,
    });

    if (verificationError) {
      dispatch(clearAdminPasswordResetOtpVerificationFeedback());
    }
  }

  function handleOtpDigitChange(index, event) {
    const digit = event.target.value.replace(/\D/g, "").slice(-1);

    const nextDigits = [...otpDigits];
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
    const pastedOtp = event.clipboardData
      .getData("text")
      .replace(/\D/g, "")
      .slice(0, OTP_LENGTH);

    if (!pastedOtp) {
      return;
    }

    event.preventDefault();

    const nextDigits = createEmptyOtpDigits();

    pastedOtp.split("").forEach((digit, index) => {
      nextDigits[index] = digit;
    });

    updateOtp(nextDigits, pastedOtp.length === OTP_LENGTH);

    const focusIndex = Math.min(pastedOtp.length, OTP_LENGTH - 1);

    otpInputRefs.current[focusIndex]?.focus();
  }

  function handleChangeEmail() {
    dispatch(setAdminPasswordRecoveryEmail(email));

    if (cameFromForgotPassword) {
      navigate(-1);
      return;
    }

    navigate("/admin/forgot-password", {
      replace: true,
    });
  }

  async function handleResendCode() {
    if (secondsRemaining > 0 || isBusy) {
      return;
    }

    const resultAction = await dispatch(
      resendAdminPasswordResetOtpThunk(email)
    );

    if (resendAdminPasswordResetOtpThunk.fulfilled.match(resultAction)) {
      reset({
        otp: "",
      });

      setOtpDigits(createEmptyOtpDigits());

      otpInputRefs.current[0]?.focus();
    }
  }

  async function handleVerifyCode(formData) {
    const resultAction = await dispatch(
      verifyAdminPasswordResetOtpThunk({
        userId,
        otp: formData.otp,
      })
    );

    if (verifyAdminPasswordResetOtpThunk.fulfilled.match(resultAction)) {
      navigate("/admin/create-new-password", {
        replace: true,

        state: {
          from: "admin-verify-reset-code",
          verifiedOtp: formData.otp,
        },
      });
    }
  }

  if (!email || !userId) {
    return null;
  }

  return (
    <AuthFormContainer>
      <button
        type="button"
        onClick={handleChangeEmail}
        disabled={isBusy}
        className="mb-7 inline-flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-500 transition-colors hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-400 dark:hover:text-gray-300"
      >
        <span>←</span>
        Change email
      </button>

      <div className="mb-8">
        <h1 className="mb-2 text-title-sm font-semibold text-gray-800 dark:text-white/90 sm:text-title-md">
          Verify Your Email
        </h1>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          Enter the 6-digit verification code sent to{" "}
          <span className="font-medium text-gray-700 dark:text-gray-300">
            {email}
          </span>
          .
        </p>
      </div>

      <form onSubmit={handleSubmit(handleVerifyCode)} noValidate>
        <input type="hidden" {...register("otp")} />

        <div className="space-y-6">
          <div>
            <Label htmlFor="otp-0">Verification Code</Label>

            <div className="grid grid-cols-6 gap-2 sm:gap-3">
              {otpDigits.map((digit, index) => (
                <input
                  key={index}
                  ref={(inputElement) => {
                    otpInputRefs.current[index] = inputElement;
                  }}
                  id={`otp-${index}`}
                  type="text"
                  inputMode="numeric"
                  autoComplete={index === 0 ? "one-time-code" : "off"}
                  maxLength={1}
                  value={digit}
                  disabled={isBusy}
                  onChange={(event) => handleOtpDigitChange(index, event)}
                  onKeyDown={(event) => handleOtpKeyDown(index, event)}
                  onPaste={handleOtpPaste}
                  onFocus={(event) => event.currentTarget.select()}
                  className={`h-14 w-full rounded-lg border bg-transparent text-center text-xl font-semibold text-gray-800 outline-none transition focus:ring-3 disabled:cursor-not-allowed disabled:opacity-50 dark:text-white/90 ${
                    errors.otp || verificationError
                      ? "border-error-500 focus:border-error-500 focus:ring-error-500/10 dark:border-error-500"
                      : "border-gray-300 focus:border-brand-300 focus:ring-brand-500/10 dark:border-gray-700 dark:focus:border-brand-800"
                  }`}
                />
              ))}
            </div>

            {errors.otp?.message && (
              <p className="mt-1.5 text-xs text-error-500">
                {errors.otp.message}
              </p>
            )}
          </div>

          {verificationError && (
            <p className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
              {verificationError}
            </p>
          )}

          {resendError && (
            <p className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-600 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
              {resendError}
            </p>
          )}

          {resendSuccessMessage && (
            <p className="rounded-lg border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-600 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400">
              {resendSuccessMessage}
            </p>
          )}

          <Button type="submit" className="w-full" disabled={isBusy}>
            {isVerificationPending ? "Verifying..." : "Verify Code"}
          </Button>
        </div>
      </form>

      <div className="mt-5 flex min-h-5 items-center justify-center gap-1 text-sm text-gray-500 dark:text-gray-400">
        <span className="shrink-0">Didn’t receive the code?</span>

        <button
          type="button"
          onClick={handleResendCode}
          disabled={secondsRemaining > 0 || isBusy}
          className="w-36 shrink-0 cursor-pointer text-left font-medium text-brand-500 hover:text-brand-600 disabled:cursor-not-allowed disabled:text-gray-400 dark:text-brand-400 dark:hover:text-brand-300 dark:disabled:text-gray-600"
        >
          {isResendPending
            ? "Resending..."
            : secondsRemaining > 0
              ? `Resend in ${formatCountdown(secondsRemaining)}`
              : "Resend code"}
        </button>
      </div>
    </AuthFormContainer>
  );
}

export default VerifyResetCodePage;
