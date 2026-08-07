import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";

import PageBreadcrumb from "../../components/common/PageBreadcrumb.jsx";
import SellerApprovalModal from "../../components/sellers/SellerApprovalModal.jsx";
import SellerDetailsModal from "../../components/sellers/SellerDetailsModal.jsx";
import SellersTable from "../../components/sellers/SellersTable.jsx";
import SellersToolbar from "../../components/sellers/SellersToolbar.jsx";
import SellerStatusModal from "../../components/sellers/SellerStatusModal.jsx";
import { selectAdminSessionGeneration } from "../../features/auth/authSlice.js";
import {
  changeSellerApprovalThunk,
  changeSellerStatusThunk,
  clearSellerApprovalRequestFeedback,
  clearSellerDetails,
  clearSellerDetailsRequestFeedback,
  clearSellerMutationRequestFeedback,
  clearSellersListRefreshRequirement,
  clearSellerStatusRequestFeedback,
  createSellersQueryKey,
  fetchSellerDetailsThunk,
  fetchSellersThunk,
  getPendingSellersListRequest,
  getSellersListRequestSequence,
  requestSellersListRefresh,
  requestSellersListThunk,
  SELLERS_PAGE_SIZE,
  selectIsSellerApprovalPending,
  selectIsSellerDetailsPending,
  selectIsSellerStatusPending,
  selectSellerApprovalError,
  selectSellerApprovalSuccessMessage,
  selectSellerDetails,
  selectSellerDetailsError,
  selectSellerDetailsSellerId,
  selectSellerMutationTargetIds,
  selectSellers,
  selectSellersListError,
  selectSellersListRefreshRequirement,
  selectSellersListStatus,
  selectSellersLoadedQueryKey,
  selectSellersPage,
  selectSellersRequestedQueryKey,
  selectSellersTotal,
  selectSellersTotalPages,
  selectSellerStatusError,
  selectSellerStatusSuccessMessage,
} from "../../features/sellers/sellersSlice.js";
import { REQUEST_STATUS } from "../../utils/redux/requestState.js";

const SEARCH_DEBOUNCE_MS = 350;

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
  neutral: {
    container:
      "border-gray-200 bg-gray-50 dark:border-gray-800 dark:bg-white/2",
    text: "text-gray-600 dark:text-gray-400",
    button:
      "border-gray-300 text-gray-700 hover:bg-gray-100 focus-visible:outline-brand-500 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-800",
  },
};

function PageFeedback({
  tone = "neutral",
  children,
  actionLabel = "",
  onAction,
}) {
  const toneClasses = FEEDBACK_TONES[tone] ?? FEEDBACK_TONES.neutral;

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={`mb-6 flex min-w-0 flex-col gap-3 rounded-xl border px-4 py-4 sm:flex-row sm:items-center sm:justify-between ${toneClasses.container}`}
    >
      <div
        className={`min-w-0 flex-1 break-words whitespace-pre-wrap text-sm ${toneClasses.text}`}
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

function normalizeBooleanFilter(value) {
  if (value === true || value === false) {
    return value;
  }

  return "";
}

function getSellerId(seller) {
  const value = seller?._id ?? seller?.id;

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return normalizeText(value);
}

function getSafeTotalPages(resultAction) {
  const totalPages = Number(resultAction.payload?.response?.data?.totalPages);

  return Number.isInteger(totalPages) && totalPages > 0 ? totalPages : 1;
}

function isRedundantApprovalResponse(message) {
  const normalizedMessage = normalizeText(message).toLowerCase();

  return (
    normalizedMessage === "seller is already approved" ||
    normalizedMessage === "seller is already rejected or not approved"
  );
}

function isRedundantStatusResponse(message) {
  const normalizedMessage = normalizeText(message).toLowerCase();

  return (
    normalizedMessage === "user account is already deactivated" ||
    normalizedMessage === "user account is already active"
  );
}

function SellersPage() {
  const dispatch = useDispatch();
  const store = useStore();
  const sellers = useSelector(selectSellers);
  const sellersTotal = useSelector(selectSellersTotal);
  const sellersPage = useSelector(selectSellersPage);
  const sellersTotalPages = useSelector(selectSellersTotalPages);
  const sellersRequestedQueryKey = useSelector(selectSellersRequestedQueryKey);
  const sellersLoadedQueryKey = useSelector(selectSellersLoadedQueryKey);
  const sellersListStatus = useSelector(selectSellersListStatus);
  const sellersListError = useSelector(selectSellersListError);
  const mutationRefresh = useSelector(selectSellersListRefreshRequirement);
  const sellerDetails = useSelector(selectSellerDetails);
  const sellerDetailsSellerId = useSelector(selectSellerDetailsSellerId);
  const sellerDetailsError = useSelector(selectSellerDetailsError);
  const isDetailsPending = useSelector(selectIsSellerDetailsPending);
  const isApprovalPending = useSelector(selectIsSellerApprovalPending);
  const approvalError = useSelector(selectSellerApprovalError);
  const approvalSuccessMessage = useSelector(
    selectSellerApprovalSuccessMessage
  );
  const isStatusPending = useSelector(selectIsSellerStatusPending);
  const statusError = useSelector(selectSellerStatusError);
  const statusSuccessMessage = useSelector(selectSellerStatusSuccessMessage);
  const mutationTargetIds = useSelector(selectSellerMutationTargetIds);

  const [searchInput, setSearchInput] = useState("");
  const [committedSearch, setCommittedSearch] = useState("");
  const [approvalFilter, setApprovalFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [detailsSellerId, setDetailsSellerId] = useState("");
  const [approvalSeller, setApprovalSeller] = useState(null);
  const [statusSeller, setStatusSeller] = useState(null);

  const currentQueryArgs = useMemo(() => {
    const query = {
      page: currentPage,
      limit: SELLERS_PAGE_SIZE,
      search: committedSearch,
      isApproved: approvalFilter === "" ? undefined : approvalFilter,
      isActive: statusFilter === "" ? undefined : statusFilter,
    };

    return {
      ...query,
      queryKey: createSellersQueryKey(query),
    };
  }, [approvalFilter, committedSearch, currentPage, statusFilter]);

  const latestQueryArgsRef = useRef(currentQueryArgs);
  const currentQueryKey = currentQueryArgs.queryKey;
  const isCurrentQueryRequested =
    sellersRequestedQueryKey === currentQueryKey;
  const isCurrentQueryLoaded = sellersLoadedQueryKey === currentQueryKey;
  const isRequestedViewLoading =
    !isCurrentQueryLoaded &&
    (!isCurrentQueryRequested ||
      sellersListStatus === REQUEST_STATUS.IDLE ||
      sellersListStatus === REQUEST_STATUS.PENDING);
  const hasRequestedViewError =
    Boolean(sellersListError) &&
    isCurrentQueryRequested &&
    !isCurrentQueryLoaded;
  const hasStaleSellersWarning =
    Boolean(sellersListError) &&
    isCurrentQueryRequested &&
    isCurrentQueryLoaded;
  const hasActiveSellerFilters =
    committedSearch.length > 0 ||
    approvalFilter !== "" ||
    statusFilter !== "";
  const isResultCountCurrent =
    isCurrentQueryLoaded && searchInput.trim() === committedSearch;
  const visibleSellers = isCurrentQueryLoaded ? sellers : [];
  const visibleCurrentPage = isCurrentQueryLoaded
    ? Math.min(Math.max(sellersPage, 1), sellersTotalPages)
    : currentPage;
  const visibleSellerDetails =
    detailsSellerId && sellerDetailsSellerId === detailsSellerId
      ? sellerDetails
      : null;
  const visibleSellerDetailsError =
    detailsSellerId && sellerDetailsSellerId === detailsSellerId
      ? sellerDetailsError
      : "";
  const isVisibleSellerDetailsPending =
    Boolean(detailsSellerId) &&
    sellerDetailsSellerId === detailsSellerId &&
    isDetailsPending;
  const mutationSuccessMessage =
    approvalSuccessMessage || statusSuccessMessage;
  const mutationError =
    (!approvalSeller && approvalError) || (!statusSeller && statusError) || "";

  useLayoutEffect(() => {
    latestQueryArgsRef.current = currentQueryArgs;
  }, [currentQueryArgs]);

  useEffect(() => {
    const normalizedSearch = searchInput.trim();

    if (normalizedSearch === committedSearch) {
      return undefined;
    }

    const searchTimerId = window.setTimeout(() => {
      setCurrentPage(1);
      setCommittedSearch(normalizedSearch);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(searchTimerId);
    };
  }, [committedSearch, searchInput]);

  useEffect(() => {
    let isActive = true;
    const requestPromise = dispatch(requestSellersListThunk(currentQueryArgs));
    const requestSequence =
      getPendingSellersListRequest(currentQueryArgs)?.sequence ?? 0;

    requestPromise.then((resultAction) => {
      const currentRefreshRequirement = selectSellersListRefreshRequirement(
        store.getState()
      );
      const isSupersededByRequiredRefresh =
        currentRefreshRequirement.afterSequence !== null &&
        requestSequence <= currentRefreshRequirement.afterSequence;

      if (
        !isActive ||
        isSupersededByRequiredRefresh ||
        !fetchSellersThunk.fulfilled.match(resultAction) ||
        resultAction.payload.queryKey !== latestQueryArgsRef.current.queryKey
      ) {
        return;
      }

      const safeTotalPages = getSafeTotalPages(resultAction);

      setCurrentPage((page) =>
        page === currentQueryArgs.page && page > safeTotalPages
          ? safeTotalPages
          : page
      );
    });

    return () => {
      isActive = false;
    };
  }, [currentQueryArgs, dispatch, store]);

  useEffect(() => {
    if (mutationRefresh.afterSequence === null) {
      return undefined;
    }

    let isActive = true;
    const refreshVersion = mutationRefresh.version;

    function ownsRefreshRequirement() {
      const currentRequirement = selectSellersListRefreshRequirement(
        store.getState()
      );

      return (
        currentRequirement.afterSequence !== null &&
        currentRequirement.version === refreshVersion
      );
    }

    async function refreshRequestedQuery() {
      let resultAction = null;

      while (isActive) {
        if (
          !ownsRefreshRequirement() ||
          currentQueryArgs.queryKey !== latestQueryArgsRef.current.queryKey
        ) {
          return;
        }

        const pendingRequest = getPendingSellersListRequest(currentQueryArgs);

        if (!pendingRequest) {
          resultAction = await dispatch(
            requestSellersListThunk({
              ...currentQueryArgs,
              force: true,
            })
          );
          break;
        }

        resultAction = await pendingRequest.promise;

        if (!isActive) {
          return;
        }

        if (pendingRequest.sequence > mutationRefresh.afterSequence) {
          break;
        }
      }

      if (
        !isActive ||
        currentQueryArgs.queryKey !== latestQueryArgsRef.current.queryKey ||
        !ownsRefreshRequirement()
      ) {
        return;
      }

      dispatch(clearSellersListRefreshRequirement(refreshVersion));

      if (
        !fetchSellersThunk.fulfilled.match(resultAction) ||
        resultAction.payload.queryKey !== currentQueryArgs.queryKey
      ) {
        return;
      }

      const safeTotalPages = getSafeTotalPages(resultAction);

      setCurrentPage((page) =>
        page === currentQueryArgs.page && page > safeTotalPages
          ? safeTotalPages
          : page
      );
    }

    void refreshRequestedQuery();

    return () => {
      isActive = false;
    };
  }, [currentQueryArgs, dispatch, mutationRefresh, store]);

  useEffect(() => {
    return () => {
      dispatch(clearSellerDetails());
      dispatch(clearSellerMutationRequestFeedback());
    };
  }, [dispatch]);

  function scheduleSellersRefresh() {
    dispatch(requestSellersListRefresh(getSellersListRequestSequence()));
  }

  function handleApprovalFilterChange(value) {
    setApprovalFilter(normalizeBooleanFilter(value));
    setCurrentPage(1);
  }

  function handleStatusFilterChange(value) {
    setStatusFilter(normalizeBooleanFilter(value));
    setCurrentPage(1);
  }

  function handlePageChange(page) {
    if (page < 1 || page > sellersTotalPages || !isCurrentQueryLoaded) {
      return;
    }

    setCurrentPage(page);
  }

  function handleRetrySellers() {
    scheduleSellersRefresh();
  }

  function handleOpenDetails(seller) {
    const sellerId = getSellerId(seller);

    if (!sellerId) {
      return;
    }

    dispatch(clearSellerDetails());
    setDetailsSellerId(sellerId);
    void dispatch(fetchSellerDetailsThunk({ sellerId }));
  }

  function handleCloseDetails() {
    setDetailsSellerId("");
    dispatch(clearSellerDetails());
  }

  function handleRetryDetails() {
    if (!detailsSellerId || isDetailsPending) {
      return;
    }

    dispatch(clearSellerDetailsRequestFeedback());
    void dispatch(fetchSellerDetailsThunk({ sellerId: detailsSellerId }));
  }

  function handleOpenApprovalModal(seller) {
    if (
      !getSellerId(seller) ||
      (seller?.isApproved !== true && seller?.isApproved !== false)
    ) {
      return;
    }

    dispatch(clearSellerMutationRequestFeedback());
    setApprovalSeller(seller);
  }

  function handleCloseApprovalModal() {
    if (isApprovalPending) {
      return;
    }

    dispatch(clearSellerApprovalRequestFeedback());
    setApprovalSeller(null);
  }

  async function handleConfirmApprovalChange() {
    if (!approvalSeller || isApprovalPending) {
      return;
    }

    const sellerId = getSellerId(approvalSeller);
    const nextIsApproved = approvalSeller.isApproved === false;
    const sessionGeneration = selectAdminSessionGeneration(store.getState());
    const resultAction = await dispatch(
      changeSellerApprovalThunk({ sellerId, nextIsApproved })
    );

    if (selectAdminSessionGeneration(store.getState()) !== sessionGeneration) {
      return;
    }

    if (!changeSellerApprovalThunk.fulfilled.match(resultAction)) {
      if (isRedundantApprovalResponse(resultAction.payload)) {
        setApprovalSeller(null);
        scheduleSellersRefresh();
      }

      return;
    }

    setApprovalSeller(null);
    scheduleSellersRefresh();
  }

  function handleOpenStatusModal(seller) {
    if (
      !getSellerId(seller) ||
      (seller?.isActive !== true && seller?.isActive !== false)
    ) {
      return;
    }

    dispatch(clearSellerMutationRequestFeedback());
    setStatusSeller(seller);
  }

  function handleCloseStatusModal() {
    if (isStatusPending) {
      return;
    }

    dispatch(clearSellerStatusRequestFeedback());
    setStatusSeller(null);
  }

  async function handleConfirmStatusChange() {
    if (!statusSeller || isStatusPending) {
      return;
    }

    const sellerId = getSellerId(statusSeller);
    const nextIsActive = statusSeller.isActive === false;
    const sessionGeneration = selectAdminSessionGeneration(store.getState());
    const resultAction = await dispatch(
      changeSellerStatusThunk({ sellerId, nextIsActive })
    );

    if (selectAdminSessionGeneration(store.getState()) !== sessionGeneration) {
      return;
    }

    if (!changeSellerStatusThunk.fulfilled.match(resultAction)) {
      if (isRedundantStatusResponse(resultAction.payload)) {
        setStatusSeller(null);
        scheduleSellersRefresh();
      }

      return;
    }

    setStatusSeller(null);
    scheduleSellersRefresh();
  }

  return (
    <div className="w-full min-w-0 max-w-full">
      <PageBreadcrumb
        pageTitle="Sellers"
        description="Review Seller accounts, marketplace approval, performance, and account access."
      />

      <SellersToolbar
        searchQuery={searchInput}
        approvalFilter={approvalFilter}
        statusFilter={statusFilter}
        resultCount={sellersTotal}
        isResultCountCurrent={isResultCountCurrent}
        onSearchChange={setSearchInput}
        onApprovalFilterChange={handleApprovalFilterChange}
        onStatusFilterChange={handleStatusFilterChange}
      />

      {mutationSuccessMessage && (
        <PageFeedback
          tone="success"
          actionLabel="Dismiss"
          onAction={() => dispatch(clearSellerMutationRequestFeedback())}
        >
          {mutationSuccessMessage}
        </PageFeedback>
      )}

      {mutationError && (
        <PageFeedback
          tone="warning"
          actionLabel="Dismiss"
          onAction={() => dispatch(clearSellerMutationRequestFeedback())}
        >
          <p>{mutationError}</p>
          <p className="mt-1 text-xs">
            A Seller-list refresh was requested to reconcile the current
            marketplace and account state.
          </p>
        </PageFeedback>
      )}

      {hasRequestedViewError && (
        <PageFeedback
          tone="error"
          actionLabel="Try again"
          onAction={handleRetrySellers}
        >
          <p>
            Sellers for the requested search and filters could not be loaded.
          </p>
          <p className="mt-1 text-xs">{sellersListError}</p>
        </PageFeedback>
      )}

      {hasStaleSellersWarning && (
        <PageFeedback
          tone="warning"
          actionLabel="Try again"
          onAction={handleRetrySellers}
        >
          <p>
            Sellers could not be refreshed. Previously loaded data is shown.
          </p>
          <p className="mt-1 text-xs">{sellersListError}</p>
        </PageFeedback>
      )}

      {!hasRequestedViewError && (
        <SellersTable
          sellers={visibleSellers}
          isLoading={isRequestedViewLoading}
          hasActiveFilters={hasActiveSellerFilters}
          onView={handleOpenDetails}
          onApprovalChange={handleOpenApprovalModal}
          onStatusChange={handleOpenStatusModal}
          pendingActions={{
            approval: isApprovalPending,
            status: isStatusPending,
          }}
          mutationTargetIds={mutationTargetIds}
          currentPage={visibleCurrentPage}
          totalPages={sellersTotalPages}
          totalItems={sellersTotal}
          pageSize={SELLERS_PAGE_SIZE}
          onPageChange={handlePageChange}
        />
      )}

      {detailsSellerId && (
        <SellerDetailsModal
          isOpen
          details={visibleSellerDetails}
          error={visibleSellerDetailsError ?? ""}
          isLoading={isVisibleSellerDetailsPending}
          onClose={handleCloseDetails}
          onRetry={handleRetryDetails}
        />
      )}

      {approvalSeller && (
        <SellerApprovalModal
          isOpen
          seller={approvalSeller}
          error={approvalError ?? ""}
          isSubmitting={isApprovalPending}
          onClose={handleCloseApprovalModal}
          onConfirm={handleConfirmApprovalChange}
        />
      )}

      {statusSeller && (
        <SellerStatusModal
          isOpen
          seller={statusSeller}
          error={statusError ?? ""}
          isSubmitting={isStatusPending}
          onClose={handleCloseStatusModal}
          onConfirm={handleConfirmStatusChange}
        />
      )}
    </div>
  );
}

export default SellersPage;
