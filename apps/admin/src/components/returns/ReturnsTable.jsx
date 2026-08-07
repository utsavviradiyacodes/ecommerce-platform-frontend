import { useState } from "react";

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

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const STATUS_TONES = {
  requested: "warning",
  approved: "brand",
  rejected: "error",
  refunded: "success",
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

function isValidReturnId(value) {
  return /^[0-9a-fA-F]{24}$/.test(value);
}

function getNonNegativeNumber(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
}

function getPositiveInteger(value) {
  return Number.isInteger(value) && value > 0 ? value : null;
}

function formatCurrency(value) {
  const number = getNonNegativeNumber(value);

  return number === null ? EMPTY_VALUE : currencyFormatter.format(number);
}

function formatDate(value) {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    return EMPTY_VALUE;
  }

  const date = new Date(normalizedValue);

  return Number.isNaN(date.getTime()) ? EMPTY_VALUE : dateFormatter.format(date);
}

function formatShortId(value, fallback = EMPTY_VALUE) {
  const id = getEntityId(value);

  return id ? `#${id.slice(-8).toUpperCase()}` : fallback;
}

function formatStatusLabel(value) {
  const normalizedValue = normalizeText(value).toLowerCase();

  return normalizedValue
    ? normalizedValue.charAt(0).toUpperCase() + normalizedValue.slice(1)
    : "Unknown";
}

function ReturnStatusBadge({ value }) {
  const normalizedValue = normalizeText(value).toLowerCase();
  const tone = STATUS_TONES[normalizedValue] ?? "neutral";

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${BADGE_CLASSES[tone]}`}
    >
      {formatStatusLabel(normalizedValue)}
    </span>
  );
}

function ProductThumbnail({ src, name }) {
  const normalizedSource = normalizeText(src);
  const [failedSource, setFailedSource] = useState("");
  const hasError = Boolean(
    normalizedSource && failedSource === normalizedSource
  );

  if (!normalizedSource || hasError) {
    return (
      <div className="flex size-11 shrink-0 items-center justify-center rounded-lg bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500">
        <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
          <path
            d="M4 7.5L12 3L20 7.5V16.5L12 21L4 16.5V7.5Z"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinejoin="round"
          />
          <path d="M4.5 7.75L12 12L19.5 7.75M12 12V20.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
        </svg>
      </div>
    );
  }

  return (
    <img
      src={normalizedSource}
      alt={name ? `${name} product` : "Returned Product"}
      className="size-11 shrink-0 rounded-lg border border-gray-200 object-cover dark:border-gray-700"
      onError={() => setFailedSource(normalizedSource)}
    />
  );
}

function ViewIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden="true">
      <path d="M2.75 12C4.55 7.95 7.58 5.75 12 5.75C16.42 5.75 19.45 7.95 21.25 12C19.45 16.05 16.42 18.25 12 18.25C7.58 18.25 4.55 16.05 2.75 12Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
      <circle cx="12" cy="12" r="2.75" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

function ApproveIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden="true">
      <path d="M5 12.5L9.25 16.5L19 7" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RejectIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-4" aria-hidden="true">
      <path d="M7 7L17 17M17 7L7 17" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" />
    </svg>
  );
}

function ReturnsTableSkeleton() {
  return Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
    <TableRow key={index}>
      {Array.from({ length: 9 }, (_, cellIndex) => (
        <TableCell
          key={cellIndex}
          className="px-4 py-4 first:pl-5 last:pr-5 sm:first:pl-6 sm:last:pr-6"
        >
          <div
            className={`h-4 animate-pulse rounded bg-gray-200 dark:bg-gray-800 ${
              cellIndex === 8 ? "ml-auto w-24" : "w-24"
            }`}
          />
          {cellIndex < 5 && (
            <div className="mt-2 h-3 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          )}
        </TableCell>
      ))}
    </TableRow>
  ));
}

function ReturnsTable({
  returns = [],
  isLoading = false,
  isSearchActive = false,
  hasStatusFilter = false,
  currentPage = 1,
  totalPages = 0,
  totalItems = 0,
  pageSize = 10,
  approveTargetId = "",
  rejectTargetId = "",
  isApprovePending = false,
  isRejectPending = false,
  onPageChange = () => {},
  onView = () => {},
  onApprove = () => {},
  onReject = () => {},
}) {
  const hasRows = returns.length > 0;

  return (
    <div className="w-full min-w-0 max-w-full rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
      {(isLoading || hasRows) && (
        <div className="custom-scrollbar max-w-full overflow-x-auto">
          <Table className="min-w-[1580px]">
            <TableHeader className="border-b border-gray-100 dark:border-white/5">
              <TableRow>
                {[
                  "Return",
                  "Order",
                  "Product",
                  "Customer",
                  "Seller",
                  "Quantity",
                  "Refund",
                  "Status",
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
              {isLoading && <ReturnsTableSkeleton />}
              {!isLoading &&
                returns.map((returnRequest, index) => {
                  const returnId = getEntityId(returnRequest);
                  const orderRelation = returnRequest?.order ?? null;
                  const productRelation = returnRequest?.product ?? null;
                  const customerRelation = returnRequest?.customer ?? null;
                  const sellerRelation = returnRequest?.seller ?? null;
                  const order = normalizeObject(orderRelation);
                  const product = normalizeObject(productRelation);
                  const customer = normalizeObject(customerRelation);
                  const seller = normalizeObject(sellerRelation);
                  const orderId = getEntityId(orderRelation);
                  const productId = getEntityId(productRelation);
                  const customerId = getEntityId(customerRelation);
                  const sellerId = getEntityId(sellerRelation);
                  const productName = normalizeText(product?.name);
                  const customerName = normalizeText(customer?.name);
                  const customerSecondary =
                    normalizeText(customer?.email) || normalizeText(customer?.phone);
                  const sellerShopName = normalizeText(seller?.shopName);
                  const sellerName = normalizeText(seller?.name);
                  const sellerPrimary = sellerShopName || sellerName;
                  const sellerSecondary = sellerShopName ? sellerName : "";
                  const productImages = Array.isArray(product?.images)
                    ? product.images
                    : [];
                  const status = normalizeText(returnRequest?.status).toLowerCase();
                  const isRequested = status === "requested";
                  const hasValidId = isValidReturnId(returnId);
                  const isThisApprovePending =
                    isApprovePending && approveTargetId === returnId;
                  const isThisRejectPending =
                    isRejectPending && rejectTargetId === returnId;
                  const hasConflictingMutation =
                    isThisApprovePending || isThisRejectPending;

                  return (
                    <TableRow
                      key={returnId || `return-row-${index}`}
                      className="transition-colors hover:bg-gray-50 dark:hover:bg-white/2"
                    >
                      <TableCell className="min-w-48 max-w-60 px-4 py-4 pl-5 sm:pl-6">
                        <p className="break-all font-medium text-gray-800 dark:text-white/90" title={returnId || undefined}>
                          {formatShortId(returnId, "Return ID unavailable")}
                        </p>
                        <p className="mt-0.5 text-xs whitespace-nowrap text-gray-500 dark:text-gray-400">
                          {formatDate(returnRequest?.createdAt)}
                        </p>
                      </TableCell>

                      <TableCell className="min-w-48 max-w-60 px-4 py-4">
                        <p className="break-all text-sm font-medium text-gray-700 dark:text-gray-300" title={orderId || undefined}>
                          {formatShortId(orderId, "Order unavailable")}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                          {order
                            ? `${formatCurrency(order.totalPrice)} \u00b7 ${formatStatusLabel(order.paymentStatus)}`
                            : "Order details unavailable"}
                        </p>
                      </TableCell>

                      <TableCell className="min-w-64 max-w-80 px-4 py-4">
                        <div className="flex min-w-0 items-center gap-3">
                          <ProductThumbnail src={productImages[0]} name={productName} />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-700 dark:text-gray-300" title={productName || productId || undefined}>
                              {productName || productId || "Product unavailable"}
                            </p>
                            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                              Current price: {product ? formatCurrency(product.price) : EMPTY_VALUE}
                            </p>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="min-w-60 max-w-72 px-4 py-4">
                        <p className="truncate text-sm font-medium text-gray-700 dark:text-gray-300" title={customerName || customerId || undefined}>
                          {customerName || customerId || "Customer unavailable"}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400" title={customerSecondary || undefined}>
                          {customerSecondary || "Contact unavailable"}
                        </p>
                      </TableCell>

                      <TableCell className="min-w-52 max-w-64 px-4 py-4">
                        <p className="truncate text-sm font-medium text-gray-700 dark:text-gray-300" title={sellerPrimary || sellerId || undefined}>
                          {sellerPrimary || sellerId || "Seller unavailable"}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400" title={sellerSecondary || undefined}>
                          {sellerSecondary || (sellerPrimary ? "Seller" : "Details unavailable")}
                        </p>
                      </TableCell>

                      <TableCell className="min-w-24 px-4 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                        {getPositiveInteger(returnRequest?.quantity) ?? EMPTY_VALUE}
                      </TableCell>

                      <TableCell className="min-w-36 px-4 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                        {formatCurrency(returnRequest?.refundAmount)}
                      </TableCell>

                      <TableCell className="min-w-32 px-4 py-4">
                        <ReturnStatusBadge value={status} />
                      </TableCell>

                      <TableCell className="px-4 py-4 pr-5 text-right sm:pr-6">
                        <div className="flex justify-end gap-2">
                          {isRequested && hasValidId && (
                            <>
                              <button
                                type="button"
                                title="Approve and refund Return"
                                onClick={() => onApprove(returnRequest)}
                                disabled={hasConflictingMutation}
                                className="relative inline-flex size-9 items-center justify-center rounded-lg border border-success-300 bg-white text-success-700 shadow-theme-xs transition hover:bg-success-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-success-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-success-500/40 dark:bg-gray-800 dark:text-success-400 dark:hover:bg-success-500/10"
                              >
                                <span className="sr-only">Approve and refund Return</span>
                                <ApproveIcon />
                              </button>
                              <button
                                type="button"
                                title="Reject Return"
                                onClick={() => onReject(returnRequest)}
                                disabled={hasConflictingMutation}
                                className="relative inline-flex size-9 items-center justify-center rounded-lg border border-error-300 bg-white text-error-700 shadow-theme-xs transition hover:bg-error-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error-500 disabled:cursor-not-allowed disabled:opacity-50 dark:border-error-500/40 dark:bg-gray-800 dark:text-error-400 dark:hover:bg-error-500/10"
                              >
                                <span className="sr-only">Reject Return</span>
                                <RejectIcon />
                              </button>
                            </>
                          )}
                          {hasValidId && (
                            <button
                              type="button"
                              title="View Return details"
                              onClick={() => onView(returnRequest)}
                              className="relative inline-flex size-9 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-700 shadow-theme-xs transition hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
                            >
                              <span className="sr-only">View Return details</span>
                              <ViewIcon />
                            </button>
                          )}
                          {!hasValidId && <span className="text-sm text-gray-400">{EMPTY_VALUE}</span>}
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
                ? "No Returns on this page match your search."
                : hasStatusFilter
                  ? "No Returns match the selected status."
                  : "No Returns found."}
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

export { ReturnStatusBadge };
export default ReturnsTable;
