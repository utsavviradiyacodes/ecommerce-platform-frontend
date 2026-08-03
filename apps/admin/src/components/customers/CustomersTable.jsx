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

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeCustomerId(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return normalizeText(value);
}

function getCustomerId(customer) {
  return normalizeCustomerId(customer?._id ?? customer?.id);
}

function getCustomerName(customer) {
  return normalizeText(customer?.name) || "Unnamed customer";
}

function getCustomerEmail(customer) {
  return normalizeText(customer?.email) || "Email unavailable";
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

function getCustomerInitials(customer) {
  const nameParts = getCustomerName(customer)
    .split(/\s+/)
    .filter(Boolean);

  if (nameParts.length > 0 && nameParts[0] !== "Unnamed") {
    return nameParts
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join("");
  }

  const email = normalizeText(customer?.email);
  return email ? email.charAt(0).toUpperCase() : "C";
}

function formatJoinedDate(value) {
  if (value === null || value === undefined || value === "") {
    return EMPTY_VALUE;
  }

  const date = new Date(value);

  return Number.isNaN(date.getTime()) ? EMPTY_VALUE : dateFormatter.format(date);
}

function CustomerAvatar({ customer }) {
  const avatarUrl = getAvatarUrl(customer?.avatar);
  const customerName = getCustomerName(customer);
  const [failedAvatarUrl, setFailedAvatarUrl] = useState("");
  const showAvatar = avatarUrl && failedAvatarUrl !== avatarUrl;

  return (
    <div className="flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-full border border-gray-200 bg-brand-50 text-sm font-semibold text-brand-600 dark:border-gray-800 dark:bg-brand-500/15 dark:text-brand-400">
      {showAvatar ? (
        <img
          src={avatarUrl}
          alt={`${customerName} avatar`}
          width="44"
          height="44"
          loading="lazy"
          onError={() => setFailedAvatarUrl(avatarUrl)}
          className="h-full w-full object-cover"
        />
      ) : (
        <span aria-hidden="true">{getCustomerInitials(customer)}</span>
      )}
    </div>
  );
}

function StatusBadge({ isActive }) {
  if (isActive !== true && isActive !== false) {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700 dark:bg-gray-800 dark:text-gray-300">
        Unknown
      </span>
    );
  }

  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
        isActive
          ? "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400"
          : "bg-error-50 text-error-700 dark:bg-error-500/15 dark:text-error-400"
      }`}
    >
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

function PowerIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M12 3V12M7.05 5.55C4.64 7.1 3 9.81 3 12.92C3 17.89 7.03 21.92 12 21.92C16.97 21.92 21 17.89 21 12.92C21 9.81 19.36 7.1 16.95 5.55"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function LoadingIcon({ className = "" }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className={`animate-spin ${className}`}
    >
      <path
        d="M21 12A9 9 0 1 1 12 3"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function CustomersTableSkeleton() {
  return Array.from({ length: SKELETON_ROW_COUNT }, (_, index) => (
    <TableRow key={index}>
      <TableCell className="px-5 py-4 sm:px-6">
        <div className="flex min-w-64 items-center gap-3">
          <div className="size-11 shrink-0 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
          <div className="min-w-0 flex-1">
            <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
            <div className="mt-2 h-3 w-44 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
          </div>
        </div>
      </TableCell>
      <TableCell className="px-4 py-4">
        <div className="h-4 w-28 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
      </TableCell>
      <TableCell className="px-4 py-4">
        <div className="h-6 w-16 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
      </TableCell>
      <TableCell className="px-4 py-4">
        <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
      </TableCell>
      <TableCell className="px-5 py-4 text-right sm:px-6">
        <div className="ml-auto h-9 w-28 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
      </TableCell>
    </TableRow>
  ));
}

function CustomersTable({
  customers = [],
  isLoading = false,
  hasActiveFilters = false,
  isStatusPending = false,
  statusTargetId = "",
  onStatusChange = () => {},
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 10,
  onPageChange = () => {},
}) {
  const hasCustomers = customers.length > 0;

  return (
    <div className="w-full min-w-0 max-w-full overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
      {(isLoading || hasCustomers) && (
        <div className="custom-scrollbar max-w-full overflow-x-auto overflow-y-hidden">
          <Table className="min-w-[860px]">
            <TableHeader className="border-b border-gray-100 dark:border-white/5">
              <TableRow>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-start font-medium text-gray-500 text-theme-xs sm:px-6 dark:text-gray-400"
                >
                  Customer
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-start font-medium text-gray-500 text-theme-xs dark:text-gray-400"
                >
                  Phone
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-start font-medium text-gray-500 text-theme-xs dark:text-gray-400"
                >
                  Status
                </TableCell>
                <TableCell
                  isHeader
                  className="px-4 py-3 text-start font-medium text-gray-500 text-theme-xs dark:text-gray-400"
                >
                  Joined
                </TableCell>
                <TableCell
                  isHeader
                  className="px-5 py-3 text-right font-medium text-gray-500 text-theme-xs sm:px-6 dark:text-gray-400"
                >
                  Actions
                </TableCell>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
              {isLoading ? (
                <CustomersTableSkeleton />
              ) : (
                customers.map((customer, index) => {
                  const customerId = getCustomerId(customer);
                  const customerName = getCustomerName(customer);
                  const exactStatusPending =
                    isStatusPending && statusTargetId === customerId;
                  const hasKnownStatus =
                    customer?.isActive === true || customer?.isActive === false;
                  const isActivating = customer?.isActive === false;
                  const actionLabel = isActivating ? "Reactivate" : "Deactivate";
                  const customerKey = customerId || `${customerName}-${index}`;

                  return (
                    <TableRow
                      key={customerKey}
                      className="transition-colors hover:bg-gray-50 dark:hover:bg-white/2"
                    >
                      <TableCell className="px-5 py-4 sm:px-6">
                        <div className="flex min-w-64 max-w-80 items-center gap-3">
                          <CustomerAvatar customer={customer} />
                          <div className="min-w-0">
                            <p
                              title={customerName}
                              className="truncate font-medium text-gray-800 dark:text-white/90"
                            >
                              {customerName}
                            </p>
                            <p
                              title={getCustomerEmail(customer)}
                              className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400"
                            >
                              {getCustomerEmail(customer)}
                            </p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-40 px-4 py-4 text-theme-sm text-gray-500 dark:text-gray-400">
                        {normalizeText(customer?.phone) || EMPTY_VALUE}
                      </TableCell>
                      <TableCell className="min-w-28 px-4 py-4">
                        <StatusBadge isActive={customer?.isActive} />
                      </TableCell>
                      <TableCell className="min-w-32 px-4 py-4 text-theme-sm text-gray-500 dark:text-gray-400">
                        {formatJoinedDate(customer?.createdAt)}
                      </TableCell>
                      <TableCell className="px-5 py-4 text-right sm:px-6">
                        <button
                          type="button"
                          disabled={
                            !customerId || !hasKnownStatus || exactStatusPending
                          }
                          onClick={() => onStatusChange(customer)}
                          className={`relative inline-flex h-9 min-w-29 items-center justify-center gap-2 rounded-lg border px-3 text-xs font-medium shadow-theme-xs transition focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${
                            isActivating
                              ? "border-success-200 bg-success-50 text-success-700 hover:bg-success-100 focus-visible:outline-success-500 dark:border-success-500/30 dark:bg-success-500/10 dark:text-success-400 dark:hover:bg-success-500/15"
                              : "border-error-200 bg-error-50 text-error-700 hover:bg-error-100 focus-visible:outline-error-500 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400 dark:hover:bg-error-500/15"
                          }`}
                          aria-busy={exactStatusPending || undefined}
                        >
                          {exactStatusPending ? (
                            <LoadingIcon className="size-4" />
                          ) : (
                            <PowerIcon className="size-4" />
                          )}
                          {exactStatusPending
                            ? isActivating
                              ? "Reactivating..."
                              : "Deactivating..."
                            : actionLabel}
                        </button>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
            </TableBody>
          </Table>
        </div>
      )}

      {!isLoading && !hasCustomers && (
        <div className="px-6 py-14 text-center">
          <div className="mx-auto max-w-sm">
            <p className="text-sm font-medium text-gray-800 dark:text-white/90">
              {hasActiveFilters ? "No matching customers" : "No customers found"}
            </p>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {hasActiveFilters
                ? "Try changing the search term or account-status filter."
                : "Registered Customer accounts will appear here."}
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

export default CustomersTable;
