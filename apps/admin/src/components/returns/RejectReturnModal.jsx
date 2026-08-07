import { useEffect, useId } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import Label from "../form/Label.jsx";
import Button from "../ui/button/Button.jsx";
import Modal from "../ui/modal/Modal.jsx";

const rejectReturnSchema = z.object({
  rejectedReason: z.string().trim().min(1, "Rejection reason is required."),
});

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getEntityId(entity) {
  if (typeof entity === "string") {
    return normalizeText(entity);
  }

  return normalizeText(entity?._id ?? entity?.id);
}

function getProductName(returnRequest) {
  const product =
    returnRequest?.product && typeof returnRequest.product === "object"
      ? returnRequest.product
      : null;

  return normalizeText(product?.name) || getEntityId(returnRequest?.product) || "Unavailable";
}

function formatQuantity(value) {
  return Number.isInteger(value) && value > 0 ? String(value) : "Unavailable";
}

function RejectIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M7 7L17 17M17 7L7 17" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function RejectReturnModal({
  isOpen,
  returnRequest = null,
  error = "",
  isSubmitting = false,
  onClose = () => {},
  onConfirm = () => false,
}) {
  const modalId = useId();
  const titleId = `${modalId}-title`;
  const descriptionId = `${modalId}-description`;
  const returnId = getEntityId(returnRequest);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(rejectReturnSchema),
    defaultValues: { rejectedReason: "" },
  });

  useEffect(() => {
    reset({ rejectedReason: "" });
  }, [isOpen, reset, returnId]);

  function handleClose() {
    if (isSubmitting) {
      return;
    }

    reset({ rejectedReason: "" });
    onClose();
  }

  async function handleValidSubmit(values) {
    if (isSubmitting || !returnId) {
      return;
    }

    const didSucceed = await onConfirm({
      rejectedReason: values.rejectedReason.trim(),
    });

    if (didSucceed) {
      reset({ rejectedReason: "" });
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      className="max-w-150"
      showCloseButton={!isSubmitting}
      ariaLabelledBy={titleId}
      ariaDescribedBy={descriptionId}
    >
      <form onSubmit={handleSubmit(handleValidSubmit)} noValidate>
        <div className="px-5 pt-7 pb-5 sm:px-8 sm:pt-8">
          <div className="flex items-start gap-4 pr-10 sm:pr-12">
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400">
              <RejectIcon className="size-6" />
            </div>
            <div className="min-w-0">
              <h3 id={titleId} className="text-xl font-semibold text-gray-800 dark:text-white/90">
                Reject Return
              </h3>
              <p id={descriptionId} className="mt-1.5 break-words text-sm leading-6 text-gray-500 dark:text-gray-400">
                Reject Return #{returnId || "ID unavailable"}. This Return record will become rejected, and the Admin panel has no undo or reopen action.
              </p>
            </div>
          </div>

          <dl className="mt-5 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="min-w-0 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 dark:border-gray-800 dark:bg-white/2">
              <dt className="text-xs text-gray-500 dark:text-gray-400">Product</dt>
              <dd className="mt-1 break-words text-sm font-semibold text-gray-800 dark:text-white/90">
                {getProductName(returnRequest)}
              </dd>
            </div>
            <div className="min-w-0 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 dark:border-gray-800 dark:bg-white/2">
              <dt className="text-xs text-gray-500 dark:text-gray-400">Quantity</dt>
              <dd className="mt-1 text-sm font-semibold text-gray-800 dark:text-white/90">
                {formatQuantity(returnRequest?.quantity)}
              </dd>
            </div>
          </dl>

          {error && (
            <div role="alert" className="mt-5 break-words whitespace-pre-wrap rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400">
              {error}
            </div>
          )}

          <div className="mt-5">
            <Label htmlFor="return-rejection-reason">
              Rejection reason
              <span className="text-error-500"> *</span>
            </Label>
            <textarea
              {...register("rejectedReason")}
              id="return-rejection-reason"
              rows={5}
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.rejectedReason) || undefined}
              aria-describedby={errors.rejectedReason ? "return-rejection-reason-error" : undefined}
              placeholder="Explain why this Return is being rejected"
              className={`w-full resize-y rounded-lg border bg-transparent px-4 py-3 text-sm text-gray-800 shadow-theme-xs outline-none transition placeholder:text-gray-400 focus:ring-3 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:disabled:bg-gray-800 ${
                errors.rejectedReason
                  ? "border-error-500 focus:border-error-500 focus:ring-error-500/30 dark:border-error-500"
                  : "border-gray-300 focus:border-brand-400 focus:ring-brand-500/30 dark:border-gray-700 dark:focus:border-brand-400 dark:focus:ring-brand-400/30"
              }`}
            />
            {errors.rejectedReason && (
              <p id="return-rejection-reason-error" className="mt-1.5 text-xs text-error-600 dark:text-error-400">
                {errors.rejectedReason.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-8 sm:py-5 dark:border-gray-800">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !returnId} className="w-full bg-error-600 hover:bg-error-700 sm:w-48" startIcon={<RejectIcon className="size-5" />}>
            {isSubmitting ? "Rejecting Return..." : "Reject Return"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default RejectReturnModal;
