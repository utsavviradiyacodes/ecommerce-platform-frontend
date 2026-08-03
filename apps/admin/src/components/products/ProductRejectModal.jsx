import { useEffect, useId } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";

import { rejectProductSchema } from "../../schemas/products/productSchema.js";

import Button from "../ui/button/Button.jsx";
import Label from "../form/Label.jsx";
import Modal from "../ui/modal/Modal.jsx";

function RejectIcon({ className = "" }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      fill="none"
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

function ProductRejectModal({
  isOpen,
  product = null,
  error = "",
  isRejecting = false,
  onClose = () => {},
  onConfirm = () => {},
}) {
  const modalId = useId();
  const modalTitleId = `${modalId}-title`;
  const modalDescriptionId = `${modalId}-description`;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(rejectProductSchema),
    defaultValues: {
      rejectedReason: "",
    },
  });

  useEffect(() => {
    reset({ rejectedReason: "" });
  }, [isOpen, product?._id, reset]);

  function handleClose() {
    if (isRejecting) {
      return;
    }

    reset({ rejectedReason: "" });
    onClose();
  }

  function handleValidSubmit(values) {
    if (isRejecting || !product) {
      return;
    }

    onConfirm(values.rejectedReason);
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="max-w-150"
      showCloseButton={!isRejecting}
      ariaLabelledBy={modalTitleId}
      ariaDescribedBy={modalDescriptionId}
    >
      <form onSubmit={handleSubmit(handleValidSubmit)} noValidate>
        <div className="px-5 pt-7 pb-5 sm:px-8 sm:pt-8">
          <div className="flex items-start gap-4 pr-10 sm:pr-12">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400">
              <RejectIcon className="size-6" />
            </div>

            <div className="min-w-0">
              <h3
                id={modalTitleId}
                className="text-xl font-semibold text-gray-800 dark:text-white/90"
              >
                Reject product?
              </h3>

              <p
                id={modalDescriptionId}
                className="mt-1.5 break-words text-sm leading-6 text-gray-500 dark:text-gray-400"
              >
                <span className="font-medium text-gray-700 dark:text-gray-300">
                  {product?.name || "This product"}
                </span>{" "}
                will be rejected and made inactive. The reason below will be
                recorded with the moderation decision.
              </p>
            </div>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-5 min-w-0 break-words whitespace-pre-wrap rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400"
            >
              {error}
            </div>
          )}

          <div className="mt-5">
            <Label htmlFor="product-rejection-reason">
              Rejection reason
              <span className="text-error-500"> *</span>
            </Label>

            <textarea
              {...register("rejectedReason")}
              id="product-rejection-reason"
              rows={4}
              disabled={isRejecting}
              aria-invalid={Boolean(errors.rejectedReason) || undefined}
              aria-describedby={
                errors.rejectedReason
                  ? "product-rejection-reason-error"
                  : undefined
              }
              placeholder="Explain why this product cannot be approved"
              className={`w-full resize-y rounded-lg border bg-transparent px-4 py-3 text-sm text-gray-800 shadow-theme-xs outline-none transition placeholder:text-gray-400 focus:ring-3 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-40 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:disabled:bg-gray-800 ${
                errors.rejectedReason
                  ? "border-error-500 focus:border-error-500 focus:ring-error-500/30 dark:border-error-500"
                  : "border-gray-300 focus:border-brand-400 focus:ring-brand-500/30 dark:border-gray-700 dark:focus:border-brand-400 dark:focus:ring-brand-400/30"
              }`}
            />

            {errors.rejectedReason && (
              <p
                id="product-rejection-reason-error"
                className="mt-1.5 text-xs text-error-600 dark:text-error-400"
              >
                {errors.rejectedReason.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-8 sm:py-5 dark:border-gray-800">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isRejecting}
            className="w-full sm:w-auto"
          >
            Cancel
          </Button>

          <Button
            type="submit"
            disabled={isRejecting || !product}
            className="w-full bg-error-500 hover:bg-error-600 sm:w-auto"
            startIcon={<RejectIcon className="size-5" />}
          >
            {isRejecting ? "Rejecting..." : "Reject product"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default ProductRejectModal;
