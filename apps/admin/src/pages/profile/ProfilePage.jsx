import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";
import { zodResolver } from "@hookform/resolvers/zod";

import AccountAccessCard from "../../components/profile/AccountAccessCard.jsx";
import EditProfileModal from "../../components/profile/EditProfileModal.jsx";
import PersonalInformationCard from "../../components/profile/PersonalInformationCard.jsx";
import ProfileSummaryCard from "../../components/profile/ProfileSummaryCard.jsx";
import RemoveAvatarModal from "../../components/profile/RemoveAvatarModal.jsx";
import PageBreadcrumb from "../../components/common/PageBreadcrumb.jsx";

import { selectCurrentAdmin } from "../../features/auth/authSlice.js";

import {
  clearProfileAvatarDeleteRequestFeedback,
  clearProfileFetchRequestFeedback,
  clearProfileUpdateRequestFeedback,
  deleteAdminAvatarThunk,
  fetchAdminProfileThunk,
  resetProfileState,
  selectIsProfileAvatarDeletePending,
  selectIsProfileFetchPending,
  selectIsProfileMutationPending,
  selectIsProfileUpdatePending,
  selectProfileAvatarDeleteError,
  selectProfileAvatarDeleteSuccessMessage,
  selectProfileFetchError,
  selectProfileUpdateError,
  selectProfileUpdateSuccessMessage,
  updateAdminProfileThunk,
} from "../../features/profile/profileSlice.js";

import { profileSchema } from "../../schemas/profile/profileSchema.js";

const RETRY_BUTTON_CLASSES =
  "inline-flex shrink-0 items-center justify-center rounded-lg border bg-white px-3 py-2 text-sm font-medium shadow-theme-xs transition focus-visible:outline-2 focus-visible:outline-offset-2 dark:bg-transparent";

const EMPTY_PROFILE_FORM_VALUES = {
  name: "",
  phone: "",
  avatar: null,
};

function normalizeProfileText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getProfileFormValues(admin) {
  return {
    name: normalizeProfileText(admin?.name),
    phone: normalizeProfileText(admin?.phone),
    avatar: null,
  };
}

function buildProfileUpdateFormData(profileData, admin) {
  const nextName = normalizeProfileText(profileData.name);
  const nextPhone = normalizeProfileText(profileData.phone);

  const originalName = normalizeProfileText(admin?.name);
  const originalPhone = normalizeProfileText(admin?.phone);

  const formData = new FormData();
  let hasChanges = false;

  if (nextName !== originalName) {
    formData.append("name", nextName);
    hasChanges = true;
  }

  if (nextPhone !== originalPhone) {
    formData.append("phone", nextPhone);
    hasChanges = true;
  }

  if (profileData.avatar instanceof File) {
    formData.append("avatar", profileData.avatar);
    hasChanges = true;
  }

  return hasChanges ? formData : null;
}

function ProfilePage() {
  const dispatch = useDispatch();

  const admin = useSelector(selectCurrentAdmin);

  const isFetchPending = useSelector(selectIsProfileFetchPending);
  const fetchError = useSelector(selectProfileFetchError);

  const isUpdatePending = useSelector(selectIsProfileUpdatePending);
  const updateError = useSelector(selectProfileUpdateError);
  const updateSuccessMessage = useSelector(selectProfileUpdateSuccessMessage);

  const isAvatarDeletePending = useSelector(selectIsProfileAvatarDeletePending);
  const avatarDeleteError = useSelector(selectProfileAvatarDeleteError);
  const avatarDeleteSuccessMessage = useSelector(
    selectProfileAvatarDeleteSuccessMessage
  );

  const isMutationPending = useSelector(selectIsProfileMutationPending);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRemoveAvatarModalOpen, setIsRemoveAvatarModalOpen] = useState(false);

  const {
    control,
    register,
    handleSubmit,
    reset,
    resetField,
    setError,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues: EMPTY_PROFILE_FORM_VALUES,
  });

  const mutationSuccessMessage =
    avatarDeleteSuccessMessage || updateSuccessMessage;

  const hasCachedAdmin = Boolean(admin);

  useEffect(() => {
    const fetchPromise = dispatch(fetchAdminProfileThunk());

    return () => {
      fetchPromise.abort();
      dispatch(resetProfileState());
    };
  }, [dispatch]);

  function clearProfileMutationFeedback() {
    dispatch(clearProfileUpdateRequestFeedback());
    dispatch(clearProfileAvatarDeleteRequestFeedback());
  }

  function handleRetryProfileFetch() {
    if (isFetchPending) {
      return;
    }

    dispatch(clearProfileFetchRequestFeedback());
    dispatch(fetchAdminProfileThunk());
  }

  function handleDismissMutationSuccess() {
    clearProfileMutationFeedback();
  }

  function handleOpenEditModal() {
    if (!admin || isFetchPending || isMutationPending) {
      return;
    }

    clearProfileMutationFeedback();
    reset(getProfileFormValues(admin));
    setIsEditModalOpen(true);
  }

  function handleCloseEditModal() {
    if (isUpdatePending) {
      return;
    }

    dispatch(clearProfileUpdateRequestFeedback());
    setIsEditModalOpen(false);
    reset(EMPTY_PROFILE_FORM_VALUES);
  }

  function handleClearSelectedAvatar() {
    resetField("avatar", {
      defaultValue: null,
    });
  }

  async function handleValidProfileSubmit(profileData) {
    if (!admin || isFetchPending || isMutationPending) {
      return;
    }

    const originalPhone = normalizeProfileText(admin.phone);
    const nextPhone = normalizeProfileText(profileData.phone);

    if (originalPhone && !nextPhone) {
      setError("phone", {
        type: "manual",
        message:
          "Enter a replacement phone number. The current number cannot be removed.",
      });
      return;
    }

    const formData = buildProfileUpdateFormData(profileData, admin);

    if (!formData) {
      reset(getProfileFormValues(admin));
      return;
    }

    const resultAction = await dispatch(updateAdminProfileThunk(formData));

    if (!updateAdminProfileThunk.fulfilled.match(resultAction)) {
      return;
    }

    setIsEditModalOpen(false);
    reset(EMPTY_PROFILE_FORM_VALUES);
  }

  function handleRequestRemoveAvatar() {
    if (!admin?.avatar || isFetchPending || isMutationPending) {
      return;
    }

    clearProfileMutationFeedback();

    setIsEditModalOpen(false);
    reset(EMPTY_PROFILE_FORM_VALUES);

    setIsRemoveAvatarModalOpen(true);
  }

  function handleCloseRemoveAvatarModal() {
    if (isAvatarDeletePending) {
      return;
    }

    dispatch(clearProfileAvatarDeleteRequestFeedback());
    setIsRemoveAvatarModalOpen(false);
  }

  async function handleConfirmRemoveAvatar() {
    if (!admin?.avatar || isFetchPending || isMutationPending) {
      return;
    }

    const resultAction = await dispatch(deleteAdminAvatarThunk());

    if (!deleteAdminAvatarThunk.fulfilled.match(resultAction)) {
      return;
    }

    setIsRemoveAvatarModalOpen(false);
  }

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden">
      <PageBreadcrumb
        pageTitle="Profile"
        description="View and maintain your administrator identity and account access."
      />

      {mutationSuccessMessage && (
        <div
          role="status"
          className="mb-6 flex flex-col gap-3 rounded-xl border border-success-200 bg-success-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-success-500/30 dark:bg-success-500/10"
        >
          <p className="min-w-0 flex-1 wrap-break-word whitespace-pre-wrap text-sm text-success-700 dark:text-success-400">
            {mutationSuccessMessage}
          </p>

          <button
            type="button"
            onClick={handleDismissMutationSuccess}
            className={`${RETRY_BUTTON_CLASSES} border-success-300 text-success-700 hover:bg-success-100 focus-visible:outline-success-500 dark:border-success-500/40 dark:text-success-400 dark:hover:bg-success-500/10`}
          >
            Dismiss
          </button>
        </div>
      )}

      {fetchError && hasCachedAdmin && (
        <div
          role="status"
          className="mb-6 flex flex-col gap-3 rounded-xl border border-warning-200 bg-warning-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-warning-500/30 dark:bg-warning-500/10"
        >
          <div className="min-w-0 flex-1 wrap-break-word whitespace-pre-wrap text-sm text-warning-700 dark:text-warning-400">
            <p>
              Your Profile could not be refreshed. Displaying the administrator
              information from your current session.
            </p>

            <p className="mt-1 text-xs">{fetchError}</p>
          </div>

          <button
            type="button"
            onClick={handleRetryProfileFetch}
            disabled={isFetchPending}
            className={`${RETRY_BUTTON_CLASSES} border-warning-300 text-warning-700 hover:bg-warning-100 focus-visible:outline-warning-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-warning-500/40 dark:text-warning-400 dark:hover:bg-warning-500/10`}
          >
            {isFetchPending ? "Trying..." : "Try again"}
          </button>
        </div>
      )}

      {fetchError && !hasCachedAdmin && (
        <div
          role="alert"
          className="mb-6 flex flex-col gap-3 rounded-xl border border-error-200 bg-error-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-error-500/30 dark:bg-error-500/10"
        >
          <p className="min-w-0 flex-1 wrap-break-word whitespace-pre-wrap text-sm text-error-700 dark:text-error-400">
            {fetchError}
          </p>

          <button
            type="button"
            onClick={handleRetryProfileFetch}
            disabled={isFetchPending}
            className={`${RETRY_BUTTON_CLASSES} border-error-300 text-error-700 hover:bg-error-100 focus-visible:outline-error-500 disabled:cursor-not-allowed disabled:opacity-60 dark:border-error-500/40 dark:text-error-400 dark:hover:bg-error-500/10`}
          >
            {isFetchPending ? "Trying..." : "Try again"}
          </button>
        </div>
      )}

      <div className="space-y-6">
        <ProfileSummaryCard
          admin={admin}
          isRefreshing={isFetchPending && hasCachedAdmin}
          isEditDisabled={isFetchPending || isMutationPending || !admin}
          onEdit={handleOpenEditModal}
        />

        <PersonalInformationCard admin={admin} />

        <AccountAccessCard admin={admin} />
      </div>

      {isEditModalOpen && (
        <EditProfileModal
          isOpen
          admin={admin}
          onClose={handleCloseEditModal}
          onSubmit={handleSubmit(handleValidProfileSubmit)}
          onRequestRemoveAvatar={handleRequestRemoveAvatar}
          onClearSelectedAvatar={handleClearSelectedAvatar}
          nameInputProps={register("name")}
          phoneInputProps={register("phone")}
          avatarInputProps={register("avatar")}
          control={control}
          nameError={errors.name?.message ?? ""}
          phoneError={errors.phone?.message ?? ""}
          avatarError={errors.avatar?.message ?? ""}
          submitError={updateError ?? ""}
          isSubmitting={isUpdatePending}
          isSubmitDisabled={isFetchPending || isAvatarDeletePending}
        />
      )}

      {isRemoveAvatarModalOpen && (
        <RemoveAvatarModal
          isOpen
          adminName={admin?.name ?? ""}
          error={avatarDeleteError ?? ""}
          isDeleting={isAvatarDeletePending}
          onClose={handleCloseRemoveAvatarModal}
          onConfirm={handleConfirmRemoveAvatar}
        />
      )}
    </div>
  );
}

export default ProfilePage;
