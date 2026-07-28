import { useCallback, useState } from "react";
import { Link, useLocation } from "react-router";

import {
  ChevronDownIcon,
  HorizontalDotsIcon,
} from "../../../../icons/index.js";

function SidebarNavigation({
  navItems,
  isExpanded,
  isHovered,
  isMobileOpen,
  onNavigate,
}) {
  const location = useLocation();

  const showLabels = isExpanded || isHovered || isMobileOpen;

  const isActive = useCallback(
    (path) => location.pathname === path,
    [location.pathname]
  );

  const activeParentLabel =
    navItems.find((navItem) =>
      navItem.subItems?.some((subItem) => isActive(subItem.path))
    )?.label ?? null;

  const [submenuSelection, setSubmenuSelection] = useState({
    pathname: null,
    label: null,
  });

  const openSubmenu =
    submenuSelection.pathname === location.pathname
      ? submenuSelection.label
      : activeParentLabel;

  function handleSubmenuToggle(label) {
    setSubmenuSelection({
      pathname: location.pathname,
      label: openSubmenu === label ? null : label,
    });
  }

  return (
    <nav className="mb-6">
      <h2
        className={`mb-4 flex text-xs uppercase leading-5 text-gray-400 ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        {showLabels ? "Menu" : <HorizontalDotsIcon className="size-6" />}
      </h2>

      <ul className="flex flex-col gap-4">
        {navItems.map((navItem) => {
          const Icon = navItem.icon;

          const submenuIsOpen = openSubmenu === navItem.label;

          const submenuContainsActiveRoute =
            navItem.subItems?.some((subItem) => isActive(subItem.path)) ??
            false;

          const parentIsActive = submenuIsOpen || submenuContainsActiveRoute;

          return (
            <li key={navItem.label}>
              {navItem.subItems ? (
                <button
                  type="button"
                  aria-expanded={submenuIsOpen}
                  onClick={() => handleSubmenuToggle(navItem.label)}
                  className={`menu-item group ${
                    parentIsActive ? "menu-item-active" : "menu-item-inactive"
                  } ${
                    !isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "lg:justify-start"
                  }`}
                >
                  <span
                    className={`menu-item-icon-size ${
                      parentIsActive
                        ? "menu-item-icon-active"
                        : "menu-item-icon-inactive"
                    }`}
                  >
                    <Icon />
                  </span>

                  {showLabels && <span>{navItem.label}</span>}

                  {showLabels && (
                    <ChevronDownIcon
                      className={`ml-auto size-5 transition-transform duration-200 ${
                        submenuIsOpen ? "rotate-180 text-brand-500" : ""
                      }`}
                    />
                  )}
                </button>
              ) : (
                <Link
                  to={navItem.path}
                  onClick={onNavigate}
                  className={`menu-item group ${
                    isActive(navItem.path)
                      ? "menu-item-active"
                      : "menu-item-inactive"
                  } ${
                    !isExpanded && !isHovered
                      ? "lg:justify-center"
                      : "lg:justify-start"
                  }`}
                >
                  <span
                    className={`menu-item-icon-size ${
                      isActive(navItem.path)
                        ? "menu-item-icon-active"
                        : "menu-item-icon-inactive"
                    }`}
                  >
                    <Icon />
                  </span>

                  {showLabels && <span>{navItem.label}</span>}
                </Link>
              )}

              {navItem.subItems && showLabels && (
                <div
                  className={`grid transition-[grid-template-rows] duration-300 ease-in-out ${
                    submenuIsOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
                  }`}
                >
                  <div className="overflow-hidden">
                    <ul className="mt-2 ml-9 space-y-1">
                      {navItem.subItems.map((subItem) => (
                        <li key={subItem.path}>
                          <Link
                            to={subItem.path}
                            onClick={onNavigate}
                            className={`menu-dropdown-item ${
                              isActive(subItem.path)
                                ? "menu-dropdown-item-active"
                                : "menu-dropdown-item-inactive"
                            }`}
                          >
                            {subItem.label}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export default SidebarNavigation;
