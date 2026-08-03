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
const ACTION_KEYS = ["approval", "status"];

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

function normalizeSellerId(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return normalizeText(value);
}

function getSellerId(seller) {
  return normalizeSellerId(seller?._id ?? seller?.id);
}

function getSellerName(seller) {
  return normalizeText(seller?.name) || "Unnamed seller";
}

function getShopName(seller) {
  return normalizeText(seller?.shopName) || "Shop name unavailable";
}

function getSellerEmail(seller) {
  return normalizeText(seller?.email) || "Email unavailable";
}

function getAvatarUrl(avatar) {
  if (typeof avatar === "string") {
    return normalizeText(avatar);
  }

  if (!avatar || typeof avatar !== "object") {
    return "";
  }

  return (
    normalizeText(avatar.url) ||
    normalizeText(avatar.secure_url) ||
    normalizeText(avatar.secureUrl) ||
    normalizeText(avatar.src)
  );
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

function SellerAvatar({ seller }) {
  const avatarUrl = getAvatarUrl(seller?.avatar);
  const sellerName = getSellerName(seller);
  const [failedAvatarUrl, setFailedAvatarUrl] = useState("");
  const showAvatar = avatarUrl && failedAvatarUrl !== avatarUrl;

  return (
    <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 bg-brand-50 text-sm font-semibold text-brand-600 dark:border-gray-800 dark:bg-brand-500/15 dark:text-brand-400">
      {showAvatar ? (
        <img
          src={avatarUrl}
          alt={`${sellerName} avatar`}
          width="44"
          height="44"
          loading="lazy"
          onError={() => setFailedAvatarUrl(avatarUrl)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{getSellerInitials(seller)}</span>
      )}
    </div>
  );
}

function getApprovalState(value) {
  if (value === true || value === "true") {
    return { isApproved: true, label: "Approved", tone: "success" };
  }

  if (value === false || value === "false") {
    return { isApproved: false, label: "Not approved", tone: "warning" };
  }

  return { isApproved: null, label: "Unknown", tone: "neutral" };
}

function getAccountState(value) {
  if (value === true || value === "true") {
    return { isActive: true, label: "Active", tone: "success" };
  }

  if (value === false || value === "false") {
    return { isActive: false, label: "Inactive", tone: "error" };
  }

  return { isActive: null, label: "Unknown", tone: "neutral" };
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
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="size-5"
      aria-hidden="true"
    >
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

function RevokeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="size-5"
      aria-hidden="true"
    >
      <path
        d="M7 7L17 17M17 7L7 17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PowerIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className="size-5"
      aria-hidden="true"
    >
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

function SellersTableSkeleton() {
  return Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
    <TableRow key={index}>
      <TableCell className="px-4 py-4 sm:px-5">
        <div className="flex min-w-52 items-center gap-3">
          <div className="size-11 shrink-0 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800" />
          <div className="min-w-0 flex-1">
            <div className="h-4 w-36 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
            <div className="mt-2 h-3 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          </div>
        </div>
      </TableCell>
      <TableCell className="px-4 py-4">
        <div className="h-4 w-44 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        <div className="mt-2 h-3 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
      </TableCell>
      <TableCell className="px-4 py-4">
        <div className="h-6 w-24 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
      </TableCell>
      <TableCell className="px-4 py-4">
        <div className="h-6 w-20 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
      </TableCell>
      <TableCell className="px-4 py-4 text-right">
        <div className="ml-auto flex justify-end gap-2">
          {Array.from({ length: 3 }, (_, actionIndex) => (
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

function SellersTable({
  sellers = [],
  isLoading = false,
  hasActiveFilters = false,
  onView = () => {},
  onApprovalChange = () => {},
  onStatusChange = () => {},
  pendingActions = {},
  mutationTargetIds = {},
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange = () => {},
}) {
  const hasSellers = sellers.length > 0;

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
      {(isLoading || hasSellers) && (
        <div className="custom-scrollbar max-w-full overflow-x-auto overflow-y-hidden">
          <Table className="min-w-[860px]">
            <TableHeader className="border-b border-gray-100 dark:border-white/5">
              <TableRow>
                <TableCell
                  isHeader
                  scope="col"
                  className="px-4 py-3 text-left text-theme-xs font-medium text-gray-500 sm:px-5 dark:text-gray-400"
                >
                  Seller & Shop
                </TableCell>
                <TableCell
                  isHeader
                  scope="col"
                  className="px-4 py-3 text-left text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Contact
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
                  Account
                </TableCell>
                <TableCell
                  isHeader
                  scope="col"
                  className="px-4 py-3 text-right text-theme-xs font-medium text-gray-500 dark:text-gray-400"
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>

            <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
              {isLoading && <SellersTableSkeleton />}
              {!isLoading &&
                hasSellers &&
                sellers.map((seller, index) => {
                  const sellerId = getSellerId(seller);
                  const sellerName = getSellerName(seller);
                  const shopName = getShopName(seller);
                  const approvalState = getApprovalState(seller?.isApproved);
                  const accountState = getAccountState(seller?.isActive);
                  const exactPendingActions = ACTION_KEYS.reduce(
                    (actions, action) => {
                      actions[action] =
                        pendingActions[action] === true &&
                        sellerId !== "" &&
                        normalizeSellerId(mutationTargetIds[action]) === sellerId;
                      return actions;
                    },
                    {}
                  );
                  const isRowPending = ACTION_KEYS.some(
                    (action) => exactPendingActions[action]
                  );
                  const hasUsableSellerId = sellerId !== "";
                  const hasKnownApproval =
                    seller?.isApproved === true || seller?.isApproved === false;
                  const hasKnownAccountStatus =
                    seller?.isActive === true || seller?.isActive === false;
                  const showApprovalAction = hasKnownApproval;
                  const showStatusAction = hasKnownAccountStatus;
                  const sellerKey =
                    sellerId ||
                    `${sellerName}-${normalizeText(seller?.createdAt) || index}`;

                  return (
                    <TableRow
                      key={sellerKey}
                      className="transition-colors hover:bg-gray-50 dark:hover:bg-white/2"
                    >
                      <TableCell className="px-4 py-4 sm:px-5">
                        <div className="flex min-w-52 max-w-72 items-center gap-3">
                          <SellerAvatar seller={seller} />
                          <div className="min-w-0">
                            <p
                              title={shopName}
                              className="truncate font-medium text-gray-800 dark:text-white/90"
                            >
                              {shopName}
                            </p>
                            <p
                              title={sellerName}
                              className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400"
                            >
                              {sellerName}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-48 max-w-64 px-4 py-4 text-theme-sm">
                        <p
                          title={getSellerEmail(seller)}
                          className="truncate text-gray-700 dark:text-gray-300"
                        >
                          {getSellerEmail(seller)}
                        </p>
                        <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                          {normalizeText(seller?.phone) || EMPTY_VALUE}
                        </p>
                      </TableCell>
                      <TableCell className="min-w-28 px-4 py-4">
                        <StatusBadge
                          label={approvalState.label}
                          tone={approvalState.tone}
                        />
                      </TableCell>
                      <TableCell className="min-w-24 px-4 py-4">
                        <StatusBadge
                          label={accountState.label}
                          tone={accountState.tone}
                        />
                      </TableCell>
                      <TableCell className="px-4 py-4 text-right">
                        <div
                          className="ml-auto flex min-w-32 items-center justify-end gap-2"
                          aria-busy={isRowPending || undefined}
                        >
                          <ActionButton
                            label={`View ${sellerName}`}
                            disabled={!hasUsableSellerId || isRowPending}
                            onClick={() => onView(seller)}
                          >
                            <ViewIcon />
                          </ActionButton>

                          {showApprovalAction && (
                            <ActionButton
                              label={
                                exactPendingActions.approval
                                  ? approvalState.isApproved
                                    ? `Revoking approval for ${sellerName}`
                                    : `Approving ${sellerName}`
                                  : approvalState.isApproved
                                    ? `Revoke approval for ${sellerName}`
                                    : `Approve ${sellerName}`
                              }
                              tone={
                                approvalState.isApproved ? "error" : "success"
                              }
                              isPending={exactPendingActions.approval}
                              disabled={
                                !hasUsableSellerId || isRowPending
                              }
                              onClick={() => onApprovalChange(seller)}
                            >
                              {approvalState.isApproved ? (
                                <RevokeIcon />
                              ) : (
                                <ApproveIcon />
                              )}
                            </ActionButton>
                          )}

                          {showStatusAction && (
                            <ActionButton
                              label={
                                exactPendingActions.status
                                  ? accountState.isActive
                                    ? `Deactivating ${sellerName}`
                                    : `Reactivating ${sellerName}`
                                  : accountState.isActive
                                    ? `Deactivate ${sellerName}`
                                    : `Reactivate ${sellerName}`
                              }
                              tone={accountState.isActive ? "error" : "success"}
                              isPending={exactPendingActions.status}
                              disabled={
                                !hasUsableSellerId || isRowPending
                              }
                              onClick={() => onStatusChange(seller)}
                            >
                              <PowerIcon />
                            </ActionButton>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
            </TableBody>
          </Table>
        </div>
      )}

      {!isLoading && !hasSellers && (
        <div className="px-6 py-14 text-center">
          <div className="mx-auto max-w-sm">
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {hasActiveFilters ? "No matching sellers" : "No sellers found"}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {hasActiveFilters
                ? "Try changing the search term or Seller filters."
                : "Registered Seller accounts will appear here."}
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

export default SellersTable;
