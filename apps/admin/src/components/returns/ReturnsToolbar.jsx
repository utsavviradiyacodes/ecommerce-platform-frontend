import { SearchIcon } from "../../icons/index.js";

import Select from "../form/Select.jsx";

const RETURN_STATUS_OPTIONS = [
  { value: "", label: "All statuses" },
  { value: "requested", label: "Requested" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "refunded", label: "Refunded" },
];

function toNonNegativeInteger(value) {
  const number = Number(value);

  return Number.isInteger(number) && number >= 0 ? number : 0;
}

function ReturnsToolbar({
  searchQuery = "",
  status = "",
  currentPage = 1,
  pageSize = 10,
  totalItems = 0,
  pageRecordCount = 0,
  matchingCount = 0,
  isSearchActive = false,
  disabled = false,
  onSearchChange = () => {},
  onStatusChange = () => {},
}) {
  const safeTotal = toNonNegativeInteger(totalItems);
  const safePageCount = toNonNegativeInteger(pageRecordCount);
  const safeMatchingCount = toNonNegativeInteger(matchingCount);
  const safePage = Math.max(1, toNonNegativeInteger(currentPage));
  const safePageSize = Math.max(1, toNonNegativeInteger(pageSize));
  const start = safePageCount > 0 ? (safePage - 1) * safePageSize + 1 : 0;
  const end = safePageCount > 0 ? start + safePageCount - 1 : 0;
  const matchingLabel = safeMatchingCount === 1 ? "Return" : "Returns";

  return (
    <div className="mb-5 min-w-0 rounded-xl border border-gray-200 bg-white p-4 sm:p-5 dark:border-white/5 dark:bg-white/3">
      <div className="mb-3 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {isSearchActive
              ? `Showing ${safeMatchingCount.toLocaleString("en-IN")} matching ${matchingLabel} on this page`
              : `Showing ${start.toLocaleString("en-IN")}–${end.toLocaleString("en-IN")} of ${safeTotal.toLocaleString("en-IN")} Returns`}
          </p>
          {isSearchActive && (
            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
              Search checks only the {safePageCount.toLocaleString("en-IN")} direct Return records on this page. The server reports {safeTotal.toLocaleString("en-IN")} Returns for the selected status.
            </p>
          )}
        </div>

      </div>

      <div className="grid min-w-0 grid-cols-1 gap-3 lg:grid-cols-[minmax(0,1fr)_minmax(0,220px)]">
        <div className="relative min-w-0">
          <label htmlFor="return-search" className="sr-only">
            Search Returns on the current page
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
            id="return-search"
            name="returnSearch"
            type="search"
            autoComplete="off"
            value={searchQuery}
            disabled={disabled}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search current page Returns..."
            className="h-11 w-full min-w-0 rounded-lg border border-gray-300 bg-transparent py-2.5 pr-4 pl-11 text-sm text-gray-800 shadow-theme-xs outline-none transition placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 disabled:opacity-40 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 dark:disabled:bg-gray-800 dark:disabled:text-gray-400"
          />
        </div>

        <div className="min-w-0">
          <label htmlFor="return-status-filter" className="sr-only">
            Filter Returns by status
          </label>
          <Select
            id="return-status-filter"
            name="returnStatusFilter"
            value={status}
            options={RETURN_STATUS_OPTIONS}
            placeholder=""
            disabled={disabled}
            onChange={onStatusChange}
          />
        </div>
      </div>
    </div>
  );
}

export default ReturnsToolbar;
