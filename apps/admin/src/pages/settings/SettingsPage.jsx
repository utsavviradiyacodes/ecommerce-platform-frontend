import { useEffect, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { useDispatch, useSelector } from "react-redux";

import PageBreadcrumb from "../../components/common/PageBreadcrumb.jsx";
import ChangePasswordCard from "../../components/settings/ChangePasswordCard.jsx";

import {
  changeAdminPasswordSucceeded,
  changeAdminPasswordThunk,
  clearSettingsChangePasswordRequestFeedback,
  selectIsSettingsChangePasswordPending,
  selectSettingsChangePasswordError,
  selectSettingsChangePasswordSuccessMessage,
} from "../../features/settings/settingsSlice.js";

import { changePasswordSchema } from "../../schemas/settings/settingsSchema.js";

const EMPTY_CHANGE_PASSWORD_FORM_VALUES = {
  currentPassword: "",
  newPassword: "",
  confirmNewPassword: "",
};

function SettingsPage() {
  const dispatch = useDispatch();

  const isChangePasswordPending = useSelector(
    selectIsSettingsChangePasswordPending
  );
  const changePasswordError = useSelector(selectSettingsChangePasswordError);
  const changePasswordSuccessMessage = useSelector(
    selectSettingsChangePasswordSuccessMessage
  );

  const [passwordCardVersion, setPasswordCardVersion] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: EMPTY_CHANGE_PASSWORD_FORM_VALUES,
  });

  useEffect(() => {
    dispatch(clearSettingsChangePasswordRequestFeedback());
  }, [dispatch]);

  function handleClearChangePasswordFeedback() {
    if (!changePasswordError && !changePasswordSuccessMessage) {
      return;
    }

    dispatch(clearSettingsChangePasswordRequestFeedback());
  }

  async function handleValidPasswordChange(passwordData) {
    if (isChangePasswordPending) {
      return;
    }

    dispatch(clearSettingsChangePasswordRequestFeedback());

    const resultAction = await dispatch(changeAdminPasswordThunk(passwordData));

    if (!changeAdminPasswordSucceeded.match(resultAction)) {
      return;
    }

    reset(EMPTY_CHANGE_PASSWORD_FORM_VALUES);
    setPasswordCardVersion((currentVersion) => currentVersion + 1);
  }

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden">
      <PageBreadcrumb
        pageTitle="Settings"
        description="Manage the security of your administrator account."
      />

      <div className="w-full">
        <ChangePasswordCard
          key={passwordCardVersion}
          currentPasswordInputProps={register("currentPassword")}
          newPasswordInputProps={register("newPassword")}
          confirmNewPasswordInputProps={register("confirmNewPassword")}
          currentPasswordError={errors.currentPassword?.message ?? ""}
          newPasswordError={errors.newPassword?.message ?? ""}
          confirmNewPasswordError={errors.confirmNewPassword?.message ?? ""}
          submitError={changePasswordError ?? ""}
          successMessage={changePasswordSuccessMessage ?? ""}
          isSubmitting={isChangePasswordPending}
          onSubmit={handleSubmit(handleValidPasswordChange)}
          onInteraction={handleClearChangePasswordFeedback}
        />
      </div>
    </div>
  );
}

export default SettingsPage;
