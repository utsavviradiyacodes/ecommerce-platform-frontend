import { useId, useState } from "react";

import Button from "../ui/button/Button.jsx";
import Modal from "../ui/modal/Modal.jsx";

const EMPTY_VALUE = "\u2014";

const countFormatter = new Intl.NumberFormat("en-IN");
const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});
const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeSeller(details) {
  const seller = details?.seller;

  return seller && typeof seller === "object" && !Array.isArray(seller)
    ? seller
    : null;
}

function getAvatarUrl(avatar) {
  if (typeof avatar === "string") {
    return normalizeText(avatar);
  }

  if (!avatar || typeof avatar !== "object" || Array.isArray(avatar)) {
    return "";
  }

  return (
    normalizeText(avatar.url) ||
    normalizeText(avatar.secure_url) ||
    normalizeText(avatar.secureUrl) ||
    normalizeText(avatar.src)
  );
}

function getSellerName(seller) {
  return normalizeText(seller?.name) || "Unnamed seller";
}

function getShopName(seller) {
  return normalizeText(seller?.shopName) || "Shop name unavailable";
}

function getSellerInitials(seller) {
  const source =
    normalizeText(seller?.shopName) ||
    normalizeText(seller?.name) ||
    normalizeText(seller?.email);
  const parts = source.split(/\s+/).filter(Boolean);

  if (parts.length === 0) {
    return "S";
  }

  return parts
    .slice(0, 2)
    .map((part) => part.charAt(0).toUpperCase())
    .join("");
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

function formatCount(value) {
  const number = getNonNegativeNumber(value);

  return number !== null && Number.isInteger(number)
    ? countFormatter.format(number)
    : EMPTY_VALUE;
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

  if (Number.isNaN(date.getTime())) {
    return EMPTY_VALUE;
  }

  return dateFormatter.format(date);
}

function getBooleanLabel(value, trueLabel, falseLabel) {
  if (value === true || value === "true") {
    return trueLabel;
  }

  if (value === false || value === "false") {
    return falseLabel;
  }

  return "Unknown";
}

function SellerAvatar({ seller }) {
  const avatarUrl = getAvatarUrl(seller?.avatar);
  const [failedAvatarUrl, setFailedAvatarUrl] = useState("");
  const showAvatar = avatarUrl && failedAvatarUrl !== avatarUrl;

  return (
    <div className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-gray-200 bg-brand-50 text-lg font-semibold text-brand-600 dark:border-gray-800 dark:bg-brand-500/15 dark:text-brand-400">
      {showAvatar ? (
        <img
          src={avatarUrl}
          alt={`${getSellerName(seller)} avatar`}
          width="64"
          height="64"
          onError={() => setFailedAvatarUrl(avatarUrl)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{getSellerInitials(seller)}</span>
      )}
    </div>
  );
}

function MetricCard({ label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/2">
      <p className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
        {label}
      </p>
      <p className="mt-2 break-words text-xl font-semibold text-gray-800 dark:text-white/90">
        {value}
      </p>
    </div>
  );
}

function DetailItem({ label, value }) {
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
        {label}
      </dt>
      <dd className="mt-1 break-words text-sm text-gray-800 dark:text-white/90">
        {value || EMPTY_VALUE}
      </dd>
    </div>
  );
}

function DetailsSkeleton() {
  return (
    <div className="animate-pulse px-5 py-6 sm:px-8">
      <div className="flex items-center gap-4">
        <div className="size-16 rounded-2xl bg-gray-200 dark:bg-gray-800" />
        <div className="min-w-0 flex-1">
          <div className="h-5 w-48 rounded bg-gray-200 dark:bg-gray-800" />
          <div className="mt-2 h-4 w-36 rounded bg-gray-200 dark:bg-gray-800" />
        </div>
      </div>
      <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div
            key={index}
            className="h-24 rounded-xl bg-gray-200 dark:bg-gray-800"
          />
        ))}
      </div>
      <div className="mt-6 grid grid-cols-1 gap-x-6 gap-y-5 sm:grid-cols-2">
        {Array.from({ length: 6 }, (_, index) => (
          <div key={index}>
            <div className="h-3 w-24 rounded bg-gray-200 dark:bg-gray-800" />
            <div className="mt-2 h-4 w-40 rounded bg-gray-200 dark:bg-gray-800" />
          </div>
        ))}
      </div>
    </div>
  );
}

function SellerDetailsModal({
  isOpen,
  details = null,
  error = "",
  isLoading = false,
  onClose = () => {},
  onRetry = () => {},
}) {
  const modalId = useId();
  const titleId = `${modalId}-title`;
  const descriptionId = `${modalId}-description`;
  const seller = normalizeSeller(details);
  const sellerName = getSellerName(seller);
  const shopName = getShopName(seller);
  const description = normalizeText(seller?.shopDescription);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-3xl"
      ariaLabelledBy={titleId}
      ariaDescribedBy={descriptionId}
    >
      <div className="flex max-h-[calc(100dvh-1.5rem)] min-h-0 flex-col overflow-hidden rounded-3xl sm:max-h-[calc(100dvh-3rem)]">
        <div className="shrink-0 border-b border-gray-100 px-5 py-5 pr-16 sm:px-8 sm:pr-20 dark:border-gray-800">
          <h3
            id={titleId}
            className="text-xl font-semibold text-gray-800 dark:text-white/90"
          >
            Seller details
          </h3>
          <p
            id={descriptionId}
            className="mt-1 text-sm text-gray-500 dark:text-gray-400"
          >
            Review marketplace identity, account state, and performance.
          </p>
        </div>

        <div className="custom-scrollbar min-h-0 flex-1 overflow-y-auto">
          {isLoading && <DetailsSkeleton />}

          {!isLoading && error && (
            <div className="px-5 py-10 text-center sm:px-8">
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                Seller details could not be loaded
              </p>
              <p className="mx-auto mt-2 max-w-md break-words whitespace-pre-wrap text-sm text-error-600 dark:text-error-400">
                {error}
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={onRetry}
                className="mt-5"
              >
                Try again
              </Button>
            </div>
          )}

          {!isLoading && !error && seller && (
            <div className="px-5 py-6 sm:px-8">
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-center">
                <SellerAvatar seller={seller} />
                <div className="min-w-0">
                  <h4 className="break-words text-lg font-semibold text-gray-800 dark:text-white/90">
                    {shopName}
                  </h4>
                  <p className="mt-1 break-words text-sm text-gray-500 dark:text-gray-400">
                    {sellerName}
                  </p>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
                <MetricCard
                  label="Products"
                  value={formatCount(details?.productCount)}
                />
                <MetricCard
                  label="Orders"
                  value={formatCount(details?.orderCount)}
                />
                <MetricCard
                  label="Revenue"
                  value={formatCurrency(details?.totalRevenue)}
                />
              </div>

              <dl className="mt-7 grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                <DetailItem
                  label="Email"
                  value={normalizeText(seller?.email)}
                />
                <DetailItem
                  label="Phone"
                  value={normalizeText(seller?.phone)}
                />
                <DetailItem
                  label="Marketplace approval"
                  value={getBooleanLabel(
                    seller?.isApproved,
                    "Approved",
                    "Not approved"
                  )}
                />
                <DetailItem
                  label="Account access"
                  value={getBooleanLabel(
                    seller?.isActive,
                    "Active",
                    "Inactive"
                  )}
                />
                <DetailItem
                  label="Email verification"
                  value={getBooleanLabel(
                    seller?.isVerified,
                    "Verified",
                    "Not verified"
                  )}
                />
                <DetailItem
                  label="Joined"
                  value={formatDate(seller?.createdAt)}
                />
                <DetailItem
                  label="Last updated"
                  value={formatDate(seller?.updatedAt)}
                />
              </dl>

              {description && (
                <div className="mt-7 rounded-xl border border-gray-200 p-4 dark:border-gray-800">
                  <h5 className="text-sm font-medium text-gray-800 dark:text-white/90">
                    Shop description
                  </h5>
                  <p className="mt-2 break-words whitespace-pre-wrap text-sm leading-6 text-gray-500 dark:text-gray-400">
                    {description}
                  </p>
                </div>
              )}
            </div>
          )}

          {!isLoading && !error && !seller && (
            <div className="px-5 py-10 text-center sm:px-8">
              <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                Seller details are unavailable
              </p>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                The server returned an unexpected response.
              </p>
            </div>
          )}
        </div>

        <div className="shrink-0 border-t border-gray-100 px-5 py-4 text-right sm:px-8 dark:border-gray-800">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}

export default SellerDetailsModal;
