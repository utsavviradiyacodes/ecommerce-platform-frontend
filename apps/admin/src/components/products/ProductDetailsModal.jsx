import { useId, useState } from "react";

import Button from "../ui/button/Button.jsx";
import Modal from "../ui/modal/Modal.jsx";

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
});

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

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
    normalizeText(image.src)
  );
}

function getProductImageUrls(product) {
  if (!Array.isArray(product?.images)) {
    return [];
  }

  return [...new Set(product.images.map(getImageUrl).filter(Boolean))];
}

function getFiniteNumber(value) {
  if (
    value === null ||
    value === undefined ||
    (typeof value === "string" && !value.trim())
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) ? number : null;
}

function getNonNegativeNumber(value) {
  const number = getFiniteNumber(value);

  return number !== null && number >= 0 ? number : null;
}

function formatCurrency(value) {
  const amount = getNonNegativeNumber(value);

  return amount === null ? "—" : currencyFormatter.format(amount);
}

function formatNonNegativeInteger(value) {
  const number = getNonNegativeNumber(value);

  return number === null || !Number.isInteger(number)
    ? "—"
    : new Intl.NumberFormat("en-IN").format(number);
}

function formatRating(value) {
  const number = getNonNegativeNumber(value);

  return number === null || number > 5
    ? "—"
    : new Intl.NumberFormat("en-IN", {
        maximumFractionDigits: 2,
      }).format(number);
}

function formatDate(value) {
  if (
    value === null ||
    value === undefined ||
    (typeof value === "string" && !value.trim())
  ) {
    return "—";
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? "—" : dateFormatter.format(date);
}

function getRelationName(relation) {
  if (relation && typeof relation === "object") {
    return normalizeText(relation.name) || normalizeText(relation.title) || "—";
  }

  return normalizeText(relation) || "—";
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
    normalizeText(seller.email) ||
    "Platform managed"
  );
}

function getAdministratorLabel(administrator) {
  if (administrator && typeof administrator === "object") {
    return (
      normalizeText(administrator.name) ||
      normalizeText(administrator.email) ||
      "Recorded administrator"
    );
  }

  return normalizeText(administrator) ? "Recorded administrator" : "—";
}

function getTags(tags) {
  const values = Array.isArray(tags)
    ? tags
    : typeof tags === "string"
      ? tags.split(",")
      : [];

  return [...new Set(values.map(normalizeText).filter(Boolean))];
}

function ProductDetailImage({ imageUrl, productName, imageNumber }) {
  const [hasFailed, setHasFailed] = useState(false);

  return (
    <div className="aspect-square min-w-0 overflow-hidden rounded-xl border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-800">
      {hasFailed ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-2 px-3 text-center text-xs text-gray-500 dark:text-gray-400">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="size-7"
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
          <span>Image unavailable</span>
        </div>
      ) : (
        <img
          src={imageUrl}
          alt={`${productName} image ${imageNumber}`}
          onError={() => setHasFailed(true)}
          className="h-full w-full object-cover"
        />
      )}
    </div>
  );
}

function DetailItem({ label, children }) {
  return (
    <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-white/2">
      <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
        {label}
      </dt>
      <dd className="mt-1 min-w-0 break-words text-sm text-gray-800 dark:text-white/90">
        {children}
      </dd>
    </div>
  );
}

function DetailsSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {Array.from({ length: 4 }, (_, index) => (
          <div
            key={index}
            className="aspect-square rounded-xl bg-gray-200 dark:bg-gray-800"
          />
        ))}
      </div>

      <div className="mt-6 h-7 w-2/3 rounded bg-gray-200 dark:bg-gray-800" />
      <div className="mt-3 h-4 w-full rounded bg-gray-200 dark:bg-gray-800" />
      <div className="mt-2 h-4 w-5/6 rounded bg-gray-200 dark:bg-gray-800" />

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 9 }, (_, index) => (
          <div
            key={index}
            className="h-20 rounded-xl bg-gray-200 dark:bg-gray-800"
          />
        ))}
      </div>
    </div>
  );
}

function ProductDetailsModal({
  isOpen,
  product = null,
  error = "",
  isLoading = false,
  onClose = () => {},
  onRetry = () => {},
}) {
  const modalId = useId();
  const modalTitleId = `${modalId}-title`;
  const modalDescriptionId = `${modalId}-description`;

  const imageUrls = getProductImageUrls(product);
  const tags = getTags(product?.tags);
  const currentPrice = getNonNegativeNumber(product?.price);
  const originalPrice = getNonNegativeNumber(product?.originalPrice);
  const showOriginalPrice =
    currentPrice !== null &&
    originalPrice !== null &&
    originalPrice > currentPrice;
  const approvalStatus = normalizeText(product?.approvalStatus).toLowerCase();
  const approvalLabel =
    approvalStatus === "approved"
      ? "Approved"
      : approvalStatus === "pending"
        ? "Pending"
        : approvalStatus === "rejected"
          ? "Rejected"
          : "Unknown";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-5xl"
      ariaLabelledBy={modalTitleId}
      ariaDescribedBy={modalDescriptionId}
    >
      <div className="flex max-h-[calc(100dvh-1.5rem)] flex-col overflow-hidden rounded-3xl sm:max-h-[calc(100dvh-3rem)]">
        <div className="shrink-0 px-5 pt-6 pr-14 pb-4 sm:px-8 sm:pt-8 sm:pr-20 sm:pb-5">
          <h3
            id={modalTitleId}
            className="text-xl font-semibold text-gray-800 dark:text-white/90"
          >
            Product details
          </h3>

          <p
            id={modalDescriptionId}
            className="mt-1.5 text-sm text-gray-500 dark:text-gray-400"
          >
            Review catalog, ownership, moderation, and availability information.
          </p>
        </div>

        <div className="min-h-0 overflow-x-hidden overflow-y-auto overscroll-contain border-y border-gray-100 px-5 py-5 sm:px-8 sm:py-6 dark:border-gray-800">
          {isLoading && <DetailsSkeleton />}

          {!isLoading && error && (
            <div
              role="alert"
              className="min-w-0 break-words whitespace-pre-wrap rounded-xl border border-error-200 bg-error-50 px-4 py-4 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400"
            >
              <p>{error}</p>

              <button
                type="button"
                onClick={onRetry}
                className="mt-3 inline-flex items-center justify-center rounded-lg border border-error-300 bg-white px-3 py-2 text-sm font-medium text-error-700 shadow-theme-xs transition hover:bg-error-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error-500 dark:border-error-500/40 dark:bg-transparent dark:text-error-400 dark:hover:bg-error-500/10"
              >
                Try again
              </button>
            </div>
          )}

          {!isLoading && !error && product && (
            <div className="min-w-0">
              {imageUrls.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {imageUrls.map((imageUrl, index) => (
                    <ProductDetailImage
                      key={imageUrl}
                      imageUrl={imageUrl}
                      productName={
                        normalizeText(product.name) || "Product"
                      }
                      imageNumber={index + 1}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex min-h-36 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 text-center text-sm text-gray-500 dark:border-gray-700 dark:bg-white/2 dark:text-gray-400">
                  No Product images are available.
                </div>
              )}

              <div className="mt-6 min-w-0">
                <h4 className="break-words text-2xl font-semibold text-gray-800 dark:text-white/90">
                  {normalizeText(product.name) || "Unnamed product"}
                </h4>

                <div className="mt-2 flex flex-wrap items-baseline gap-3">
                  <span className="text-xl font-semibold text-gray-800 dark:text-white/90">
                    {formatCurrency(product.price)}
                  </span>
                  {showOriginalPrice && (
                    <span className="text-sm text-gray-500 line-through dark:text-gray-400">
                      {formatCurrency(product.originalPrice)}
                    </span>
                  )}
                </div>

                <p className="mt-4 break-words whitespace-pre-wrap text-sm leading-6 text-gray-600 dark:text-gray-300">
                  {normalizeText(product.description) || "No description provided."}
                </p>
              </div>

              <dl className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <DetailItem label="Stock">
                  {formatNonNegativeInteger(product.stock)}
                </DetailItem>
                <DetailItem label="Category">
                  {getRelationName(product.category)}
                </DetailItem>
                <DetailItem label="Subcategory">
                  {getRelationName(product.subcategory)}
                </DetailItem>
                <DetailItem label="Seller">
                  {getSellerLabel(product.seller)}
                </DetailItem>
                <DetailItem label="Approval">{approvalLabel}</DetailItem>
                <DetailItem label="Availability">
                  {product.isActive === true
                    ? "Active"
                    : product.isActive === false
                      ? "Inactive"
                      : "Unknown"}
                </DetailItem>
                <DetailItem label="Rating">
                  {formatRating(product.rating)}
                </DetailItem>
                <DetailItem label="Reviews">
                  {formatNonNegativeInteger(
                    product.reviewCount ?? product.numReviews
                  )}
                </DetailItem>
                <DetailItem label="Approved by">
                  {getAdministratorLabel(product.approvedBy)}
                </DetailItem>
                <DetailItem label="Approved at">
                  {formatDate(product.approvedAt)}
                </DetailItem>
                <DetailItem label="Created">{formatDate(product.createdAt)}</DetailItem>
                <DetailItem label="Last updated">
                  {formatDate(product.updatedAt)}
                </DetailItem>
              </dl>

              {approvalStatus === "rejected" && (
                <div className="mt-4 min-w-0 rounded-xl border border-error-200 bg-error-50 px-4 py-3 dark:border-error-500/30 dark:bg-error-500/10">
                  <p className="text-xs font-medium tracking-wide text-error-600 uppercase dark:text-error-400">
                    Rejection reason
                  </p>
                  <p className="mt-1 break-words whitespace-pre-wrap text-sm text-error-700 dark:text-error-300">
                    {normalizeText(product.rejectedReason) || "—"}
                  </p>
                </div>
              )}

              <div className="mt-6">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Tags
                </p>
                {tags.length > 0 ? (
                  <div className="mt-2 flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <span
                        key={tag}
                        className="max-w-full break-words rounded-full bg-gray-100 px-3 py-1 text-xs text-gray-600 dark:bg-gray-800 dark:text-gray-300"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                    No tags provided.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex shrink-0 justify-end px-5 py-4 sm:px-8 sm:py-5">
          <Button type="button" variant="outline" onClick={onClose} className="w-full sm:w-auto">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default ProductDetailsModal;
