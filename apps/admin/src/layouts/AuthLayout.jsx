import { Outlet } from "react-router";

import { ThemeToggleButton } from "../components/common/ThemeToggleButton.jsx";
import AuthGridShape from "../components/layout/auth/AuthGridShape.jsx";

function AuthLayout() {
  return (
    <div className="relative min-h-dvh overflow-x-hidden bg-white dark:bg-gray-900">
      <div className="relative flex min-h-dvh w-full flex-col dark:bg-gray-900 lg:flex-row">
        {/* Authentication page content */}
        <main className="flex min-h-dvh w-full flex-col lg:w-1/2">
          <Outlet />
        </main>

        {/* Sellora brand panel */}
        <aside className="hidden w-full items-center bg-brand-950 lg:sticky lg:top-0 lg:grid lg:h-dvh lg:w-1/2 dark:bg-white/5">
          <div className="relative z-1 flex items-center justify-center">
            <AuthGridShape />

            <div className="flex max-w-xs flex-col items-center">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex size-14 items-center justify-center rounded-2xl bg-brand-500 text-2xl font-semibold text-white">
                  S
                </span>

                <span className="text-4xl font-semibold text-white">
                  Sellora
                </span>
              </div>

              <p className="text-center text-gray-400 dark:text-white/60">
                E-commerce Administration Platform
              </p>
            </div>
          </div>
        </aside>

        {/* Shared auth-page theme toggle */}
        <div className="fixed right-6 bottom-6 z-50 hidden sm:block">
          <ThemeToggleButton />
        </div>
      </div>
    </div>
  );
}

export default AuthLayout;
