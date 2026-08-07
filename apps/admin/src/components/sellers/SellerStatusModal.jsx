import { useId } from "react";

import Button from "../ui/button/Button.jsx";
import Modal from "../ui/modal/Modal.jsx";

function StatusIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M12 3V12M7.05 5.55C4.64 7.1 3 9.81 3 12.92C3 17.89 7.03 21.92 12 21.92C16.97 21.92 21 17.89 21 12.92C21 9.81 19.36 7.1 16.95 5.55"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function getSellerLabel(seller) {
  const shopName =
    typeof seller?.shopName === "string" ? seller.shopName.trim() : "";
  const sellerName =
    typeof seller?.name === "string" ? seller.name.trim() : "";

  return shopName || sellerName || "This seller";
}

function SellerStatusModal({
  isOpen,
  seller = null,
  error = "",
  isSubmitting = false,
  onClose = () => {},
  onConfirm = () => {},
}) {
  const modalId = useId();
  const modalTitleId = `${modalId}-title`;
  const modalDescriptionId = `${modalId}-description`;
  const isReactivating = seller?.isActive === false;
  const sellerLabel = getSellerLabel(seller);

  function handleClose() {
    if (isSubmitting) {
      return;
    }

    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="max-w-125"
      showCloseButton={!isSubmitting}
      ariaLabelledBy={modalTitleId}
      ariaDescribedBy={modalDescriptionId}
    >
      <div className="rounded-3xl">
        <div className="px-5 pt-7 pb-5 text-center sm:px-8 sm:pt-8">
          <div
            className={`mx-auto flex size-14 items-center justify-center rounded-full ${
              isReactivating
                ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400"
                : "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400"
            }`}
          >
            <StatusIcon className="size-7" />
          </div>
          <h3
            id={modalTitleId}
            className="mt-5 text-xl font-semibold text-gray-800 dark:text-white/90"
          >
            {isReactivating ? "Reactivate seller?" : "Deactivate seller?"}
          </h3>
          <p
            id={modalDescriptionId}
            className="mx-auto mt-2 max-w-sm break-words text-sm leading-6 text-gray-500 dark:text-gray-400"
          >
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {sellerLabel}
            </span>{" "}
            {isReactivating
              ? "will regain account access when their Seller approval and email verification requirements are also satisfied."
              : "will no longer be able to sign in. Their approval state and marketplace data remain unchanged, and the account can be reactivated later."}
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="mx-5 mb-5 min-w-0 break-words whitespace-pre-wrap rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 sm:mx-8 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400"
          >
            {error}
          </div>
        )}

        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-8 sm:py-5 dark:border-gray-800">
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
            type="button"
            onClick={onConfirm}
            disabled={isSubmitting || !seller}
            className={`w-full sm:w-auto ${
              isReactivating
                ? "bg-success-500 hover:bg-success-600"
                : "bg-error-500 hover:bg-error-600"
            }`}
            startIcon={<StatusIcon className="size-5" />}
          >
            {isSubmitting
              ? isReactivating
                ? "Reactivating..."
                : "Deactivating..."
              : isReactivating
                ? "Reactivate seller"
                : "Deactivate seller"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default SellerStatusModal;
