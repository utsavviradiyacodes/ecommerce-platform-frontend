import { useId } from "react";

import Button from "../ui/button/Button.jsx";
import Modal from "../ui/modal/Modal.jsx";

function ApprovalIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M5 12.5L9.25 16.75L19 7"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RevokeIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M7 7L17 17M17 7L7 17"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
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

function SellerApprovalModal({
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
  const isApproving = seller?.isApproved === false;
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
              isApproving
                ? "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400"
                : "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400"
            }`}
          >
            {isApproving ? (
              <ApprovalIcon className="size-7" />
            ) : (
              <RevokeIcon className="size-7" />
            )}
          </div>
          <h3
            id={modalTitleId}
            className="mt-5 text-xl font-semibold text-gray-800 dark:text-white/90"
          >
            {isApproving ? "Approve seller?" : "Revoke Seller approval?"}
          </h3>
          <p
            id={modalDescriptionId}
            className="mx-auto mt-2 max-w-sm break-words text-sm leading-6 text-gray-500 dark:text-gray-400"
          >
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {sellerLabel}
            </span>{" "}
            {isApproving
              ? "will be approved to operate on the marketplace. Sign-in still requires an active account and verified email."
              : "will lose marketplace approval and will be blocked from Seller sign-in. Their account and data are not deleted, and approval can be granted again later."}
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
              isApproving
                ? "bg-success-500 hover:bg-success-600"
                : "bg-error-500 hover:bg-error-600"
            }`}
            startIcon={
              isApproving ? (
                <ApprovalIcon className="size-5" />
              ) : (
                <RevokeIcon className="size-5" />
              )
            }
          >
            {isSubmitting
              ? isApproving
                ? "Approving..."
                : "Revoking..."
              : isApproving
                ? "Approve seller"
                : "Revoke approval"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default SellerApprovalModal;
