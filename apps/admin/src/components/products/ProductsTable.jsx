import { useState } from "react";

import { PencilIcon, TrashIcon } from "../../icons/index.js";

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
const ACTION_KEYS = ["approve", "reject", "toggle", "archive"];

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
});

const integerFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

const badgeClasses = {
  neutral:
    "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  success:
    "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
  warning:
    "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400",
  error:
    "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400",
};

const actionButtonClasses = {
  neutral:
    "hover:border-gray-400 hover:bg-gray-50 hover:text-gray-700 focus-visible:outline-gray-500 dark:hover:border-gray-600 dark:hover:bg-gray-700 dark:hover:text-gray-200",
  brand:
    "hover:border-brand-300 hover:bg-brand-50 hover:text-brand-600 focus-visible:outline-brand-500 dark:hover:border-brand-700 dark:hover:bg-brand-500/10 dark:hover:text-brand-400",
  success:
    "hover:border-success-300 hover:bg-success-50 hover:text-success-700 focus-visible:outline-success-500 dark:hover:border-success-500/40 dark:hover:bg-success-500/10 dark:hover:text-success-400",
  warning:
    "hover:border-warning-300 hover:bg-warning-50 hover:text-warning-700 focus-visible:outline-warning-500 dark:hover:border-warning-500/40 dark:hover:bg-warning-500/10 dark:hover:text-warning-400",
  error:
    "hover:border-error-300 hover:bg-error-50 hover:text-error-600 focus-visible:outline-error-500 dark:hover:border-error-800 dark:hover:bg-error-500/10 dark:hover:text-error-400",
};

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeProductId(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return normalizeText(value);
}

function getProductId(product) {
  return normalizeProductId(product?._id ?? product?.id);
}

function getImageUrl(image) {
  if (typeof image === "string") {
    return normalizeText(image);
  }

  if (!image || typeof image !== "object") {
    return "";
  }

  return (
    normalizeText(image.url) ||
    normalizeText(image.secure_url) ||
    normalizeText(image.secureUrl) ||
    normalizeText(image.src)
  );
}

function getFirstProductImage(images) {
  if (!Array.isArray(images)) {
    return "";
  }

  return images.map(getImageUrl).find(Boolean) || "";
}

function ProductImagePlaceholder({ productName }) {
  return (
    <>
      <span className="sr-only">No image available for {productName}</span>

      <svg
        width="22"
        height="22"
        viewBox="0 0 24 24"
        fill="none"
        className="text-gray-400 dark:text-gray-500"
        aria-hidden="true"
      >
        <path
          d="M4 16.5L8.25 12.25C8.66421 11.8358 9.33579 11.8358 9.75 12.25L12 14.5L14.25 12.25C14.6642 11.8358 15.3358 11.8358 15.75 12.25L20 16.5M8.5 8.5H8.51M5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </>
  );
}

function ProductThumbnail({ images, productName }) {
  const imageUrl = getFirstProductImage(images);
  const [failedImageUrl, setFailedImageUrl] = useState("");
  const showImage = imageUrl && failedImageUrl !== imageUrl;

  return (
    <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-800">
      {showImage ? (
        <img
          src={imageUrl}
          alt={`${productName} thumbnail`}
          width="48"
          height="48"
          onError={() => setFailedImageUrl(imageUrl)}
          className="h-full w-full object-cover"
        />
      ) : (
        <ProductImagePlaceholder productName={productName} />
      )}
    </div>
  );
}

function getSellerLabel(seller) {
  if (!seller || typeof seller !== "object") {
    return "Platform managed";
  }

  return (
    normalizeText(seller.shopName) ||
    normalizeText(seller.storeName) ||
    normalizeText(seller.businessName) ||
    normalizeText(seller.name) ||
    normalizeText(seller.fullName) ||
    normalizeText(seller.user?.name) ||
    normalizeText(seller.email) ||
    "Platform managed"
  );
}

function getRelationName(relation, fallback) {
  if (relation && typeof relation === "object") {
    return (
      normalizeText(relation.name) ||
      normalizeText(relation.title) ||
      normalizeText(relation.label) ||
      fallback
    );
  }

  return normalizeText(relation) || fallback;
}

function getNonNegativeNumber(value) {
  if (
    value === null ||
    value === undefined ||
    (typeof value === "string" && !value.trim())
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) && number >= 0 ? number : null;
}

function formatCurrency(value) {
  const number = getNonNegativeNumber(value);

  return number === null ? EMPTY_VALUE : currencyFormatter.format(number);
}

function getStockState(value) {
  const stock = getNonNegativeNumber(value);

  if (stock === null || !Number.isInteger(stock)) {
    return null;
  }

  if (stock === 0) {
    return { label: "Out of stock", tone: "error" };
  }

  if (stock <= 10) {
    return {
      label: `Low stock (${integerFormatter.format(stock)})`,
      tone: "warning",
    };
  }

  return {
    label: `In stock (${integerFormatter.format(stock)})`,
    tone: "success",
  };
}

function getApprovalState(value) {
  const status = normalizeText(value).toLowerCase();

  if (status === "approved") {
    return { status, label: "Approved", tone: "success" };
  }

  if (status === "pending") {
    return { status, label: "Pending", tone: "warning" };
  }

  if (status === "rejected") {
    return { status, label: "Rejected", tone: "error" };
  }

  return { status: "unknown", label: "Unknown", tone: "neutral" };
}

function getAvailabilityState(value) {
  if (value === true || value === "true") {
    return { isActive: true, label: "Active", tone: "success" };
  }

  if (value === false || value === "false") {
    return { isActive: false, label: "Inactive", tone: "neutral" };
  }

  return { isActive: false, label: "Unknown", tone: "neutral" };
}

function StatusBadge({ label, tone = "neutral" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${badgeClasses[tone]}`}
    >
      {label}
    </span>
  );
}

function LoadingIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="size-5 animate-spin"
      aria-hidden="true"
    >
      <circle
        cx="12"
        cy="12"
        r="9"
        stroke="currentColor"
        strokeWidth="2"
        className="opacity-25"
      />
      <path
        d="M21 12A9 9 0 0 0 12 3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ViewIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="size-5"
      aria-hidden="true"
    >
      <path
        d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle
        cx="12"
        cy="12"
        r="2.75"
        stroke="currentColor"
        strokeWidth="1.7"
      />
    </svg>
  );
}

function ApproveIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
      <path
        d="M5 12.5L9.25 16.5L19 7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RejectIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
      <path
        d="M7 7L17 17M17 7L7 17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AvailabilityIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
      <path
        d="M12 3V12M7.05 5.93A8 8 0 1 0 16.95 5.93"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ActionButton({
  label,
  tone = "neutral",
  isPending = false,
  disabled = false,
  onClick = () => {},
  children,
}) {
  return (
    <button
      type="button"
      title={label}
      disabled={disabled}
      aria-busy={isPending || undefined}
      onClick={onClick}
      className={`relative inline-flex size-9 shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white text-gray-500 shadow-theme-xs transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 ${actionButtonClasses[tone]}`}
    >
      {isPending ? <LoadingIcon /> : children}

      <span className="sr-only">{label}</span>
    </button>
  );
}

function ProductTableSkeleton() {
  return Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
    <TableRow key={index}>
      <TableCell className="px-5 py-4 sm:px-6">
        <div className="flex min-w-64 items-center gap-3">
          <div className="size-12 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
          <div className="space-y-2">
            <div className="h-4 w-36 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
            <div className="h-3 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          </div>
        </div>
      </TableCell>

      <TableCell className="px-4 py-4">
        <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
      </TableCell>

      <TableCell className="px-4 py-4">
        <div className="h-6 w-24 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
      </TableCell>

      <TableCell className="px-4 py-4">
        <div className="space-y-2">
          <div className="h-4 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          <div className="h-3 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        </div>
      </TableCell>

      <TableCell className="px-4 py-4">
        <div className="h-6 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
      </TableCell>

      <TableCell className="px-4 py-4">
        <div className="h-6 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
      </TableCell>

      <TableCell className="px-5 py-4 text-right sm:px-6">
        <div className="ml-auto flex justify-end gap-2">
          {Array.from({ length: 5 }, (_, actionIndex) => (
            <div
              key={actionIndex}
              className="size-9 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800"
            />
          ))}
        </div>
      </TableCell>
    </TableRow>
  ));
}

function ProductsTable({
  products = [],
  isLoading = false,
  hasActiveFilters = false,
  onView = () => {},
  onEdit = () => {},
  onApprove = () => {},
  onReject = () => {},
  onToggleAvailability = () => {},
  onArchive = () => {},
  pendingActions = {},
  mutationTargetIds = {},
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange = () => {},
}) {
  const hasProducts = products.length > 0;

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
      {(isLoading || hasProducts) && (
        <div className="custom-scrollbar max-w-full overflow-x-auto overflow-y-hidden">
          <Table className="min-w-[1240px]">
          <TableHeader className="border-b border-gray-100 dark:border-white/5">
            <TableRow>
              <TableCell
                isHeader
                scope="col"
                className="px-5 py-3 text-left text-theme-xs font-medium text-gray-500 sm:px-6 dark:text-gray-400"
              >
                Product
              </TableCell>

              <TableCell
                isHeader
                scope="col"
                className="px-4 py-3 text-left text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Price
              </TableCell>

              <TableCell
                isHeader
                scope="col"
                className="px-4 py-3 text-left text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Stock
              </TableCell>

              <TableCell
                isHeader
                scope="col"
                className="px-4 py-3 text-left text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Category
              </TableCell>

              <TableCell
                isHeader
                scope="col"
                className="px-4 py-3 text-left text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Approval
              </TableCell>

              <TableCell
                isHeader
                scope="col"
                className="px-4 py-3 text-left text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Availability
              </TableCell>

              <TableCell
                isHeader
                scope="col"
                className="px-5 py-3 text-right text-theme-xs font-medium text-gray-500 sm:px-6 dark:text-gray-400"
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
            {isLoading && <ProductTableSkeleton />}

            {!isLoading &&
              hasProducts &&
              products.map((product) => {
                const productId = getProductId(product);
                const productName =
                  normalizeText(product?.name) || "Unnamed product";
                const productKey =
                  productId ||
                  `${productName}-${normalizeText(product?.createdAt) || "unknown"}`;
                const sellerLabel = getSellerLabel(product?.seller);
                const currentPrice = getNonNegativeNumber(product?.price);
                const originalPrice = getNonNegativeNumber(
                  product?.originalPrice
                );
                const showOriginalPrice =
                  currentPrice !== null &&
                  originalPrice !== null &&
                  originalPrice > currentPrice;
                const stockState = getStockState(product?.stock);
                const approvalState = getApprovalState(
                  product?.approvalStatus
                );
                const availabilityState = getAvailabilityState(
                  product?.isActive
                );
                const exactPendingActions = ACTION_KEYS.reduce(
                  (actions, action) => {
                    actions[action] =
                      pendingActions[action] === true &&
                      productId !== "" &&
                      normalizeProductId(mutationTargetIds[action]) ===
                        productId;
                    return actions;
                  },
                  {}
                );
                const isRowPending = ACTION_KEYS.some(
                  (action) => exactPendingActions[action]
                );
                const hasUsableProductId = productId !== "";
                const showApprove =
                  approvalState.status === "pending" ||
                  approvalState.status === "rejected";
                const showReject =
                  approvalState.status === "pending" ||
                  approvalState.status === "approved";
                const showToggle =
                  approvalState.status === "approved" &&
                  product?.isDeleted !== true;
                const toggleLabel = availabilityState.isActive
                  ? `Deactivate ${productName}`
                  : `Activate ${productName}`;

                return (
                  <TableRow
                    key={productKey}
                    className="transition-colors hover:bg-gray-50 dark:hover:bg-white/2"
                  >
                    <TableCell className="px-5 py-4 sm:px-6">
                      <div className="flex min-w-64 max-w-72 items-center gap-3">
                        <ProductThumbnail
                          images={product?.images}
                          productName={productName}
                        />

                        <div className="min-w-0">
                          <p
                            title={productName}
                            className="truncate font-medium text-gray-800 dark:text-white/90"
                          >
                            {productName}
                          </p>
                          <p
                            title={sellerLabel}
                            className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400"
                          >
                            {sellerLabel}
                          </p>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="min-w-36 px-4 py-4 text-theme-sm">
                      <p className="font-medium text-gray-800 dark:text-white/90">
                        {formatCurrency(product?.price)}
                      </p>
                      {showOriginalPrice && (
                        <p className="mt-0.5 text-xs text-gray-500 line-through dark:text-gray-400">
                          {formatCurrency(product?.originalPrice)}
                        </p>
                      )}
                    </TableCell>

                    <TableCell className="min-w-36 px-4 py-4 text-theme-sm text-gray-500 dark:text-gray-400">
                      {stockState ? (
                        <StatusBadge
                          label={stockState.label}
                          tone={stockState.tone}
                        />
                      ) : (
                        EMPTY_VALUE
                      )}
                    </TableCell>

                    <TableCell className="min-w-52 max-w-60 px-4 py-4 text-theme-sm">
                      <p className="break-words text-gray-700 dark:text-gray-300">
                        {getRelationName(
                          product?.category,
                          "Unknown category"
                        )}
                      </p>
                      <p className="mt-0.5 break-words text-xs text-gray-500 dark:text-gray-400">
                        {getRelationName(
                          product?.subcategory,
                          "Unknown subcategory"
                        )}
                      </p>
                    </TableCell>

                    <TableCell className="min-w-28 px-4 py-4">
                      <StatusBadge
                        label={approvalState.label}
                        tone={approvalState.tone}
                      />
                    </TableCell>

                    <TableCell className="min-w-32 px-4 py-4">
                      <StatusBadge
                        label={availabilityState.label}
                        tone={availabilityState.tone}
                      />
                    </TableCell>

                    <TableCell className="px-5 py-4 text-right sm:px-6">
                      <div
                        className="ml-auto flex min-w-56 items-center justify-end gap-2"
                        aria-busy={isRowPending || undefined}
                      >
                        <ActionButton
                          label={`View ${productName}`}
                          disabled={!hasUsableProductId || isRowPending}
                          onClick={() => onView(product)}
                        >
                          <ViewIcon />
                        </ActionButton>

                        <ActionButton
                          label={`Edit ${productName}`}
                          tone="brand"
                          disabled={!hasUsableProductId || isRowPending}
                          onClick={() => onEdit(product)}
                        >
                          <PencilIcon className="size-5" aria-hidden="true" />
                        </ActionButton>

                        {showApprove && (
                          <ActionButton
                            label={
                              exactPendingActions.approve
                                ? `Approving ${productName}`
                                : `Approve ${productName}`
                            }
                            tone="success"
                            isPending={exactPendingActions.approve}
                            disabled={
                              !hasUsableProductId ||
                              isRowPending ||
                              pendingActions.approve === true
                            }
                            onClick={() => onApprove(product)}
                          >
                            <ApproveIcon />
                          </ActionButton>
                        )}

                        {showToggle && (
                          <ActionButton
                            label={
                              exactPendingActions.toggle
                                ? `${
                                    availabilityState.isActive
                                      ? "Deactivating"
                                      : "Activating"
                                  } ${productName}`
                                : toggleLabel
                            }
                            tone={
                              availabilityState.isActive
                                ? "warning"
                                : "success"
                            }
                            isPending={exactPendingActions.toggle}
                            disabled={
                              !hasUsableProductId ||
                              isRowPending ||
                              pendingActions.toggle === true
                            }
                            onClick={() => onToggleAvailability(product)}
                          >
                            <AvailabilityIcon />
                          </ActionButton>
                        )}

                        {showReject && (
                          <ActionButton
                            label={
                              exactPendingActions.reject
                                ? `Rejecting ${productName}`
                                : `Reject ${productName}`
                            }
                            tone="error"
                            isPending={exactPendingActions.reject}
                            disabled={
                              !hasUsableProductId ||
                              isRowPending ||
                              pendingActions.reject === true
                            }
                            onClick={() => onReject(product)}
                          >
                            <RejectIcon />
                          </ActionButton>
                        )}

                        <ActionButton
                          label={
                            exactPendingActions.archive
                              ? `Archiving ${productName}`
                              : `Archive ${productName}`
                          }
                          tone="error"
                          isPending={exactPendingActions.archive}
                          disabled={
                            !hasUsableProductId ||
                            isRowPending ||
                            pendingActions.archive === true
                          }
                          onClick={() => onArchive(product)}
                        >
                          <TrashIcon className="size-5" aria-hidden="true" />
                        </ActionButton>
                      </div>
                    </TableCell>
                  </TableRow>
                );
              })}

          </TableBody>
          </Table>
        </div>
      )}

      {!isLoading && !hasProducts && (
        <div className="px-6 py-14 text-center">
          <div className="mx-auto max-w-sm">
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {hasActiveFilters
                ? "No matching products"
                : "No products found"}
            </p>

            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {hasActiveFilters
                ? "Try changing the search term or Product filters."
                : "Products will appear here after they are added."}
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

export default ProductsTable;
