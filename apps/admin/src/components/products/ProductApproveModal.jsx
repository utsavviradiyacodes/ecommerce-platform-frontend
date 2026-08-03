import { useId } from "react";

import Button from "../ui/button/Button.jsx";
import Modal from "../ui/modal/Modal.jsx";

function ApprovalIcon({ className = "" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
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

function ProductApproveModal({
  isOpen,
  product = null,
  error = "",
  isApproving = false,
  onClose = () => {},
  onConfirm = () => {},
}) {
  const modalId = useId();
  const modalTitleId = `${modalId}-title`;
  const modalDescriptionId = `${modalId}-description`;

  function handleClose() {
    if (isApproving) {
      return;
    }

    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="max-w-125"
      showCloseButton={!isApproving}
      ariaLabelledBy={modalTitleId}
      ariaDescribedBy={modalDescriptionId}
    >
      <div className="rounded-3xl">
        <div className="px-5 pt-7 pb-5 text-center sm:px-8 sm:pt-8">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400">
            <ApprovalIcon className="size-7" />
          </div>

          <h3
            id={modalTitleId}
            className="mt-5 text-xl font-semibold text-gray-800 dark:text-white/90"
          >
            Approve product?
          </h3>

          <p
            id={modalDescriptionId}
            className="mx-auto mt-2 max-w-sm break-words text-sm leading-6 text-gray-500 dark:text-gray-400"
          >
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {product?.name || "This product"}
            </span>{" "}
            will be marked approved and immediately become active and live in
            the marketplace. This is a moderation action, not an availability
            toggle.
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
            disabled={isApproving}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={onConfirm}
            disabled={isApproving || !product}
            className="w-full bg-success-500 hover:bg-success-600 sm:w-auto"
            startIcon={<ApprovalIcon className="size-5" />}
          >
            {isApproving ? "Approving..." : "Approve product"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ProductApproveModal;
