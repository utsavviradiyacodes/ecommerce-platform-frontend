import { useMemo } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router";

import { ADMIN_NAV_ITEMS } from "../../../constants/adminNavigation.js";
import { useSidebar } from "../../../hooks/useSidebar.js";
import { selectCurrentAdmin } from "../../../features/auth/authSlice.js";
import { getVisibleAdminNavigationItems } from "../../../utils/getVisibleAdminNavigationItems.js";
import SidebarNavigation from "./sidebar/SidebarNavigation.jsx";

function AppSidebar() {
  const {
    isExpanded,
    isMobileOpen,
    isHovered,
    setIsHovered,
    closeMobileSidebar,
  } = useSidebar();

  const currentAdmin = useSelector(selectCurrentAdmin);

  const visibleNavItems = useMemo(
    () => getVisibleAdminNavigationItems(ADMIN_NAV_ITEMS, currentAdmin),
    [currentAdmin]
  );

  const showBrandText = isExpanded || isHovered || isMobileOpen;

  const sidebarIsWide = isExpanded || isHovered || isMobileOpen;

  return (
    <aside
      className={`fixed top-0 left-0 z-50 mt-16 flex h-screen flex-col border-r border-gray-200 bg-white px-5 text-gray-900 transition-all duration-300 ease-in-out dark:border-gray-800 dark:bg-gray-900 lg:mt-0 ${
        sidebarIsWide ? "w-72.5" : "w-22.5"
      } ${
        isMobileOpen ? "translate-x-0" : "-translate-x-full"
      } lg:translate-x-0`}
      onMouseEnter={() => {
        if (!isExpanded) {
          setIsHovered(true);
        }
      }}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        className={`flex py-8 ${
          !isExpanded && !isHovered ? "lg:justify-center" : "justify-start"
        }`}
      >
        <Link
          to="/admin"
          onClick={closeMobileSidebar}
          className="flex items-center gap-3"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-brand-500 text-lg font-semibold text-white">
            S
          </span>

          {showBrandText && (
            <div>
              <span className="block text-xl font-semibold text-gray-900 dark:text-white">
                Sellora
              </span>

              <span className="block text-xs text-gray-500 dark:text-gray-400">
                Admin Panel
              </span>
            </div>
          )}
        </Link>
      </div>

      <div className="flex flex-col overflow-y-auto duration-300 ease-linear no-scrollbar">
        <SidebarNavigation
          navItems={visibleNavItems}
          isExpanded={isExpanded}
          isHovered={isHovered}
          isMobileOpen={isMobileOpen}
          onNavigate={closeMobileSidebar}
        />
      </div>
    </aside>
  );
}

export default AppSidebar;
