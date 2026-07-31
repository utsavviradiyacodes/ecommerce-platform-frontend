function InputField({
  className = "",
  disabled = false,
  error = false,
  success = false,
  hint = "",
  ...inputProps
}) {
  const {
    id,
    "aria-describedby": providedAriaDescribedBy,
    "aria-invalid": providedAriaInvalid,
    ...remainingInputProps
  } = inputProps;

  const hintId = hint && id ? `${id}-hint` : undefined;
  const ariaDescribedBy = [providedAriaDescribedBy, hintId]
    .filter(Boolean)
    .join(" ");

  let inputClasses = `h-11 w-full appearance-none rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus-visible:outline-hidden focus-visible:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-gray-500 sellora-input ${className}`;

  if (disabled) {
    inputClasses +=
      " cursor-not-allowed border-gray-300 bg-gray-100 text-gray-500 opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400";
  } else if (error) {
    inputClasses +=
      " border-error-500 focus-visible:border-error-500 focus-visible:ring-error-500/30 dark:border-error-500 dark:text-error-400 dark:focus-visible:border-error-400 dark:focus-visible:ring-error-400/30";
  } else if (success) {
    inputClasses +=
      " border-success-500 focus-visible:border-success-500 focus-visible:ring-success-500/30 dark:border-success-500 dark:text-success-400 dark:focus-visible:border-success-400 dark:focus-visible:ring-success-400/30";
  } else {
    inputClasses +=
      " border-gray-300 bg-transparent text-gray-800 focus-visible:border-brand-400 focus-visible:ring-brand-500/30 dark:border-gray-700 dark:text-white/90 dark:focus-visible:border-brand-400 dark:focus-visible:ring-brand-400/30";
  }

  return (
    <div className="relative">
      <input
        {...remainingInputProps}
        id={id}
        disabled={disabled}
        aria-describedby={ariaDescribedBy || undefined}
        aria-invalid={providedAriaInvalid ?? (error || undefined)}
        className={inputClasses}
      />

      {hint && (
        <p
          id={hintId}
          className={`mt-1.5 text-xs ${
            error
              ? "text-error-600 dark:text-error-400"
              : success
                ? "text-success-700 dark:text-success-400"
                : "text-gray-500 dark:text-gray-400"
          }`}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

export default InputField;
