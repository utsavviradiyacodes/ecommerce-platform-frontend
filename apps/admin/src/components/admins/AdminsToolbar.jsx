import { SearchIcon } from "../../icons/index.js";

function AddIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
      <path
        d="M12 5V19M5 12H19"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function AdminsToolbar({
  searchDraft = "",
  onSearchDraftChange = () => {},
  onSearchSubmit = () => {},
  onAddAdmin = () => {},
}) {
  function handleSubmit(event) {
    event.preventDefault();
    onSearchSubmit(searchDraft);
  }

  return (
    <div className="mb-5 min-w-0 rounded-xl border border-gray-200 bg-white p-4 sm:p-5 dark:border-white/5 dark:bg-white/3">
      <div className="flex min-w-0 flex-col gap-3 lg:flex-row lg:items-center">
        <form
          onSubmit={handleSubmit}
          className="min-w-0 flex-1"
        >
          <div className="relative min-w-0 flex-1">
            <label htmlFor="admin-search" className="sr-only">
              Search Admins by name or email
            </label>
            <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-gray-500 dark:text-gray-400">
              <SearchIcon className="size-5" aria-hidden="true" />
            </span>
            <input
              id="admin-search"
              name="adminSearch"
              type="search"
              autoComplete="off"
              value={searchDraft}
              onChange={(event) => onSearchDraftChange(event.target.value)}
              placeholder="Search Admin name or email..."
              className="h-11 w-full min-w-0 rounded-lg border border-gray-300 bg-transparent py-2.5 pr-4 pl-11 text-sm text-gray-800 shadow-theme-xs outline-none transition placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:opacity-50 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 dark:disabled:bg-gray-800"
            />
          </div>

        </form>

        <button
          type="button"
          onClick={onAddAdmin}
          className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 text-sm font-medium text-white shadow-theme-xs transition hover:bg-brand-600 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 lg:w-auto"
        >
          <AddIcon />
          Add Admin
        </button>
      </div>
    </div>
  );
}

export default AdminsToolbar;
