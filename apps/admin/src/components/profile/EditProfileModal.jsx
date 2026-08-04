import { useEffect, useId, useRef, useState } from "react";
import { useWatch } from "react-hook-form";

import { PROFILE_AVATAR_ACCEPT } from "../../schemas/profile/profileSchema.js";

import Button from "../ui/button/Button.jsx";
import FileInput from "../form/input/FileInput.jsx";
import InputField from "../form/input/InputField.jsx";
import Label from "../form/Label.jsx";
import Modal from "../ui/modal/Modal.jsx";

function AvatarPreview({ avatarUrl, adminName, adminInitial }) {
  const [hasAvatarError, setHasAvatarError] = useState(false);

  return (
    <div className="flex size-24 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-brand-500 text-3xl font-semibold text-white dark:border-gray-800">
      {avatarUrl && !hasAvatarError ? (
        <img
          src={avatarUrl}
          alt={`${adminName} profile preview`}
          onError={() => setHasAvatarError(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        adminInitial
      )}
    </div>
  );
}

function EditProfileModal({
  isOpen,
  admin = null,
  onClose = () => {},
  onSubmit = () => {},
  onRequestRemoveAvatar = () => {},
  onClearSelectedAvatar = () => {},
  nameInputProps = {},
  phoneInputProps = {},
  avatarInputProps = {},
  control,
  nameError = "",
  phoneError = "",
  avatarError = "",
  submitError = "",
  isSubmitting = false,
  isSubmitDisabled = false,
}) {
  const [selectedPreviewUrl, setSelectedPreviewUrl] = useState("");
  const [hasReplacementAvatar, setHasReplacementAvatar] = useState(false);

  const objectUrlRef = useRef("");
  const avatarInputElementRef = useRef(null);
  const submitErrorRef = useRef(null);

  const modalId = useId();
  const modalTitleId = `${modalId}-title`;
  const modalDescriptionId = `${modalId}-description`;

  const originalName = typeof admin?.name === "string" ? admin.name.trim() : "";

  const originalPhone =
    typeof admin?.phone === "string" ? admin.phone.trim() : "";

  const adminEmail = typeof admin?.email === "string" ? admin.email.trim() : "";

  const currentAvatarUrl =
    typeof admin?.avatar === "string" ? admin.avatar.trim() : "";

  const [currentName = "", currentPhone = ""] = useWatch({
    control,
    name: ["name", "phone"],
  });

  const normalizedCurrentName =
    typeof currentName === "string" ? currentName.trim() : "";

  const normalizedCurrentPhone =
    typeof currentPhone === "string" ? currentPhone.trim() : "";

  const displayedAdminName =
    normalizedCurrentName || originalName || "Administrator";

  const adminInitial = displayedAdminName.charAt(0).toUpperCase();

  const displayedAvatarUrl = selectedPreviewUrl || currentAvatarUrl;

  const hasProfileFieldChanges =
    normalizedCurrentName !== originalName ||
    normalizedCurrentPhone !== originalPhone;

  const hasMeaningfulChanges = hasProfileFieldChanges || hasReplacementAvatar;

  const isUnsupportedPhoneRemoval =
    Boolean(originalPhone) && !normalizedCurrentPhone;

  const displayedPhoneError =
    phoneError ||
    (isUnsupportedPhoneRemoval
      ? "Enter a replacement phone number. The current number cannot be removed."
      : "");

  const canRequestAvatarRemoval =
    Boolean(currentAvatarUrl) &&
    !hasReplacementAvatar &&
    !hasProfileFieldChanges &&
    !isSubmitting;

  const {
    onChange: forwardedAvatarChange,
    ref: forwardedAvatarRef,
    ...remainingAvatarInputProps
  } = avatarInputProps;

  function assignAvatarInputRef(element) {
    avatarInputElementRef.current = element;
    forwardedAvatarRef?.(element);
  }

  function clearSelectedPreview() {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = "";
    }

    if (avatarInputElementRef.current) {
      avatarInputElementRef.current.value = "";
    }

    setSelectedPreviewUrl("");
    setHasReplacementAvatar(false);
  }

  function handleAvatarChange(event) {
    const selectedFile = event.target.files?.[0] ?? null;

    setHasReplacementAvatar(Boolean(selectedFile));

    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = "";
    }

    if (selectedFile && selectedFile.type.startsWith("image/")) {
      const nextPreviewUrl = URL.createObjectURL(selectedFile);

      objectUrlRef.current = nextPreviewUrl;
      setSelectedPreviewUrl(nextPreviewUrl);
    } else {
      setSelectedPreviewUrl("");
    }

    forwardedAvatarChange?.(event);
  }

  function handleClearSelectedAvatar() {
    if (isSubmitting || !hasReplacementAvatar) {
      return;
    }

    clearSelectedPreview();
    onClearSelectedAvatar();
  }

  function handleClose() {
    if (isSubmitting) {
      return;
    }

    clearSelectedPreview();
    onClose();
  }

  function handleRequestRemoveAvatar() {
    if (!canRequestAvatarRemoval) {
      return;
    }

    onRequestRemoveAvatar();
  }

  useEffect(() => {
    return () => {
      if (objectUrlRef.current) {
        URL.revokeObjectURL(objectUrlRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!submitError) {
      return undefined;
    }

    const errorFrameId = window.requestAnimationFrame(() => {
      submitErrorRef.current?.scrollIntoView({
        block: "nearest",
      });
    });

    return () => {
      window.cancelAnimationFrame(errorFrameId);
    };
  }, [submitError]);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="max-w-190"
      ariaLabelledBy={modalTitleId}
      ariaDescribedBy={modalDescriptionId}
    >
      <form
        onSubmit={onSubmit}
        noValidate
        className="flex max-h-[calc(100dvh-1.5rem)] flex-col overflow-hidden rounded-3xl sm:max-h-[calc(100dvh-3rem)]"
      >
        <div className="shrink-0 px-5 pt-6 pr-14 pb-4 sm:px-8 sm:pt-8 sm:pr-20 sm:pb-5">
          <h3
            id={modalTitleId}
            className="text-xl font-semibold text-gray-800 dark:text-white/90"
          >
            Edit profile
          </h3>

          <p
            id={modalDescriptionId}
            className="mt-1.5 max-w-xl text-sm text-gray-500 dark:text-gray-400"
          >
            Update your name, phone number, or profile photo. Your email address
            and account access cannot be changed here.
          </p>
        </div>

        <div className="min-h-0 overflow-x-hidden overflow-y-auto overscroll-contain border-y border-gray-100 px-5 py-5 sm:px-8 dark:border-gray-800">
          {submitError && (
            <div
              ref={submitErrorRef}
              role="alert"
              className="mb-5 min-w-0 wrap-break-word whitespace-pre-wrap rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400"
            >
              {submitError}
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
            <div>
              <p className="mb-2 text-sm font-medium text-gray-700 dark:text-gray-400">
                Profile photo
              </p>

              <div className="flex flex-col items-center rounded-2xl border border-gray-200 bg-gray-50 p-5 text-center dark:border-gray-800 dark:bg-white/2">
                <AvatarPreview
                  key={displayedAvatarUrl || adminInitial}
                  avatarUrl={displayedAvatarUrl}
                  adminName={displayedAdminName}
                  adminInitial={adminInitial}
                />

                <p className="mt-3 max-w-full wrap-break-word text-sm font-medium text-gray-800 dark:text-white/90">
                  {displayedAdminName}
                </p>

                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Use a clear square image where possible.
                </p>

                {currentAvatarUrl && (
                  <div className="mt-4 border-t border-gray-200 pt-4 dark:border-gray-800">
                    <button
                      type="button"
                      onClick={handleRequestRemoveAvatar}
                      disabled={!canRequestAvatarRemoval}
                      className="text-sm font-medium text-error-600 transition hover:text-error-700 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-error-400 dark:hover:text-error-300"
                    >
                      Remove current photo
                    </button>

                    {(hasReplacementAvatar || hasProfileFieldChanges) && (
                      <p className="mt-2 text-xs leading-5 text-gray-500 dark:text-gray-400">
                        Save or cancel your other changes before removing the
                        current photo.
                      </p>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div className="min-w-0">
              <div>
                <Label htmlFor="profile-name">
                  Full name
                  <span className="text-error-500"> *</span>
                </Label>

                <InputField
                  {...nameInputProps}
                  id="profile-name"
                  type="text"
                  placeholder="Enter your full name"
                  autoComplete="name"
                  error={Boolean(nameError)}
                  hint={nameError}
                  disabled={isSubmitting}
                />
              </div>

              <div className="mt-5">
                <Label htmlFor="profile-email">Email address</Label>

                <InputField
                  id="profile-email"
                  type="email"
                  value={adminEmail}
                  disabled
                  hint="Email address cannot be changed."
                />
              </div>

              <div className="mt-5">
                <Label htmlFor="profile-phone">Phone number</Label>

                <InputField
                  {...phoneInputProps}
                  id="profile-phone"
                  type="tel"
                  placeholder="Enter your phone number"
                  autoComplete="tel"
                  error={Boolean(displayedPhoneError)}
                  hint={
                    displayedPhoneError ||
                    "Use 7 to 15 digits. Spaces, +, -, and parentheses are allowed."
                  }
                  disabled={isSubmitting}
                />
              </div>

              <div className="mt-5">
                <Label htmlFor="profile-avatar">Profile photo</Label>

                <FileInput
                  {...remainingAvatarInputProps}
                  ref={assignAvatarInputRef}
                  id="profile-avatar"
                  accept={PROFILE_AVATAR_ACCEPT}
                  onChange={handleAvatarChange}
                  error={Boolean(avatarError)}
                  hint={
                    avatarError ||
                    "Choose a JPG, PNG, or WebP image up to 5 MB."
                  }
                  disabled={isSubmitting}
                />

                {hasReplacementAvatar && (
                  <button
                    type="button"
                    onClick={handleClearSelectedAvatar}
                    disabled={isSubmitting}
                    className="mt-3 text-sm font-medium text-brand-500 transition hover:text-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:text-brand-400 dark:hover:text-brand-300"
                  >
                    Clear selected photo
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-3 px-5 py-4 sm:flex-row sm:justify-end sm:px-8 sm:py-5">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={
              isSubmitting ||
              isSubmitDisabled ||
              !hasMeaningfulChanges ||
              isUnsupportedPhoneRemoval
            }
            className="w-full sm:w-auto"
          >
            {isSubmitting ? "Saving..." : "Save changes"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default EditProfileModal;
