import { useId } from "react";

import Button from "../ui/button/Button.jsx";
import Modal from "../ui/modal/Modal.jsx";

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getAdminId(admin) {
  return normalizeText(admin?._id ?? admin?.id);
}

function DeleteIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M5 7H19M9 7V4.5H15V7M7.5 7L8.25 20H15.75L16.5 7M10 10.5V16.5M14 10.5V16.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function DeleteAdminModal({
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

  function handleClose() {
    if (!isSubmitting) {
      onClose();
    }
  }

  async function handleConfirm() {
    if (!isSubmitting && adminId) {
      await onConfirm();
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={handleClose} className="max-w-150" showCloseButton={!isSubmitting} ariaLabelledBy={titleId} ariaDescribedBy={descriptionId}>
      <div className="px-5 pt-7 pb-5 sm:px-8 sm:pt-8">
        <div className="flex items-start gap-4 pr-10 sm:pr-12">
          <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400">
            <DeleteIcon className="size-6" />
          </div>
          <div className="min-w-0">
            <h3 id={titleId} className="text-xl font-semibold text-gray-800 dark:text-white/90">Permanently delete Admin</h3>
            <p id={descriptionId} className="mt-1.5 break-words text-sm leading-6 text-gray-500 dark:text-gray-400">
              Delete {normalizeText(admin?.name) || normalizeText(admin?.email) || "this Admin"} from the backend.
            </p>
          </div>
        </div>

        <div className="mt-5 rounded-xl border border-error-200 bg-error-50 px-4 py-3 text-sm leading-6 text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
          This is a hard delete and cannot be undone. The backend blocks deleting your own account but does not protect the last Super Admin.
        </div>

        {error && (
          <div role="alert" className="mt-5 break-words whitespace-pre-wrap rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">{error}</div>
        )}

        <dl className="mt-5 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="min-w-0 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 dark:border-gray-800 dark:bg-white/2">
            <dt className="text-xs text-gray-500 dark:text-gray-400">Admin</dt>
            <dd className="mt-1 break-words text-sm font-semibold text-gray-800 dark:text-white/90">{normalizeText(admin?.name) || "Unavailable"}</dd>
          </div>
          <div className="min-w-0 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 dark:border-gray-800 dark:bg-white/2">
            <dt className="text-xs text-gray-500 dark:text-gray-400">Email</dt>
            <dd className="mt-1 break-words text-sm font-semibold text-gray-800 dark:text-white/90">{normalizeText(admin?.email) || "Unavailable"}</dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-col-reverse gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-8 sm:py-5 dark:border-gray-800">
        <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting} className="w-full sm:w-auto">Cancel</Button>
        <Button type="button" onClick={handleConfirm} disabled={isSubmitting || !adminId} className="w-full bg-error-600 hover:bg-error-700 sm:w-44" startIcon={<DeleteIcon className="size-5" />}>
          {isSubmitting ? "Deleting Admin..." : "Delete Admin"}
        </Button>
      </div>
    </Modal>
  );
}

export default DeleteAdminModal;
