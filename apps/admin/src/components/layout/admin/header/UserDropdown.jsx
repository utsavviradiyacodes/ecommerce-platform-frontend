import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import {
  signOutAdminThunk,
  selectAdminSignOutError,
  selectCurrentAdmin,
  selectIsAdminSignOutPending,
} from "../../../../features/auth/authSlice.js";
import { Dropdown } from "../../../ui/dropdown/Dropdown.jsx";
import { DropdownItem } from "../../../ui/dropdown/DropdownItem.jsx";
import {
  AccountSettingsIcon,
  EditProfileIcon,
  SignOutIcon,
  SupportIcon,
} from "./UserMenuIcons.jsx";

const dropdownItemClasses =
  "group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-theme-sm font-medium text-gray-700 hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300";

const dropdownIconClasses =
  "shrink-0 fill-gray-500 transition-colors group-hover:fill-gray-700 dark:fill-gray-400 dark:group-hover:fill-gray-300";

function HeaderAvatar({ avatarUrl, adminName, adminInitial }) {
  const [hasAvatarError, setHasAvatarError] = useState(false);

  return (
    <span className="mr-3 flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-brand-500 text-lg font-semibold text-white">
      {avatarUrl && !hasAvatarError ? (
        <img
          src={avatarUrl}
          alt={`${adminName} profile`}
          onError={() => setHasAvatarError(true)}
          className="h-full w-full object-cover"
        />
      ) : (
        adminInitial
      )}
    </span>
  );
}

function UserDropdown() {
  const dispatch = useDispatch();

  const currentAdmin = useSelector(selectCurrentAdmin);
  const isAdminSignOutPending = useSelector(selectIsAdminSignOutPending);
  const adminSignOutError = useSelector(selectAdminSignOutError);

  const [isOpen, setIsOpen] = useState(false);

  const adminName =
    typeof currentAdmin?.name === "string" && currentAdmin.name.trim()
      ? currentAdmin.name.trim()
      : "Admin";

  const adminEmail =
    typeof currentAdmin?.email === "string" ? currentAdmin.email.trim() : "";

  const avatarUrl =
    typeof currentAdmin?.avatar === "string" ? currentAdmin.avatar.trim() : "";

  const adminInitial = adminName.charAt(0).toUpperCase();

  function toggleDropdown() {
    setIsOpen((currentValue) => !currentValue);
  }

  function closeDropdown() {
    setIsOpen(false);
  }

  function handleSignOut() {
    dispatch(signOutAdminThunk());
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleDropdown}
        className="dropdown-toggle flex items-center text-gray-700 dark:text-gray-400"
      >
        <HeaderAvatar
          key={avatarUrl || "header-avatar-fallback"}
          avatarUrl={avatarUrl}
          adminName={adminName}
          adminInitial={adminInitial}
        />

        <span className="mr-1 hidden text-theme-sm font-medium sm:block">
          {adminName}
        </span>

        <svg
          aria-hidden="true"
          className={`stroke-gray-500 transition-transform duration-200 dark:stroke-gray-400 ${
            isOpen ? "rotate-180" : ""
          }`}
          width="18"
          height="20"
          viewBox="0 0 18 20"
          fill="none"
        >
          <path
            d="M4.3125 8.65625L9 13.3437L13.6875 8.65625"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      <Dropdown
        isOpen={isOpen}
        onClose={closeDropdown}
        className="right-0 mt-4.25 flex w-65 flex-col rounded-2xl p-3"
      >
        {/* No border below the admin information */}
        <div>
          <span className="block text-theme-sm font-medium text-gray-700 dark:text-gray-400">
            {adminName}
          </span>

          <span className="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
            {adminEmail}
          </span>
        </div>

        {/* The only divider is below this list */}
        <ul className="flex flex-col gap-1 border-b border-gray-200 pt-4 pb-3 dark:border-gray-800">
          <li>
            <DropdownItem
              tag="a"
              to="/admin/profile"
              onItemClick={closeDropdown}
              baseClassName={dropdownItemClasses}
            >
              <EditProfileIcon className={dropdownIconClasses} />
              <span>Edit profile</span>
            </DropdownItem>
          </li>

          <li>
            <DropdownItem
              tag="a"
              to="/admin/settings"
              onItemClick={closeDropdown}
              baseClassName={dropdownItemClasses}
            >
              <AccountSettingsIcon className={dropdownIconClasses} />
              <span>Account settings</span>
            </DropdownItem>
          </li>

          <li>
            <DropdownItem
              onItemClick={closeDropdown}
              baseClassName={dropdownItemClasses}
            >
              <SupportIcon className={dropdownIconClasses} />
              <span>Support</span>
            </DropdownItem>
          </li>
        </ul>

        <div className="mt-3">
          {adminSignOutError && (
            <p
              role="alert"
              className="mb-2 rounded-lg border border-error-200 bg-error-50 px-3 py-2 text-theme-xs text-error-700 dark:border-error-500/30 dark:bg-error-500/10 dark:text-error-400"
            >
              {adminSignOutError}
            </p>
          )}

          <button
            type="button"
            onClick={handleSignOut}
            disabled={isAdminSignOutPending}
            className={`${dropdownItemClasses} disabled:cursor-not-allowed disabled:opacity-50`}
          >
            <SignOutIcon className={dropdownIconClasses} />

            <span>{isAdminSignOutPending ? "Signing out..." : "Sign out"}</span>
          </button>
        </div>
      </Dropdown>
    </div>
  );
}

export default UserDropdown;
