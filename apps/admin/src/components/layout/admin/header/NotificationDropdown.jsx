import { useState } from "react";

import { Dropdown } from "../../../ui/dropdown/Dropdown.jsx";

const NOTIFICATIONS = [
  {
    id: "seller-application",
    type: "Seller",
    title: "Seller application",
    message: "A new Seller application is waiting for review.",
    time: "5 min ago",
    iconClasses:
      "bg-brand-50 text-brand-500 dark:bg-brand-500/15 dark:text-brand-400",
  },
  {
    id: "return-request",
    type: "Return",
    title: "Return request",
    message: "A Return request requires Admin review.",
    time: "18 min ago",
    iconClasses:
      "bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-400",
  },
  {
    id: "payment-refund",
    type: "Payment",
    title: "Payment refund",
    message: "A Payment refund was processed successfully.",
    time: "1 hr ago",
    iconClasses:
      "bg-success-50 text-success-600 dark:bg-success-500/15 dark:text-success-400",
  },
];

function NotificationIcon({ type }) {
  const normalizedType = type.toLowerCase();

  if (normalizedType === "seller") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
        <path
          d="M16 20V18.5C16 16.57 14.43 15 12.5 15H7.5C5.57 15 4 16.57 4 18.5V20M10 11C12.21 11 14 9.21 14 7C14 4.79 12.21 3 10 3C7.79 3 6 4.79 6 7C6 9.21 7.79 11 10 11ZM18 8V14M21 11H15"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (normalizedType === "return") {
    return (
      <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
        <path
          d="M8 7H17C18.66 7 20 8.34 20 10V17M8 7L11 4M8 7L11 10M16 17H7C5.34 17 4 15.66 4 14V7M16 17L13 14M16 17L13 20"
          stroke="currentColor"
          strokeWidth="1.7"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" fill="none" className="size-5" aria-hidden="true">
      <path
        d="M4 7H20M6 4H18C19.1 4 20 4.9 20 6V18C20 19.1 19.1 20 18 20H6C4.9 20 4 19.1 4 18V6C4 4.9 4.9 4 6 4ZM8 15H11"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);

  function toggleDropdown() {
    setIsOpen((currentValue) => !currentValue);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleDropdown}
        aria-label={isOpen ? "Close notifications" : "Open notifications"}
        aria-expanded={isOpen}
        className="dropdown-toggle relative flex h-11 w-11 items-center justify-center rounded-full border border-gray-200 bg-white text-gray-500 transition-colors hover:bg-gray-100 hover:text-gray-700 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
      >
        {/* TailAdmin-style unread indicator */}
        <span className="absolute right-0 top-0.5 z-10 h-2 w-2 rounded-full bg-orange-400">
          <span className="absolute inset-0 inline-flex h-full w-full animate-ping rounded-full bg-orange-400 opacity-75" />
        </span>

        <svg
          aria-hidden="true"
          className="fill-current"
          width="20"
          height="20"
          viewBox="0 0 20 20"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M10.75 2.29248C10.75 1.87827 10.4143 1.54248 10 1.54248C9.58583 1.54248 9.25004 1.87827 9.25004 2.29248V2.83613C6.08266 3.20733 3.62504 5.9004 3.62504 9.16748V14.4591H3.33337C2.91916 14.4591 2.58337 14.7949 2.58337 15.2091C2.58337 15.6234 2.91916 15.9591 3.33337 15.9591H4.37504H15.625H16.6667C17.0809 15.9591 17.4167 15.6234 17.4167 15.2091C17.4167 14.7949 17.0809 14.4591 16.6667 14.4591H16.375V9.16748C16.375 5.9004 13.9174 3.20733 10.75 2.83613V2.29248ZM14.875 14.4591V9.16748C14.875 6.47509 12.6924 4.29248 10 4.29248C7.30765 4.29248 5.12504 6.47509 5.12504 9.16748V14.4591H14.875ZM8.00004 17.7085C8.00004 18.1228 8.33583 18.4585 8.75004 18.4585H11.25C11.6643 18.4585 12 18.1228 12 17.7085C12 17.2943 11.6643 16.9585 11.25 16.9585H8.75004C8.33583 16.9585 8.00004 17.2943 8.00004 17.7085Z"
            fill="currentColor"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="-right-60 mt-4.25 flex w-87.5 flex-col rounded-2xl p-3 sm:w-90.25 lg:right-0"
      >
        <div className="mb-3 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-gray-700">
          <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200">
            Notifications
          </h2>

          <button
            type="button"
            onClick={closeDropdown}
            aria-label="Close notifications"
            className="text-2xl leading-none text-gray-500 transition-colors hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ×
          </button>
        </div>

        <ul className="custom-scrollbar max-h-96 overflow-y-auto">
          {NOTIFICATIONS.map((notification) => (
            <li
              key={notification.id}
              className="flex gap-3 border-b border-gray-100 px-2 py-3 last:border-b-0 dark:border-gray-800"
            >
              <span
                className={`flex size-10 shrink-0 items-center justify-center rounded-full ${notification.iconClasses}`}
              >
                <NotificationIcon type={notification.type} />
              </span>

              <div className="min-w-0 flex-1">
                <div className="flex items-start gap-2">
                  <p className="min-w-0 flex-1 text-theme-sm font-medium text-gray-800 dark:text-white/90">
                    {notification.title}
                  </p>
                  <span
                    className="mt-1.5 size-2 shrink-0 rounded-full bg-brand-500"
                    aria-label="Unread"
                  />
                </div>

                <p className="mt-0.5 text-theme-xs leading-5 text-gray-500 dark:text-gray-400">
                  {notification.message}
                </p>

                <p className="mt-1 text-theme-xs text-gray-400 dark:text-gray-500">
                  {notification.type} <span aria-hidden="true">&bull;</span>{" "}
                  {notification.time}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </Dropdown>
    </div>
  );
}

export default NotificationDropdown;
