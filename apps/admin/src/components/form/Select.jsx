import { useState } from "react";
import ReactSelect, {
  components as ReactSelectComponents,
} from "react-select";

import { ChevronDownIcon } from "../../icons/index.js";

const SELECT_MENU_PORTAL_Z_INDEX = 100000;
const DEFAULT_MENU_MAX_HEIGHT = 248;
const SELECT_MENU_VIEWPORT_GUTTER = 8;

function DropdownIndicator(indicatorProps) {
  return (
    <ReactSelectComponents.DropdownIndicator {...indicatorProps}>
      <ChevronDownIcon className="size-5" />
    </ReactSelectComponents.DropdownIndicator>
  );
}

function SearchInput(inputProps) {
  const { selectProps } = inputProps;
  const isSearchInputActive = selectProps.menuIsOpen;

  return (
    <ReactSelectComponents.Input
      {...inputProps}
      inputMode={isSearchInputActive ? "text" : "none"}
      readOnly={!isSearchInputActive}
    />
  );
}

const SELECT_COMPONENTS = {
  DropdownIndicator,
  IndicatorSeparator: null,
  Input: SearchInput,
};

function createMessageResolver(message, fallbackMessage) {
  if (typeof message === "function") {
    return message;
  }

  return () => message || fallbackMessage;
}

function getViewportSafeMenuPortalStyles(baseStyles) {
  const portalStyles = {
    ...baseStyles,
    zIndex: SELECT_MENU_PORTAL_Z_INDEX,
  };

  if (typeof window === "undefined") {
    return portalStyles;
  }

  const availableWidth = Math.max(
    window.innerWidth - SELECT_MENU_VIEWPORT_GUTTER * 2,
    0
  );
  const measuredWidth = Number.parseFloat(baseStyles.width);
  const measuredLeft = Number.parseFloat(baseStyles.left);
  const menuWidth = Math.min(
    Number.isFinite(measuredWidth) ? measuredWidth : availableWidth,
    availableWidth
  );
  const preferredLeft = Number.isFinite(measuredLeft)
    ? measuredLeft
    : SELECT_MENU_VIEWPORT_GUTTER;
  const maximumLeft = Math.max(
    SELECT_MENU_VIEWPORT_GUTTER,
    window.innerWidth - SELECT_MENU_VIEWPORT_GUTTER - menuWidth
  );

  return {
    ...portalStyles,
    left: Math.min(
      Math.max(preferredLeft, SELECT_MENU_VIEWPORT_GUTTER),
      maximumLeft
    ),
    width: menuWidth,
  };
}

function Select({
  ref,
  id,
  name,
  options = [],
  value = "",
  onChange = () => {},
  onBlur,
  placeholder = "Select an option",
  disabled = false,
  error = false,
  hint = "",
  isSearchable = false,
  isLoading = false,
  loadingMessage = "Loading options...",
  noOptionsMessage = "No options found.",
  searchPlaceholder = "Search options...",
  isClearable = false,
  className = "",
  menuPlacement = "auto",
  menuPosition = "fixed",
  maxMenuHeight = DEFAULT_MENU_MAX_HEIGHT,
  menuShouldScrollIntoView = false,
  menuPortalTarget: providedMenuPortalTarget,
  "aria-describedby": providedAriaDescribedBy,
  "aria-invalid": providedAriaInvalid,
}) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const selectedOption =
    options.find((option) => Object.is(option.value, value)) ?? null;

  const searchableMenuIsOpen = isSearchable && isMenuOpen;

  const hintId = hint && id ? `${id}-hint` : undefined;
  const ariaDescribedBy =
    [providedAriaDescribedBy, hintId].filter(Boolean).join(" ") || undefined;

  const defaultMenuPortalTarget =
    typeof document === "undefined" ? null : document.body;
  const menuPortalTarget =
    providedMenuPortalTarget === undefined
      ? defaultMenuPortalTarget
      : providedMenuPortalTarget;

  function handleChange(option) {
    onChange(option ? option.value : "");
  }

  return (
    <div className={`min-w-0 ${className}`}>
      <ReactSelect
        ref={ref}
        inputId={id}
        name={name}
        options={options}
        value={selectedOption}
        onChange={handleChange}
        onBlur={onBlur}
        onMenuOpen={() => setIsMenuOpen(true)}
        onMenuClose={() => setIsMenuOpen(false)}
        placeholder={
          searchableMenuIsOpen ? searchPlaceholder : placeholder
        }
        isDisabled={disabled}
        isOptionDisabled={(option) => Boolean(option.disabled)}
        isSearchable={isSearchable}
        controlShouldRenderValue={!searchableMenuIsOpen}
        isLoading={isLoading}
        loadingMessage={createMessageResolver(
          loadingMessage,
          "Loading options..."
        )}
        noOptionsMessage={createMessageResolver(
          noOptionsMessage,
          "No options found."
        )}
        isClearable={isClearable}
        unstyled
        components={SELECT_COMPONENTS}
        menuPortalTarget={menuPortalTarget}
        menuPosition={menuPosition}
        menuPlacement={menuPlacement}
        maxMenuHeight={maxMenuHeight}
        menuShouldScrollIntoView={menuShouldScrollIntoView}
        aria-describedby={ariaDescribedBy}
        aria-invalid={providedAriaInvalid ?? (error || undefined)}
        styles={{ menuPortal: getViewportSafeMenuPortalStyles }}
        classNames={{
          container: () => "w-full min-w-0",
          control: ({ isDisabled, isFocused }) => {
            const interactionClass = searchableMenuIsOpen
              ? "cursor-text"
              : "cursor-pointer";

            const baseClasses = `flex h-11 min-h-11 w-full min-w-0 rounded-lg border bg-transparent text-sm shadow-theme-xs transition ${interactionClass}`;
            const enabledBaseClasses = `${baseClasses} dark:bg-gray-900`;

            if (isDisabled) {
              return `${baseClasses} cursor-not-allowed border-gray-300 bg-gray-100 text-gray-500 opacity-40 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400`;
            }

            if (error) {
              return `${enabledBaseClasses} border-error-500 ${
                isFocused
                  ? "ring-3 ring-error-500/30 dark:border-error-400 dark:ring-error-400/30"
                  : ""
              } dark:border-error-500`;
            }

            return `${enabledBaseClasses} border-gray-300 ${
              isFocused
                ? "border-brand-400 ring-3 ring-brand-500/30 dark:border-brand-400 dark:ring-brand-400/30"
                : ""
            } dark:border-gray-700`;
          },
          valueContainer: () => "min-w-0 overflow-hidden px-4 py-0",
          singleValue: () =>
            "min-w-0 max-w-full truncate text-gray-800 dark:text-white/90",
          placeholder: () =>
            "min-w-0 max-w-full truncate text-gray-400 dark:text-gray-500",
          input: () =>
            `m-0 min-w-0 overflow-hidden p-0 text-gray-800 dark:text-white/90 ${
              searchableMenuIsOpen ? "caret-current" : "caret-transparent"
            }`,
          indicatorsContainer: () => "shrink-0 pr-2",
          dropdownIndicator: ({ isFocused }) =>
            `flex size-9 items-center justify-center rounded-md p-0 text-gray-500 transition-colors dark:text-gray-400 ${
              isFocused ? "text-brand-500 dark:text-brand-400" : ""
            }`,
          clearIndicator: () =>
            "flex size-8 cursor-pointer items-center justify-center rounded-md p-0 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-500 dark:hover:bg-gray-800 dark:hover:text-gray-300",
          loadingIndicator: () =>
            "mr-1 flex text-brand-500 dark:text-brand-400",
          menu: () =>
            "my-1 w-full min-w-0 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-theme-lg dark:border-gray-700 dark:bg-gray-900",
          menuList: () =>
            "custom-scrollbar max-h-62 overflow-x-hidden overflow-y-auto px-1 py-1",
          option: ({ isDisabled, isFocused, isSelected }) => {
            const baseClasses =
              "w-full min-w-0 truncate rounded-md px-3 py-2 text-sm";

            if (isDisabled) {
              return `${baseClasses} cursor-not-allowed text-gray-400 opacity-60 dark:text-gray-600`;
            }

            if (isSelected) {
              return `${baseClasses} cursor-pointer bg-brand-50 font-medium text-brand-600 dark:bg-brand-500/15 dark:text-brand-400`;
            }

            if (isFocused) {
              return `${baseClasses} cursor-pointer bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-white/90`;
            }

            return `${baseClasses} cursor-pointer text-gray-700 dark:text-gray-300`;
          },
          noOptionsMessage: () =>
            "px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400",
          loadingMessage: () =>
            "px-3 py-4 text-center text-sm text-gray-500 dark:text-gray-400",
        }}
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

export default Select;
