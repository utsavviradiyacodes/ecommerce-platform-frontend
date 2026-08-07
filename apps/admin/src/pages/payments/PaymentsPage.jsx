import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";

import PageBreadcrumb from "../../components/common/PageBreadcrumb.jsx";
import RefreshDataButton from "../../components/common/RefreshDataButton.jsx";
import PaymentDetailsModal from "../../components/payments/PaymentDetailsModal.jsx";
import PaymentsTable from "../../components/payments/PaymentsTable.jsx";
import PaymentsToolbar from "../../components/payments/PaymentsToolbar.jsx";
import RefundPaymentModal from "../../components/payments/RefundPaymentModal.jsx";
import { selectAdminSessionGeneration } from "../../features/auth/authSlice.js";
import {
  clearPaymentRefundFeedback,
  createPaymentsQueryKey,
  fetchPaymentsThunk,
  fetchPaymentStatsThunk,
  PAYMENTS_PAGE_SIZE,
  processPaymentRefundThunk,
  selectIsPaymentRefundPending,
  selectIsPaymentsListPending,
  selectIsPaymentStatsPending,
  selectPaymentRefundError,
  selectPaymentRefundSuccessMessage,
  selectPayments,
  selectPaymentsListError,
  selectPaymentsListIsStale,
  selectPaymentsListLoadedAt,
  selectPaymentsListStatus,
  selectPaymentsLoadedQueryKey,
  selectPaymentsPagination,
  selectPaymentsRequestedQueryKey,
  selectPaymentStats,
  selectPaymentStatsError,
  selectPaymentStatsIsStale,
  selectPaymentStatsLoadedAt,
} from "../../features/payments/paymentsSlice.js";
import { REQUEST_STATUS } from "../../utils/redux/requestState.js";

const EMPTY_VALUE = "\u2014";

const countFormatter = new Intl.NumberFormat("en-IN", {
  maximumFractionDigits: 0,
});

const currencyFormatter = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

const loadedAtFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const RETRY_BUTTON_CLASSES =
  "inline-flex shrink-0 items-center justify-center rounded-lg border bg-white px-3 py-2 text-sm font-medium shadow-theme-xs transition focus-visible:outline-2 focus-visible:outline-offset-2 dark:bg-transparent";

const FEEDBACK_TONES = {
  success: {
    container:
      "border-success-200 bg-success-50 dark:border-success-500/30 dark:bg-success-500/10",
    text: "text-success-700 dark:text-success-400",
    button:
      "border-success-300 text-success-700 hover:bg-success-100 focus-visible:outline-success-500 dark:border-success-500/40 dark:text-success-400 dark:hover:bg-success-500/10",
  },
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

function normalizeObject(value) {
  return value && typeof value === "object" && !Array.isArray(value)
    ? value
    : null;
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

function claimPaymentRefundContinuation({
  isPageMountedRef,
  requestRef,
  requestPromise,
  sessionGeneration,
  store,
}) {
  const ownsRequest = requestRef.current === requestPromise;

  if (ownsRequest) {
    requestRef.current = null;
  }

  return (
    isPageMountedRef.current &&
    ownsRequest &&
    selectAdminSessionGeneration(store.getState()) === sessionGeneration
  );
}

function getNonNegativeNumber(value, { missingAsZero = false } = {}) {
  if ((value === null || value === undefined) && missingAsZero) {
    return 0;
  }

  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? value
    : null;
}

function formatCount(value) {
  return Number.isSafeInteger(value) && value >= 0
    ? countFormatter.format(value)
    : EMPTY_VALUE;
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

function getPaymentSearchText(payment) {
  const customerRelation = payment?.customer ?? payment?.customerId ?? null;
  const orderRelation = payment?.order ?? payment?.orderId ?? null;
  const customer = normalizeObject(customerRelation);
  const order = normalizeObject(orderRelation);

  return [
    getEntityId(payment),
    normalizeText(payment?.transactionId),
    normalizeText(customer?.name),
    normalizeText(customer?.email),
    getEntityId(orderRelation),
    normalizeText(order?.trackingId),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
}

function getRefundEligibility(payment) {
  const paymentId = getEntityId(payment);
  const amount = getNonNegativeNumber(payment?.amount);
  const existingRefundAmount = getNonNegativeNumber(payment?.refundAmount, {
    missingAsZero: true,
  });
  const remainingAmount =
    amount !== null && existingRefundAmount !== null
      ? Math.max(0, amount - existingRefundAmount)
      : null;
  const isEligible = Boolean(
    normalizeText(payment?.status).toLowerCase() === "paid" &&
    /^[0-9a-fA-F]{24}$/.test(paymentId) &&
    amount !== null &&
    amount > 0 &&
    existingRefundAmount !== null &&
    remainingAmount > 0
  );

  return { paymentId, remainingAmount, isEligible };
}

function SummaryMetric({ label, value, isLoading = false }) {
  return (
    <div className="min-w-0 rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/2">
      <p className="text-xs font-medium tracking-wide text-gray-500 uppercase dark:text-gray-400">
        {label}
      </p>
      {isLoading ? (
        <div className="mt-2 h-8 w-24 animate-pulse rounded bg-gray-200 dark:bg-gray-800" />
      ) : (
        <p className="mt-2 wrap-break-word text-2xl font-semibold text-gray-800 dark:text-white/90">
          {value}
        </p>
      )}
    </div>
  );
}

function PaymentSummary({ stats, isLoading }) {
  const paymentsByStatus = normalizeObject(stats?.paymentsByStatus);

  return (
    <section className="mb-5 min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs sm:p-6 dark:border-gray-800 dark:bg-white/3">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Payment overview
        </h2>
      </div>

      <div className="mt-5 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryMetric
          label="Total payments"
          value={formatCount(stats?.totalPayments)}
          isLoading={isLoading}
        />
        <SummaryMetric
          label="Paid payments"
          value={formatCount(paymentsByStatus?.paid)}
          isLoading={isLoading}
        />
        <SummaryMetric
          label="Total revenue"
          value={formatCurrency(stats?.totalRevenue)}
          isLoading={isLoading}
        />
        <SummaryMetric
          label="Total refunded"
          value={formatCurrency(stats?.totalRefunded)}
          isLoading={isLoading}
        />
      </div>
    </section>
  );
}

function PaymentsPage() {
  const dispatch = useDispatch();
  const store = useStore();
  const payments = useSelector(selectPayments);
  const pagination = useSelector(selectPaymentsPagination);
  const requestedQueryKey = useSelector(selectPaymentsRequestedQueryKey);
  const loadedQueryKey = useSelector(selectPaymentsLoadedQueryKey);
  const listStatus = useSelector(selectPaymentsListStatus);
  const listError = useSelector(selectPaymentsListError);
  const listLoadedAt = useSelector(selectPaymentsListLoadedAt);
  const listIsStale = useSelector(selectPaymentsListIsStale);
  const isListPending = useSelector(selectIsPaymentsListPending);
  const stats = useSelector(selectPaymentStats);
  const statsError = useSelector(selectPaymentStatsError);
  const statsLoadedAt = useSelector(selectPaymentStatsLoadedAt);
  const statsIsStale = useSelector(selectPaymentStatsIsStale);
  const isStatsPending = useSelector(selectIsPaymentStatsPending);
  const refundError = useSelector(selectPaymentRefundError);
  const refundSuccessMessage = useSelector(selectPaymentRefundSuccessMessage);
  const isRefundPending = useSelector(selectIsPaymentRefundPending);

  const [searchQuery, setSearchQuery] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [detailsPayment, setDetailsPayment] = useState(null);
  const [refundPayment, setRefundPayment] = useState(null);

  const listRequestRef = useRef(null);
  const listAbortTimerRef = useRef(null);
  const statsRequestRef = useRef(null);
  const statsAbortTimerRef = useRef(null);
  const isPageMountedRef = useRef(false);
  const refundRequestRef = useRef(null);

  const currentQuery = useMemo(
    () => ({
      page: currentPage,
      limit: PAYMENTS_PAGE_SIZE,
      status: paymentStatus,
      method: paymentMethod,
    }),
    [currentPage, paymentMethod, paymentStatus]
  );
  const currentQueryKey = useMemo(
    () => createPaymentsQueryKey(currentQuery),
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
  const visiblePayments = useMemo(
    () => (isCurrentQueryLoaded ? payments : []),
    [isCurrentQueryLoaded, payments]
  );
  const normalizedSearch = normalizeText(searchQuery).toLowerCase();
  const isSearchActive = normalizedSearch.length > 0;
  const searchedPayments = useMemo(() => {
    if (!normalizedSearch) {
      return visiblePayments;
    }

    return visiblePayments.filter((payment) =>
      getPaymentSearchText(payment).includes(normalizedSearch)
    );
  }, [normalizedSearch, visiblePayments]);
  const hasServerFilters = Boolean(paymentStatus || paymentMethod);
  const visiblePage = isCurrentQueryLoaded ? pagination.page : currentPage;
  const visibleTotalPages = isCurrentQueryLoaded ? pagination.totalPages : 0;
  const visibleTotal = isCurrentQueryLoaded ? pagination.total : 0;
  const isMainRefreshPending = isListPending || isStatsPending;

  const startListRequest = useCallback(
    (query, { force = false } = {}) => {
      const queryKey = createPaymentsQueryKey(query);
      const activeRequest = listRequestRef.current;

      if (activeRequest?.queryKey === queryKey && !force) {
        return activeRequest.promise;
      }

      activeRequest?.promise.abort();
      const requestPromise = dispatch(fetchPaymentsThunk({ ...query, force }));
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
      const requestPromise = dispatch(fetchPaymentStatsThunk({ force }));
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
      return;
    }

    const safeLastPage = Math.max(1, pagination.totalPages);

    if (currentPage <= safeLastPage) {
      return undefined;
    }

    const correctionTimerId = window.setTimeout(() => {
      setSearchQuery("");
      setCurrentPage(safeLastPage);
    }, 0);

    return () => {
      window.clearTimeout(correctionTimerId);
    };
  }, [currentPage, isCurrentQueryLoaded, pagination.totalPages]);

  useEffect(() => {
    isPageMountedRef.current = true;

    return () => {
      isPageMountedRef.current = false;
    };
  }, []);

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

  function handlePaymentStatusChange(value) {
    setSearchQuery("");
    setPaymentStatus(normalizeText(value).toLowerCase());
    setCurrentPage(1);
  }

  function handlePaymentMethodChange(value) {
    setSearchQuery("");
    setPaymentMethod(normalizeText(value).toLowerCase());
    setCurrentPage(1);
  }

  function handlePageChange(page) {
    if (page < 1 || page > visibleTotalPages || page === currentPage) {
      return;
    }

    setSearchQuery("");
    setCurrentPage(page);
  }

  function handleOpenDetails(payment) {
    setDetailsPayment(payment);
  }

  function handleCloseDetails() {
    setDetailsPayment(null);
  }

  function handleOpenRefund(payment) {
    if (!getRefundEligibility(payment).isEligible) {
      return;
    }

    dispatch(clearPaymentRefundFeedback());
    setRefundPayment(payment);
  }

  function handleCloseRefund() {
    if (isRefundPending || refundRequestRef.current) {
      return;
    }

    dispatch(clearPaymentRefundFeedback());
    setRefundPayment(null);
  }

  async function handleConfirmRefund(values) {
    const { paymentId, remainingAmount, isEligible } =
      getRefundEligibility(refundPayment);
    const requestedAmount = Number(values?.refundAmount);

    if (
      !isEligible ||
      isRefundPending ||
      refundRequestRef.current ||
      !Number.isFinite(requestedAmount) ||
      requestedAmount <= 0 ||
      requestedAmount > remainingAmount
    ) {
      return false;
    }

    const sessionGeneration = selectAdminSessionGeneration(store.getState());
    const requestPromise = dispatch(
      processPaymentRefundThunk({ paymentId, ...values })
    );
    refundRequestRef.current = requestPromise;
    const resultAction = await requestPromise;

    if (
      !claimPaymentRefundContinuation({
        isPageMountedRef,
        requestRef: refundRequestRef,
        requestPromise,
        sessionGeneration,
        store,
      }) ||
      !processPaymentRefundThunk.fulfilled.match(resultAction) ||
      resultAction.meta.wasRequestOwned !== true
    ) {
      return false;
    }

    setRefundPayment(null);
    startListRequest(currentQuery, { force: true });
    startStatsRequest({ force: true });
    return true;
  }

  return (
    <div className="w-full min-w-0 max-w-full">
      <PageBreadcrumb
        pageTitle="Payments"
        description="Review direct Payment records, platform Payment statistics, and eligible refunds."
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

      <PaymentSummary stats={stats} isLoading={isInitialStatsLoading} />

      {refundSuccessMessage && (
        <PageFeedback
          tone="success"
          actionLabel="Dismiss"
          onAction={() => dispatch(clearPaymentRefundFeedback())}
        >
          {refundSuccessMessage}
        </PageFeedback>
      )}

      {hasInitialStatsError && (
        <PageFeedback
          tone="error"
          actionLabel="Try again"
          onAction={handleRetryStats}
        >
          <p className="font-medium">Payment statistics could not be loaded.</p>
          <p className="mt-1 text-xs">{statsError}</p>
        </PageFeedback>
      )}

      {hasStaleStatsWarning && (
        <PageFeedback actionLabel="Try again" onAction={handleRetryStats}>
          <p className="font-medium">
            Cached Payment statistics remain visible.
          </p>
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
          <p className="font-medium">Payment records could not be loaded.</p>
          <p className="mt-1 text-xs">{listError}</p>
        </PageFeedback>
      )}

      {hasStaleListWarning && (
        <PageFeedback actionLabel="Try again" onAction={handleRetryList}>
          <p className="font-medium">Cached Payment records remain visible.</p>
          <p className="mt-1">
            The latest list refresh failed, so the displayed page may be stale.
          </p>
          <p className="mt-1 text-xs">{listError}</p>
        </PageFeedback>
      )}

      {!hasRequestedViewError && (
        <>
          <PaymentsToolbar
            searchQuery={searchQuery}
            paymentStatus={paymentStatus}
            paymentMethod={paymentMethod}
            currentPage={visiblePage}
            pageSize={PAYMENTS_PAGE_SIZE}
            totalItems={visibleTotal}
            pageRecordCount={visiblePayments.length}
            matchingCount={searchedPayments.length}
            isSearchActive={isSearchActive}
            disabled={isRequestedViewLoading}
            onSearchChange={setSearchQuery}
            onPaymentStatusChange={handlePaymentStatusChange}
            onPaymentMethodChange={handlePaymentMethodChange}
          />

          <PaymentsTable
            payments={searchedPayments}
            isLoading={isRequestedViewLoading}
            isSearchActive={isSearchActive}
            hasServerFilters={hasServerFilters}
            currentPage={visiblePage}
            totalPages={visibleTotalPages}
            totalItems={visibleTotal}
            pageSize={PAYMENTS_PAGE_SIZE}
            onPageChange={handlePageChange}
            onView={handleOpenDetails}
            onRefund={handleOpenRefund}
          />
        </>
      )}

      {detailsPayment && (
        <PaymentDetailsModal
          isOpen
          payment={detailsPayment}
          onClose={handleCloseDetails}
        />
      )}

      {refundPayment && (
        <RefundPaymentModal
          isOpen
          payment={refundPayment}
          error={refundError ?? ""}
          isSubmitting={isRefundPending}
          onClose={handleCloseRefund}
          onConfirm={handleConfirmRefund}
        />
      )}
    </div>
  );
}

export default PaymentsPage;
