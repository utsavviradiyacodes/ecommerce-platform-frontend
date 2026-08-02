import { useId } from "react";

import { TrashIcon } from "../../icons/index.js";

import Button from "../ui/button/Button.jsx";
import Modal from "../ui/modal/Modal.jsx";

function CategoryDeleteModal({
  isOpen,
  category = null,
  error = "",
  isDeleting = false,
  onClose = () => {},
  onConfirm = () => {},
}) {
  const modalId = useId();
  const modalTitleId = `${modalId}-title`;
  const modalDescriptionId = `${modalId}-description`;

  function handleClose() {
    if (isDeleting) {
      return;
    }

    onClose();
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="max-w-125"
      ariaLabelledBy={modalTitleId}
      ariaDescribedBy={modalDescriptionId}
    >
      <div className="rounded-3xl">
        <div className="px-5 pt-7 pb-5 text-center sm:px-8 sm:pt-8">
          <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400">
            <TrashIcon className="size-7" />
          </div>

          <h3
            id={modalTitleId}
            className="mt-5 text-xl font-semibold text-gray-800 dark:text-white/90"
          >
            Delete category?
          </h3>

          <p
            id={modalDescriptionId}
            className="mx-auto mt-2 max-w-sm text-sm leading-6 text-gray-500 dark:text-gray-400"
          >
            <span className="font-medium text-gray-700 dark:text-gray-300">
              {category?.name || "This category"}
            </span>{" "}
            and all subcategories under it will be permanently deleted. This
            action cannot be undone.
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
            disabled={isDeleting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>

          <Button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting || !category}
            className="w-full bg-error-500 hover:bg-error-600 sm:w-auto"
            startIcon={<TrashIcon className="size-5" />}
          >
            {isDeleting ? "Deleting..." : "Delete category"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default CategoryDeleteModal;
