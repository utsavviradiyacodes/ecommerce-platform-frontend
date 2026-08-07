import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useSelector, useStore } from "react-redux";

import AdminDetailsModal from "../../components/admins/AdminDetailsModal.jsx";
import AdminFormModal from "../../components/admins/AdminFormModal.jsx";
import AdminPermissionsModal from "../../components/admins/AdminPermissionsModal.jsx";
import AdminsTable from "../../components/admins/AdminsTable.jsx";
import AdminsToolbar from "../../components/admins/AdminsToolbar.jsx";
import DeleteAdminModal from "../../components/admins/DeleteAdminModal.jsx";
import PageBreadcrumb from "../../components/common/PageBreadcrumb.jsx";
import RefreshDataButton from "../../components/common/RefreshDataButton.jsx";
import {
  ADMINS_PAGE_SIZE,
  clearAdminMutationFeedback,
  createAdminsQueryKey,
  createAdminThunk,
  deleteAdminThunk,
  fetchAdminsThunk,
  selectAdminCreateError,
  selectAdminDeleteError,
  selectAdminDeleteTargetId,
  selectAdminMutationSuccessMessage,
  selectAdminPermissionsError,
  selectAdminPermissionsTargetId,
  selectAdmins,
  selectAdminsListError,
  selectAdminsListIsStale,
  selectAdminsListLoadedAt,
  selectAdminsListStatus,
  selectAdminsLoadedQueryKey,
  selectAdminsPagination,
  selectAdminsRequestedQueryKey,
  selectAdminUpdateError,
  selectAdminUpdateTargetId,
  selectIsAdminCreatePending,
  selectIsAdminDeletePending,
  selectIsAdminPermissionsPending,
  selectIsAdminsListPending,
  selectIsAdminUpdatePending,
  updateAdminPermissionsThunk,
  updateAdminThunk,
} from "../../features/admins/adminsSlice.js";
import {
  selectAdminSessionGeneration,
  selectCurrentAdmin,
} from "../../features/auth/authSlice.js";
import { REQUEST_STATUS } from "../../utils/redux/requestState.js";

const SEARCH_DEBOUNCE_MS = 350;

const loadedAtFormatter = new Intl.DateTimeFormat("en-IN", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

const RETRY_BUTTON_CLASSES =
  "inline-flex shrink-0 items-center justify-center rounded-lg border bg-white px-3 py-2 text-sm font-medium shadow-theme-xs transition focus-visible:outline-2 focus-visible:outline-offset-2 dark:bg-transparent";

const ADMIN_CREATE_SUCCESS_MESSAGE =
  "Admin account created. Verification delivery was initiated to the new Admin's email. They must complete verification on their own device.";

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

function getAdminId(admin) {
  return normalizeText(admin?._id ?? admin?.id);
}

function isValidAdminId(value) {
  return /^[0-9a-fA-F]{24}$/.test(value);
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

function claimAdminMutationContinuation({
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

function AdminsPage() {
  const dispatch = useDispatch();
  const store = useStore();
  const currentAdmin = useSelector(selectCurrentAdmin);
  const admins = useSelector(selectAdmins);
  const pagination = useSelector(selectAdminsPagination);
  const requestedQueryKey = useSelector(selectAdminsRequestedQueryKey);
  const loadedQueryKey = useSelector(selectAdminsLoadedQueryKey);
  const listStatus = useSelector(selectAdminsListStatus);
  const listError = useSelector(selectAdminsListError);
  const listLoadedAt = useSelector(selectAdminsListLoadedAt);
  const listIsStale = useSelector(selectAdminsListIsStale);
  const isListPending = useSelector(selectIsAdminsListPending);
  const createError = useSelector(selectAdminCreateError);
  const isCreatePending = useSelector(selectIsAdminCreatePending);
  const updateError = useSelector(selectAdminUpdateError);
  const isUpdatePending = useSelector(selectIsAdminUpdatePending);
  const updateTargetId = useSelector(selectAdminUpdateTargetId);
  const permissionsError = useSelector(selectAdminPermissionsError);
  const isPermissionsPending = useSelector(selectIsAdminPermissionsPending);
  const permissionsTargetId = useSelector(selectAdminPermissionsTargetId);
  const deleteError = useSelector(selectAdminDeleteError);
  const isDeletePending = useSelector(selectIsAdminDeletePending);
  const deleteTargetId = useSelector(selectAdminDeleteTargetId);
  const mutationSuccessMessage = useSelector(selectAdminMutationSuccessMessage);

  const [searchDraft, setSearchDraft] = useState("");
  const [appliedSearch, setAppliedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [detailsAdmin, setDetailsAdmin] = useState(null);
  const [formMode, setFormMode] = useState(null);
  const [editAdmin, setEditAdmin] = useState(null);
  const [permissionsAdmin, setPermissionsAdmin] = useState(null);
  const [deleteAdmin, setDeleteAdmin] = useState(null);
  const [createSuccessMessage, setCreateSuccessMessage] = useState(null);

  const listRequestRef = useRef(null);
  const listAbortTimerRef = useRef(null);
  const isPageMountedRef = useRef(false);
  const createRequestRef = useRef(null);
  const updateRequestRef = useRef(null);
  const permissionsRequestRef = useRef(null);
  const deleteRequestRef = useRef(null);

  const currentAdminId = getAdminId(currentAdmin);
  const currentQuery = useMemo(
    () => ({
      page: currentPage,
      limit: ADMINS_PAGE_SIZE,
      search: appliedSearch,
    }),
    [appliedSearch, currentPage]
  );
  const currentQueryKey = useMemo(
    () => createAdminsQueryKey(currentQuery),
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
  const visibleAdmins = isCurrentQueryLoaded ? admins : [];
  const visiblePage = isCurrentQueryLoaded ? pagination.page : currentPage;
  const visibleTotalPages = isCurrentQueryLoaded ? pagination.totalPages : 0;
  const visibleTotal = isCurrentQueryLoaded ? pagination.total : 0;
  const hasOpenMutationModal = Boolean(
    formMode || permissionsAdmin || deleteAdmin
  );
  const hasPendingMutation = Boolean(
    isCreatePending ||
    isUpdatePending ||
    isPermissionsPending ||
    isDeletePending
  );
  const visibleMutationSuccessMessage =
    createSuccessMessage || mutationSuccessMessage;

  const startListRequest = useCallback(
    (query, { force = false } = {}) => {
      const queryKey = createAdminsQueryKey(query);
      const activeRequest = listRequestRef.current;

      if (activeRequest?.queryKey === queryKey && !force) {
        return activeRequest.promise;
      }

      activeRequest?.promise.abort();
      const requestPromise = dispatch(fetchAdminsThunk({ ...query, force }));
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

  useEffect(() => {
    isPageMountedRef.current = true;

    return () => {
      isPageMountedRef.current = false;
    };
  }, []);

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
    const normalizedSearch = normalizeText(searchDraft);

    if (normalizedSearch === appliedSearch) {
      return undefined;
    }

    const searchTimerId = window.setTimeout(() => {
      setCurrentPage(1);
      setAppliedSearch(normalizedSearch);
    }, SEARCH_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(searchTimerId);
    };
  }, [appliedSearch, searchDraft]);

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

    return () => window.clearTimeout(correctionTimerId);
  }, [currentPage, isCurrentQueryLoaded, pagination.totalPages]);

  function handleRefresh() {
    if (!isListPending) {
      startListRequest(currentQuery, { force: true });
    }
  }

  function handleRetryList() {
    if (!isListPending) {
      startListRequest(currentQuery, { force: true });
    }
  }

  function handleSearchSubmit(value) {
    const normalizedSearch = normalizeText(value);

    if (normalizedSearch === appliedSearch && currentPage === 1) {
      return;
    }

    setSearchDraft(normalizedSearch);
    setAppliedSearch(normalizedSearch);
    setCurrentPage(1);
  }

  function handlePageChange(page) {
    if (page < 1 || page > visibleTotalPages || page === currentPage) {
      return;
    }

    setCurrentPage(page);
  }

  function canOpenMutationModal() {
    return !hasPendingMutation && !hasOpenMutationModal;
  }

  function handleOpenCreate() {
    if (!canOpenMutationModal()) {
      return;
    }

    dispatch(clearAdminMutationFeedback());
    setCreateSuccessMessage(null);
    setEditAdmin(null);
    setFormMode("create");
  }

  function handleOpenEdit(admin) {
    if (!canOpenMutationModal() || !isValidAdminId(getAdminId(admin))) {
      return;
    }

    dispatch(clearAdminMutationFeedback());
    setCreateSuccessMessage(null);
    setEditAdmin(admin);
    setFormMode("edit");
  }

  function handleCloseForm() {
    if (
      isCreatePending ||
      isUpdatePending ||
      createRequestRef.current ||
      updateRequestRef.current
    ) {
      return;
    }

    dispatch(clearAdminMutationFeedback());
    setCreateSuccessMessage(null);
    setEditAdmin(null);
    setFormMode(null);
  }

  function handleOpenPermissions(admin) {
    if (
      !canOpenMutationModal() ||
      admin?.isSuperAdmin ||
      !isValidAdminId(getAdminId(admin))
    ) {
      return;
    }

    dispatch(clearAdminMutationFeedback());
    setCreateSuccessMessage(null);
    setPermissionsAdmin(admin);
  }

  function handleClosePermissions() {
    if (isPermissionsPending || permissionsRequestRef.current) {
      return;
    }

    dispatch(clearAdminMutationFeedback());
    setPermissionsAdmin(null);
  }

  function handleOpenDelete(admin) {
    const adminId = getAdminId(admin);

    if (
      !canOpenMutationModal() ||
      !isValidAdminId(adminId) ||
      adminId === currentAdminId
    ) {
      return;
    }

    dispatch(clearAdminMutationFeedback());
    setCreateSuccessMessage(null);
    setDeleteAdmin(admin);
  }

  function handleCloseDelete() {
    if (isDeletePending || deleteRequestRef.current) {
      return;
    }

    dispatch(clearAdminMutationFeedback());
    setDeleteAdmin(null);
  }

  async function handleCreateAdmin(values) {
    if (isCreatePending || hasPendingMutation || createRequestRef.current) {
      return false;
    }

    const sessionGeneration = selectAdminSessionGeneration(store.getState());
    const requestPromise = dispatch(createAdminThunk(values));
    createRequestRef.current = requestPromise;
    const result = await requestPromise;

    if (
      !claimAdminMutationContinuation({
        isPageMountedRef,
        requestRef: createRequestRef,
        requestPromise,
        sessionGeneration,
        store,
      }) ||
      result?.success !== true
    ) {
      return false;
    }

    setFormMode(null);
    setEditAdmin(null);
    setCreateSuccessMessage(ADMIN_CREATE_SUCCESS_MESSAGE);
    startListRequest(currentQuery, { force: true });
    return true;
  }

  async function handleUpdateAdmin(changes) {
    const adminId = getAdminId(editAdmin);

    if (
      !isValidAdminId(adminId) ||
      isUpdatePending ||
      hasPendingMutation ||
      updateRequestRef.current
    ) {
      return false;
    }

    const sessionGeneration = selectAdminSessionGeneration(store.getState());
    const requestPromise = dispatch(updateAdminThunk({ adminId, changes }));
    updateRequestRef.current = requestPromise;
    const resultAction = await requestPromise;

    if (
      !claimAdminMutationContinuation({
        isPageMountedRef,
        requestRef: updateRequestRef,
        requestPromise,
        sessionGeneration,
        store,
      }) ||
      !updateAdminThunk.fulfilled.match(resultAction) ||
      resultAction.meta.wasRequestOwned !== true
    ) {
      return false;
    }

    setFormMode(null);
    setEditAdmin(null);

    startListRequest(currentQuery, { force: true });
    return true;
  }

  async function handleUpdatePermissions(permissions) {
    const adminId = getAdminId(permissionsAdmin);

    if (
      !isValidAdminId(adminId) ||
      permissionsAdmin?.isSuperAdmin ||
      isPermissionsPending ||
      hasPendingMutation ||
      permissionsRequestRef.current
    ) {
      return false;
    }

    const sessionGeneration = selectAdminSessionGeneration(store.getState());
    const requestPromise = dispatch(
      updateAdminPermissionsThunk({ adminId, permissions })
    );
    permissionsRequestRef.current = requestPromise;
    const resultAction = await requestPromise;

    if (
      !claimAdminMutationContinuation({
        isPageMountedRef,
        requestRef: permissionsRequestRef,
        requestPromise,
        sessionGeneration,
        store,
      }) ||
      !updateAdminPermissionsThunk.fulfilled.match(resultAction)
    ) {
      return false;
    }

    setPermissionsAdmin(null);
    startListRequest(currentQuery, { force: true });
    return true;
  }

  async function handleDeleteAdmin() {
    const adminId = getAdminId(deleteAdmin);

    if (
      !isValidAdminId(adminId) ||
      adminId === currentAdminId ||
      isDeletePending ||
      hasPendingMutation ||
      deleteRequestRef.current
    ) {
      return false;
    }

    const sessionGeneration = selectAdminSessionGeneration(store.getState());
    const requestPromise = dispatch(deleteAdminThunk({ adminId }));
    deleteRequestRef.current = requestPromise;
    const resultAction = await requestPromise;

    if (
      !claimAdminMutationContinuation({
        isPageMountedRef,
        requestRef: deleteRequestRef,
        requestPromise,
        sessionGeneration,
        store,
      }) ||
      !deleteAdminThunk.fulfilled.match(resultAction)
    ) {
      return false;
    }

    setDeleteAdmin(null);
    startListRequest(currentQuery, { force: true });
    return true;
  }

  return (
    <div className="w-full min-w-0 max-w-full">
      <PageBreadcrumb
        pageTitle="Admins"
        description="Manage administrator accounts, dashboard access, and verified backend-supported permissions."
      />

      <div className="-mt-2 mb-5 flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <p className="min-w-0 text-xs text-gray-500 dark:text-gray-400">
          Records: {formatLoadedAt(listLoadedAt)}
        </p>
        <RefreshDataButton
          onClick={handleRefresh}
          isRefreshing={isListPending}
        />
      </div>

      {visibleMutationSuccessMessage && (
        <PageFeedback
          tone="success"
          actionLabel="Dismiss"
          onAction={() => {
            setCreateSuccessMessage(null);
            dispatch(clearAdminMutationFeedback());
          }}
        >
          {visibleMutationSuccessMessage}
        </PageFeedback>
      )}

      {hasRequestedViewError && (
        <PageFeedback
          tone="error"
          actionLabel="Try again"
          onAction={handleRetryList}
        >
          <p className="font-medium">Admin records could not be loaded.</p>
          <p className="mt-1 text-xs">{listError}</p>
        </PageFeedback>
      )}

      {hasStaleListWarning && (
        <PageFeedback actionLabel="Try again" onAction={handleRetryList}>
          <p className="font-medium">Cached Admin records remain visible.</p>
          <p className="mt-1">
            The latest list refresh failed, so the displayed page may be stale.
          </p>
          <p className="mt-1 text-xs">{listError}</p>
        </PageFeedback>
      )}

      {!hasRequestedViewError && (
        <>
          <AdminsToolbar
            searchDraft={searchDraft}
            onSearchDraftChange={setSearchDraft}
            onSearchSubmit={handleSearchSubmit}
            onAddAdmin={handleOpenCreate}
          />

          <AdminsTable
            admins={visibleAdmins}
            currentAdminId={currentAdminId}
            isLoading={isRequestedViewLoading}
            hasSearch={Boolean(appliedSearch)}
            currentPage={visiblePage}
            totalPages={visibleTotalPages}
            totalItems={visibleTotal}
            pageSize={ADMINS_PAGE_SIZE}
            updateTargetId={updateTargetId ?? ""}
            permissionsTargetId={permissionsTargetId ?? ""}
            deleteTargetId={deleteTargetId ?? ""}
            isUpdatePending={isUpdatePending}
            isPermissionsPending={isPermissionsPending}
            isDeletePending={isDeletePending}
            onPageChange={handlePageChange}
            onView={setDetailsAdmin}
            onEdit={handleOpenEdit}
            onPermissions={handleOpenPermissions}
            onDelete={handleOpenDelete}
          />
        </>
      )}

      {detailsAdmin && (
        <AdminDetailsModal
          isOpen
          admin={detailsAdmin}
          isCurrentAdmin={getAdminId(detailsAdmin) === currentAdminId}
          onClose={() => setDetailsAdmin(null)}
        />
      )}

      {formMode && (
        <AdminFormModal
          isOpen
          mode={formMode}
          admin={editAdmin}
          isCurrentAdmin={Boolean(
            editAdmin && getAdminId(editAdmin) === currentAdminId
          )}
          error={
            formMode === "create" ? (createError ?? "") : (updateError ?? "")
          }
          isSubmitting={
            formMode === "create" ? isCreatePending : isUpdatePending
          }
          onClose={handleCloseForm}
          onConfirm={
            formMode === "create" ? handleCreateAdmin : handleUpdateAdmin
          }
        />
      )}

      {permissionsAdmin && (
        <AdminPermissionsModal
          isOpen
          admin={permissionsAdmin}
          error={permissionsError ?? ""}
          isSubmitting={isPermissionsPending}
          onClose={handleClosePermissions}
          onConfirm={handleUpdatePermissions}
        />
      )}

      {deleteAdmin && (
        <DeleteAdminModal
          isOpen
          admin={deleteAdmin}
          error={deleteError ?? ""}
          isSubmitting={isDeletePending}
          onClose={handleCloseDelete}
          onConfirm={handleDeleteAdmin}
        />
      )}
    </div>
  );
}

export default AdminsPage;
