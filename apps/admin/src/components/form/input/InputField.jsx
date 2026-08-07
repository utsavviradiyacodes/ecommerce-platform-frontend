import { useEffect, useRef } from "react";

const NUMBER_SPINNER_STEP = 1;

function assignRef(ref, value) {
  if (typeof ref === "function") {
    ref(value);
  } else if (ref && typeof ref === "object") {
    ref.current = value;
  }
}

function setNativeInputValue(input, value) {
  const valueSetter = Object.getOwnPropertyDescriptor(
    Object.getPrototypeOf(input),
    "value"
  )?.set;

  if (valueSetter) {
    valueSetter.call(input, value);
  } else {
    input.value = value;
  }

  input.dispatchEvent(new Event("input", { bubbles: true }));
}

function stepNumberInput(input, direction) {
  if (!input || input.disabled || input.readOnly) {
    return;
  }

  const currentValue = Number(input.value);
  const safeCurrentValue = Number.isFinite(currentValue) ? currentValue : 0;
  const nextValue = Math.max(
    0,
    Math.round(
      (safeCurrentValue + direction * NUMBER_SPINNER_STEP + Number.EPSILON) *
        1e12
    ) / 1e12
  );

  setNativeInputValue(input, String(nextValue));
  input.focus({ preventScroll: true });
}

function NumberSpinner({ disabled = false, onStep }) {
  return (
    <div className="absolute top-px right-px bottom-px flex w-8 flex-col overflow-hidden rounded-r-[7px] border-l border-gray-200 text-gray-500 dark:border-gray-700 dark:text-gray-400">
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        aria-label="Increase value"
        onPointerDown={(event) => event.preventDefault()}
        onClick={() => onStep(1)}
        className="flex min-h-0 flex-1 items-center justify-center bg-transparent transition-colors hover:bg-gray-100 disabled:cursor-not-allowed dark:hover:bg-gray-800"
      >
        <svg viewBox="0 0 10 6" className="h-1.5 w-2.5" aria-hidden="true">
          <path d="M1 5L5 1L9 5" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      <button
        type="button"
        tabIndex={-1}
        disabled={disabled}
        aria-label="Decrease value"
        onPointerDown={(event) => event.preventDefault()}
        onClick={() => onStep(-1)}
        className="flex min-h-0 flex-1 items-center justify-center border-t border-gray-200 bg-transparent transition-colors hover:bg-gray-100 disabled:cursor-not-allowed dark:border-gray-700 dark:hover:bg-gray-800"
      >
        <svg viewBox="0 0 10 6" className="h-1.5 w-2.5" aria-hidden="true">
          <path d="M1 1L5 5L9 1" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
    </div>
  );
}

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
    ref: providedRef,
    onKeyDown: providedOnKeyDown,
    step: providedStep,
    "aria-describedby": providedAriaDescribedBy,
    "aria-invalid": providedAriaInvalid,
    ...remainingInputProps
  } = inputProps;
  const inputRef = useRef(null);
  const isNumberInput = remainingInputProps.type === "number";
  const isNumberSpinnerDisabled =
    disabled || remainingInputProps.readOnly === true;

  const hintId = hint && id ? `${id}-hint` : undefined;
  const ariaDescribedBy = [providedAriaDescribedBy, hintId]
    .filter(Boolean)
    .join(" ");

  let inputClasses = `h-11 w-full appearance-none rounded-lg border px-4 py-2.5 text-sm shadow-theme-xs placeholder:text-gray-400 focus-visible:outline-hidden focus-visible:ring-3 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-gray-500 sellora-input ${
    isNumberInput
      ? "pr-10 [&::-webkit-inner-spin-button]:m-0 [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:m-0 [&::-webkit-outer-spin-button]:appearance-none"
      : ""
  } ${className}`;

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

  function handleInputRef(input) {
    inputRef.current = input;
    assignRef(providedRef, input);
  }

  function handleKeyDown(event) {
    providedOnKeyDown?.(event);

    if (!isNumberInput || event.defaultPrevented) {
      return;
    }

    if (event.key === "ArrowUp" || event.key === "ArrowDown") {
      event.preventDefault();
      stepNumberInput(inputRef.current, event.key === "ArrowUp" ? 1 : -1);
    }
  }

  useEffect(() => {
    const input = inputRef.current;

    if (!isNumberInput || !input) {
      return undefined;
    }

    function handleWheel(event) {
      if (document.activeElement !== input || event.deltaY === 0) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();
      stepNumberInput(input, event.deltaY < 0 ? 1 : -1);
    }

    input.addEventListener("wheel", handleWheel, { passive: false });

    return () => input.removeEventListener("wheel", handleWheel);
  }, [isNumberInput]);

  return (
    <div>
      <div className="relative">
        <input
          {...remainingInputProps}
          ref={handleInputRef}
          id={id}
          step={isNumberInput ? "any" : providedStep}
          disabled={disabled}
          onKeyDown={handleKeyDown}
          aria-describedby={ariaDescribedBy || undefined}
          aria-invalid={providedAriaInvalid ?? (error || undefined)}
          className={inputClasses}
        />

        {isNumberInput && (
          <NumberSpinner
            disabled={isNumberSpinnerDisabled}
            onStep={(direction) => stepNumberInput(inputRef.current, direction)}
          />
        )}
      </div>

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
