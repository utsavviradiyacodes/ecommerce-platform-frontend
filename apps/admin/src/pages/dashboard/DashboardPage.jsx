import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";

import PageBreadcrumb from "../../components/common/PageBreadcrumb.jsx";
import RefreshDataButton from "../../components/common/RefreshDataButton.jsx";
import EcommerceMetrics from "../../components/dashboard/EcommerceMetrics.jsx";
import MarketplaceUsersChart from "../../components/dashboard/MarketplaceUsersChart.jsx";
import OrderFulfillmentCard from "../../components/dashboard/OrderFulfillmentCard.jsx";
import OrdersByStatusChart from "../../components/dashboard/OrdersByStatusChart.jsx";
import PaymentOverviewCard from "../../components/dashboard/PaymentOverviewCard.jsx";
import RecentProducts from "../../components/dashboard/RecentProducts.jsx";
import ReturnOverviewCard from "../../components/dashboard/ReturnOverviewCard.jsx";
import SalesOverviewChart from "../../components/dashboard/SalesOverviewChart.jsx";

import { selectCurrentAdmin } from "../../features/auth/authSlice.js";

import {
  fetchDashboardPaymentStatsThunk,
  fetchDashboardRecentProductsThunk,
  fetchDashboardReturnStatsThunk,
  fetchDashboardStatsThunk,
  selectDashboardPaymentStats,
  selectDashboardPaymentStatsError,
  selectDashboardPaymentStatsStatus,
  selectDashboardRecentProducts,
  selectDashboardRecentProductsError,
  selectDashboardRecentProductsStatus,
  selectDashboardRecentProductsTotal,
  selectDashboardReturnStats,
  selectDashboardReturnStatsError,
  selectDashboardReturnStatsStatus,
  selectDashboardStats,
  selectDashboardStatsError,
  selectDashboardStatsStatus,
} from "../../features/dashboard/dashboardSlice.js";

import { ADMIN_PERMISSIONS } from "../../constants/adminPermissions.js";
import { hasAdminPermission } from "../../utils/hasAdminPermission.js";
import { REQUEST_STATUS } from "../../utils/redux/requestState.js";

const RETRY_BUTTON_CLASSES =
  "inline-flex shrink-0 items-center justify-center rounded-lg border bg-white px-3 py-2 text-sm font-medium shadow-theme-xs transition focus-visible:outline-2 focus-visible:outline-offset-2 dark:bg-transparent";

function DashboardPage() {
  const dispatch = useDispatch();
  const currentAdmin = useSelector(selectCurrentAdmin);

  const canViewAllProducts = hasAdminPermission(
    currentAdmin,
    ADMIN_PERMISSIONS.PRODUCTS
  );

  const stats = useSelector(selectDashboardStats);
  const statsStatus = useSelector(selectDashboardStatsStatus);
  const statsError = useSelector(selectDashboardStatsError);

  const paymentStats = useSelector(selectDashboardPaymentStats);
  const paymentStatsStatus = useSelector(selectDashboardPaymentStatsStatus);
  const paymentStatsError = useSelector(selectDashboardPaymentStatsError);

  const returnStats = useSelector(selectDashboardReturnStats);
  const returnStatsStatus = useSelector(selectDashboardReturnStatsStatus);
  const returnStatsError = useSelector(selectDashboardReturnStatsError);

  const recentProducts = useSelector(selectDashboardRecentProducts);
  const recentProductsTotal = useSelector(selectDashboardRecentProductsTotal);
  const recentProductsStatus = useSelector(selectDashboardRecentProductsStatus);
  const recentProductsError = useSelector(selectDashboardRecentProductsError);

  const hasStats = stats !== null;

  const isInitialStatsLoading =
    !hasStats &&
    (statsStatus === REQUEST_STATUS.IDLE ||
      statsStatus === REQUEST_STATUS.PENDING);

  const isStatsUnavailable = Boolean(statsError) && !hasStats;
  const hasStaleStatsWarning = Boolean(statsError) && hasStats;

  const isPaymentStatsLoading =
    paymentStatsStatus === REQUEST_STATUS.IDLE ||
    paymentStatsStatus === REQUEST_STATUS.PENDING;

  const isReturnStatsLoading =
    returnStatsStatus === REQUEST_STATUS.IDLE ||
    returnStatsStatus === REQUEST_STATUS.PENDING;

  const isRecentProductsLoading =
    recentProductsStatus === REQUEST_STATUS.IDLE ||
    recentProductsStatus === REQUEST_STATUS.PENDING;

  const isDashboardRefreshing =
    statsStatus === REQUEST_STATUS.PENDING ||
    paymentStatsStatus === REQUEST_STATUS.PENDING ||
    returnStatsStatus === REQUEST_STATUS.PENDING ||
    recentProductsStatus === REQUEST_STATUS.PENDING;

  useEffect(() => {
    dispatch(fetchDashboardStatsThunk());
    dispatch(fetchDashboardPaymentStatsThunk());
    dispatch(fetchDashboardReturnStatsThunk());
    dispatch(fetchDashboardRecentProductsThunk());
  }, [dispatch]);

  function handleRetryStats() {
    dispatch(fetchDashboardStatsThunk({ force: true }));
  }

  function handleRetryPaymentStats() {
    dispatch(fetchDashboardPaymentStatsThunk({ force: true }));
  }

  function handleRetryReturnStats() {
    dispatch(fetchDashboardReturnStatsThunk({ force: true }));
  }

  function handleRetryRecentProducts() {
    dispatch(fetchDashboardRecentProductsThunk({ force: true }));
  }

  function handleRefreshDashboard() {
    if (isDashboardRefreshing) {
      return;
    }

    dispatch(fetchDashboardStatsThunk({ force: true }));
    dispatch(fetchDashboardPaymentStatsThunk({ force: true }));
    dispatch(fetchDashboardReturnStatsThunk({ force: true }));
    dispatch(fetchDashboardRecentProductsThunk({ force: true }));
  }

  return (
    <div className="w-full min-w-0 max-w-full overflow-x-hidden">
      <PageBreadcrumb
        pageTitle="Dashboard"
        description="Monitor Sellora’s catalog, customers, orders, payments, and returns."
      />

      <div className="-mt-2 mb-6 flex justify-end">
        <RefreshDataButton
          onClick={handleRefreshDashboard}
          isRefreshing={isDashboardRefreshing}
        />
      </div>

      <div className="min-w-0 space-y-4 md:space-y-6">
        {isStatsUnavailable ? (
          <div className="flex flex-col gap-3 rounded-xl border border-error-200 bg-error-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-error-500/30 dark:bg-error-500/10">
            <p className="min-w-0 flex-1 wrap-break-word whitespace-pre-wrap text-sm text-error-700 dark:text-error-400">
              {statsError}
            </p>

            <button
              type="button"
              onClick={handleRetryStats}
              className={`${RETRY_BUTTON_CLASSES} border-error-300 text-error-700 hover:bg-error-100 focus-visible:outline-error-500 dark:border-error-500/40 dark:text-error-400 dark:hover:bg-error-500/10`}
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            {hasStaleStatsWarning && (
              <div className="flex flex-col gap-3 rounded-xl border border-warning-200 bg-warning-50 px-4 py-4 sm:flex-row sm:items-center sm:justify-between dark:border-warning-500/30 dark:bg-warning-500/10">
                <div className="min-w-0 flex-1 wrap-break-word whitespace-pre-wrap text-sm text-warning-700 dark:text-warning-400">
                  <p>
                    Dashboard statistics could not be refreshed. Displaying
                    previously loaded data.
                  </p>

                  <p className="mt-1 text-xs">{statsError}</p>
                </div>

                <button
                  type="button"
                  onClick={handleRetryStats}
                  className={`${RETRY_BUTTON_CLASSES} border-warning-300 text-warning-700 hover:bg-warning-100 focus-visible:outline-warning-500 dark:border-warning-500/40 dark:text-warning-400 dark:hover:bg-warning-500/10`}
                >
                  Try again
                </button>
              </div>
            )}

            <div className="grid min-w-0 grid-cols-12 gap-4 md:gap-6">
              <div className="col-span-12 min-w-0 xl:col-span-8">
                <EcommerceMetrics
                  stats={stats}
                  isLoading={isInitialStatsLoading}
                />
              </div>

              <div className="col-span-12 min-w-0 xl:col-span-4">
                <OrderFulfillmentCard
                  orders={stats?.orders}
                  isLoading={isInitialStatsLoading}
                />
              </div>

              <div className="col-span-12 min-w-0 xl:col-span-8">
                <OrdersByStatusChart
                  orders={stats?.orders}
                  isLoading={isInitialStatsLoading}
                />
              </div>

              <div className="col-span-12 min-w-0 xl:col-span-4">
                <MarketplaceUsersChart
                  users={stats?.users}
                  isLoading={isInitialStatsLoading}
                />
              </div>
            </div>
          </>
        )}

        <SalesOverviewChart />

        <div className="grid min-w-0 grid-cols-1 gap-4 md:gap-6 xl:grid-cols-2">
          <PaymentOverviewCard
            stats={paymentStats}
            isLoading={isPaymentStatsLoading}
            error={paymentStatsError ?? ""}
            onRetry={handleRetryPaymentStats}
          />

          <ReturnOverviewCard
            stats={returnStats}
            isLoading={isReturnStatsLoading}
            error={returnStatsError ?? ""}
            onRetry={handleRetryReturnStats}
          />
        </div>

        <RecentProducts
          products={recentProducts}
          total={recentProductsTotal}
          isLoading={isRecentProductsLoading}
          error={recentProductsError ?? ""}
          onRetry={handleRetryRecentProducts}
          canViewAllProducts={canViewAllProducts}
        />
      </div>
    </div>
  );
}

export default DashboardPage;
