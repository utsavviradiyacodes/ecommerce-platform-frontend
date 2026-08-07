import Button from "../ui/button/Button.jsx";

function RefreshIcon({ isRefreshing = false }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={`size-4 ${
        isRefreshing
          ? "animate-spin [animation-timing-function:linear] will-change-transform"
          : ""
      }`}
      aria-hidden="true"
    >
      <path
        d="M20 7V3M20 3H16M20 3L16.8 6.2C15.52 4.92 13.76 4.12 11.8 4.12C7.9 4.12 4.75 7.28 4.75 11.17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 17V21M4 21H8M4 21L7.2 17.8C8.48 19.08 10.24 19.88 12.2 19.88C16.1 19.88 19.25 16.72 19.25 12.83"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function RefreshDataButton({
  onClick = () => {},
  isRefreshing = false,
  disabled = false,
  className = "",
}) {
  return (
    <Button
      type="button"
      size="sm"
      variant="outline"
      onClick={onClick}
      disabled={disabled || isRefreshing}
      aria-busy={isRefreshing || undefined}
      startIcon={<RefreshIcon isRefreshing={isRefreshing} />}
      className={`h-11 w-36 shrink-0 ${className}`}
    >
      Refresh data
    </Button>
  );
}

export default RefreshDataButton;
