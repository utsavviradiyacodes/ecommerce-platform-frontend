import { useEffect, useId, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { z } from "zod";

import { EyeCloseIcon, EyeIcon } from "../../icons/index.js";

import Label from "../form/Label.jsx";
import Button from "../ui/button/Button.jsx";
import Modal from "../ui/modal/Modal.jsx";

const PERMISSION_FIELDS = [
  { key: "manageProducts", label: "Manage Products" },
  { key: "manageSellers", label: "Manage Sellers" },
  { key: "manageOrders", label: "Manage Orders and Returns" },
  { key: "manageCustomers", label: "Manage Customers" },
];

const createAdminSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required."),
    email: z
      .string()
      .trim()
      .min(1, "Email is required.")
      .email("Enter a valid email address."),
    phone: z.string().trim().min(1, "Phone is required."),
    password: z.string().min(6, "Password must be at least 6 characters."),
    confirmPassword: z.string().min(1, "Confirm password is required."),
    isSuperAdmin: z.boolean(),
    manageProducts: z.boolean(),
    manageSellers: z.boolean(),
    manageOrders: z.boolean(),
    manageCustomers: z.boolean(),
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });

const editAdminSchema = z.object({
  name: z.string().trim().min(1, "Name is required."),
  phone: z.string(),
  isSuperAdmin: z.boolean(),
});

const INPUT_BASE_CLASSES =
  "h-11 w-full rounded-lg border bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs outline-none transition placeholder:text-gray-400 focus:ring-3 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:disabled:bg-gray-800";

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getAdminId(admin) {
  return normalizeText(admin?._id ?? admin?.id);
}

function getDefaultValues(mode, admin) {
  if (mode === "edit") {
    return {
      name: normalizeText(admin?.name),
      phone: normalizeText(admin?.phone),
      isSuperAdmin: admin?.isSuperAdmin === true,
    };
  }

  return {
    name: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: "",
    isSuperAdmin: false,
    manageProducts: true,
    manageSellers: true,
    manageOrders: true,
    manageCustomers: true,
  };
}

function fieldClasses(hasError) {
  return `${INPUT_BASE_CLASSES} ${
    hasError
      ? "border-error-500 focus:border-error-500 focus:ring-error-500/30 dark:border-error-500"
      : "border-gray-300 focus:border-brand-400 focus:ring-brand-500/30 dark:border-gray-700 dark:focus:border-brand-400 dark:focus:ring-brand-400/30"
  }`;
}

function FieldError({ id, error }) {
  return error ? (
    <p id={id} className="mt-1.5 text-xs text-error-600 dark:text-error-400">
      {error.message}
    </p>
  ) : null;
}

function AdminFormModal({
  isOpen,
  mode = "create",
  admin = null,
  isCurrentAdmin = false,
  error = "",
  isSubmitting = false,
  onClose = () => {},
  onConfirm = () => false,
}) {
  const modalId = useId();
  const titleId = `${modalId}-title`;
  const descriptionId = `${modalId}-description`;
  const isEditMode = mode === "edit";
  const adminId = getAdminId(admin);
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isConfirmPasswordVisible, setIsConfirmPasswordVisible] =
    useState(false);
  const {
    register,
    handleSubmit,
    reset,
    control,
    setError,
    clearErrors,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(isEditMode ? editAdminSchema : createAdminSchema),
    defaultValues: getDefaultValues(mode, admin),
  });
  const isSuperAdmin = useWatch({ control, name: "isSuperAdmin" });

  useEffect(() => {
    reset(getDefaultValues(mode, admin));
  }, [admin, adminId, isOpen, mode, reset]);

  function handleClose() {
    if (isSubmitting) {
      return;
    }

    reset(getDefaultValues(mode, admin));
    onClose();
  }

  async function handleValidSubmit(values) {
    if (isSubmitting) {
      return;
    }

    clearErrors("root");

    if (isEditMode) {
      const initialName = normalizeText(admin?.name);
      const initialPhone = normalizeText(admin?.phone);
      const nextName = values.name.trim();
      const nextPhone = values.phone.trim();
      const changes = {};

      if (!nextPhone && initialPhone) {
        setError("phone", {
          type: "manual",
          message:
            "The backend does not support clearing an Admin phone number.",
        });
        return;
      }

      if (nextName !== initialName) {
        changes.name = nextName;
      }

      if (nextPhone && nextPhone !== initialPhone) {
        changes.phone = nextPhone;
      }

      if (values.isSuperAdmin !== (admin?.isSuperAdmin === true)) {
        changes.isSuperAdmin = values.isSuperAdmin;
      }

      if (Object.keys(changes).length === 0) {
        setError("root", {
          type: "manual",
          message: "Change at least one supported Admin field before saving.",
        });
        return;
      }

      const didSucceed = await onConfirm(changes);

      if (didSucceed) {
        reset(getDefaultValues(mode, admin));
      }
      return;
    }

    const permissions = PERMISSION_FIELDS.reduce((result, permission) => {
      result[permission.key] = values[permission.key] === true;
      return result;
    }, {});
    const didSucceed = await onConfirm({
      name: values.name.trim(),
      email: values.email.trim().toLowerCase(),
      phone: values.phone.trim(),
      password: values.password,
      confirmPassword: values.confirmPassword,
      isSuperAdmin: values.isSuperAdmin,
      permissions,
    });

    if (didSucceed) {
      reset(getDefaultValues(mode, admin));
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="max-h-[92vh] max-w-3xl overflow-hidden"
      showCloseButton={!isSubmitting}
      ariaLabelledBy={titleId}
      ariaDescribedBy={descriptionId}
    >
      <form
        onSubmit={handleSubmit(handleValidSubmit)}
        noValidate
        className="flex max-h-[92vh] min-w-0 flex-col"
      >
        <div className="shrink-0 border-b border-gray-100 px-5 pt-7 pb-5 pr-16 sm:px-8 sm:pt-8 sm:pr-20 dark:border-gray-800">
          <h3
            id={titleId}
            className="text-xl font-semibold text-gray-800 dark:text-white/90"
          >
            {isEditMode ? "Edit Admin" : "Add Admin"}
          </h3>
          <p
            id={descriptionId}
            className="mt-1.5 text-sm leading-6 text-gray-500 dark:text-gray-400"
          >
            {isEditMode
              ? `Update supported fields for ${normalizeText(admin?.email) || "this Admin"}. Email and password cannot be changed here.`
              : "Create an Admin account. The backend sends the new Admin an email verification code."}
          </p>
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8 sm:py-6">
          {(error || errors.root?.message) && (
            <div
              role="alert"
              className="mb-5 wrap-break-word whitespace-pre-wrap rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400"
            >
              {error || errors.root.message}
            </div>
          )}

          {isCurrentAdmin && isEditMode && (
            <div className="mb-5 rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-sm leading-6 text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-400">
              You are editing your own account. Removing Super Admin access will
              remove access to this page after the backend result is
              synchronized.
            </div>
          )}

          <div className="grid min-w-0 grid-cols-1 gap-5 sm:grid-cols-2">
            <div>
              <Label htmlFor="admin-form-name">
                Name <span className="text-error-500">*</span>
              </Label>
              <input
                {...register("name")}
                id="admin-form-name"
                type="text"
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.name) || undefined}
                aria-describedby={
                  errors.name ? "admin-form-name-error" : undefined
                }
                className={fieldClasses(Boolean(errors.name))}
              />
              <FieldError id="admin-form-name-error" error={errors.name} />
            </div>

            <div>
              <Label htmlFor="admin-form-phone">
                Phone {!isEditMode && <span className="text-error-500">*</span>}
              </Label>
              <input
                {...register("phone")}
                id="admin-form-phone"
                type="tel"
                disabled={isSubmitting}
                aria-invalid={Boolean(errors.phone) || undefined}
                aria-describedby={
                  errors.phone ? "admin-form-phone-error" : undefined
                }
                className={fieldClasses(Boolean(errors.phone))}
              />
              <FieldError id="admin-form-phone-error" error={errors.phone} />
            </div>

            {!isEditMode && (
              <>
                <div className="sm:col-span-2">
                  <Label htmlFor="admin-form-email">
                    Email <span className="text-error-500">*</span>
                  </Label>
                  <input
                    {...register("email")}
                    id="admin-form-email"
                    type="email"
                    autoComplete="off"
                    disabled={isSubmitting}
                    aria-invalid={Boolean(errors.email) || undefined}
                    aria-describedby={
                      errors.email ? "admin-form-email-error" : undefined
                    }
                    className={fieldClasses(Boolean(errors.email))}
                  />
                  <FieldError
                    id="admin-form-email-error"
                    error={errors.email}
                  />
                </div>

                <div>
                  <Label htmlFor="admin-form-password">
                    Initial password <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <input
                      {...register("password")}
                      id="admin-form-password"
                      type={isPasswordVisible ? "text" : "password"}
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      aria-invalid={Boolean(errors.password) || undefined}
                      aria-describedby={
                        errors.password
                          ? "admin-form-password-error"
                          : undefined
                      }
                      className={`${fieldClasses(Boolean(errors.password))} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setIsPasswordVisible((currentValue) => !currentValue)
                      }
                      disabled={isSubmitting}
                      className="absolute top-0 right-0 z-30 flex size-11 cursor-pointer items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:outline-brand-400"
                    >
                      {isPasswordVisible ? (
                        <EyeIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
                      ) : (
                        <EyeCloseIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
                      )}
                      <span className="sr-only">
                        {isPasswordVisible
                          ? "Hide initial password"
                          : "Show initial password"}
                      </span>
                    </button>
                  </div>
                  <FieldError
                    id="admin-form-password-error"
                    error={errors.password}
                  />
                </div>

                <div>
                  <Label htmlFor="admin-form-confirm-password">
                    Confirm password <span className="text-error-500">*</span>
                  </Label>
                  <div className="relative">
                    <input
                      {...register("confirmPassword")}
                      id="admin-form-confirm-password"
                      type={isConfirmPasswordVisible ? "text" : "password"}
                      autoComplete="new-password"
                      disabled={isSubmitting}
                      aria-invalid={
                        Boolean(errors.confirmPassword) || undefined
                      }
                      aria-describedby={
                        errors.confirmPassword
                          ? "admin-form-confirm-password-error"
                          : undefined
                      }
                      className={`${fieldClasses(Boolean(errors.confirmPassword))} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setIsConfirmPasswordVisible(
                          (currentValue) => !currentValue
                        )
                      }
                      disabled={isSubmitting}
                      className="absolute top-0 right-0 z-30 flex size-11 cursor-pointer items-center justify-center rounded-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:focus-visible:outline-brand-400"
                    >
                      {isConfirmPasswordVisible ? (
                        <EyeIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
                      ) : (
                        <EyeCloseIcon className="size-5 fill-gray-500 dark:fill-gray-400" />
                      )}
                      <span className="sr-only">
                        {isConfirmPasswordVisible
                          ? "Hide confirmed password"
                          : "Show confirmed password"}
                      </span>
                    </button>
                  </div>
                  <FieldError
                    id="admin-form-confirm-password-error"
                    error={errors.confirmPassword}
                  />
                </div>
              </>
            )}
          </div>

          <div className="mt-5 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
            <label
              htmlFor="admin-form-superadmin"
              className="flex cursor-pointer items-start gap-3"
            >
              <input
                {...register("isSuperAdmin")}
                id="admin-form-superadmin"
                type="checkbox"
                disabled={isSubmitting}
                className="mt-0.5 size-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900"
              />
              <span className="min-w-0">
                <span className="block text-sm font-medium text-gray-800 dark:text-white/90">
                  Super Admin access
                </span>
                <span className="mt-1 block text-xs leading-5 text-gray-500 dark:text-gray-400">
                  Super Admins bypass granular frontend permission checks and
                  can manage other Admin accounts.
                </span>
              </span>
            </label>
          </div>

          {!isEditMode && (
            <fieldset className="mt-5 min-w-0">
              <legend className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Initial permissions
              </legend>
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                {isSuperAdmin
                  ? "The backend forces full permissions for Super Admin accounts."
                  : "Choose the dashboard modules this regular Admin can access."}
              </p>
              <div className="mt-3 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
                {PERMISSION_FIELDS.map((permission) => (
                  <label
                    key={permission.key}
                    htmlFor={`admin-create-${permission.key}`}
                    className={`flex min-w-0 items-center gap-3 rounded-xl border border-gray-200 p-3 dark:border-gray-800 ${isSuperAdmin ? "cursor-not-allowed opacity-60" : "cursor-pointer"}`}
                  >
                    <input
                      {...register(permission.key)}
                      id={`admin-create-${permission.key}`}
                      type="checkbox"
                      disabled={isSubmitting || isSuperAdmin}
                      className="size-4 rounded border-gray-300 text-brand-500 focus:ring-brand-500 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-900"
                    />
                    <span className="min-w-0 wrap-break-word text-sm text-gray-700 dark:text-gray-300">
                      {permission.label}
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
          )}
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-8 sm:py-5 dark:border-gray-800">
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
            disabled={isSubmitting || (isEditMode && !isDirty)}
            className="w-full sm:w-48"
          >
            {isSubmitting
              ? isEditMode
                ? "Saving changes..."
                : "Creating Admin..."
              : isEditMode
                ? "Save changes"
                : "Create Admin"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default AdminFormModal;
