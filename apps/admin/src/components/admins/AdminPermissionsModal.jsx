import { useEffect, useId } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import Button from "../ui/button/Button.jsx";
import Modal from "../ui/modal/Modal.jsx";

const PERMISSION_FIELDS = [
  { key: "manageProducts", label: "Manage Products", description: "Catalog categories, subcategories, and Products." },
  { key: "manageSellers", label: "Manage Sellers", description: "Seller review and account-management access." },
  { key: "manageOrders", label: "Manage Orders and Returns", description: "Order and Return request management access." },
  { key: "manageCustomers", label: "Manage Customers", description: "Customer account-management access." },
];

const permissionsSchema = z.object({
  manageProducts: z.boolean(),
  manageSellers: z.boolean(),
  manageOrders: z.boolean(),
  manageCustomers: z.boolean(),
});

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getAdminId(admin) {
  return normalizeText(admin?._id ?? admin?.id);
}

function getPermissionDefaults(admin) {
  const permissions =
    admin?.permissions && typeof admin.permissions === "object"
      ? admin.permissions
      : {};

  return PERMISSION_FIELDS.reduce((values, permission) => {
    values[permission.key] = permissions[permission.key] === true;
    return values;
  }, {});
}

function AdminPermissionsModal({
  isOpen,
  admin = null,
  error = "",
  isSubmitting = false,
  onClose = () => {},
  onConfirm = () => false,
}) {
  const modalId = useId();
  const titleId = `${modalId}-title`;
  const descriptionId = `${modalId}-description`;
  const adminId = getAdminId(admin);
  const {
    register,
    handleSubmit,
    reset,
    setError,
    formState: { errors, isDirty },
  } = useForm({
    resolver: zodResolver(permissionsSchema),
    defaultValues: getPermissionDefaults(admin),
  });

  useEffect(() => {
    reset(getPermissionDefaults(admin));
  }, [admin, adminId, isOpen, reset]);

  function handleClose() {
    if (isSubmitting) {
      return;
    }

    reset(getPermissionDefaults(admin));
    onClose();
  }

  async function handleValidSubmit(values) {
    if (isSubmitting || admin?.isSuperAdmin) {
      return;
    }

    if (!isDirty) {
      setError("root", { type: "manual", message: "Change at least one permission before saving." });
      return;
    }

    const existingPermissions =
      admin?.permissions && typeof admin.permissions === "object"
        ? admin.permissions
        : {};
    const permissions = {
      ...existingPermissions,
      ...PERMISSION_FIELDS.reduce((result, permission) => {
        result[permission.key] = values[permission.key] === true;
        return result;
      }, {}),
    };
    const didSucceed = await onConfirm(permissions);

    if (didSucceed) {
      reset(getPermissionDefaults(admin));
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-h-[92vh] max-w-2xl overflow-hidden" showCloseButton={!isSubmitting} ariaLabelledBy={titleId} ariaDescribedBy={descriptionId}>
      <form onSubmit={handleSubmit(handleValidSubmit)} noValidate className="flex max-h-[92vh] min-w-0 flex-col">
        <div className="shrink-0 border-b border-gray-100 px-5 pt-7 pb-5 pr-16 sm:px-8 sm:pt-8 sm:pr-20 dark:border-gray-800">
          <h3 id={titleId} className="text-xl font-semibold text-gray-800 dark:text-white/90">Manage Admin permissions</h3>
          <p id={descriptionId} className="mt-1.5 break-words text-sm leading-6 text-gray-500 dark:text-gray-400">
            Update dashboard access for {normalizeText(admin?.name) || normalizeText(admin?.email) || "this Admin"}.
          </p>
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-8 sm:py-6">
          {(error || errors.root?.message) && (
            <div role="alert" className="mb-5 break-words whitespace-pre-wrap rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
              {error || errors.root.message}
            </div>
          )}

          <div className="mb-5 rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-sm leading-6 text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-400">
            Permission changes affect which protected Admin pages this account can open. The backend result will remain authoritative.
          </div>

          <fieldset disabled={isSubmitting || admin?.isSuperAdmin}>
            <legend className="sr-only">Admin permissions</legend>
            <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
              {PERMISSION_FIELDS.map((permission) => (
                <label key={permission.key} htmlFor={`admin-permission-${permission.key}`} className="flex min-w-0 cursor-pointer items-start gap-3 rounded-xl border border-gray-200 p-4 transition hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/2">
                  <input {...register(permission.key)} id={`admin-permission-${permission.key}`} type="checkbox" className="mt-0.5 size-4 shrink-0 rounded border-gray-300 text-brand-500 focus:ring-brand-500 disabled:cursor-not-allowed dark:border-gray-700 dark:bg-gray-900" />
                  <span className="min-w-0">
                    <span className="block break-words text-sm font-medium text-gray-800 dark:text-white/90">{permission.label}</span>
                    <span className="mt-1 block text-xs leading-5 text-gray-500 dark:text-gray-400">{permission.description}</span>
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          {admin?.isSuperAdmin && (
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Granular permissions do not restrict Super Admin accounts.</p>
          )}
        </div>

        <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-8 sm:py-5 dark:border-gray-800">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting} className="w-full sm:w-auto">Cancel</Button>
          <Button type="submit" disabled={isSubmitting || !isDirty || admin?.isSuperAdmin || !adminId} className="w-full sm:w-48">
            {isSubmitting ? "Saving permissions..." : "Save permissions"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default AdminPermissionsModal;
