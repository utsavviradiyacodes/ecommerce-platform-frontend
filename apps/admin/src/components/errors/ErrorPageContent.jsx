import { Link } from "react-router";

import GridShape from "../common/GridShape.jsx";

function ErrorPageContent({
  code,
  message,
  standalone = false,
  lightImage,
  darkImage,
  illustrationAlt,
}) {
  const minimumHeightClass = standalone
    ? "min-h-dvh bg-white dark:bg-gray-900"
    : "min-h-[calc(100dvh-10rem)]";

  const spacingClass = standalone ? "px-6 py-20" : "p-6";

  const hasIllustrations = Boolean(lightImage && darkImage);

  return (
    <section
      className={`relative z-1 flex flex-col items-center justify-center overflow-hidden ${minimumHeightClass} ${spacingClass}`}
    >
      <GridShape />

      <div className="mx-auto w-full max-w-60.5 text-center sm:max-w-118">
        <h1 className="mb-8 text-title-md font-bold text-gray-800 dark:text-white/90 xl:text-title-2xl">
          ERROR
        </h1>

        {hasIllustrations ? (
          <>
            <img
              src={lightImage}
              alt={illustrationAlt}
              className="dark:hidden"
            />

            <img
              src={darkImage}
              alt={illustrationAlt}
              className="hidden dark:block"
            />
          </>
        ) : (
          <div className="flex min-h-32 items-center justify-center sm:min-h-48">
            <p className="text-[96px] leading-none font-bold tracking-[-0.06em] text-brand-500 sm:text-[152px] dark:text-brand-400">
              {code}
            </p>
          </div>
        )}

        <p
          className={`mt-10 text-base text-gray-700 sm:text-lg dark:text-gray-400 ${
            standalone ? "mb-6" : ""
          }`}
        >
          {message}
        </p>

        {standalone && (
          <Link
            to="/admin"
            replace
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-5 py-3.5 text-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700 dark:hover:text-gray-200"
          >
            Back to Home Page
          </Link>
        )}
      </div>

      {standalone && (
        <p className="absolute bottom-6 left-1/2 -translate-x-1/2 text-center text-sm text-gray-500 dark:text-gray-400">
          &copy; {new Date().getFullYear()} - Sellora
        </p>
      )}
    </section>
  );
}

export default ErrorPageContent;
