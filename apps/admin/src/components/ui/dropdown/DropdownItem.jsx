import { Link } from "react-router";

export function DropdownItem({
  tag = "button",
  to,
  onClick,
  onItemClick,
  baseClassName = "block w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900",
  className = "",
  children,
}) {
  const combinedClasses = `${baseClassName} ${className}`.trim();

  function handleClick(event) {
    if (tag === "button") {
      event.preventDefault();
    }

    if (onClick) {
      onClick();
    }

    if (onItemClick) {
      onItemClick();
    }
  }

  if (tag === "a" && to) {
    return (
      <Link to={to} className={combinedClasses} onClick={handleClick}>
        {children}
      </Link>
    );
  }

  return (
    <button type="button" onClick={handleClick} className={combinedClasses}>
      {children}
    </button>
  );
}
