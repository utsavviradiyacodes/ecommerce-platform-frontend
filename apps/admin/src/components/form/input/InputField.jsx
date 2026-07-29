function InputField({
  className = "",
  disabled = false,
  error = false,
  success = false,
  hint = "",
  ...inputProps
}) {
  let inputClasses = `h-11 w-full appearance-none rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus:outline-hidden focus:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 sellora-input ${className}`;

  if (disabled) {
    inputClasses +=
      " cursor-not-allowed border-gray-300 bg-gray-100 text-gray-500 opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400";
  } else if (error) {
    inputClasses +=
      " border-error-500 focus:border-error-300 focus:ring-error-500/20 dark:border-error-500 dark:text-error-400 dark:focus:border-error-800";
  } else if (success) {
    inputClasses +=
      " border-success-500 focus:border-success-300 focus:ring-success-500/20 dark:border-success-500 dark:text-success-400 dark:focus:border-success-800";
  } else {
    inputClasses +=
      " border-gray-300 bg-transparent text-gray-800 focus:border-brand-300 focus:ring-brand-500/20 dark:border-gray-700 dark:text-white/90 dark:focus:border-brand-800";
  }

  return (
    <div className="relative">
      <input {...inputProps} disabled={disabled} className={inputClasses} />

      {hint && (
        <p
          className={`mt-1.5 text-xs ${
            error
              ? "text-error-500"
              : success
                ? "text-success-500"
                : "text-gray-500"
          }`}
        >
          {hint}
        </p>
      )}
    </div>
  );
}

export default InputField;
