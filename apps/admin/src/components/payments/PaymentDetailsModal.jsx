import { useId } from "react";

import Button from "../ui/button/Button.jsx";
import Modal from "../ui/modal/Modal.jsx";

const EMPTY_VALUE = "\u2014";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const dateTimeFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const STATUS_TONES = {
  paid: "success",
  pending: "warning",
  failed: "error",
  refunded: "neutral",
  partially_refunded: "brand",
};

const BADGE_CLASSES = {
  brand:
    "bg-brand-50 text-brand-700 dark:bg-brand-500/15 dark:text-brand-400",
  success:
    "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
  warning:
    "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400",
  error:
    "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400",
  neutral: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
};

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : null;
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

function formatCurrency(value) {
  const number = getNonNegativeNumber(value);

  return number === null ? EMPTY_VALUE : currencyFormatter.format(number);
}

function formatDateTime(value) {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    return EMPTY_VALUE;
  }

  const date = new Date(normalizedValue);

  return Number.isNaN(date.getTime())
    ? EMPTY_VALUE
    : dateTimeFormatter.format(date);
}

function formatLabel(value) {
  const normalizedValue = normalizeText(value).toLowerCase();

  if (!normalizedValue) {
    return "Unknown";
  }

  if (normalizedValue === "upi") {
    return "UPI";
  }

  if (normalizedValue === "partially_refunded") {
    return "Partially refunded";
  }

  return normalizedValue
    .split(/[_-]/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function getDisplayStatus(payment) {
  const backendStatus = normalizeText(payment?.status).toLowerCase();

  if (backendStatus === "refunded") {
    return "refunded";
  }

  const amount = getNonNegativeNumber(payment?.amount);
  const refundAmount = getNonNegativeNumber(payment?.refundAmount, {
    missingAsZero: true,
  });

  if (
    backendStatus === "paid" &&
    amount !== null &&
    refundAmount !== null &&
    refundAmount > 0 &&
    refundAmount < amount
  ) {
    return "partially_refunded";
  }

  return backendStatus;
}

function formatOrderReference(order) {
  const orderId = getEntityId(order);

  return orderId ? `#${orderId.slice(-8).toUpperCase()}` : EMPTY_VALUE;
}

function StatusBadge({ value }) {
  const normalizedValue = normalizeText(value).toLowerCase();
  const tone = STATUS_TONES[normalizedValue] ?? "neutral";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${BADGE_CLASSES[tone]}`}
    >
      {formatLabel(normalizedValue)}
    </span>
  );
}

function DetailItem({ label, value, children }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm text-gray-800 dark:text-white/90">
        {children ?? value ?? EMPTY_VALUE}
      </dd>
    </div>
  );
}

function Section({ title, children }) {
  return (
    <section className="min-w-0 rounded-xl border border-gray-200 p-4 sm:p-5 dark:border-gray-800">
      <h4 className="text-sm font-semibold text-gray-800 dark:text-white/90">
        {title}
      </h4>
      <div className="mt-4">{children}</div>
    </section>
  );
}

function PaymentDetailsModal({
  isOpen,
  payment = null,
  onClose = () => {},
}) {
  const modalId = useId();
  const titleId = `${modalId}-title`;
  const descriptionId = `${modalId}-description`;
  const directPayment = normalizeObject(payment);
  const customerRelation =
    directPayment?.customer ?? directPayment?.customerId ?? null;
  const orderRelation = directPayment?.order ?? directPayment?.orderId ?? null;
  const customer = normalizeObject(customerRelation);
  const order = normalizeObject(orderRelation);
  const paymentId = getEntityId(directPayment);
  const customerId = getEntityId(customerRelation);
  const orderId = getEntityId(orderRelation);
  const amount = getNonNegativeNumber(directPayment?.amount);
  const refundAmount = getNonNegativeNumber(directPayment?.refundAmount, {
    missingAsZero: true,
  });
  const remainingAmount =
    amount !== null && refundAmount !== null
      ? Math.max(0, amount - refundAmount)
      : null;
  const backendStatus = normalizeText(directPayment?.status).toLowerCase();
  const displayStatus = getDisplayStatus(directPayment);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      ariaLabelledBy={titleId}
      ariaDescribedBy={descriptionId}
      className="flex max-h-[calc(100dvh-1.5rem)] max-w-5xl flex-col overflow-hidden sm:max-h-[calc(100dvh-3rem)]"
    >
      <div className="shrink-0 border-b border-gray-100 px-5 py-5 pr-16 sm:px-8 sm:pr-20 dark:border-gray-800">
        <h3 id={titleId} className="text-xl font-semibold text-gray-800 dark:text-white/90">
          Payment details
        </h3>
        <p id={descriptionId} className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {paymentId || "Payment ID unavailable"} &middot; Direct Payment record
        </p>
      </div>

      <div className="custom-scrollbar min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-contain">
        <div className="min-w-0 space-y-4 px-5 py-6 sm:px-8">
          <Section title="Payment">
            <dl className="grid min-w-0 grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem label="Payment ID" value={paymentId || EMPTY_VALUE} />
              <DetailItem
                label="Transaction ID"
                value={normalizeText(directPayment?.transactionId) || EMPTY_VALUE}
              />
              <DetailItem
                label="Method"
                value={
                  normalizeText(directPayment?.method)
                    ? formatLabel(directPayment.method)
                    : EMPTY_VALUE
                }
              />
              <DetailItem
                label="Currency"
                value={normalizeText(directPayment?.currency) || EMPTY_VALUE}
              />
              <DetailItem label="Backend status">
                {backendStatus ? <StatusBadge value={backendStatus} /> : EMPTY_VALUE}
              </DetailItem>
              <DetailItem label="Display status">
                {displayStatus ? <StatusBadge value={displayStatus} /> : EMPTY_VALUE}
              </DetailItem>
              <DetailItem label="Amount" value={formatCurrency(amount)} />
            </dl>
          </Section>

          <Section title="Refund">
            <dl className="grid min-w-0 grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem label="Refund amount" value={formatCurrency(refundAmount)} />
              <DetailItem label="Remaining amount" value={formatCurrency(remainingAmount)} />
              <DetailItem
                label="Refund reason"
                value={normalizeText(directPayment?.refundReason) || EMPTY_VALUE}
              />
              <DetailItem
                label="Refunded at"
                value={formatDateTime(directPayment?.refundedAt)}
              />
            </dl>
          </Section>

          <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-2">
            <Section title="Customer">
              <dl className="grid min-w-0 grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <DetailItem label="Customer ID" value={customerId || EMPTY_VALUE} />
                <DetailItem
                  label="Name"
                  value={normalizeText(customer?.name) || "Customer unavailable"}
                />
                <DetailItem
                  label="Email"
                  value={normalizeText(customer?.email) || EMPTY_VALUE}
                />
                <DetailItem
                  label="Phone"
                  value={
                    normalizeText(customer?.phone ?? customer?.phoneNumber) ||
                    EMPTY_VALUE
                  }
                />
              </dl>
            </Section>

            <Section title="Related Order">
              <dl className="grid min-w-0 grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
                <DetailItem label="Order ID" value={orderId || EMPTY_VALUE} />
                <DetailItem
                  label="Reference"
                  value={formatOrderReference(orderRelation)}
                />
                <DetailItem
                  label="Tracking ID"
                  value={normalizeText(order?.trackingId) || EMPTY_VALUE}
                />
                <DetailItem
                  label="Order status"
                  value={
                    normalizeText(order?.orderStatus ?? order?.status)
                      ? formatLabel(order?.orderStatus ?? order?.status)
                      : EMPTY_VALUE
                  }
                />
                <DetailItem
                  label="Order payment status"
                  value={
                    normalizeText(order?.paymentStatus)
                      ? formatLabel(order.paymentStatus)
                      : EMPTY_VALUE
                  }
                />
              </dl>
            </Section>
          </div>

          <Section title="Timeline">
            <dl className="grid min-w-0 grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
              <DetailItem label="Created" value={formatDateTime(directPayment?.createdAt)} />
              <DetailItem label="Paid" value={formatDateTime(directPayment?.paidAt)} />
              <DetailItem label="Refunded" value={formatDateTime(directPayment?.refundedAt)} />
              <DetailItem label="Last updated" value={formatDateTime(directPayment?.updatedAt)} />
            </dl>
          </Section>
        </div>
      </div>

      <div className="shrink-0 border-t border-gray-100 px-5 py-4 text-right sm:px-8 dark:border-gray-800">
        <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
          Close
        </Button>
      </div>
    </Modal>
  );
}

export default PaymentDetailsModal;
