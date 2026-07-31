function NotFoundPage({ standalone = false }) {
  return (
    <main
      className={`flex items-center justify-center bg-gray-50 px-4 py-12 text-center dark:bg-gray-900 ${
        standalone ? "min-h-dvh" : "min-h-[calc(100dvh-8rem)]"
      }`}
    >
      <div className="max-w-md">
        <p className="text-7xl font-semibold text-brand-500 dark:text-brand-400">
          404
        </p>

        <h1 className="mt-5 text-2xl font-semibold text-gray-900 sm:text-3xl dark:text-white">
          Page not found
        </h1>

        <p className="mt-3 text-sm leading-6 text-gray-500 sm:text-base dark:text-gray-400">
          The page you requested could not be found.
        </p>
      </div>
    </main>
  );
}

export default NotFoundPage;
