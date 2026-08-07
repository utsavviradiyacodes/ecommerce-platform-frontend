import { useEffect, useId } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";

import InputField from "../form/input/InputField.jsx";
import Label from "../form/Label.jsx";
import Button from "../ui/button/Button.jsx";
import Modal from "../ui/modal/Modal.jsx";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getEntityId(entity) {
  if (typeof entity === "number" && Number.isFinite(entity)) {
    return String(entity);
  }

  if (typeof entity === "string") {
    return normalizeText(entity);
  }

  return normalizeText(entity?._id ?? entity?.id);
}

function getNonNegativeNumber(value, { missingAsZero = false } = {}) {
  if ((value === null || value === undefined) && missingAsZero) {
    return 0;
  }

  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
}

function getRefundAmounts(payment) {
  const amount = getNonNegativeNumber(payment?.amount);
  const refundAmount = getNonNegativeNumber(payment?.refundAmount, {
    missingAsZero: true,
  });
  const remainingAmount =
    amount !== null && refundAmount !== null
      ? Math.max(0, amount - refundAmount)
      : null;

  return { amount, refundAmount, remainingAmount };
}

function createRefundSchema(remainingAmount) {
  return z.object({
    refundAmount: z.string().superRefine((value, context) => {
      const trimmedValue = value.trim();

      if (!trimmedValue) {
        context.addIssue({
          code: "custom",
          message: "Refund amount is required.",
        });
        return;
      }

      const number = Number(trimmedValue);

      if (!Number.isFinite(number)) {
        context.addIssue({
          code: "custom",
          message: "Refund amount must be a valid number.",
        });
        return;
      }

      if (number <= 0) {
        context.addIssue({
          code: "custom",
          message: "Refund amount must be greater than zero.",
        });
        return;
      }

      if (remainingAmount === null || number > remainingAmount) {
        context.addIssue({
          code: "custom",
          message: "Refund amount cannot exceed the remaining amount.",
        });
      }
    }),
    refundReason: z.string().trim().min(1, "Refund reason is required."),
  });
}

function RefundIcon({ className = "" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" className={className} aria-hidden="true">
      <path
        d="M8 7H5V4M5.5 7.5A8 8 0 1 1 4 13"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RefundPaymentModal({
  isOpen,
  payment = null,
  error = "",
  isSubmitting = false,
  onClose = () => {},
  onConfirm = () => false,
}) {
  const modalId = useId();
  const titleId = `${modalId}-title`;
  const descriptionId = `${modalId}-description`;
  const { amount, refundAmount, remainingAmount } = getRefundAmounts(payment);
  const paymentId = getEntityId(payment);
  const schema = createRefundSchema(remainingAmount);
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      refundAmount: remainingAmount === null ? "" : String(remainingAmount),
      refundReason: "",
    },
  });

  useEffect(() => {
    reset({
      refundAmount: remainingAmount === null ? "" : String(remainingAmount),
      refundReason: "",
    });
  }, [isOpen, paymentId, remainingAmount, reset]);

  function handleClose() {
    if (isSubmitting) {
      return;
    }

    reset({
      refundAmount: remainingAmount === null ? "" : String(remainingAmount),
      refundReason: "",
    });
    onClose();
  }

  async function handleValidSubmit(values) {
    if (isSubmitting || !paymentId || remainingAmount === null) {
      return;
    }

    const didSucceed = await onConfirm({
      refundAmount: Number(values.refundAmount.trim()),
      refundReason: values.refundReason.trim(),
    });

    if (didSucceed) {
      reset({ refundAmount: "", refundReason: "" });
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
            <div className="flex size-12 shrink-0 items-center justify-center rounded-full bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400">
              <RefundIcon className="size-6" />
            </div>

            <div className="min-w-0">
              <h3 id={titleId} className="text-xl font-semibold text-gray-800 dark:text-white/90">
                Refund Payment
              </h3>
              <p id={descriptionId} className="mt-1.5 break-words text-sm leading-6 text-gray-500 dark:text-gray-400">
                Process a full or partial refund for Payment {paymentId || "ID unavailable"}.
              </p>
            </div>
          </div>

          <dl className="mt-5 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-3">
            {[
              ["Original amount", amount],
              ["Already refunded", refundAmount],
              ["Remaining", remainingAmount],
            ].map(([label, value]) => (
              <div
                key={label}
                className="min-w-0 rounded-lg border border-gray-200 bg-gray-50 px-3 py-3 dark:border-gray-800 dark:bg-white/2"
              >
                <dt className="text-xs text-gray-500 dark:text-gray-400">{label}</dt>
                <dd className="mt-1 break-words text-sm font-semibold text-gray-800 dark:text-white/90">
                  {value === null ? "Unavailable" : currencyFormatter.format(value)}
                </dd>
              </div>
            ))}
          </dl>

          {error && (
            <div
              role="alert"
              className="mt-5 min-w-0 break-words whitespace-pre-wrap rounded-lg border border-error-200 bg-error-50 px-4 py-3 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400"
            >
              {error}
            </div>
          )}

          <div className="mt-5">
            <Label htmlFor="payment-refund-amount">
              Refund amount
              <span className="text-error-500"> *</span>
            </Label>
            <InputField
              {...register("refundAmount")}
              id="payment-refund-amount"
              type="number"
              inputMode="decimal"
              min="0"
              step="1"
              disabled={isSubmitting}
              error={Boolean(errors.refundAmount)}
              hint={errors.refundAmount?.message || ""}
            />
            <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400">
              Keep the pre-filled remaining amount for a full refund, or enter a smaller amount for a partial refund.
            </p>
          </div>

          <div className="mt-5">
            <Label htmlFor="payment-refund-reason">
              Refund reason
              <span className="text-error-500"> *</span>
            </Label>
            <textarea
              {...register("refundReason")}
              id="payment-refund-reason"
              rows={4}
              disabled={isSubmitting}
              aria-invalid={Boolean(errors.refundReason) || undefined}
              aria-describedby={
                errors.refundReason ? "payment-refund-reason-error" : undefined
              }
              placeholder="Explain why this Payment is being refunded"
              className={`w-full resize-y rounded-lg border bg-transparent px-4 py-3 text-sm text-gray-800 shadow-theme-xs outline-none transition placeholder:text-gray-400 focus:ring-3 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-40 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:disabled:bg-gray-800 ${
                errors.refundReason
                  ? "border-error-500 focus:border-error-500 focus:ring-error-500/30 dark:border-error-500"
                  : "border-gray-300 focus:border-brand-400 focus:ring-brand-500/30 dark:border-gray-700 dark:focus:border-brand-400 dark:focus:ring-brand-400/30"
              }`}
            />
            {errors.refundReason && (
              <p id="payment-refund-reason-error" className="mt-1.5 text-xs text-error-600 dark:text-error-400">
                {errors.refundReason.message}
              </p>
            )}
          </div>
        </div>

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
            type="submit"
            disabled={isSubmitting || !paymentId || remainingAmount === null}
            className="w-full bg-warning-600 hover:bg-warning-700 sm:w-56"
            startIcon={<RefundIcon className="size-5" />}
          >
            {isSubmitting ? "Processing refund..." : "Process refund"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}

export default RefundPaymentModal;
