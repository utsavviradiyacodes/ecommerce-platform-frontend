import Pagination from "../ui/pagination/Pagination.jsx";
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table/Table.jsx";

const EMPTY_VALUE = "\u2014";
const SKELETON_ROW_COUNT = 10;

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

function getPaymentRefundDetails(payment) {
  const paymentId = getEntityId(payment);
  const amount = getNonNegativeNumber(payment?.amount);
  const refundAmount = getNonNegativeNumber(payment?.refundAmount, {
    missingAsZero: true,
  });
  const remainingAmount =
    amount !== null && refundAmount !== null
      ? Math.max(0, amount - refundAmount)
      : null;
  const isEligible = Boolean(
    normalizeText(payment?.status).toLowerCase() === "paid" &&
      /^[0-9a-fA-F]{24}$/.test(paymentId) &&
      amount !== null &&
      amount > 0 &&
      refundAmount !== null &&
      remainingAmount > 0
  );

  return { paymentId, amount, refundAmount, remainingAmount, isEligible };
}

function formatOrderReference(order) {
  const orderId = getEntityId(order);

  return orderId ? `#${orderId.slice(-8).toUpperCase()}` : EMPTY_VALUE;
}

function getCustomerRelation(payment) {
  return payment?.customer ?? payment?.customerId ?? null;
}

function getOrderRelation(payment) {
  return payment?.order ?? payment?.orderId ?? null;
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

function ViewIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden="true">
      <path
        d="M2.75 12C4.55 7.95 7.58 5.75 12 5.75C16.42 5.75 19.45 7.95 21.25 12C19.45 16.05 16.42 18.25 12 18.25C7.58 18.25 4.55 16.05 2.75 12Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      <circle cx="12" cy="12" r="2.75" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function RefundIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden="true">
      <path
        d="M8 7H5V4M5.5 7.5A8 8 0 1 1 4 13"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function PaymentsTableSkeleton() {
  return Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
    <TableRow key={index}>
      {Array.from({ length: 9 }, (_, cellIndex) => (
        <TableCell
          key={cellIndex}
          className="px-4 py-4 first:pl-5 last:pr-5 sm:first:pl-6 sm:last:pr-6"
        >
          <div
            className={`h-4 animate-pulse rounded bg-gray-200 dark:bg-gray-800 ${
              cellIndex === 8 ? "ml-auto w-20" : "w-24"
            }`}
          />
          {cellIndex < 3 && (
            <div className="mt-2 h-3 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          )}
        </TableCell>
      ))}
    </TableRow>
  ));
}

function PaymentsTable({
  payments = [],
  isLoading = false,
  isSearchActive = false,
  hasServerFilters = false,
  currentPage = 1,
  totalPages = 0,
  totalItems = 0,
  pageSize = 10,
  onPageChange = () => {},
  onView = () => {},
  onRefund = () => {},
}) {
  const hasRows = payments.length > 0;

  return (
    <div className="w-full min-w-0 max-w-full rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
      {(isLoading || hasRows) && (
        <div className="custom-scrollbar max-w-full overflow-x-auto">
          <Table className="min-w-[1450px]">
            <TableHeader className="border-b border-gray-100 dark:border-white/5">
              <TableRow>
                {[
                  "Payment",
                  "Customer",
                  "Order",
                  "Method",
                  "Amount",
                  "Refund",
                  "Status",
                  "Date",
                  "Actions",
                ].map((heading, index) => (
                  <TableCell
                    key={heading}
                    isHeader
                    className={`px-4 py-3 font-medium whitespace-nowrap text-gray-500 text-theme-xs dark:text-gray-400 ${
                      index === 0 ? "pl-5 text-start sm:pl-6" : ""
                    } ${index === 8 ? "pr-5 text-right sm:pr-6" : "text-start"}`}
                  >
                    {heading}
                  </TableCell>
                ))}
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
              {isLoading && <PaymentsTableSkeleton />}
              {!isLoading &&
                payments.map((payment, index) => {
                  const paymentId = getEntityId(payment);
                  const customerRelation = getCustomerRelation(payment);
                  const orderRelation = getOrderRelation(payment);
                  const customer = normalizeObject(customerRelation);
                  const order = normalizeObject(orderRelation);
                  const customerId = getEntityId(customerRelation);
                  const customerName = normalizeText(customer?.name);
                  const customerEmail = normalizeText(customer?.email);
                  const transactionId = normalizeText(payment?.transactionId);
                  const refund = getPaymentRefundDetails(payment);
                  const orderStatus = normalizeText(
                    order?.orderStatus ?? order?.status
                  );
                  const shortPaymentId = paymentId
                    ? `#${paymentId.slice(-8).toUpperCase()}`
                    : "";

                  return (
                    <TableRow
                      key={paymentId || `payment-row-${index}`}
                      className="transition-colors hover:bg-gray-50 dark:hover:bg-white/2"
                    >
                      <TableCell className="min-w-56 max-w-72 px-4 py-4 pl-5 sm:pl-6">
                        <p
                          className="break-all font-medium text-gray-800 dark:text-white/90"
                          title={paymentId || undefined}
                        >
                          {shortPaymentId || "Payment ID unavailable"}
                        </p>
                        <p
                          className="mt-0.5 break-all text-xs text-gray-500 dark:text-gray-400"
                          title={transactionId || undefined}
                        >
                          {transactionId || "Transaction ID unavailable"}
                        </p>
                      </TableCell>
                      <TableCell className="min-w-56 max-w-72 px-4 py-4">
                        <p
                          className="truncate text-sm font-medium text-gray-700 dark:text-gray-300"
                          title={customerName || customerId || undefined}
                        >
                          {customerName || customerId || "Customer unavailable"}
                        </p>
                        <p
                          className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400"
                          title={customerEmail || undefined}
                        >
                          {customerEmail || "Email unavailable"}
                        </p>
                      </TableCell>
                      <TableCell className="min-w-44 max-w-60 px-4 py-4">
                        <p className="font-medium text-gray-700 dark:text-gray-300">
                          {formatOrderReference(orderRelation)}
                        </p>
                        <p
                          className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400"
                          title={normalizeText(order?.trackingId) || undefined}
                        >
                          {normalizeText(order?.trackingId) || "Tracking unavailable"}
                        </p>
                        {orderStatus && (
                          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                            {formatLabel(orderStatus)}
                          </p>
                        )}
                      </TableCell>
                      <TableCell className="min-w-28 px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                        {formatLabel(payment?.method)}
                      </TableCell>
                      <TableCell className="min-w-32 px-4 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                        {formatCurrency(payment?.amount)}
                      </TableCell>
                      <TableCell className="min-w-36 px-4 py-4 text-sm text-gray-700 dark:text-gray-300">
                        <p>{formatCurrency(refund.refundAmount)} refunded</p>
                        <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                          {formatCurrency(refund.remainingAmount)} remaining
                        </p>
                      </TableCell>
                      <TableCell className="min-w-40 px-4 py-4">
                        <StatusBadge value={getDisplayStatus(payment)} />
                      </TableCell>
                      <TableCell className="min-w-52 px-4 py-4 text-sm whitespace-nowrap text-gray-500 dark:text-gray-400">
                        {formatDateTime(
                          normalizeText(payment?.paidAt) || payment?.createdAt
                        )}
                      </TableCell>
                      <TableCell className="px-4 py-4 pr-5 text-right sm:pr-6">
                        <div className="flex justify-end gap-2">
                          {refund.isEligible && (
                            <button
                              type="button"
                              title="Refund Payment"
                              onClick={() => onRefund(payment)}
                              className="relative inline-flex size-9 items-center justify-center rounded-lg border border-warning-300 bg-white text-warning-700 shadow-theme-xs transition hover:bg-warning-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-warning-500 dark:border-warning-500/40 dark:bg-gray-800 dark:text-warning-400 dark:hover:bg-warning-500/10"
                            >
                              <span className="sr-only">Refund Payment</span>
                              <RefundIcon />
                            </button>
                          )}
                          <button
                            type="button"
                            title="View Payment details"
                            onClick={() => onView(payment)}
                            className="relative inline-flex size-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 shadow-theme-xs transition hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                          >
                            <span className="sr-only">View Payment details</span>
                            <ViewIcon />
                          </button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </div>
      )}

      {!isLoading && !hasRows && (
        <div className="px-6 py-14 text-center">
          <div className="mx-auto max-w-md">
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {isSearchActive
                ? "No payments on this page match your search."
                : hasServerFilters
                  ? "No payments match the selected filters."
                  : "No payments found."}
            </p>
          </div>
        </div>
      )}

      {!isLoading && totalItems > 0 && (
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          totalItems={totalItems}
          pageSize={pageSize}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}

export default PaymentsTable;
