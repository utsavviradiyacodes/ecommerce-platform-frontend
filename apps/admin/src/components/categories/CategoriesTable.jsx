import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from "../ui/table/Table.jsx";

import Pagination from "../ui/pagination/Pagination.jsx";

const dateFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

function formatCategoryDate(value) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return dateFormatter.format(date);
}

function CategoryTableSkeleton() {
  return Array.from({ length: 5 }, (_, index) => (
    <TableRow key={index}>
      <TableCell className="px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />

          <div className="h-4 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
        </div>
      </TableCell>

      <TableCell className="px-4 py-4">
        <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
      </TableCell>

      <TableCell className="px-4 py-4">
        <div className="h-4 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
      </TableCell>

      <TableCell className="px-5 py-4 text-right sm:px-6">
        <div className="ml-auto h-8 w-14 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
      </TableCell>
    </TableRow>
  ));
}

function CategoriesTable({
  categories = [],
  isLoading = false,
  hasSearchQuery = false,
  onEdit = () => {},
  currentPage = 1,
  totalPages = 1,
  totalItems = 0,
  pageSize = 5,
  onPageChange = () => {},
}) {
  const hasCategories = categories.length > 0;

  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-white/5 dark:bg-white/3">
      <div className="max-w-full overflow-x-auto">
        <Table>
          <TableHeader className="border-b border-gray-100 dark:border-white/5">
            <TableRow>
              <TableCell
                isHeader
                scope="col"
                className="px-5 py-3 text-left text-theme-xs font-medium text-gray-500 sm:px-6 dark:text-gray-400"
              >
                Category
              </TableCell>

              <TableCell
                isHeader
                scope="col"
                className="px-4 py-3 text-left text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Created
              </TableCell>

              <TableCell
                isHeader
                scope="col"
                className="px-4 py-3 text-left text-theme-xs font-medium text-gray-500 dark:text-gray-400"
              >
                Last updated
              </TableCell>

              <TableCell
                isHeader
                scope="col"
                className="px-5 py-3 text-right text-theme-xs font-medium text-gray-500 sm:px-6 dark:text-gray-400"
              >
                Actions
              </TableCell>
            </TableRow>
          </TableHeader>

          <TableBody className="divide-y divide-gray-100 dark:divide-white/5">
            {isLoading && <CategoryTableSkeleton />}

            {!isLoading &&
              hasCategories &&
              categories.map((category) => (
                <TableRow
                  key={category._id}
                  className="transition-colors hover:bg-gray-50 dark:hover:bg-white/2"
                >
                  <TableCell className="px-5 py-4 sm:px-6">
                    <div className="flex min-w-52 items-center gap-3">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-gray-100 dark:border-gray-800 dark:bg-gray-800">
                        {category.image ? (
                          <img
                            src={category.image}
                            alt={category.name}
                            width="48"
                            height="48"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <>
                            <span className="sr-only">
                              No image available for {category.name}
                            </span>

                            <svg
                              width="22"
                              height="22"
                              viewBox="0 0 24 24"
                              fill="none"
                              className="text-gray-400 dark:text-gray-500"
                              aria-hidden="true"
                            >
                              <path
                                d="M4 16.5L8.25 12.25C8.66421 11.8358 9.33579 11.8358 9.75 12.25L12 14.5L14.25 12.25C14.6642 11.8358 15.3358 11.8358 15.75 12.25L20 16.5M8.5 8.5H8.51M5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21Z"
                                stroke="currentColor"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                          </>
                        )}
                      </div>

                      <p className="font-medium text-gray-800 dark:text-white/90">
                        {category.name}
                      </p>
                    </div>
                  </TableCell>

                  <TableCell className="whitespace-nowrap px-4 py-4 text-theme-sm text-gray-500 dark:text-gray-400">
                    {formatCategoryDate(category.createdAt)}
                  </TableCell>

                  <TableCell className="whitespace-nowrap px-4 py-4 text-theme-sm text-gray-500 dark:text-gray-400">
                    {formatCategoryDate(category.updatedAt)}
                  </TableCell>

                  <TableCell className="px-5 py-4 text-right sm:px-6">
                    <button
                      type="button"
                      onClick={() => onEdit(category)}
                      className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-theme-xs transition hover:bg-gray-50 hover:text-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
                    >
                      Edit
                    </button>
                  </TableCell>
                </TableRow>
              ))}

            {!isLoading && !hasCategories && (
              <TableRow>
                <TableCell colSpan={4} className="px-6 py-14 text-center">
                  <div className="mx-auto max-w-sm">
                    <p className="text-sm font-medium text-gray-800 dark:text-white/90">
                      {hasSearchQuery
                        ? "No matching categories"
                        : "No categories found"}
                    </p>

                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                      {hasSearchQuery
                        ? "Try searching with a different category name."
                        : "Categories will appear here after they are added."}
                    </p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

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

export default CategoriesTable;
