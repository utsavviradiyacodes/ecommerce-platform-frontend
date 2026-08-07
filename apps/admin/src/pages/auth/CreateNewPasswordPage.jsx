import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";

import AuthFormContainer from "../../components/layout/auth/AuthFormContainer.jsx";
import Label from "../../components/form/Label.jsx";
import InputField from "../../components/form/input/InputField.jsx";
import Button from "../../components/ui/button/Button.jsx";

import {
  cancelAdminPasswordRecovery,
  clearAdminPasswordResetFeedback,
  resetAdminPasswordThunk,
  selectAdminPasswordRecovery,
  selectAdminPasswordResetError,
  selectIsAdminPasswordResetPending,
} from "../../features/auth/authSlice.js";

import { EyeCloseIcon, EyeIcon } from "../../icons/index.js";

import { createNewPasswordSchema } from "../../schemas/auth/createNewPasswordSchema.js";

function CreateNewPasswordPage() {
  const dispatch = useDispatch();

  const { email } = useSelector(selectAdminPasswordRecovery);

  const isPasswordResetPending = useSelector(selectIsAdminPasswordResetPending);

  const passwordResetError = useSelector(selectAdminPasswordResetError);

  const [showNewPassword, setShowNewPassword] = useState(false);

  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(createNewPasswordSchema),

    defaultValues: {
      newPassword: "",
      confirmNewPassword: "",
    },
  });

  useEffect(() => {
    dispatch(clearAdminPasswordResetFeedback());
  }, [dispatch]);

  function handleCancelPasswordReset() {
    dispatch(cancelAdminPasswordRecovery());
  }

  function handleCreateNewPassword(formData) {
    dispatch(resetAdminPasswordThunk(formData));
  }

  return (
    <AuthFormContainer>
      <div className="mb-8">
        <h1 className="mb-2 text-title-sm font-semibold text-gray-800 dark:text-white/90 sm:text-title-md">
          Create New Password
        </h1>

        <p className="text-sm text-gray-500 dark:text-gray-400">
          Create a new password for{" "}
          <span className="break-all font-medium text-gray-700 dark:text-gray-300">
            {email}
          </span>
          .
        </p>
      </div>

      <form
        className="space-y-5"
        onSubmit={handleSubmit(handleCreateNewPassword)}
        onChangeCapture={() => dispatch(clearAdminPasswordResetFeedback())}
        noValidate
      >
        <div>
          <Label htmlFor="newPassword">
            New Password <span className="text-error-500">*</span>
          </Label>

          <div className="relative">
            <InputField
              type={showNewPassword ? "text" : "password"}
              id="newPassword"
              placeholder="Enter your new password"
              autoComplete="new-password"
              className="pr-11"
              disabled={isPasswordResetPending}
              error={Boolean(errors.newPassword)}
              hint={errors.newPassword?.message}
              {...register("newPassword")}
            />

            <button
              type="button"
              onClick={() =>
                setShowNewPassword((currentValue) => !currentValue)
              }
              disabled={isPasswordResetPending}
              className="absolute top-0 right-0 z-30 flex size-11 cursor-pointer items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:outline-brand-400"
            >
              {showNewPassword ? (
                <EyeIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
              ) : (
                <EyeCloseIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
              )}

              <span className="sr-only">
                {showNewPassword ? "Hide new password" : "Show new password"}
              </span>
            </button>
          </div>
        </div>

        <div>
          <Label htmlFor="confirmNewPassword">
            Confirm New Password <span className="text-error-500">*</span>
          </Label>

          <div className="relative">
            <InputField
              type={showConfirmNewPassword ? "text" : "password"}
              id="confirmNewPassword"
              placeholder="Confirm your new password"
              autoComplete="new-password"
              className="pr-11"
              disabled={isPasswordResetPending}
              error={Boolean(errors.confirmNewPassword)}
              hint={errors.confirmNewPassword?.message}
              {...register("confirmNewPassword")}
            />

            <button
              type="button"
              onClick={() =>
                setShowConfirmNewPassword((currentValue) => !currentValue)
              }
              disabled={isPasswordResetPending}
              className="absolute top-0 right-0 z-30 flex size-11 cursor-pointer items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:outline-brand-400"
            >
              {showConfirmNewPassword ? (
                <EyeIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
              ) : (
                <EyeCloseIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
              )}

              <span className="sr-only">
                {showConfirmNewPassword
                  ? "Hide confirmed password"
                  : "Show confirmed password"}
              </span>
            </button>
          </div>
        </div>

        {passwordResetError && (
          <p
            role="alert"
            className="rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400"
          >
            {passwordResetError}
          </p>
        )}

        <Button
          type="submit"
          className="w-full"
          disabled={isPasswordResetPending}
        >
          {isPasswordResetPending ? "Resetting password..." : "Reset Password"}
        </Button>
      </form>

      <div className="mt-5 text-center">
        <button
          type="button"
          onClick={handleCancelPasswordReset}
          disabled={isPasswordResetPending}
          className="cursor-pointer rounded-sm text-sm font-medium text-gray-500 transition-colors hover:text-gray-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-400 dark:hover:text-gray-300 dark:focus-visible:outline-brand-400"
        >
          Cancel and return to Sign In
        </button>
      </div>
    </AuthFormContainer>
  );
}

export default CreateNewPasswordPage;
