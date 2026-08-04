import { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import PageBreadcrumb from "../../components/common/PageBreadcrumb.jsx";
import OrderDetailsModal from "../../components/orders/OrderDetailsModal.jsx";
import OrdersTable from "../../components/orders/OrdersTable.jsx";
import OrdersToolbar from "../../components/orders/OrdersToolbar.jsx";
import Button from "../../components/ui/button/Button.jsx";
import { selectCurrentAdmin } from "../../features/auth/authSlice.js";
import {
  clearOrderDetails,
  fetchOrderDetailsThunk,
  fetchOrdersInventoryThunk,
  ORDERS_PAGE_SIZE,
  ORDER_STATUS_KEYS,
  selectIsOrderDetailsPending,
  selectIsOrdersInventoryPending,
  selectOrderDetails,
  selectOrderDetailsError,
  selectOrderDetailsOrderId,
  selectOrders,
  selectOrdersCoverage,
  selectOrdersInventoryError,
} from "../../features/orders/ordersSlice.js";

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
      <div className={`min-w-0 flex-1 break-words text-sm ${toneClasses.text}`}>
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

function RefreshIcon({ isSpinning = false }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      className={`size-4 ${isSpinning ? "animate-spin" : ""}`}
      aria-hidden="true"
    >
      <path
        d="M20 7V3M20 3H16M20 3L16.8 6.2C15.52 4.92 13.76 4.12 11.8 4.12C7.9 4.12 4.75 7.28 4.75 11.17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4 17V21M4 21H8M4 21L7.2 17.8C8.48 19.08 10.24 19.88 12.2 19.88C16.1 19.88 19.25 16.72 19.25 12.83"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
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

function getNonNegativeNumber(value) {
  if (
    value === null ||
    value === undefined ||
    (typeof value === "string" && !value.trim())
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) && number >= 0 ? number : null;
}

function formatCount(value) {
  const number = getNonNegativeNumber(value);

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

function getCreatedAtTimestamp(order) {
  const createdAt = normalizeText(order?.createdAt);

  if (!createdAt) {
    return null;
  }

  const timestamp = new Date(createdAt).getTime();

  return Number.isNaN(timestamp) ? null : timestamp;
}

function compareOrdersByNewest(firstOrder, secondOrder) {
  const firstTimestamp = getCreatedAtTimestamp(firstOrder);
  const secondTimestamp = getCreatedAtTimestamp(secondOrder);

  if (firstTimestamp === null && secondTimestamp !== null) {
    return 1;
  }

  if (firstTimestamp !== null && secondTimestamp === null) {
    return -1;
  }

  if (
    firstTimestamp !== null &&
    secondTimestamp !== null &&
    firstTimestamp !== secondTimestamp
  ) {
    return secondTimestamp - firstTimestamp;
  }

  return getEntityId(firstOrder).localeCompare(getEntityId(secondOrder));
}

function SummaryMetric({ label, value, isLoading = false, emphasized = false }) {
  return (
    <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/2">
      <p className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
        {label}
      </p>
      {isLoading ? (
        <div className="mt-2 h-7 w-20 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
      ) : (
        <p
          className={`mt-2 break-words font-semibold text-gray-800 dark:text-white/90 ${
            emphasized ? "text-2xl" : "text-xl"
          }`}
        >
          {value}
        </p>
      )}
    </div>
  );
}

function PlatformSummary({ expected, isLoading = false }) {
  return (
    <section className="mb-5 min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs sm:p-6 dark:border-gray-800 dark:bg-white/3">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Platform Order summary
        </h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Platform-wide statistics reported by the Dashboard endpoint.
        </p>
      </div>

      <div className="mt-5 grid min-w-0 grid-cols-2 gap-3 md:grid-cols-4">
        <SummaryMetric
          label="Platform Orders"
          value={formatCount(expected?.total)}
          isLoading={isLoading}
          emphasized
        />
        <SummaryMetric
          label="Paid revenue"
          value={formatCurrency(expected?.totalRevenue)}
          isLoading={isLoading}
          emphasized
        />
        {ORDER_STATUS_KEYS.map((status) => (
          <SummaryMetric
            key={status}
            label={STATUS_LABELS[status]}
            value={formatCount(expected?.byStatus?.[status])}
            isLoading={isLoading}
          />
        ))}
      </div>
    </section>
  );
}

function PlatformSummaryUnavailable() {
  return (
    <section className="mb-5 min-w-0 rounded-xl border border-gray-200 bg-gray-50 px-4 py-4 dark:border-gray-800 dark:bg-white/2">
      <h2 className="text-sm font-semibold text-gray-800 dark:text-white/90">
        Platform summary unavailable
      </h2>
      <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
        This admin session can display the Seller-based Order records it can
        enumerate, but the backend cannot independently verify platform-wide
        Order statistics.
      </p>
    </section>
  );
}

function CoverageWarning({ coverage }) {
  const actual = coverage?.actual;
  const coverageStatus = coverage?.status;

  if (
    !coverageStatus ||
    coverageStatus === "idle" ||
    coverageStatus === "matched" ||
    coverageStatus === "mismatch" ||
    coverage?.isStale ||
    (coverageStatus === "partial" && !coverage?.loadedAt)
  ) {
    return null;
  }

  if (coverageStatus === "enumerated") {
    return <PlatformSummaryUnavailable />;
  }

  const failedSellerCount = Array.isArray(coverage?.failedSellerIds)
    ? coverage.failedSellerIds.length
    : 0;

  return (
    <PageFeedback>
      <p className="font-semibold">Partial order data</p>
      <p className="mt-1">
        The Seller-based Order inventory could not be reconstructed completely.
        {actual
          ? ` ${formatCount(actual.total)} available records are shown.`
          : " The table may be unavailable or stale."}
      </p>
      {failedSellerCount > 0 && (
        <p className="mt-2 text-xs">
          {failedSellerCount} Seller request{failedSellerCount === 1 ? "" : "s"} failed during the latest refresh.
        </p>
      )}
    </PageFeedback>
  );
}

function OrdersPage() {
  const dispatch = useDispatch();
  const currentAdmin = useSelector(selectCurrentAdmin);
  const orders = useSelector(selectOrders);
  const coverage = useSelector(selectOrdersCoverage);
  const inventoryError = useSelector(selectOrdersInventoryError);
  const isInventoryPending = useSelector(selectIsOrdersInventoryPending);
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

  const inventoryRequestRef = useRef(null);
  const inventoryAbortTimerRef = useRef(null);
  const detailsRequestRef = useRef(null);

  const hasLoadedInventory = Boolean(coverage.loadedAt);
  const isInitialLoading = isInventoryPending && !hasLoadedInventory;
  const hasInitialError = Boolean(inventoryError) && !hasLoadedInventory;
  const hasStaleInventoryWarning =
    Boolean(inventoryError) && coverage.isStale === true;
  const isSuperAdmin = currentAdmin?.isSuperAdmin === true;

  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => {
        const normalizedOrderStatus = normalizeText(order?.orderStatus).toLowerCase();
        const normalizedPaymentStatus = normalizeText(order?.paymentStatus).toLowerCase();
        const normalizedPaymentMethod = normalizeText(order?.paymentMethod).toLowerCase();

        return (
          (!orderStatus || normalizedOrderStatus === orderStatus) &&
          (!paymentStatus || normalizedPaymentStatus === paymentStatus) &&
          (!paymentMethod || normalizedPaymentMethod === paymentMethod)
        );
      })
      .sort(compareOrdersByNewest);
  }, [orderStatus, orders, paymentMethod, paymentStatus]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredOrders.length / ORDERS_PAGE_SIZE)
  );
  const visibleCurrentPage = Math.min(
    Math.max(currentPage, 1),
    totalPages
  );

  const visibleOrders = useMemo(() => {
    const firstIndex = (visibleCurrentPage - 1) * ORDERS_PAGE_SIZE;

    return filteredOrders.slice(firstIndex, firstIndex + ORDERS_PAGE_SIZE);
  }, [filteredOrders, visibleCurrentPage]);

  const hasActiveFilters = Boolean(
    orderStatus || paymentStatus || paymentMethod
  );

  useEffect(() => {
    if (inventoryAbortTimerRef.current !== null) {
      window.clearTimeout(inventoryAbortTimerRef.current);
      inventoryAbortTimerRef.current = null;
    }

    if (!inventoryRequestRef.current) {
      const requestPromise = dispatch(fetchOrdersInventoryThunk());

      inventoryRequestRef.current = requestPromise;
      requestPromise.finally(() => {
        if (inventoryRequestRef.current === requestPromise) {
          inventoryRequestRef.current = null;
        }
      });
    }

    return () => {
      const requestPromise = inventoryRequestRef.current;

      inventoryAbortTimerRef.current = window.setTimeout(() => {
        if (inventoryRequestRef.current === requestPromise) {
          requestPromise?.abort();
          inventoryRequestRef.current = null;
        }

        inventoryAbortTimerRef.current = null;
      }, 0);
    };
  }, [dispatch]);

  useEffect(() => {
    return () => {
      detailsRequestRef.current?.abort();
      dispatch(clearOrderDetails());
    };
  }, [dispatch]);

  function handleFilterChange(setFilter, value) {
    setFilter(normalizeText(value).toLowerCase());
    setCurrentPage(1);
  }

  function handlePageChange(page) {
    if (page < 1 || page > totalPages) {
      return;
    }

    setCurrentPage(page);
  }

  function handleRefresh() {
    if (isInventoryPending) {
      return;
    }

    const requestPromise = dispatch(fetchOrdersInventoryThunk());

    inventoryRequestRef.current = requestPromise;
    requestPromise.finally(() => {
      if (inventoryRequestRef.current === requestPromise) {
        inventoryRequestRef.current = null;
      }
    });
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
    <div className="w-full min-w-0 max-w-full overflow-x-hidden">
      <PageBreadcrumb
        pageTitle="Orders"
        description="Review platform statistics and the read-only subset of Orders available through Seller records."
      />

      <div className="-mt-2 mb-5 flex min-w-0 flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Last loaded: {formatLoadedAt(coverage.loadedAt)}
        </p>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={isInventoryPending}
          onClick={handleRefresh}
          startIcon={<RefreshIcon isSpinning={isInventoryPending} />}
        >
          {isInventoryPending ? "Refreshing..." : "Refresh data"}
        </Button>
      </div>

      {isSuperAdmin && (
        <PlatformSummary
          expected={coverage.expected}
          isLoading={isInitialLoading}
        />
      )}

      <CoverageWarning coverage={coverage} />

      {hasInitialError && (
        <PageFeedback tone="error" actionLabel="Try again" onAction={handleRefresh}>
          <p className="font-medium">Available Order records could not be loaded.</p>
          <p className="mt-1 text-xs">{inventoryError}</p>
        </PageFeedback>
      )}

      {hasStaleInventoryWarning && (
        <PageFeedback actionLabel="Try again" onAction={handleRefresh}>
          <p className="font-medium">Older cached Order data remains visible.</p>
          <p className="mt-1">
            The latest Seller-based inventory refresh was incomplete. The last
            usable snapshot remains below and may no longer be current.
          </p>
          <p className="mt-1 text-xs">{inventoryError}</p>
        </PageFeedback>
      )}

      {!hasInitialError && (
        <>
          <OrdersToolbar
            orderStatus={orderStatus}
            paymentStatus={paymentStatus}
            paymentMethod={paymentMethod}
            availableCount={orders.length}
            filteredCount={filteredOrders.length}
            expectedTotal={coverage.expected?.total}
            disabled={isInitialLoading}
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
            isLoading={isInitialLoading}
            hasActiveFilters={hasActiveFilters}
            currentPage={visibleCurrentPage}
            totalPages={totalPages}
            totalItems={filteredOrders.length}
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
          error={detailsOrderId === selectedOrderId ? detailsError ?? "" : ""}
          isLoading={isSelectedDetailsLoading}
          onClose={handleCloseDetails}
          onRetry={handleRetryDetails}
        />
      )}
    </div>
  );
}

export default OrdersPage;
