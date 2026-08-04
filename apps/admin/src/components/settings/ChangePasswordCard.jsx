import { useState } from "react";

import { EyeCloseIcon, EyeIcon } from "../../icons/index.js";

import Label from "../form/Label.jsx";
import InputField from "../form/input/InputField.jsx";
import Button from "../ui/button/Button.jsx";

function PasswordField({
  id,
  label,
  placeholder,
  autoComplete,
  inputProps = {},
  errorMessage = "",
  helperText = "",
  isVisible = false,
  isDisabled = false,
  onToggleVisibility = () => {},
  className = "",
}) {
  return (
    <div className={className}>
      <Label htmlFor={id}>
        {label} <span className="text-error-500">*</span>
      </Label>

      <div className="relative">
        <InputField
          {...inputProps}
          id={id}
          type={isVisible ? "text" : "password"}
          placeholder={placeholder}
          autoComplete={autoComplete}
          className="pr-11"
          disabled={isDisabled}
          error={Boolean(errorMessage)}
          hint={errorMessage || helperText}
        />

        <button
          type="button"
          onClick={onToggleVisibility}
          disabled={isDisabled}
          className="absolute top-0 right-0 z-30 flex size-11 cursor-pointer items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:outline-brand-400"
        >
          {isVisible ? (
            <EyeIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
          ) : (
            <EyeCloseIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
          )}

          <span className="sr-only">
            {isVisible
              ? `Hide ${label.toLowerCase()}`
              : `Show ${label.toLowerCase()}`}
          </span>
        </button>
      </div>
    </div>
  );
}

function ChangePasswordCard({
  currentPasswordInputProps = {},
  newPasswordInputProps = {},
  confirmNewPasswordInputProps = {},
  currentPasswordError = "",
  newPasswordError = "",
  confirmNewPasswordError = "",
  submitError = "",
  successMessage = "",
  isSubmitting = false,
  onSubmit = () => {},
  onInteraction = () => {},
}) {
  const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] =
    useState(false);
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);
  const [isConfirmNewPasswordVisible, setIsConfirmNewPasswordVisible] =
    useState(false);

  return (
    <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-white/3">
      <div className="border-b border-gray-100 px-5 py-5 sm:px-6 dark:border-gray-800">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Account security
        </h2>

        <p className="mt-1 text-sm leading-6 text-gray-500 dark:text-gray-400">
          Change the password used to sign in to your administrator account.
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        onChangeCapture={onInteraction}
        noValidate
        className="px-5 py-6 sm:px-6"
      >
        <div className="max-w-xl space-y-5">
          <PasswordField
            id="settings-current-password"
            label="Current password"
            placeholder="Enter your current password"
            autoComplete="current-password"
            inputProps={currentPasswordInputProps}
            errorMessage={currentPasswordError}
            isVisible={isCurrentPasswordVisible}
            isDisabled={isSubmitting}
            onToggleVisibility={() =>
              setIsCurrentPasswordVisible((currentValue) => !currentValue)
            }
          />

          <PasswordField
            id="settings-new-password"
            label="New password"
            placeholder="Enter your new password"
            autoComplete="new-password"
            inputProps={newPasswordInputProps}
            errorMessage={newPasswordError}
            helperText="Use at least 6 characters."
            isVisible={isNewPasswordVisible}
            isDisabled={isSubmitting}
            onToggleVisibility={() =>
              setIsNewPasswordVisible((currentValue) => !currentValue)
            }
          />

          <PasswordField
            id="settings-confirm-new-password"
            label="Confirm new password"
            placeholder="Confirm your new password"
            autoComplete="new-password"
            inputProps={confirmNewPasswordInputProps}
            errorMessage={confirmNewPasswordError}
            isVisible={isConfirmNewPasswordVisible}
            isDisabled={isSubmitting}
            onToggleVisibility={() =>
              setIsConfirmNewPasswordVisible((currentValue) => !currentValue)
            }
          />
        </div>

        {successMessage && (
          <p
            role="status"
            className="mt-5 wrap-break-word whitespace-pre-wrap rounded-lg border border-success-200 bg-success-50 px-4 py-3 text-sm text-success-700 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400"
          >
            {successMessage}
          </p>
        )}

        {submitError && (
          <p
            role="alert"
            className="mt-5 wrap-break-word whitespace-pre-wrap rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400"
          >
            {submitError}
          </p>
        )}

        <div className="mt-6 flex border-t border-gray-100 pt-5 sm:justify-end dark:border-gray-800">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto sm:min-w-42"
          >
            {isSubmitting ? "Updating..." : "Update password"}
          </Button>
        </div>
      </form>
    </section>
  );
}

export default ChangePasswordCard;
