import Button from "../ui/button/Button.jsx";

function CategoriesToolbar({
  searchQuery = "",
  onSearchChange = () => {},
  onAdd = () => {},
  resultCount = 0,
}) {
  const hasSearchQuery = searchQuery.trim().length > 0;

  const resultLabel =
    resultCount === 1
      ? "1 matching category"
      : `${resultCount} matching categories`;

  return (
    <div className="mb-5 flex flex-col gap-4 rounded-xl border border-gray-200 bg-white p-4 sm:flex-row sm:items-start sm:justify-between sm:p-5 dark:border-white/5 dark:bg-white/3">
      <div className="w-full sm:max-w-md">
        <div className="relative">
          <label htmlFor="category-search" className="sr-only">
            Search categories
          </label>

          <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 text-gray-500 dark:text-gray-400">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <path
                d="M8.75 15.8333C12.662 15.8333 15.8333 12.662 15.8333 8.75C15.8333 4.83798 12.662 1.66666 8.75 1.66666C4.83798 1.66666 1.66666 4.83798 1.66666 8.75C1.66666 12.662 4.83798 15.8333 8.75 15.8333Z"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              <path
                d="M13.75 13.75L18.3333 18.3333"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </span>

          <input
            id="category-search"
            name="categorySearch"
            type="search"
            autoComplete="off"
            value={searchQuery}
            onChange={(event) => onSearchChange(event.target.value)}
            placeholder="Search categories..."
            className="h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pr-4 pl-11 text-sm text-gray-800 shadow-theme-xs outline-none transition placeholder:text-gray-400 focus:border-brand-300 focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
          />
        </div>

        {hasSearchQuery && (
          <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
            {resultLabel}
          </p>
        )}
      </div>

      <Button
        type="button"
        onClick={onAdd}
        className="h-11 w-full shrink-0 sm:w-auto"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
          <path
            d="M10 4.16666V15.8333M4.16666 10H15.8333"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
        Add Category
      </Button>
    </div>
  );
}

export default CategoriesToolbar;
