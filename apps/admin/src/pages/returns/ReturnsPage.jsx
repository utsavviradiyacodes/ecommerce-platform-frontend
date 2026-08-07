import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";

import PageBreadcrumb from "../../components/common/PageBreadcrumb.jsx";
import RefreshDataButton from "../../components/common/RefreshDataButton.jsx";
import ApproveReturnModal from "../../components/returns/ApproveReturnModal.jsx";
import RejectReturnModal from "../../components/returns/RejectReturnModal.jsx";
import ReturnDetailsModal from "../../components/returns/ReturnDetailsModal.jsx";
import ReturnsTable from "../../components/returns/ReturnsTable.jsx";
import ReturnsToolbar from "../../components/returns/ReturnsToolbar.jsx";
import { selectAdminSessionGeneration } from "../../features/auth/authSlice.js";
import {
  approveReturnThunk,
  clearReturnDetails,
  clearReturnMutationFeedback,
  createReturnsQueryKey,
  fetchReturnDetailsThunk,
  fetchReturnsThunk,
  fetchReturnStatsThunk,
  rejectReturnThunk,
  RETURNS_PAGE_SIZE,
  selectApproveReturnError,
  selectApproveReturnTargetId,
  selectIsApproveReturnPending,
  selectIsRejectReturnPending,
  selectIsReturnDetailsPending,
  selectIsReturnsListPending,
  selectIsReturnStatsPending,
  selectRejectReturnError,
  selectRejectReturnTargetId,
  selectReturnDetails,
  selectReturnDetailsError,
  selectReturnDetailsReturnId,
  selectReturnMutationSuccessMessage,
  selectReturns,
  selectReturnsListError,
  selectReturnsListIsStale,
  selectReturnsListLoadedAt,
  selectReturnsListStatus,
  selectReturnsLoadedQueryKey,
  selectReturnsPagination,
  selectReturnsRequestedQueryKey,
  selectReturnStats,
  selectReturnStatsError,
  selectReturnStatsIsStale,
  selectReturnStatsLoadedAt,
} from "../../features/returns/returnsSlice.js";
import { REQUEST_STATUS } from "../../utils/redux/requestState.js";

const EMPTY_VALUE = "\u2014";

function claimReturnMutationContinuation({
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

function isValidReturnId(value) {
  return /^[0-9a-fA-F]{24}$/.test(value);
}

function formatCount(value) {
  return Number.isSafeInteger(value) && value >= 0
    ? countFormatter.format(value)
    : EMPTY_VALUE;
}

function formatCurrency(value) {
  return typeof value === "number" && Number.isFinite(value) && value >= 0
    ? currencyFormatter.format(value)
    : EMPTY_VALUE;
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

function getReturnSearchText(returnRequest) {
  const orderRelation = returnRequest?.order ?? null;
  const productRelation = returnRequest?.product ?? null;
  const customerRelation = returnRequest?.customer ?? null;
  const sellerRelation = returnRequest?.seller ?? null;
  const product = normalizeObject(productRelation);
  const customer = normalizeObject(customerRelation);
  const seller = normalizeObject(sellerRelation);

  return [
    getEntityId(returnRequest),
    getEntityId(orderRelation),
    normalizeText(customer?.name),
    normalizeText(customer?.email),
    normalizeText(customer?.phone),
    normalizeText(product?.name),
    normalizeText(seller?.name),
    normalizeText(seller?.shopName),
    normalizeText(returnRequest?.reason),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
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

function ReturnSummary({ stats, isLoading }) {
  const returnsByStatus = normalizeObject(stats?.returnsByStatus);

  return (
    <section className="mb-5 min-w-0 rounded-2xl border border-gray-200 bg-white p-5 shadow-theme-xs sm:p-6 dark:border-gray-800 dark:bg-white/3">
      <div className="min-w-0">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white/90">
          Return overview
        </h2>
      </div>

      <div className="mt-5 grid min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <SummaryMetric
          label="Total Returns"
          value={formatCount(stats?.totalReturns)}
          isLoading={isLoading}
        />
        <SummaryMetric
          label="Requested"
          value={formatCount(returnsByStatus?.requested)}
          isLoading={isLoading}
        />
        <SummaryMetric
          label="Refunded"
          value={formatCount(returnsByStatus?.refunded)}
          isLoading={isLoading}
        />
        <SummaryMetric
          label="Rejected"
          value={formatCount(returnsByStatus?.rejected)}
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

function ReturnsPage() {
  const dispatch = useDispatch();
  const store = useStore();
  const returns = useSelector(selectReturns);
  const pagination = useSelector(selectReturnsPagination);
  const requestedQueryKey = useSelector(selectReturnsRequestedQueryKey);
  const loadedQueryKey = useSelector(selectReturnsLoadedQueryKey);
  const listStatus = useSelector(selectReturnsListStatus);
  const listError = useSelector(selectReturnsListError);
  const listLoadedAt = useSelector(selectReturnsListLoadedAt);
  const listIsStale = useSelector(selectReturnsListIsStale);
  const isListPending = useSelector(selectIsReturnsListPending);
  const stats = useSelector(selectReturnStats);
  const statsError = useSelector(selectReturnStatsError);
  const statsLoadedAt = useSelector(selectReturnStatsLoadedAt);
  const statsIsStale = useSelector(selectReturnStatsIsStale);
  const isStatsPending = useSelector(selectIsReturnStatsPending);
  const details = useSelector(selectReturnDetails);
  const detailsReturnId = useSelector(selectReturnDetailsReturnId);
  const detailsError = useSelector(selectReturnDetailsError);
  const isDetailsPending = useSelector(selectIsReturnDetailsPending);
  const approveError = useSelector(selectApproveReturnError);
  const approveTargetId = useSelector(selectApproveReturnTargetId);
  const isApprovePending = useSelector(selectIsApproveReturnPending);
  const rejectError = useSelector(selectRejectReturnError);
  const rejectTargetId = useSelector(selectRejectReturnTargetId);
  const isRejectPending = useSelector(selectIsRejectReturnPending);
  const mutationSuccessMessage = useSelector(
    selectReturnMutationSuccessMessage
  );

  const [searchQuery, setSearchQuery] = useState("");
  const [status, setStatus] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [approveTarget, setApproveTarget] = useState(null);
  const [rejectTarget, setRejectTarget] = useState(null);

  const listRequestRef = useRef(null);
  const listAbortTimerRef = useRef(null);
  const statsRequestRef = useRef(null);
  const statsAbortTimerRef = useRef(null);
  const detailsRequestRef = useRef(null);
  const isPageMountedRef = useRef(false);
  const approveRequestRef = useRef(null);
  const rejectRequestRef = useRef(null);

  const currentQuery = useMemo(
    () => ({ page: currentPage, limit: RETURNS_PAGE_SIZE, status }),
    [currentPage, status]
  );
  const currentQueryKey = useMemo(
    () => createReturnsQueryKey(currentQuery),
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
  const visibleReturns = useMemo(
    () => (isCurrentQueryLoaded ? returns : []),
    [isCurrentQueryLoaded, returns]
  );
  const normalizedSearch = normalizeText(searchQuery).toLowerCase();
  const isSearchActive = normalizedSearch.length > 0;
  const searchedReturns = useMemo(() => {
    if (!normalizedSearch) {
      return visibleReturns;
    }

    return visibleReturns.filter((returnRequest) =>
      getReturnSearchText(returnRequest).includes(normalizedSearch)
    );
  }, [normalizedSearch, visibleReturns]);
  const visiblePage = isCurrentQueryLoaded ? pagination.page : currentPage;
  const visibleTotalPages = isCurrentQueryLoaded ? pagination.totalPages : 0;
  const visibleTotal = isCurrentQueryLoaded ? pagination.total : 0;
  const isMainRefreshPending = isListPending || isStatsPending;

  const startListRequest = useCallback(
    (query, { force = false } = {}) => {
      const queryKey = createReturnsQueryKey(query);
      const activeRequest = listRequestRef.current;

      if (activeRequest?.queryKey === queryKey && !force) {
        return activeRequest.promise;
      }

      activeRequest?.promise.abort();
      const requestPromise = dispatch(fetchReturnsThunk({ ...query, force }));
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
      const requestPromise = dispatch(fetchReturnStatsThunk({ force }));
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

  const startDetailsRequest = useCallback(
    (returnId, { force = false } = {}) => {
      detailsRequestRef.current?.abort();
      const requestPromise = dispatch(
        fetchReturnDetailsThunk({ returnId, force })
      );
      detailsRequestRef.current = requestPromise;
      requestPromise.finally(() => {
        if (detailsRequestRef.current === requestPromise) {
          detailsRequestRef.current = null;
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
      setSearchQuery("");
      setCurrentPage(safeLastPage);
    }, 0);

    return () => window.clearTimeout(correctionTimerId);
  }, [currentPage, isCurrentQueryLoaded, pagination.totalPages]);

  useEffect(() => {
    isPageMountedRef.current = true;

    return () => {
      isPageMountedRef.current = false;
      detailsRequestRef.current?.abort();
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

  function handleStatusChange(value) {
    setSearchQuery("");
    setStatus(normalizeText(value).toLowerCase());
    setCurrentPage(1);
  }

  function handlePageChange(page) {
    if (page < 1 || page > visibleTotalPages || page === currentPage) {
      return;
    }

    setSearchQuery("");
    setCurrentPage(page);
  }

  function handleOpenDetails(returnRequest) {
    const returnId = getEntityId(returnRequest);

    if (!isValidReturnId(returnId)) {
      return;
    }

    detailsRequestRef.current?.abort();
    dispatch(clearReturnDetails());
    setSelectedReturn(returnRequest);
    startDetailsRequest(returnId);
  }

  function handleCloseDetails() {
    detailsRequestRef.current?.abort();
    detailsRequestRef.current = null;
    dispatch(clearReturnDetails());
    setSelectedReturn(null);
  }

  function handleRetryDetails() {
    const returnId = getEntityId(selectedReturn);

    if (!isDetailsPending && isValidReturnId(returnId)) {
      startDetailsRequest(returnId, { force: true });
    }
  }

  function handleOpenApprove(returnRequest) {
    if (
      normalizeText(returnRequest?.status).toLowerCase() !== "requested" ||
      !isValidReturnId(getEntityId(returnRequest)) ||
      isApprovePending ||
      isRejectPending ||
      approveTarget ||
      rejectTarget
    ) {
      return;
    }

    dispatch(clearReturnMutationFeedback());
    setApproveTarget(returnRequest);
  }

  function handleCloseApprove() {
    if (isApprovePending || approveRequestRef.current) {
      return;
    }

    dispatch(clearReturnMutationFeedback());
    setApproveTarget(null);
  }

  function handleOpenReject(returnRequest) {
    if (
      normalizeText(returnRequest?.status).toLowerCase() !== "requested" ||
      !isValidReturnId(getEntityId(returnRequest)) ||
      isApprovePending ||
      isRejectPending ||
      approveTarget ||
      rejectTarget
    ) {
      return;
    }

    dispatch(clearReturnMutationFeedback());
    setRejectTarget(returnRequest);
  }

  function handleCloseReject() {
    if (isRejectPending || rejectRequestRef.current) {
      return;
    }

    dispatch(clearReturnMutationFeedback());
    setRejectTarget(null);
  }

  function clearMatchingDetails(returnId) {
    if (getEntityId(selectedReturn) !== returnId) {
      return;
    }

    detailsRequestRef.current?.abort();
    detailsRequestRef.current = null;
    dispatch(clearReturnDetails());
    setSelectedReturn(null);
  }

  async function handleConfirmApprove(values) {
    const returnId = getEntityId(approveTarget);

    if (
      !isValidReturnId(returnId) ||
      normalizeText(approveTarget?.status).toLowerCase() !== "requested" ||
      isApprovePending ||
      isRejectPending ||
      approveRequestRef.current ||
      rejectRequestRef.current
    ) {
      return false;
    }

    const sessionGeneration = selectAdminSessionGeneration(store.getState());
    const requestPromise = dispatch(
      approveReturnThunk({ returnId, refundNote: values?.refundNote })
    );
    approveRequestRef.current = requestPromise;
    const resultAction = await requestPromise;

    if (
      !claimReturnMutationContinuation({
        isPageMountedRef,
        requestRef: approveRequestRef,
        requestPromise,
        sessionGeneration,
        store,
      }) ||
      !approveReturnThunk.fulfilled.match(resultAction) ||
      resultAction.meta.wasRequestOwned !== true
    ) {
      return false;
    }

    setApproveTarget(null);
    clearMatchingDetails(returnId);
    startListRequest(currentQuery, { force: true });
    startStatsRequest({ force: true });
    return true;
  }

  async function handleConfirmReject(values) {
    const returnId = getEntityId(rejectTarget);

    if (
      !isValidReturnId(returnId) ||
      normalizeText(rejectTarget?.status).toLowerCase() !== "requested" ||
      isApprovePending ||
      isRejectPending ||
      approveRequestRef.current ||
      rejectRequestRef.current
    ) {
      return false;
    }

    const sessionGeneration = selectAdminSessionGeneration(store.getState());
    const requestPromise = dispatch(
      rejectReturnThunk({
        returnId,
        rejectedReason: values?.rejectedReason,
      })
    );
    rejectRequestRef.current = requestPromise;
    const resultAction = await requestPromise;

    if (
      !claimReturnMutationContinuation({
        isPageMountedRef,
        requestRef: rejectRequestRef,
        requestPromise,
        sessionGeneration,
        store,
      }) ||
      !rejectReturnThunk.fulfilled.match(resultAction) ||
      resultAction.meta.wasRequestOwned !== true
    ) {
      return false;
    }

    setRejectTarget(null);
    clearMatchingDetails(returnId);
    startListRequest(currentQuery, { force: true });
    startStatsRequest({ force: true });
    return true;
  }

  return (
    <div className="w-full min-w-0 max-w-full">
      <PageBreadcrumb
        pageTitle="Returns"
        description="Review customer Return requests, inspect evidence, and approve refunds or reject requests."
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

      <ReturnSummary stats={stats} isLoading={isInitialStatsLoading} />

      {mutationSuccessMessage && (
        <PageFeedback
          tone="success"
          actionLabel="Dismiss"
          onAction={() => dispatch(clearReturnMutationFeedback())}
        >
          {mutationSuccessMessage}
        </PageFeedback>
      )}

      {hasInitialStatsError && (
        <PageFeedback
          tone="error"
          actionLabel="Try again"
          onAction={handleRetryStats}
        >
          <p className="font-medium">Return statistics could not be loaded.</p>
          <p className="mt-1 text-xs">{statsError}</p>
        </PageFeedback>
      )}

      {hasStaleStatsWarning && (
        <PageFeedback actionLabel="Try again" onAction={handleRetryStats}>
          <p className="font-medium">
            Cached Return statistics remain visible.
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
          <p className="font-medium">Return records could not be loaded.</p>
          <p className="mt-1 text-xs">{listError}</p>
        </PageFeedback>
      )}

      {hasStaleListWarning && (
        <PageFeedback actionLabel="Try again" onAction={handleRetryList}>
          <p className="font-medium">Cached Return records remain visible.</p>
          <p className="mt-1">
            The latest list refresh failed, so the displayed page may be stale.
          </p>
          <p className="mt-1 text-xs">{listError}</p>
        </PageFeedback>
      )}

      {!hasRequestedViewError && (
        <>
          <ReturnsToolbar
            searchQuery={searchQuery}
            status={status}
            matchingCount={searchedReturns.length}
            isSearchActive={isSearchActive}
            disabled={isRequestedViewLoading}
            onSearchChange={setSearchQuery}
            onStatusChange={handleStatusChange}
          />

          <ReturnsTable
            returns={searchedReturns}
            isLoading={isRequestedViewLoading}
            isSearchActive={isSearchActive}
            hasStatusFilter={Boolean(status)}
            currentPage={visiblePage}
            totalPages={visibleTotalPages}
            totalItems={visibleTotal}
            pageSize={RETURNS_PAGE_SIZE}
            approveTargetId={approveTargetId ?? ""}
            rejectTargetId={rejectTargetId ?? ""}
            isApprovePending={isApprovePending}
            isRejectPending={isRejectPending}
            onPageChange={handlePageChange}
            onView={handleOpenDetails}
            onApprove={handleOpenApprove}
            onReject={handleOpenReject}
          />
        </>
      )}

      {selectedReturn && (
        <ReturnDetailsModal
          isOpen
          selectedReturn={selectedReturn}
          details={details}
          detailsReturnId={detailsReturnId ?? ""}
          isLoading={isDetailsPending}
          error={detailsError ?? ""}
          onClose={handleCloseDetails}
          onRetry={handleRetryDetails}
        />
      )}

      {approveTarget && (
        <ApproveReturnModal
          isOpen
          returnRequest={approveTarget}
          error={approveError ?? ""}
          isSubmitting={isApprovePending}
          onClose={handleCloseApprove}
          onConfirm={handleConfirmApprove}
        />
      )}

      {rejectTarget && (
        <RejectReturnModal
          isOpen
          returnRequest={rejectTarget}
          error={rejectError ?? ""}
          isSubmitting={isRejectPending}
          onClose={handleCloseReject}
          onConfirm={handleConfirmReject}
        />
      )}
    </div>
  );
}

export default ReturnsPage;
