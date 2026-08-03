import { SearchIcon } from "../../icons/index.js";

import Select from "../form/Select.jsx";

const APPROVAL_OPTIONS = [
  { value: "", label: "All approval states" },
  { value: true, label: "Approved" },
  { value: false, label: "Not approved" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All account statuses" },
  { value: true, label: "Active" },
  { value: false, label: "Inactive" },
];

function normalizeBooleanFilter(value) {
  if (value === true || value === "true") {
    return true;
  }

  if (value === false || value === "false") {
    return false;
  }

  return "";
}

function SellersToolbar({
  searchQuery = "",
  approvalFilter = "",
  statusFilter = "",
  resultCount = null,
  isResultCountCurrent = false,
  isSearchDisabled = false,
  areFiltersDisabled = false,
  onSearchChange = () => {},
  onApprovalFilterChange = () => {},
  onStatusFilterChange = () => {},
}) {
  const normalizedApprovalFilter = normalizeBooleanFilter(approvalFilter);
  const normalizedStatusFilter = normalizeBooleanFilter(statusFilter);
  const hasActiveFilters =
    searchQuery.trim().length > 0 ||
    normalizedApprovalFilter !== "" ||
    normalizedStatusFilter !== "";
  const hasValidResultCount =
    Number.isSafeInteger(resultCount) && resultCount >= 0;
  const showResultCount =
    hasActiveFilters && isResultCountCurrent && hasValidResultCount;
  const resultLabel =
    resultCount === 1 ? "1 matching seller" : `${resultCount} matching sellers`;

  return (
    <div className="mb-5 min-w-0 rounded-xl border border-gray-200 bg-white p-4 sm:p-5 dark:border-white/5 dark:bg-white/3">
      <div className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,190px)_minmax(0,190px)] lg:items-start">
        <div className="w-full min-w-0">
          <div className="relative min-w-0">
            <label htmlFor="seller-search" className="sr-only">
              Search sellers
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
              id="seller-search"
              name="sellerSearch"
              type="search"
              autoComplete="off"
              value={searchQuery}
              disabled={isSearchDisabled}
              onChange={(event) => onSearchChange(event.target.value)}
              placeholder="Search by seller, email, or shop name..."
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
          <label htmlFor="seller-approval-filter" className="sr-only">
            Filter sellers by approval state
          </label>
          <Select
            id="seller-approval-filter"
            name="sellerApprovalFilter"
            value={normalizedApprovalFilter}
            options={APPROVAL_OPTIONS}
            placeholder=""
            disabled={areFiltersDisabled}
            onChange={onApprovalFilterChange}
          />
        </div>

        <div className="w-full min-w-0">
          <label htmlFor="seller-status-filter" className="sr-only">
            Filter sellers by account status
          </label>
          <Select
            id="seller-status-filter"
            name="sellerStatusFilter"
            value={normalizedStatusFilter}
            options={STATUS_OPTIONS}
            placeholder=""
            disabled={areFiltersDisabled}
            onChange={onStatusFilterChange}
          />
        </div>
      </div>
    </div>
  );
}

export default SellersToolbar;
