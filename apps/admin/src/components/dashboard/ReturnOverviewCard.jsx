const integerFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

function getNonNegativeNumber(value) {
  const number = Number(value);

  return Number.isFinite(number) && number >= 0 ? number : 0;
}

function formatCount(value) {
  return integerFormatter.format(Math.trunc(getNonNegativeNumber(value)));
}

function formatCurrency(value) {
  return currencyFormatter.format(getNonNegativeNumber(value));
}

function ReturnOverviewCard({
  stats = null,
  isLoading = false,
  error = "",
  onRetry = () => {},
}) {
  const requestedReturns = stats?.returnsByStatus?.requested;
  const refundedReturns = stats?.returnsByStatus?.refunded;
  const rejectedReturns = stats?.returnsByStatus?.rejected;

  return (
    <section className="h-full min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-theme-xs dark:border-gray-800 dark:bg-white/3">
      <div className="flex min-w-0 items-start justify-between gap-4 px-5 pt-5 sm:px-6 sm:pt-6">
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
            Return Overview
          </h2>

          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Current return requests and refunded value.
          </p>
        </div>

        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-warning-50 text-warning-600 dark:bg-warning-500/15 dark:text-warning-400">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            className="size-6"
            aria-hidden="true"
          >
            <path
              d="M7 7H17C19.2091 7 21 8.79086 21 11V15C21 17.2091 19.2091 19 17 19H8"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
            <path
              d="M7 7L10 4M7 7L10 10"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M3 5V19"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {error && !stats ? (
        <div className="px-5 py-6 sm:px-6">
          <div
            role="alert"
            className="min-w-0 wrap-break-word whitespace-pre-wrap rounded-xl border border-error-200 bg-error-50 px-4 py-4 text-sm text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400"
          >
            <p>{error}</p>

            <button
              type="button"
              onClick={onRetry}
              className="mt-3 inline-flex items-center justify-center rounded-lg border border-error-300 bg-white px-3 py-2 text-sm font-medium shadow-theme-xs transition hover:bg-error-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error-500 dark:border-error-500/40 dark:bg-transparent dark:hover:bg-error-500/10"
            >
              Try again
            </button>
          </div>
        </div>
      ) : (
        <>
          {error && stats && (
            <div className="mx-5 mt-4 min-w-0 wrap-break-word whitespace-pre-wrap rounded-lg border border-warning-200 bg-warning-50 px-4 py-3 text-xs text-warning-700 sm:mx-6 dark:border-warning-500/30 dark:bg-warning-500/10 dark:text-warning-400">
              Return statistics could not be refreshed. Displaying previously
              loaded data.
            </div>
          )}

          <div className="grid grid-cols-1 gap-4 px-5 py-5 sm:grid-cols-2 sm:px-6">
            <div className="rounded-xl bg-gray-50 px-4 py-4 dark:bg-white/3">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Total returns
              </p>

              {isLoading && !stats ? (
                <div className="mt-2 h-7 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
              ) : (
                <p className="mt-1 text-xl font-semibold text-gray-800 dark:text-white/90">
                  {formatCount(stats?.totalReturns)}
                </p>
              )}
            </div>

            <div className="rounded-xl bg-gray-50 px-4 py-4 dark:bg-white/3">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Refunded amount
              </p>

              {isLoading && !stats ? (
                <div className="mt-2 h-7 w-32 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
              ) : (
                <p className="mt-1 wrap-break-word text-xl font-semibold text-success-600 dark:text-success-400">
                  {formatCurrency(stats?.totalRefunded)}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-3 border-t border-gray-100 dark:border-gray-800">
            <div className="min-w-0 px-4 py-4 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Requested
              </p>

              {isLoading && !stats ? (
                <div className="mx-auto mt-2 h-5 w-10 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
              ) : (
                <p className="mt-1 text-sm font-semibold text-warning-600 dark:text-warning-400">
                  {formatCount(requestedReturns)}
                </p>
              )}
            </div>

            <div className="min-w-0 border-x border-gray-100 px-4 py-4 text-center dark:border-gray-800">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Refunded
              </p>

              {isLoading && !stats ? (
                <div className="mx-auto mt-2 h-5 w-10 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
              ) : (
                <p className="mt-1 text-sm font-semibold text-success-600 dark:text-success-400">
                  {formatCount(refundedReturns)}
                </p>
              )}
            </div>

            <div className="min-w-0 px-4 py-4 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Rejected
              </p>

              {isLoading && !stats ? (
                <div className="mx-auto mt-2 h-5 w-10 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
              ) : (
                <p className="mt-1 text-sm font-semibold text-error-600 dark:text-error-400">
                  {formatCount(rejectedReturns)}
                </p>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
}

export default ReturnOverviewCard;
