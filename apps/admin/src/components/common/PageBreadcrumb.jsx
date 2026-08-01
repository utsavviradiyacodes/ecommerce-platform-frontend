import { Link } from "react-router";

function PageBreadcrumb({ pageTitle, description = "" }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div className="min-w-0">
        <h1 className="text-xl font-semibold text-gray-800 dark:text-white/90">
          {pageTitle}
        </h1>

        {description && (
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {description}
          </p>
        )}
      </div>

      <nav className="shrink-0">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link
              to="/admin/dashboard"
              className="inline-flex items-center gap-1.5 text-sm text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
            >
              Home
              <svg
                width="17"
                height="16"
                viewBox="0 0 17 16"
                fill="none"
                className="stroke-current"
              >
                <path
                  d="M6.0765 12.667L10.2432 8.50033L6.0765 4.33366"
                  strokeWidth="1.2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          </li>

          <li className="text-sm text-gray-800 dark:text-white/90">
            {pageTitle}
          </li>
        </ol>
      </nav>
    </div>
  );
}

export default PageBreadcrumb;
