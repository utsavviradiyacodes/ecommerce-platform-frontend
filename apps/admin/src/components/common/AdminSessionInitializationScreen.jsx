import Button from "../ui/button/Button.jsx";

const INITIALIZATION_FAILURE_FALLBACK_MESSAGE =
  "We couldn't check your admin session. Please try again.";

function LoadingIndicator() {
  return (
    <span
      className="size-10 rounded-full border-4 border-gray-200 border-t-brand-500 motion-safe:animate-spin dark:border-gray-700 dark:border-t-brand-400"
      aria-hidden="true"
    />
  );
}

function AdminSessionInitializationScreen({
  isPending,
  error,
  onRetry,
}) {
  if (isPending) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-gray-50 px-4 py-10 dark:bg-gray-900">
        <div
          className="flex flex-col items-center gap-4 text-center"
          role="status"
        >
          <LoadingIndicator />

          <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Checking your admin session...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-gray-50 px-4 py-10 dark:bg-gray-900">
      <section className="w-full max-w-md rounded-2xl border border-gray-200 bg-white p-6 text-center shadow-theme-sm sm:p-8 dark:border-gray-800 dark:bg-white/3">
        <div
          className="mx-auto mb-5 flex size-12 items-center justify-center rounded-full bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400"
          aria-hidden="true"
        >
          <svg
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M12 8V12.5M12 16H12.01M21 12C21 16.9706 16.9706 21 12 21C7.02944 21 3 16.9706 3 12C3 7.02944 7.02944 3 12 3C16.9706 3 21 7.02944 21 12Z"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
          Unable to connect
        </h1>

        <p className="mt-3 text-sm leading-6 text-gray-500 dark:text-gray-400">
          {error || INITIALIZATION_FAILURE_FALLBACK_MESSAGE}
        </p>

        <Button
          type="button"
          onClick={onRetry}
          className="mt-6 w-full"
        >
          Retry
        </Button>
      </section>
    </main>
  );
}

export default AdminSessionInitializationScreen;
