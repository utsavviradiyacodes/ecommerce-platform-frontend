import { SearchIcon } from "../../icons/index.js";

import Select from "../form/Select.jsx";

const PAYMENT_STATUS_OPTIONS = [
  { value: "", label: "All payment statuses" },
  { value: "paid", label: "Paid" },
  { value: "pending", label: "Pending" },
  { value: "failed", label: "Failed" },
  { value: "refunded", label: "Refunded" },
];

const PAYMENT_METHOD_OPTIONS = [
  { value: "", label: "All payment methods" },
  { value: "online", label: "Online" },
  { value: "upi", label: "UPI" },
];

function toNonNegativeInteger(value) {
  const number = Number(value);

  return Number.isInteger(number) && number >= 0 ? number : 0;
}

function PaymentsToolbar({
  searchQuery = "",
  paymentStatus = "",
  paymentMethod = "",
  matchingCount = 0,
  isSearchActive = false,
  disabled = false,
  onSearchChange = () => {},
  onPaymentStatusChange = () => {},
  onPaymentMethodChange = () => {},
}) {
  const safeMatchingCount = toNonNegativeInteger(matchingCount);
  const resultLabel =
    safeMatchingCount === 1
      ? "1 matching payment"
      : `${safeMatchingCount.toLocaleString("en-IN")} matching payments`;

  return (
    <div className="mb-5 min-w-0 rounded-xl border border-gray-200 bg-white p-4 sm:p-5 dark:border-white/5 dark:bg-white/3">
      <div className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,210px)_minmax(0,210px)]">
        <div className="min-w-0">
          <div className="relative min-w-0">
            <label htmlFor="payment-search" className="sr-only">
              Search payments on the current page
            </label>
            <span
              className={`pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 ${
                disabled
                  ? "text-gray-400 opacity-40 dark:text-gray-600"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              <SearchIcon className="size-5" aria-hidden="true" />
            </span>
            <input
              id="payment-search"
              name="paymentSearch"
              type="search"
              autoComplete="off"
              value={searchQuery}
              disabled={disabled}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search this page by payment, customer, or order..."
              className="h-11 w-full min-w-0 rounded-lg border border-gray-300 bg-transparent py-2.5 pr-4 pl-11 text-sm text-gray-800 shadow-theme-xs outline-none transition placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 dark:disabled:bg-gray-800 dark:disabled:text-gray-400"
            />
          </div>
          {!disabled && isSearchActive && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {resultLabel}
            </p>
          )}
        </div>

        <div className="min-w-0">
          <label htmlFor="payment-status-filter" className="sr-only">
            Filter payments by status
          </label>
          <Select
            id="payment-status-filter"
            name="paymentStatusFilter"
            value={paymentStatus}
            options={PAYMENT_STATUS_OPTIONS}
            placeholder=""
            disabled={disabled}
            onChange={onPaymentStatusChange}
          />
        </div>

        <div className="min-w-0">
          <label htmlFor="payment-method-filter" className="sr-only">
            Filter payments by method
          </label>
          <Select
            id="payment-method-filter"
            name="paymentMethodFilter"
            value={paymentMethod}
            options={PAYMENT_METHOD_OPTIONS}
            placeholder=""
            disabled={disabled}
            onChange={onPaymentMethodChange}
          />
        </div>
      </div>
    </div>
  );
}

export default PaymentsToolbar;
