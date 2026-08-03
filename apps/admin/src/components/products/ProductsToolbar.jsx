import { SearchIcon } from "../../icons/index.js";

import Select from "../form/Select.jsx";
import Button from "../ui/button/Button.jsx";

const APPROVAL_OPTIONS = [
  { value: "", label: "All approval states" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
];

const AVAILABILITY_OPTIONS = [
  { value: "", label: "All availability states" },
  { value: true, label: "Active" },
  { value: false, label: "Inactive" },
];

function normalizeAvailabilityFilter(value) {
  if (value === true || value === "true") {
    return true;
  }

  if (value === false || value === "false") {
    return false;
  }

  return "";
}

function ProductsToolbar({
  searchQuery = "",
  approvalFilter = "",
  availabilityFilter = "",
  resultCount = null,
  isResultCountCurrent = false,
  isSearchDisabled = false,
  isApprovalFilterDisabled = false,
  isAvailabilityFilterDisabled = false,
  isAddDisabled = false,
  onSearchChange = () => {},
  onApprovalFilterChange = () => {},
  onAvailabilityFilterChange = () => {},
  onAdd = () => {},
}) {
  const normalizedAvailabilityFilter = normalizeAvailabilityFilter(
    availabilityFilter
  );
  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    approvalFilter !== "" ||
    normalizedAvailabilityFilter !== "";
  const hasValidResultCount =
    Number.isSafeInteger(resultCount) && resultCount >= 0;
  const showResultCount =
    hasActiveFilters && isResultCountCurrent && hasValidResultCount;
  const resultLabel =
    resultCount === 1
      ? "1 matching product"
      : `${resultCount} matching products`;

  return (
    <div className="mb-5 min-w-0 rounded-xl border border-gray-200 bg-white p-4 sm:p-5 dark:border-white/5 dark:bg-white/3">
      <div className="grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 min-[1120px]:grid-cols-[minmax(0,1fr)_minmax(0,165px)_minmax(0,165px)_auto] min-[1120px]:items-start min-[1120px]:gap-2 min-[1280px]:gap-3">
        <div className="w-full min-w-0 sm:col-span-2 min-[1120px]:col-span-1">
          <div className="relative min-w-0">
            <label htmlFor="product-search" className="sr-only">
              Search products
            </label>

            <span
              className={`pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 ${
                isSearchDisabled
                  ? "text-gray-400 opacity-40 dark:text-gray-600"
                  : "text-gray-500 dark:text-gray-400"
              }`}
            >
              <SearchIcon className="size-5" aria-hidden="true" />
            </span>

            <input
              id="product-search"
              name="productSearch"
              type="search"
              autoComplete="off"
              value={searchQuery}
              disabled={isSearchDisabled}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search products..."
              className="h-11 w-full min-w-0 rounded-lg border border-gray-300 bg-transparent py-2.5 pr-4 pl-11 text-sm text-gray-800 shadow-theme-xs outline-none transition placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 dark:disabled:bg-gray-800 dark:disabled:text-gray-400"
            />
          </div>

          {showResultCount && (
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {resultLabel}
            </p>
          )}
        </div>

        <div className="w-full min-w-0">
          <label htmlFor="product-approval-filter" className="sr-only">
            Filter products by approval state
          </label>

          <Select
            id="product-approval-filter"
            name="productApprovalFilter"
            value={approvalFilter}
            options={APPROVAL_OPTIONS}
            placeholder=""
            disabled={isApprovalFilterDisabled}
            onChange={onApprovalFilterChange}
          />
        </div>

        <div className="w-full min-w-0">
          <label htmlFor="product-availability-filter" className="sr-only">
            Filter products by availability
          </label>

          <Select
            id="product-availability-filter"
            name="productAvailabilityFilter"
            value={normalizedAvailabilityFilter}
            options={AVAILABILITY_OPTIONS}
            placeholder=""
            disabled={isAvailabilityFilterDisabled}
            onChange={onAvailabilityFilterChange}
          />
        </div>

        <Button
          type="button"
          disabled={isAddDisabled}
          onClick={onAdd}
          className="h-11 w-full shrink-0 sm:col-span-2 min-[1120px]:col-span-1 min-[1120px]:w-auto"
          startIcon={
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              aria-hidden="true"
            >
              <path
                d="M10 4.16666V15.8333M4.16666 10H15.8333"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          }
        >
          Add Product
        </Button>
      </div>
    </div>
  );
}

export default ProductsToolbar;
