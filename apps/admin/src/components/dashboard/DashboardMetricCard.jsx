const HELPER_TONE_CLASSES = {
  neutral: "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300",
  success:
    "bg-success-50 text-success-700 dark:bg-success-500/15 dark:text-success-400",
  warning:
    "bg-warning-50 text-warning-700 dark:bg-warning-500/15 dark:text-warning-400",
};

function DashboardMetricCard({
  title,
  value,
  helperText = "",
  helperTone = "neutral",
  icon,
  isLoading = false,
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs sm:p-6 dark:border-gray-800 dark:bg-white/3">
      <div className="flex size-12 items-center justify-center rounded-xl bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-white/90">
        {icon}
      </div>

      <div className="mt-5 flex min-w-0 items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
            {title}
          </p>

          {isLoading ? (
            <div className="mt-2 h-8 w-28 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-800" />
          ) : (
            <h3 className="mt-1 min-w-0 wrap-break-word text-2xl font-bold text-gray-800 sm:text-3xl dark:text-white/90">
              {value}
            </h3>
          )}
        </div>

        {isLoading ? (
          <div className="h-7 w-20 shrink-0 animate-pulse rounded-full bg-gray-200 dark:bg-gray-800" />
        ) : (
          helperText && (
            <span
              className={`inline-flex shrink-0 items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                HELPER_TONE_CLASSES[helperTone] ?? HELPER_TONE_CLASSES.neutral
              }`}
            >
              {helperText}
            </span>
          )
        )}
      </div>
    </div>
  );
}

export default DashboardMetricCard;
