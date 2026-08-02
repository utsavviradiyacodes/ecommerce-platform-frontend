import { Outlet } from "react-router";

import { useSidebar } from "../hooks/useSidebar.js";
import AppHeader from "../components/layout/admin/AppHeader.jsx";
import AppSidebar from "../components/layout/admin/AppSidebar.jsx";
import Backdrop from "../components/layout/admin/Backdrop.jsx";

function AdminLayout() {
  const { isExpanded, isHovered } = useSidebar();

  const sidebarIsWide = isExpanded || isHovered;

  return (
    <div className="min-h-screen min-w-0 bg-gray-50 dark:bg-gray-900 xl:flex">
      <AppSidebar />
      <Backdrop />

      <div
        className={`flex min-h-screen min-w-0 flex-1 flex-col transition-all duration-300 ease-in-out ${
          sidebarIsWide ? "lg:ml-72.5" : "lg:ml-22.5"
        }`}
      >
        <AppHeader />

        <main className="min-w-0 flex-1">
          <div className="mx-auto w-full min-w-0 max-w-(--breakpoint-2xl) p-4 md:p-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
