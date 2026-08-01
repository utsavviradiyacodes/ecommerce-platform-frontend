function FileInput({
  className = "",
  error = false,
  hint = "",
  id,
  "aria-describedby": providedAriaDescribedBy,
  "aria-invalid": providedAriaInvalid,
  ...inputProps
}) {
  let inputClasses =
    "h-11 w-full overflow-hidden rounded-lg border bg-transparent text-sm text-gray-500 shadow-theme-xs transition-colors file:mr-5 file:cursor-pointer file:border-0 file:border-r file:border-solid file:border-gray-200 file:bg-gray-50 file:px-3.5 file:py-3 file:text-sm file:text-gray-700 hover:file:bg-gray-100 focus-visible:outline-hidden focus-visible:ring-3 dark:bg-gray-900 dark:text-gray-400 dark:file:border-gray-800 dark:file:bg-white/[0.03] dark:file:text-gray-400";

  if (error) {
    inputClasses +=
      " border-error-500 focus-visible:border-error-500 focus-visible:ring-error-500/30 dark:border-error-500 dark:focus-visible:border-error-400 dark:focus-visible:ring-error-400/30";
  } else {
    inputClasses +=
      " border-gray-300 focus-visible:border-brand-400 focus-visible:ring-brand-500/30 dark:border-gray-700 dark:focus-visible:border-brand-400 dark:focus-visible:ring-brand-400/30";
  }

  const hintId = hint && id ? `${id}-hint` : undefined;

  const ariaDescribedBy =
    [providedAriaDescribedBy, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div>
      <input
        {...inputProps}
        id={id}
        type="file"
        aria-describedby={ariaDescribedBy}
        aria-invalid={providedAriaInvalid ?? (error || undefined)}
        className={`${inputClasses} ${className}`}
      />

      {hint && (
        <p
          id={hintId}
          className={`mt-1.5 text-xs ${
            error
              ? "text-error-600 dark:text-error-400"
              : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

export default FileInput;
