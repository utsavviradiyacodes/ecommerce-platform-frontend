import { useState } from "react";
import { Link } from "react-router";

import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table/Table.jsx";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const BADGE_CLASSES = {
  neutral: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
  success:
    "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
  warning:
    "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400",
  error: "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400",
};

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
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

function getRelationName(relation) {
  if (relation && typeof relation === "object") {
    return (
      normalizeText(relation.name) ||
      normalizeText(relation.title) ||
      "Uncategorized"
    );
  }

  return normalizeText(relation) || "Uncategorized";
}

function formatCurrency(value) {
  if (
    value === null ||
    value === undefined ||
    (typeof value === "string" && !value.trim())
  ) {
    return "—";
  }

  const number = Number(value);

  return Number.isFinite(number) && number >= 0
    ? currencyFormatter.format(number)
    : "—";
}

function getApprovalState(value) {
  const status = normalizeText(value).toLowerCase();

  if (status === "approved") {
    return {
      label: "Approved",
      tone: "success",
    };
  }

  if (status === "pending") {
    return {
      label: "Pending",
      tone: "warning",
    };
  }

  if (status === "rejected") {
    return {
      label: "Rejected",
      tone: "error",
    };
  }

  return {
    label: "Unknown",
    tone: "neutral",
  };
}

function getAvailabilityState(value) {
  if (value === true || value === "true") {
    return {
      label: "Active",
      tone: "success",
    };
  }

  if (value === false || value === "false") {
    return {
      label: "Inactive",
      tone: "neutral",
    };
  }

  return {
    label: "Unknown",
    tone: "neutral",
  };
}

function StatusBadge({ label, tone = "neutral" }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium whitespace-nowrap ${
        BADGE_CLASSES[tone] ?? BADGE_CLASSES.neutral
      }`}
    >
      {label}
    </span>
  );
}

function ProductImagePlaceholder() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="size-6 text-gray-400 dark:text-gray-500"
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
  );
}

function RecentProductThumbnail({ product }) {
  const productName = normalizeText(product?.name) || "Product";
  const imageUrl = getFirstProductImage(product?.images);
  const [failedImageUrl, setFailedImageUrl] = useState("");

  const shouldShowImage = Boolean(imageUrl) && failedImageUrl !== imageUrl;

  return (
    <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-800">
      {shouldShowImage ? (
        <img
          src={imageUrl}
          alt={`${productName} thumbnail`}
          width="48"
          height="48"
          onError={() => setFailedImageUrl(imageUrl)}
          className="h-full w-full object-cover"
        />
      ) : (
        <ProductImagePlaceholder />
      )}
    </div>
  );
}

function RecentProductsSkeleton() {
  return (
    <div className="custom-scrollbar overflow-x-auto overflow-y-hidden">
      <div className="min-w-190">
        <div className="border-t border-gray-100 dark:border-gray-800">
          {Array.from({ length: 5 }, (_, index) => (
            <div
              key={index}
              className="grid grid-cols-[2fr_1.2fr_1fr_1fr_1fr] items-center gap-5 border-b border-gray-100 px-5 py-4 sm:px-6 dark:border-gray-800"
            >
              <div className="flex items-center gap-3">
                <div className="size-12 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />

                <div className="min-w-0 flex-1">
                  <div className="h-4 w-36 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                  <div className="mt-2 h-3 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
                </div>
              </div>

              {Array.from({ length: 4 }, (_, cellIndex) => (
                <div
                  key={cellIndex}
                  className="h-5 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-800"
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function RecentProducts({
  products = [],
  total = 0,
  isLoading = false,
  error = "",
  onRetry = () => {},
  canViewAllProducts = false,
}) {
  const hasProducts = products.length > 0;

  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/3">
      <div className="flex min-w-0 flex-col gap-3 px-5 py-5 sm:flex-row sm:items-start sm:justify-between sm:px-6 sm:py-6">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Recent Products
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            The latest Products added to Sellora’s marketplace catalog.
          </p>
        </div>

        {canViewAllProducts && (
          <Link
            to="/admin/products"
            onClick={() =>
              window.scrollTo({ top: 0, left: 0, behavior: "auto" })
            }
            className="inline-flex w-fit shrink-0 items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-theme-xs transition hover:bg-gray-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:border-gray-700 dark:bg-transparent dark:text-gray-300 dark:hover:bg-white/5"
          >
            View all Products
          </Link>
        )}
      </div>

      {error && !hasProducts ? (
        <div className="border-t border-gray-100 px-5 py-6 sm:px-6 dark:border-gray-800">
          <div
            role="alert"
            className="min-w-0 wrap-break-word whitespace-pre-wrap rounded-xl border border-error-200 bg-error-50 px-4 py-4 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400"
          >
            <p>{error}</p>

            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex items-center justify-center rounded-lg border border-error-300 bg-white px-3 py-2 text-sm font-medium shadow-theme-xs transition hover:bg-error-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error-500 dark:border-error-500/40 dark:bg-transparent dark:hover:bg-error-500/10"
            >
              Try again
            </button>
          </div>
        </div>
      ) : (
        <>
          {error && hasProducts && (
            <div className="mx-5 mb-4 min-w-0 wrap-break-word whitespace-pre-wrap rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-xs text-warning-700 sm:mx-6 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-400">
              Recent Products could not be refreshed. Displaying previously
              loaded data.
            </div>
          )}

          {isLoading && !hasProducts ? (
            <RecentProductsSkeleton />
          ) : hasProducts ? (
            <div className="custom-scrollbar min-w-0 overflow-x-auto overflow-y-hidden">
              <div className="min-w-190">
                <Table>
                  <TableHeader className="border-y border-gray-100 dark:border-gray-800">
                    <TableRow>
                      <TableCell
                        isHeader
                        className="px-5 py-3 text-start text-xs font-medium text-gray-500 sm:px-6 dark:text-gray-400"
                      >
                        Product
                      </TableCell>

                      <TableCell
                        isHeader
                        className="px-5 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400"
                      >
                        Category
                      </TableCell>

                      <TableCell
                        isHeader
                        className="px-5 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400"
                      >
                        Price
                      </TableCell>

                      <TableCell
                        isHeader
                        className="px-5 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400"
                      >
                        Approval
                      </TableCell>

                      <TableCell
                        isHeader
                        className="px-5 py-3 text-start text-xs font-medium text-gray-500 dark:text-gray-400"
                      >
                        Availability
                      </TableCell>
                    </TableRow>
                  </TableHeader>

                  <TableBody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {products.map((product, index) => {
                      const productId =
                        normalizeText(product?._id) ||
                        normalizeText(product?.id) ||
                        `recent-product-${index}`;

                      const productName =
                        normalizeText(product?.name) || "Unnamed product";

                      const approval = getApprovalState(
                        product?.approvalStatus
                      );

                      const availability = getAvailabilityState(
                        product?.isActive
                      );

                      return (
                        <TableRow key={productId}>
                          <TableCell className="px-5 py-4 sm:px-6">
                            <div className="flex min-w-0 items-center gap-3">
                              <RecentProductThumbnail product={product} />

                              <div className="min-w-0">
                                <p className="max-w-70 truncate text-sm font-medium text-gray-800 dark:text-white/90">
                                  {productName}
                                </p>

                                <p className="mt-1 max-w-70 truncate text-xs text-gray-500 dark:text-gray-400">
                                  {getRelationName(product?.subcategory)}
                                </p>
                              </div>
                            </div>
                          </TableCell>

                          <TableCell className="px-5 py-4 text-sm text-gray-600 dark:text-gray-300">
                            {getRelationName(product?.category)}
                          </TableCell>

                          <TableCell className="px-5 py-4 text-sm font-medium text-gray-800 dark:text-white/90">
                            {formatCurrency(product?.price)}
                          </TableCell>

                          <TableCell className="px-5 py-4">
                            <StatusBadge
                              label={approval.label}
                              tone={approval.tone}
                            />
                          </TableCell>

                          <TableCell className="px-5 py-4">
                            <StatusBadge
                              label={availability.label}
                              tone={availability.tone}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : (
            <div className="border-t border-gray-100 px-5 py-12 text-center sm:px-6 dark:border-gray-800">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                No Products are available yet.
              </p>

              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Newly added Products will appear here.
              </p>
            </div>
          )}

          {!(isLoading && !hasProducts) && (
            <div className="flex min-w-0 items-center justify-between gap-3 border-t border-gray-100 px-5 py-4 text-xs text-gray-500 sm:px-6 dark:border-gray-800 dark:text-gray-400">
              <span>
                Showing {products.length} recent{" "}
                {products.length === 1 ? "Product" : "Products"}
              </span>

              <span>{total.toLocaleString("en-IN")} total</span>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export default RecentProducts;
