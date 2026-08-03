import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";

import PageBreadcrumb from "../../components/common/PageBreadcrumb.jsx";
import CustomerStatusModal from "../../components/customers/CustomerStatusModal.jsx";
import CustomersTable from "../../components/customers/CustomersTable.jsx";
import CustomersToolbar from "../../components/customers/CustomersToolbar.jsx";
import {
  changeCustomerStatusThunk,
  clearCustomersListRefreshRequirement,
  clearCustomerStatusRequestFeedback,
  createCustomersQueryKey,
  CUSTOMERS_PAGE_SIZE,
  fetchCustomersThunk,
  getCustomersListRequestSequence,
  getPendingCustomersListRequest,
  requestCustomersListRefresh,
  requestCustomersListThunk,
  resetCustomerMutationRequestStates,
  selectCustomers,
  selectCustomersListError,
  selectCustomersListRefreshRequirement,
  selectCustomersListStatus,
  selectCustomersLoadedQueryKey,
  selectCustomersPage,
  selectCustomersRequestedQueryKey,
  selectCustomersTotal,
  selectCustomersTotalPages,
  selectCustomerStatusError,
  selectCustomerStatusSuccessMessage,
  selectCustomerStatusTargetId,
  selectIsCustomerStatusPending,
} from "../../features/customers/customersSlice.js";
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

function normalizeStatusFilter(value) {
  if (value === true || value === false) {
    return value;
  }

  return "";
}

function getCustomerId(customer) {
  const value = customer?._id ?? customer?.id;

  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return normalizeText(value);
}

function getSafeTotalPages(resultAction) {
  const totalPages = Number(resultAction.payload?.response?.data?.totalPages);

  return Number.isInteger(totalPages) && totalPages > 0 ? totalPages : 1;
}

function isRedundantStatusResponse(message) {
  const normalizedMessage = normalizeText(message).toLowerCase();

  return (
    normalizedMessage === "user account is already deactivated" ||
    normalizedMessage === "user account is already active"
  );
}

function CustomersPage() {
  const dispatch = useDispatch();
  const store = useStore();
  const customers = useSelector(selectCustomers);
  const customersTotal = useSelector(selectCustomersTotal);
  const customersPage = useSelector(selectCustomersPage);
  const customersTotalPages = useSelector(selectCustomersTotalPages);
  const customersRequestedQueryKey = useSelector(
    selectCustomersRequestedQueryKey
  );
  const customersLoadedQueryKey = useSelector(selectCustomersLoadedQueryKey);
  const customersListStatus = useSelector(selectCustomersListStatus);
  const customersListError = useSelector(selectCustomersListError);
  const mutationRefresh = useSelector(
    selectCustomersListRefreshRequirement
  );
  const isStatusPending = useSelector(selectIsCustomerStatusPending);
  const statusError = useSelector(selectCustomerStatusError);
  const statusSuccessMessage = useSelector(
    selectCustomerStatusSuccessMessage
  );
  const statusTargetId = useSelector(selectCustomerStatusTargetId);

  const [searchInput, setSearchInput] = useState("");
  const [committedSearch, setCommittedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [statusCustomer, setStatusCustomer] = useState(null);

  const currentQueryArgs = useMemo(() => {
    const query = {
      page: currentPage,
      limit: CUSTOMERS_PAGE_SIZE,
      search: committedSearch,
      isActive: statusFilter === "" ? undefined : statusFilter,
    };

    return {
      ...query,
      queryKey: createCustomersQueryKey(query),
    };
  }, [committedSearch, currentPage, statusFilter]);

  const latestQueryArgsRef = useRef(currentQueryArgs);
  const currentQueryKey = currentQueryArgs.queryKey;
  const isCurrentQueryRequested =
    customersRequestedQueryKey === currentQueryKey;
  const isCurrentQueryLoaded = customersLoadedQueryKey === currentQueryKey;
  const isRequestedViewLoading =
    !isCurrentQueryLoaded &&
    (!isCurrentQueryRequested ||
      customersListStatus === REQUEST_STATUS.IDLE ||
      customersListStatus === REQUEST_STATUS.PENDING);
  const hasRequestedViewError =
    Boolean(customersListError) &&
    isCurrentQueryRequested &&
    !isCurrentQueryLoaded;
  const hasStaleCustomersWarning =
    Boolean(customersListError) &&
    isCurrentQueryRequested &&
    isCurrentQueryLoaded;
  const hasActiveCustomerFilters =
    committedSearch.length > 0 || statusFilter !== "";
  const isResultCountCurrent =
    isCurrentQueryLoaded && searchInput.trim() === committedSearch;
  const visibleCustomers = isCurrentQueryLoaded ? customers : [];
  const visibleCurrentPage = isCurrentQueryLoaded
    ? Math.min(Math.max(customersPage, 1), customersTotalPages)
    : currentPage;

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
    const requestPromise = dispatch(requestCustomersListThunk(currentQueryArgs));
    const requestSequence =
      getPendingCustomersListRequest(currentQueryArgs)?.sequence ?? 0;

    requestPromise.then((resultAction) => {
      const currentRefreshRequirement =
        selectCustomersListRefreshRequirement(store.getState());
      const isSupersededByRequiredRefresh =
        currentRefreshRequirement.afterSequence !== null &&
        requestSequence <= currentRefreshRequirement.afterSequence;

      if (
        !isActive ||
        isSupersededByRequiredRefresh ||
        !fetchCustomersThunk.fulfilled.match(resultAction) ||
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
      const currentRequirement = selectCustomersListRefreshRequirement(
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

        const pendingRequest = getPendingCustomersListRequest(currentQueryArgs);

        if (!pendingRequest) {
          resultAction = await dispatch(
            requestCustomersListThunk({
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

      dispatch(clearCustomersListRefreshRequirement(refreshVersion));

      if (
        !fetchCustomersThunk.fulfilled.match(resultAction) ||
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
      dispatch(resetCustomerMutationRequestStates());
    };
  }, [dispatch]);

  function scheduleCustomersRefresh() {
    dispatch(requestCustomersListRefresh(getCustomersListRequestSequence()));
  }

  function handleStatusFilterChange(value) {
    setStatusFilter(normalizeStatusFilter(value));
    setCurrentPage(1);
  }

  function handlePageChange(page) {
    if (page < 1 || page > customersTotalPages || !isCurrentQueryLoaded) {
      return;
    }

    setCurrentPage(page);
  }

  function handleRetryCustomers() {
    scheduleCustomersRefresh();
  }

  function handleOpenStatusModal(customer) {
    if (
      !getCustomerId(customer) ||
      (customer?.isActive !== true && customer?.isActive !== false)
    ) {
      return;
    }

    dispatch(clearCustomerStatusRequestFeedback());
    setStatusCustomer(customer);
  }

  function handleCloseStatusModal() {
    if (isStatusPending) {
      return;
    }

    dispatch(clearCustomerStatusRequestFeedback());
    setStatusCustomer(null);
  }

  async function handleConfirmStatusChange() {
    if (!statusCustomer || isStatusPending) {
      return;
    }

    const customerId = getCustomerId(statusCustomer);
    const nextIsActive = statusCustomer.isActive === false;
    const resultAction = await dispatch(
      changeCustomerStatusThunk({ customerId, nextIsActive })
    );

    if (!changeCustomerStatusThunk.fulfilled.match(resultAction)) {
      if (isRedundantStatusResponse(resultAction.payload)) {
        setStatusCustomer(null);
        scheduleCustomersRefresh();
      }

      return;
    }

    setStatusCustomer(null);
    scheduleCustomersRefresh();
  }

  return (
    <div className="w-full min-w-0 max-w-full">
      <PageBreadcrumb
        pageTitle="Customers"
        description="Manage registered Customer accounts and account access."
      />

      <CustomersToolbar
        searchQuery={searchInput}
        statusFilter={statusFilter}
        resultCount={customersTotal}
        isResultCountCurrent={isResultCountCurrent}
        onSearchChange={setSearchInput}
        onStatusFilterChange={handleStatusFilterChange}
      />

      {statusSuccessMessage && (
        <PageFeedback
          tone="success"
          actionLabel="Dismiss"
          onAction={() => dispatch(clearCustomerStatusRequestFeedback())}
        >
          {statusSuccessMessage}
        </PageFeedback>
      )}

      {statusError && !statusCustomer && (
        <PageFeedback
          tone="warning"
          actionLabel="Dismiss"
          onAction={() => dispatch(clearCustomerStatusRequestFeedback())}
        >
          <p>{statusError}</p>
          <p className="mt-1 text-xs">
            A Customer-list refresh was requested to reconcile the current
            account state.
          </p>
        </PageFeedback>
      )}

      {hasRequestedViewError && (
        <PageFeedback
          tone="error"
          actionLabel="Try again"
          onAction={handleRetryCustomers}
        >
          <p>
            Customers for the requested search and status filter could not be
            loaded.
          </p>
          <p className="mt-1 text-xs">{customersListError}</p>
        </PageFeedback>
      )}

      {hasStaleCustomersWarning && (
        <PageFeedback
          tone="warning"
          actionLabel="Try again"
          onAction={handleRetryCustomers}
        >
          <p>
            Customers could not be refreshed. Previously loaded data is shown.
          </p>
          <p className="mt-1 text-xs">{customersListError}</p>
        </PageFeedback>
      )}

      {!hasRequestedViewError && (
        <CustomersTable
          customers={visibleCustomers}
          isLoading={isRequestedViewLoading}
          hasActiveFilters={hasActiveCustomerFilters}
          isStatusPending={isStatusPending}
          statusTargetId={statusTargetId ?? ""}
          onStatusChange={handleOpenStatusModal}
          currentPage={visibleCurrentPage}
          totalPages={customersTotalPages}
          totalItems={customersTotal}
          pageSize={CUSTOMERS_PAGE_SIZE}
          onPageChange={handlePageChange}
        />
      )}

      {statusCustomer && (
        <CustomerStatusModal
          isOpen
          customer={statusCustomer}
          error={statusError ?? ""}
          isSubmitting={isStatusPending}
          onClose={handleCloseStatusModal}
          onConfirm={handleConfirmStatusChange}
        />
      )}
    </div>
  );
}

export default CustomersPage;
