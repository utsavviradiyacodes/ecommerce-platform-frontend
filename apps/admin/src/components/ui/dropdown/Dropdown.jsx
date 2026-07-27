import { useEffect, useRef } from "react";

export function Dropdown({ isOpen, onClose, children, className = "" }) {
  const dropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      const clickedInsideDropdown =
        dropdownRef.current && dropdownRef.current.contains(event.target);

      const clickedDropdownButton = event.target.closest(".dropdown-toggle");

      if (!clickedInsideDropdown && !clickedDropdownButton) {
        onClose();
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      ref={dropdownRef}
      className={`absolute right-0 z-40 mt-2 rounded-xl border border-gray-200 bg-white shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark ${className}`}
    >
      {children}
    </div>
  );
}
