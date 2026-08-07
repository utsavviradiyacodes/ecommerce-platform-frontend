import { useEffect, useId } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import Label from "../form/Label.jsx";
import Button from "../ui/button/Button.jsx";
import Modal from "../ui/modal/Modal.jsx";

const approveReturnSchema = z.object({
  refundNote: z.string(),
});

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
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

function formatRefundAmount(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? currencyFormatter.format(value)
    : "Unavailable";
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

function ApproveIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path d="M5 12.5L9.25 16.5L19 7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function ApproveReturnModal({
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
    resolver: zodResolver(approveReturnSchema),
    defaultValues: { refundNote: "" },
  });

  useEffect(() => {
    reset({ refundNote: "" });
  }, [isOpen, reset, returnId]);

  function handleClose() {
    if (isSubmitting) {
      return;
    }

    reset({ refundNote: "" });
    onClose();
  }

  async function handleValidSubmit(values) {
    if (isSubmitting || !returnId) {
      return;
    }

    const refundNote = normalizeText(values.refundNote);
    const didSucceed = await onConfirm(
      refundNote ? { refundNote } : {}
    );

    if (didSucceed) {
      reset({ refundNote: "" });
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
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400">
              <ApproveIcon className="size-6" />
            </div>
            <div className="min-w-0">
              <h3 id={titleId} className="text-xl font-semibold text-gray-800 dark:text-white/90">
                Approve Return and refund
              </h3>
              <p id={descriptionId} className="mt-1.5 break-words text-sm leading-6 text-gray-500 dark:text-gray-400">
                Approve Return #{returnId || "ID unavailable"} for {formatRefundAmount(returnRequest?.refundAmount)}.
              </p>
            </div>
          </div>

          <div className="mt-5 rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-sm leading-6 text-warning-700 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-400">
            Approval asks the backend to mark this Return refunded, update Payment refund bookkeeping, possibly mark the Order payment refunded, and restore Product stock. This action cannot be undone from the Admin panel. No external payment transfer is implied.
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
            <Label htmlFor="return-refund-amount">Refund amount</Label>
            <input
              id="return-refund-amount"
              type="text"
              readOnly
              value={formatRefundAmount(returnRequest?.refundAmount)}
              className="h-11 w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-sm text-gray-700 shadow-theme-xs outline-none dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300"
            />
          </div>

          <div className="mt-5">
            <Label htmlFor="return-refund-note">Refund note (optional)</Label>
            <textarea
              {...register("refundNote")}
              id="return-refund-note"
              rows={4}
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.refundNote) || undefined}
              aria-describedby={errors.refundNote ? "return-refund-note-error" : undefined}
              placeholder="Add an internal note for this refund"
              className={`w-full resize-y rounded-lg border bg-transparent px-4 py-3 text-sm text-gray-800 shadow-theme-xs outline-none transition placeholder:text-gray-400 focus:ring-3 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:disabled:bg-gray-800 ${
                errors.refundNote
                  ? "border-error-500 focus:border-error-500 focus:ring-error-500/30 dark:border-error-500"
                  : "border-gray-300 focus:border-brand-400 focus:ring-brand-500/30 dark:border-gray-700 dark:focus:border-brand-400 dark:focus:ring-brand-400/30"
              }`}
            />
            {errors.refundNote && (
              <p id="return-refund-note-error" className="mt-1.5 text-xs text-error-600 dark:text-error-400">
                {errors.refundNote.message}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col-reverse gap-3 border-t border-gray-100 px-5 py-4 sm:flex-row sm:justify-end sm:px-8 sm:py-5 dark:border-gray-800">
          <Button type="button" variant="outline" onClick={handleClose} disabled={isSubmitting} className="w-full sm:w-auto">
            Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting || !returnId} className="w-full bg-success-600 hover:bg-success-700 sm:w-56" startIcon={<ApproveIcon className="size-5" />}>
            {isSubmitting ? "Approving Return..." : "Approve & refund"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default ApproveReturnModal;
