import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import PageBreadcrumb from "../../components/common/PageBreadcrumb.jsx";
import RefreshDataButton from "../../components/common/RefreshDataButton.jsx";
import OrderDetailsModal from "../../components/orders/OrderDetailsModal.jsx";
import OrdersTable from "../../components/orders/OrdersTable.jsx";
import OrdersToolbar from "../../components/orders/OrdersToolbar.jsx";
import {
  clearOrderDetails,
  createOrdersQueryKey,
  fetchOrderDetailsThunk,
  fetchOrdersThunk,
  fetchOrderStatsThunk,
  ORDERS_PAGE_SIZE,
  ORDER_STATUS_KEYS,
  selectIsOrderDetailsPending,
  selectIsOrdersListPending,
  selectIsOrderStatsPending,
  selectOrderDetails,
  selectOrderDetailsError,
  selectOrderDetailsOrderId,
  selectOrders,
  selectOrdersListError,
  selectOrdersListIsStale,
  selectOrdersListLoadedAt,
  selectOrdersListStatus,
  selectOrdersLoadedQueryKey,
  selectOrdersPagination,
  selectOrdersRequestedQueryKey,
  selectOrderStats,
  selectOrderStatsError,
  selectOrderStatsIsStale,
  selectOrderStatsLoadedAt,
} from "../../features/orders/ordersSlice.js";
import { REQUEST_STATUS } from "../../utils/redux/requestState.js";

const EMPTY_VALUE = "\u2014";

const countFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 0,
});

const loadedAtFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const STATUS_LABELS = {
  placed: "Placed",
  confirmed: "Confirmed",
  processing: "Processing",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

const RETRY_BUTTON_CLASSES =
  "inline-flex shrink-0 items-center justify-center rounded-lg border bg-white px-3 py-2 text-sm font-medium shadow-theme-xs transition focus-visible:outline-2 focus-visible:outline-offset-2 dark:bg-transparent";

const FEEDBACK_TONES = {
  error: {
    container:
      "border-error-200 bg-error-50 dark:border-error-500/30 dark:bg-error-500/10",
    text: "text-error-700 dark:text-error-400",
    button:
      "border-error-300 text-error-700 hover:bg-error-100 focus-visible:outline-error-500 dark:border-error-500/40 dark:text-error-400 dark:hover:bg-error-500/10",
  },
  warning: {
    container:
      "border-warning-200 bg-warning-50 dark:border-warning-500/30 dark:bg-warning-500/10",
    text: "text-warning-700 dark:text-warning-400",
    button:
      "border-warning-300 text-warning-700 hover:bg-warning-100 focus-visible:outline-warning-500 dark:border-warning-500/40 dark:text-warning-400 dark:hover:bg-warning-500/10",
  },
};

function PageFeedback({ tone = "warning", children, actionLabel, onAction }) {
  const toneClasses = FEEDBACK_TONES[tone] ?? FEEDBACK_TONES.warning;

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`mb-5 flex min-w-0 flex-col gap-3 rounded-xl border px-4 py-4 sm:flex-row sm:items-start sm:justify-between ${toneClasses.container}`}
    >
      <div
        className={`min-w-0 flex-1 wrap-break-word text-sm ${toneClasses.text}`}
      >
        {children}
      </div>
      {actionLabel && onAction && (
        <button
          type="button"
          onClick={onAction}
          className={`${RETRY_BUTTON_CLASSES} ${toneClasses.button}`}
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function getEntityId(entity) {
  if (typeof entity === "number" && Number.isFinite(entity)) {
    return String(entity);
  }

  if (typeof entity === "string") {
    return normalizeText(entity);
  }

  return normalizeText(entity?._id ?? entity?.id);
}

function getNonNegativeNumber(value, { integer = false } = {}) {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    return null;
  }

  return integer && !Number.isSafeInteger(value) ? null : value;
}

function formatCount(value) {
  const number = getNonNegativeNumber(value, { integer: true });

  return number === null ? EMPTY_VALUE : countFormatter.format(number);
}

function formatCurrency(value) {
  const number = getNonNegativeNumber(value);

  return number === null ? EMPTY_VALUE : currencyFormatter.format(number);
}

function formatLoadedAt(value) {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    return "Not loaded yet";
  }

  const date = new Date(normalizedValue);

  return Number.isNaN(date.getTime())
    ? "Refresh time unavailable"
    : loadedAtFormatter.format(date);
}

function SummaryMetric({
  label,
  value,
  isLoading = false,
  emphasized = false,
}) {
  return (
    <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/2">
      <p className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
        {label}
      </p>
      {isLoading ? (
        <div className="mt-2 h-7 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
      ) : (
        <p
          className={`mt-2 wrap-break-word font-semibold text-gray-800 dark:text-white/90 ${
            emphasized ? "text-2xl" : "text-xl"
          }`}
        >
          {value}
        </p>
      )}
    </div>
  );
}

function OrderSummary({ stats, isLoading = false }) {
  const ordersByStatus =
    stats?.ordersByStatus &&
    typeof stats.ordersByStatus === "object" &&
    !Array.isArray(stats.ordersByStatus)
      ? stats.ordersByStatus
      : null;

  return (
    <section className="mb-5 min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs sm:p-6 dark:border-gray-800 dark:bg-white/3">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Order summary
        </h2>
      </div>

      <div className="mt-5 grid min-w-0 grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryMetric
          label="Total Orders"
          value={formatCount(stats?.totalOrders)}
          isLoading={isLoading}
          emphasized
        />
        <SummaryMetric
          label="Paid revenue"
          value={formatCurrency(stats?.totalRevenue)}
          isLoading={isLoading}
          emphasized
        />
        {ORDER_STATUS_KEYS.map((status) => (
          <SummaryMetric
            key={status}
            label={STATUS_LABELS[status]}
            value={formatCount(ordersByStatus?.[status])}
            isLoading={isLoading}
          />
        ))}
      </div>
    </section>
  );
}

function OrdersPage() {
  const dispatch = useDispatch();
  const orders = useSelector(selectOrders);
  const pagination = useSelector(selectOrdersPagination);
  const requestedQueryKey = useSelector(selectOrdersRequestedQueryKey);
  const loadedQueryKey = useSelector(selectOrdersLoadedQueryKey);
  const listStatus = useSelector(selectOrdersListStatus);
  const listError = useSelector(selectOrdersListError);
  const listLoadedAt = useSelector(selectOrdersListLoadedAt);
  const listIsStale = useSelector(selectOrdersListIsStale);
  const isListPending = useSelector(selectIsOrdersListPending);
  const stats = useSelector(selectOrderStats);
  const statsError = useSelector(selectOrderStatsError);
  const statsLoadedAt = useSelector(selectOrderStatsLoadedAt);
  const statsIsStale = useSelector(selectOrderStatsIsStale);
  const isStatsPending = useSelector(selectIsOrderStatsPending);
  const details = useSelector(selectOrderDetails);
  const detailsOrderId = useSelector(selectOrderDetailsOrderId);
  const detailsError = useSelector(selectOrderDetailsError);
  const isDetailsPending = useSelector(selectIsOrderDetailsPending);

  const [orderStatus, setOrderStatus] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  const listRequestRef = useRef(null);
  const listAbortTimerRef = useRef(null);
  const statsRequestRef = useRef(null);
  const statsAbortTimerRef = useRef(null);
  const detailsRequestRef = useRef(null);

  const currentQuery = useMemo(
    () => ({
      page: currentPage,
      limit: ORDERS_PAGE_SIZE,
      orderStatus,
      paymentStatus,
      paymentMethod,
    }),
    [currentPage, orderStatus, paymentMethod, paymentStatus]
  );
  const currentQueryKey = useMemo(
    () => createOrdersQueryKey(currentQuery),
    [currentQuery]
  );
  const isCurrentQueryRequested = requestedQueryKey === currentQueryKey;
  const isCurrentQueryLoaded = loadedQueryKey === currentQueryKey;
  const isRequestedViewLoading =
    !isCurrentQueryLoaded &&
    (!isCurrentQueryRequested ||
      listStatus === REQUEST_STATUS.IDLE ||
      listStatus === REQUEST_STATUS.PENDING);
  const hasRequestedViewError = Boolean(
    listError && isCurrentQueryRequested && !isCurrentQueryLoaded
  );
  const hasStaleListWarning = Boolean(
    listError && isCurrentQueryRequested && isCurrentQueryLoaded && listIsStale
  );
  const hasInitialStatsError = Boolean(statsError && !statsLoadedAt);
  const hasStaleStatsWarning = Boolean(
    statsError && statsLoadedAt && statsIsStale
  );
  const isInitialStatsLoading = !statsLoadedAt && !statsError;
  const visibleOrders = useMemo(
    () => (isCurrentQueryLoaded ? orders : []),
    [isCurrentQueryLoaded, orders]
  );
  const hasActiveFilters = Boolean(
    orderStatus || paymentStatus || paymentMethod
  );
  const visiblePage = isCurrentQueryLoaded ? pagination.page : currentPage;
  const visibleTotalPages = isCurrentQueryLoaded ? pagination.totalPages : 0;
  const visibleTotal = isCurrentQueryLoaded ? pagination.total : 0;
  const isMainRefreshPending = isListPending || isStatsPending;

  const startListRequest = useCallback(
    (query, { force = false } = {}) => {
      const queryKey = createOrdersQueryKey(query);
      const activeRequest = listRequestRef.current;

      if (activeRequest?.queryKey === queryKey && !force) {
        return activeRequest.promise;
      }

      activeRequest?.promise.abort();
      const requestPromise = dispatch(fetchOrdersThunk({ ...query, force }));
      listRequestRef.current = { queryKey, promise: requestPromise };
      requestPromise.finally(() => {
        if (listRequestRef.current?.promise === requestPromise) {
          listRequestRef.current = null;
        }
      });

      return requestPromise;
    },
    [dispatch]
  );

  const startStatsRequest = useCallback(
    ({ force = false } = {}) => {
      if (statsRequestRef.current && !force) {
        return statsRequestRef.current;
      }

      statsRequestRef.current?.abort();
      const requestPromise = dispatch(fetchOrderStatsThunk({ force }));
      statsRequestRef.current = requestPromise;
      requestPromise.finally(() => {
        if (statsRequestRef.current === requestPromise) {
          statsRequestRef.current = null;
        }
      });

      return requestPromise;
    },
    [dispatch]
  );

  useEffect(() => {
    if (listAbortTimerRef.current !== null) {
      window.clearTimeout(listAbortTimerRef.current);
      listAbortTimerRef.current = null;
    }

    startListRequest(currentQuery);

    return () => {
      const request = listRequestRef.current;

      listAbortTimerRef.current = window.setTimeout(() => {
        if (listRequestRef.current === request) {
          request?.promise.abort();
          listRequestRef.current = null;
        }

        listAbortTimerRef.current = null;
      }, 0);
    };
  }, [currentQuery, startListRequest]);

  useEffect(() => {
    if (statsAbortTimerRef.current !== null) {
      window.clearTimeout(statsAbortTimerRef.current);
      statsAbortTimerRef.current = null;
    }

    startStatsRequest();

    return () => {
      const request = statsRequestRef.current;

      statsAbortTimerRef.current = window.setTimeout(() => {
        if (statsRequestRef.current === request) {
          request?.abort();
          statsRequestRef.current = null;
        }

        statsAbortTimerRef.current = null;
      }, 0);
    };
  }, [startStatsRequest]);

  useEffect(() => {
    if (!isCurrentQueryLoaded) {
      return undefined;
    }

    const safeLastPage = Math.max(1, pagination.totalPages);

    if (currentPage <= safeLastPage) {
      return undefined;
    }

    const correctionTimerId = window.setTimeout(() => {
      setCurrentPage(safeLastPage);
    }, 0);

    return () => {
      window.clearTimeout(correctionTimerId);
    };
  }, [currentPage, isCurrentQueryLoaded, pagination.totalPages]);

  useEffect(() => {
    return () => {
      detailsRequestRef.current?.abort();
      detailsRequestRef.current = null;
      dispatch(clearOrderDetails());
    };
  }, [dispatch]);

  function handleRefresh() {
    if (isMainRefreshPending) {
      return;
    }

    startListRequest(currentQuery, { force: true });
    startStatsRequest({ force: true });
  }

  function handleRetryList() {
    if (!isListPending) {
      startListRequest(currentQuery, { force: true });
    }
  }

  function handleRetryStats() {
    if (!isStatsPending) {
      startStatsRequest({ force: true });
    }
  }

  function handleFilterChange(setFilter, value) {
    setFilter(normalizeText(value).toLowerCase());
    setCurrentPage(1);
  }

  function handlePageChange(page) {
    if (
      page < 1 ||
      page > visibleTotalPages ||
      page === currentPage ||
      !isCurrentQueryLoaded
    ) {
      return;
    }

    setCurrentPage(page);
  }

  function requestSelectedOrderDetails(order) {
    const orderId = getEntityId(order);

    if (!orderId) {
      return;
    }

    detailsRequestRef.current?.abort();
    dispatch(clearOrderDetails());
    const requestPromise = dispatch(fetchOrderDetailsThunk({ orderId }));

    detailsRequestRef.current = requestPromise;
    requestPromise.finally(() => {
      if (detailsRequestRef.current === requestPromise) {
        detailsRequestRef.current = null;
      }
    });
  }

  function handleOpenDetails(order) {
    if (!getEntityId(order)) {
      return;
    }

    setSelectedOrder(order);
    setIsDetailsModalOpen(true);
    requestSelectedOrderDetails(order);
  }

  function handleRetryDetails() {
    if (!selectedOrder || isDetailsPending) {
      return;
    }

    requestSelectedOrderDetails(selectedOrder);
  }

  function handleCloseDetails() {
    detailsRequestRef.current?.abort();
    detailsRequestRef.current = null;
    dispatch(clearOrderDetails());
    setIsDetailsModalOpen(false);
    setSelectedOrder(null);
  }

  const selectedOrderId = getEntityId(selectedOrder);
  const isSelectedDetailsLoading =
    isDetailsPending && detailsOrderId === selectedOrderId;

  return (
    <div className="w-full min-w-0 max-w-full">
      <PageBreadcrumb
        pageTitle="Orders"
        description="Review Orders returned directly by the Admin Orders API and inspect each record."
      />

      <div className="-mt-2 mb-5 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0 text-xs text-gray-500 dark:text-gray-400">
          <p>Last updated: {formatLoadedAt(listLoadedAt)}</p>
        </div>
        <RefreshDataButton
          onClick={handleRefresh}
          isRefreshing={isMainRefreshPending}
        />
      </div>

      <OrderSummary stats={stats} isLoading={isInitialStatsLoading} />

      {hasInitialStatsError && (
        <PageFeedback
          tone="error"
          actionLabel="Try again"
          onAction={handleRetryStats}
        >
          <p className="font-medium">Order statistics could not be loaded.</p>
          <p className="mt-1 text-xs">{statsError}</p>
        </PageFeedback>
      )}

      {hasStaleStatsWarning && (
        <PageFeedback actionLabel="Try again" onAction={handleRetryStats}>
          <p className="font-medium">Cached Order statistics remain visible.</p>
          <p className="mt-1">
            The latest statistics refresh failed, so these totals may be stale.
          </p>
          <p className="mt-1 text-xs">{statsError}</p>
        </PageFeedback>
      )}

      {hasRequestedViewError && (
        <PageFeedback
          tone="error"
          actionLabel="Try again"
          onAction={handleRetryList}
        >
          <p className="font-medium">Order records could not be loaded.</p>
          <p className="mt-1 text-xs">{listError}</p>
        </PageFeedback>
      )}

      {hasStaleListWarning && (
        <PageFeedback actionLabel="Try again" onAction={handleRetryList}>
          <p className="font-medium">Cached Order records remain visible.</p>
          <p className="mt-1">
            The latest list refresh failed, so the displayed page may be stale.
          </p>
          <p className="mt-1 text-xs">{listError}</p>
        </PageFeedback>
      )}

      {!hasRequestedViewError && (
        <>
          <OrdersToolbar
            orderStatus={orderStatus}
            paymentStatus={paymentStatus}
            paymentMethod={paymentMethod}
            currentPage={visiblePage}
            pageSize={ORDERS_PAGE_SIZE}
            totalItems={visibleTotal}
            pageRecordCount={visibleOrders.length}
            disabled={isRequestedViewLoading}
            onOrderStatusChange={(value) =>
              handleFilterChange(setOrderStatus, value)
            }
            onPaymentStatusChange={(value) =>
              handleFilterChange(setPaymentStatus, value)
            }
            onPaymentMethodChange={(value) =>
              handleFilterChange(setPaymentMethod, value)
            }
          />

          <OrdersTable
            orders={visibleOrders}
            isLoading={isRequestedViewLoading}
            hasActiveFilters={hasActiveFilters}
            currentPage={visiblePage}
            totalPages={visibleTotalPages}
            totalItems={visibleTotal}
            pageSize={ORDERS_PAGE_SIZE}
            onPageChange={handlePageChange}
            onView={handleOpenDetails}
          />
        </>
      )}

      {isDetailsModalOpen && (
        <OrderDetailsModal
          isOpen
          details={detailsOrderId === selectedOrderId ? details : null}
          fallbackOrder={selectedOrder}
          error={detailsOrderId === selectedOrderId ? (detailsError ?? "") : ""}
          isLoading={isSelectedDetailsLoading}
          onClose={handleCloseDetails}
          onRetry={handleRetryDetails}
        />
      )}
    </div>
  );
}

export default OrdersPage;
