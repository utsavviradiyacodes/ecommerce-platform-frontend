import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router";

import AuthFormContainer from "../../components/layout/auth/AuthFormContainer.jsx";
import Label from "../../components/form/Label.jsx";
import InputField from "../../components/form/input/InputField.jsx";
import Button from "../../components/ui/button/Button.jsx";
import { ChevronLeftIcon } from "../../icons/index.js";

import {
  clearAdminPasswordResetOtpRequestFeedback,
  requestAdminPasswordResetThunk,
  selectAdminPasswordRecovery,
  selectAdminPasswordResetOtpRequestError,
  selectIsAdminPasswordResetOtpRequestPending,
  setAdminPasswordRecoveryEmail,
} from "../../features/auth/authSlice.js";

import { forgotPasswordSchema } from "../../schemas/auth/forgotPasswordSchema.js";

function ForgotPasswordPage() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const { email: savedEmail } = useSelector(selectAdminPasswordRecovery);

  const isPasswordResetOtpRequestPending = useSelector(
    selectIsAdminPasswordResetOtpRequestPending
  );

  const passwordResetOtpRequestError = useSelector(
    selectAdminPasswordResetOtpRequestError
  );

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),

    defaultValues: {
      email: savedEmail || "",
    },
  });

  useEffect(() => {
    dispatch(clearAdminPasswordResetOtpRequestFeedback());
  }, [dispatch]);

  function handleReturnToSignIn() {
    if (isPasswordResetOtpRequestPending) {
      return;
    }

    const currentEmail = getValues("email").trim();

    dispatch(setAdminPasswordRecoveryEmail(currentEmail));

    navigate("/admin/sign-in", {
      replace: true,
    });
  }

  function handleForgotPasswordSubmit(formData) {
    dispatch(requestAdminPasswordResetThunk(formData.email));
  }

  return (
    <AuthFormContainer>
      <button
        type="button"
        onClick={handleReturnToSignIn}
        disabled={isPasswordResetOtpRequestPending}
        className="mb-7 inline-flex cursor-pointer items-center gap-2 rounded-sm text-sm font-medium text-gray-500 transition-colors hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-400 dark:hover:text-gray-300 dark:focus-visible:outline-brand-400"
      >
        <ChevronLeftIcon className="size-5 shrink-0" />
        Return to Sign In
      </button>

      <div className="mb-8">
        <h1 className="mb-2 text-title-sm font-semibold text-gray-800 dark:text-white/90 sm:text-title-md">
          Forgot Your Password?
        </h1>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          Enter the email address associated with your admin account, and we’ll
          send you a password-reset code.
        </p>
      </div>

      <form
        onSubmit={handleSubmit(handleForgotPasswordSubmit)}
        onChangeCapture={() =>
          dispatch(clearAdminPasswordResetOtpRequestFeedback())
        }
        noValidate
      >
        <div className="space-y-6">
          <div>
            <Label htmlFor="email">
              Email <span className="text-error-500">*</span>
            </Label>

            <InputField
              id="email"
              type="email"
              placeholder="Enter your email"
              autoComplete="email"
              disabled={isPasswordResetOtpRequestPending}
              error={Boolean(errors.email)}
              hint={errors.email?.message}
              {...register("email")}
            />
          </div>

          {passwordResetOtpRequestError && (
            <p
              role="alert"
              className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400"
            >
              {passwordResetOtpRequestError}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            disabled={isPasswordResetOtpRequestPending}
          >
            {isPasswordResetOtpRequestPending
              ? "Sending reset code..."
              : "Send reset code"}
          </Button>
        </div>
      </form>
    </AuthFormContainer>
  );
}

export default ForgotPasswordPage;
