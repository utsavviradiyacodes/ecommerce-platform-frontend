import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { synchronizeCurrentAdmin } from "../auth/authSlice.js";
import { normalizeAuthenticatedAdminData } from "../auth/adminData.js";

import { getApiErrorMessage } from "../../utils/api/getApiErrorMessage.js";
import {
  REQUEST_STATUS,
  clearRequestFeedback,
  createRequestState,
  getRejectedActionErrorMessage,
  isRequestStateOwnedBy,
  resetRequestState,
  setRequestFailed,
  setRequestPending,
  setRequestSucceeded,
} from "../../utils/redux/requestState.js";
import {
  createAdminAccount,
  deleteAdminAccount,
  getAdmins,
  updateAdminAccount,
} from "./adminsApi.js";

export const ADMINS_PAGE_SIZE = 10;

let createAdminRequestSequence = 0;

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizeOptionalBoolean(value) {
  return typeof value === "boolean" ? value : null;
}

function normalizePositiveInteger(value, fallback) {
  const number = Number(value);

  return Number.isInteger(number) && number > 0 ? number : fallback;
}

function normalizeAdminsQuery(options = {}) {
  return {
    page: normalizePositiveInteger(options.page, 1),
    limit: normalizePositiveInteger(options.limit, ADMINS_PAGE_SIZE),
    search: normalizeText(options.search),
  };
}

export function createAdminsQueryKey(options = {}) {
  const query = normalizeAdminsQuery(options);

  return JSON.stringify([query.page, query.limit, query.search || null]);
}

function isRecord(value) {
  return value && typeof value === "object" && !Array.isArray(value);
}

function getEntityId(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  if (typeof value === "string") {
    return normalizeText(value);
  }

  return normalizeText(value?._id ?? value?.id);
}

function getAdminId(argument) {
  if (typeof argument === "string" || typeof argument === "number") {
    return getEntityId(argument);
  }

  return getEntityId(argument?.adminId ?? argument?.admin);
}

function isValidAdminId(value) {
  return /^[0-9a-fA-F]{24}$/.test(value);
}

function normalizeSafePermissions(value) {
  if (!isRecord(value)) {
    return {};
  }

  return Object.entries(value).reduce((permissions, [key, permissionValue]) => {
    const normalizedKey = normalizeText(key);

    if (normalizedKey && typeof permissionValue === "boolean") {
      permissions[normalizedKey] = permissionValue;
    }

    return permissions;
  }, {});
}

function normalizeSafeAdmin(value) {
  if (!isRecord(value)) {
    throw new Error("The Admin list contained an invalid record.");
  }

  return {
    _id: getEntityId(value),
    name: normalizeText(value.name),
    email: normalizeText(value.email),
    phone: normalizeText(value.phone),
    avatar: normalizeText(value.avatar),
    role: normalizeText(value.role) || "admin",
    isSuperAdmin: value.isSuperAdmin === true,
    permissions: normalizeSafePermissions(value.permissions),
    isActive: normalizeOptionalBoolean(value.isActive),
    isVerified: normalizeOptionalBoolean(value.isVerified),
    createdAt: normalizeText(value.createdAt) || null,
    updatedAt: normalizeText(value.updatedAt) || null,
  };
}

function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

function normalizeAdminsResponse(response, query) {
  const data = response?.data;

  if (!isRecord(data)) {
    throw new Error("The Admin list response was invalid.");
  }

  if (!Array.isArray(data.admins)) {
    throw new Error("The Admin list response did not include an admins array.");
  }

  const total = Number(data.total);
  const page = Number(data.page);
  const totalPages = Number(data.totalPages);

  if (
    !isNonNegativeInteger(total) ||
    !Number.isInteger(page) ||
    page < 1 ||
    !isNonNegativeInteger(totalPages)
  ) {
    throw new Error("The Admin list pagination response was invalid.");
  }

  return {
    admins: data.admins.map(normalizeSafeAdmin),
    pagination: {
      total,
      page,
      totalPages,
      limit: query.limit,
    },
  };
}

function normalizeMutationResponse(response, fallbackMessage) {
  return {
    message: normalizeText(response?.message) || fallbackMessage,
    admin: isRecord(response?.data) ? normalizeSafeAdmin(response.data) : null,
  };
}

function createInitialState() {
  return {
    admins: [],
    pagination: {
      total: 0,
      page: 1,
      totalPages: 0,
      limit: ADMINS_PAGE_SIZE,
    },
    requestedQueryKey: "",
    loadedQueryKey: "",
    listLoadedAt: null,
    listIsStale: false,
    updateTargetId: null,
    permissionsTargetId: null,
    deleteTargetId: null,
    mutationSuccessMessage: null,
    requests: {
      list: createRequestState(),
      create: createRequestState(),
      update: createRequestState(),
      permissions: createRequestState(),
      delete: createRequestState(),
    },
  };
}

const initialState = createInitialState();

export const fetchAdminsThunk = createAsyncThunk(
  "admins/fetchAdmins",
  async (options = {}, { rejectWithValue, signal }) => {
    const query = normalizeAdminsQuery(options);
    const queryKey = createAdminsQueryKey(query);

    try {
      const response = await getAdmins({ ...query, signal });

      return {
        ...normalizeAdminsResponse(response, query),
        queryKey,
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Unable to load Admins. Please try again.")
      );
    }
  },
  {
    condition: (options = {}, { getState }) => {
      if (options.force === true) {
        return true;
      }

      const adminsState = getState().admins;
      const queryKey = createAdminsQueryKey(options);

      return !(
        adminsState?.requests.list.status === REQUEST_STATUS.PENDING &&
        adminsState.requestedQueryKey === queryKey
      );
    },
  }
);

function hasPendingAdminMutation(adminsState, adminId) {
  return Boolean(
    (adminsState?.requests.update.status === REQUEST_STATUS.PENDING &&
      adminsState.updateTargetId === adminId) ||
      (adminsState?.requests.permissions.status === REQUEST_STATUS.PENDING &&
        adminsState.permissionsTargetId === adminId) ||
      (adminsState?.requests.delete.status === REQUEST_STATUS.PENDING &&
        adminsState.deleteTargetId === adminId)
  );
}

function isAdminUpdateRequestOwned(getState, requestId) {
  const state = getState();
  const requestState = state.admins?.requests?.update;

  return (
    Boolean(requestState) &&
    isRequestStateOwnedBy(requestState, requestId)
  );
}

function canSynchronizeUpdatedCurrentAdmin(getState, updatedAdmin) {
  const state = getState();
  const currentAdminId = getEntityId(state.auth?.admin);
  const updatedAdminId = getEntityId(updatedAdmin);

  return (
    Boolean(currentAdminId) &&
    currentAdminId === updatedAdminId
  );
}

function normalizeCurrentAdminUpdate(getState, requestedAdminId, value) {
  const currentAdminId = getEntityId(getState().auth?.admin);

  if (!currentAdminId || currentAdminId !== requestedAdminId) {
    return null;
  }

  const normalizedAdmin = normalizeAuthenticatedAdminData(value);

  if (!canSynchronizeUpdatedCurrentAdmin(getState, normalizedAdmin)) {
    throw new Error("The current Admin update response was invalid.");
  }

  return normalizedAdmin;
}

export const updateAdminThunk = createAsyncThunk(
  "admins/updateAdmin",
  async (
    argument,
    {
      dispatch,
      fulfillWithValue,
      getState,
      rejectWithValue,
      requestId,
      signal,
    }
  ) => {
    const adminId = getAdminId(argument);

    try {
      if (!isValidAdminId(adminId)) {
        throw new Error("A valid Admin ID is required.");
      }

      const response = await updateAdminAccount({
        adminId,
        changes: argument?.changes,
        signal,
      });
      const wasRequestOwned = isAdminUpdateRequestOwned(getState, requestId);
      const authenticatedCurrentAdmin = wasRequestOwned
        ? normalizeCurrentAdminUpdate(getState, adminId, response?.data)
        : null;
      const result = normalizeMutationResponse(
        response,
        "Admin updated successfully."
      );

      if (authenticatedCurrentAdmin) {
        dispatch(synchronizeCurrentAdmin(authenticatedCurrentAdmin));
      }

      return fulfillWithValue(result, { wasRequestOwned });
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Unable to update the Admin. Please try again.")
      );
    }
  },
  {
    condition: (argument, { getState }) => {
      const adminId = getAdminId(argument);
      const adminsState = getState().admins;

      return !hasPendingAdminMutation(adminsState, adminId);
    },
  }
);

export const updateAdminPermissionsThunk = createAsyncThunk(
  "admins/updateAdminPermissions",
  async (argument, { rejectWithValue, signal }) => {
    const adminId = getAdminId(argument);

    try {
      if (!isValidAdminId(adminId)) {
        throw new Error("A valid Admin ID is required.");
      }

      const response = await updateAdminAccount({
        adminId,
        changes: { permissions: argument?.permissions },
        signal,
      });

      return normalizeMutationResponse(
        response,
        "Admin permissions updated successfully."
      );
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Unable to update Admin permissions. Please try again."
        )
      );
    }
  },
  {
    condition: (argument, { getState }) => {
      const adminId = getAdminId(argument);
      const adminsState = getState().admins;

      return !hasPendingAdminMutation(adminsState, adminId);
    },
  }
);

export const deleteAdminThunk = createAsyncThunk(
  "admins/deleteAdmin",
  async (argument, { rejectWithValue, signal }) => {
    const adminId = getAdminId(argument);

    try {
      if (!isValidAdminId(adminId)) {
        throw new Error("A valid Admin ID is required.");
      }

      const response = await deleteAdminAccount(adminId, { signal });

      return normalizeMutationResponse(response, "Admin deleted successfully.");
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Unable to delete the Admin. Please try again.")
      );
    }
  },
  {
    condition: (argument, { getState }) => {
      const adminId = getAdminId(argument);
      const adminsState = getState().admins;

      return !hasPendingAdminMutation(adminsState, adminId);
    },
  }
);

const adminsSlice = createSlice({
  name: "admins",
  initialState,
  reducers: {
    adminCreateStarted(state, action) {
      state.mutationSuccessMessage = null;
      setRequestPending(state.requests.create, action.payload.requestId);
    },
    adminCreateSucceeded(state, action) {
      if (
        !isRequestStateOwnedBy(
          state.requests.create,
          action.payload.requestId
        )
      ) {
        return;
      }

      state.mutationSuccessMessage = action.payload.message;
      setRequestSucceeded(state.requests.create);
    },
    adminCreateFailed(state, action) {
      if (
        !isRequestStateOwnedBy(
          state.requests.create,
          action.payload.requestId
        )
      ) {
        return;
      }

      setRequestFailed(state.requests.create, action.payload.error);
    },
    clearAdminMutationFeedback(state) {
      clearRequestFeedback(state.requests.create);
      clearRequestFeedback(state.requests.update);
      clearRequestFeedback(state.requests.permissions);
      clearRequestFeedback(state.requests.delete);
      state.mutationSuccessMessage = null;
    },
    resetAdminsState() {
      return createInitialState();
    },
  },
  selectors: {
    selectAdmins: (sliceState) => sliceState.admins,
    selectAdminsPagination: (sliceState) => sliceState.pagination,
    selectAdminsRequestedQueryKey: (sliceState) =>
      sliceState.requestedQueryKey,
    selectAdminsLoadedQueryKey: (sliceState) => sliceState.loadedQueryKey,
    selectAdminsListLoadedAt: (sliceState) => sliceState.listLoadedAt,
    selectAdminsListIsStale: (sliceState) => sliceState.listIsStale,
    selectAdminsListStatus: (sliceState) => sliceState.requests.list.status,
    selectAdminsListError: (sliceState) => sliceState.requests.list.error,
    selectIsAdminsListPending: (sliceState) =>
      sliceState.requests.list.status === REQUEST_STATUS.PENDING,
    selectAdminCreateError: (sliceState) => sliceState.requests.create.error,
    selectIsAdminCreatePending: (sliceState) =>
      sliceState.requests.create.status === REQUEST_STATUS.PENDING,
    selectAdminUpdateError: (sliceState) => sliceState.requests.update.error,
    selectIsAdminUpdatePending: (sliceState) =>
      sliceState.requests.update.status === REQUEST_STATUS.PENDING,
    selectAdminUpdateTargetId: (sliceState) => sliceState.updateTargetId,
    selectAdminPermissionsError: (sliceState) =>
      sliceState.requests.permissions.error,
    selectIsAdminPermissionsPending: (sliceState) =>
      sliceState.requests.permissions.status === REQUEST_STATUS.PENDING,
    selectAdminPermissionsTargetId: (sliceState) =>
      sliceState.permissionsTargetId,
    selectAdminDeleteError: (sliceState) => sliceState.requests.delete.error,
    selectIsAdminDeletePending: (sliceState) =>
      sliceState.requests.delete.status === REQUEST_STATUS.PENDING,
    selectAdminDeleteTargetId: (sliceState) => sliceState.deleteTargetId,
    selectAdminMutationSuccessMessage: (sliceState) =>
      sliceState.mutationSuccessMessage,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAdminsThunk.pending, (state, action) => {
        state.requestedQueryKey = createAdminsQueryKey(action.meta.arg);
        state.listIsStale = false;
        setRequestPending(state.requests.list, action.meta.requestId);
      })
      .addCase(fetchAdminsThunk.fulfilled, (state, action) => {
        if (!isRequestStateOwnedBy(state.requests.list, action.meta.requestId)) {
          return;
        }

        state.admins = action.payload.admins;
        state.pagination = action.payload.pagination;
        state.loadedQueryKey = action.payload.queryKey;
        state.listLoadedAt = new Date().toISOString();
        state.listIsStale = false;
        setRequestSucceeded(state.requests.list);
      })
      .addCase(fetchAdminsThunk.rejected, (state, action) => {
        if (!isRequestStateOwnedBy(state.requests.list, action.meta.requestId)) {
          return;
        }

        if (action.meta.aborted || action.meta.condition) {
          resetRequestState(state.requests.list);
          return;
        }

        state.listIsStale = state.loadedQueryKey === state.requestedQueryKey;
        setRequestFailed(
          state.requests.list,
          getRejectedActionErrorMessage(
            action,
            "Unable to load Admins. Please try again."
          )
        );
      })
      .addCase(updateAdminThunk.pending, (state, action) => {
        state.updateTargetId = getAdminId(action.meta.arg);
        state.mutationSuccessMessage = null;
        setRequestPending(state.requests.update, action.meta.requestId);
      })
      .addCase(updateAdminThunk.fulfilled, (state, action) => {
        if (!isRequestStateOwnedBy(state.requests.update, action.meta.requestId)) {
          return;
        }

        state.updateTargetId = null;
        state.mutationSuccessMessage = action.payload.message;
        setRequestSucceeded(state.requests.update);
      })
      .addCase(updateAdminThunk.rejected, (state, action) => {
        if (!isRequestStateOwnedBy(state.requests.update, action.meta.requestId)) {
          return;
        }

        state.updateTargetId = null;

        if (action.meta.aborted || action.meta.condition) {
          resetRequestState(state.requests.update);
          return;
        }

        setRequestFailed(
          state.requests.update,
          getRejectedActionErrorMessage(
            action,
            "Unable to update the Admin. Please try again."
          )
        );
      })
      .addCase(updateAdminPermissionsThunk.pending, (state, action) => {
        state.permissionsTargetId = getAdminId(action.meta.arg);
        state.mutationSuccessMessage = null;
        setRequestPending(state.requests.permissions, action.meta.requestId);
      })
      .addCase(updateAdminPermissionsThunk.fulfilled, (state, action) => {
        if (
          !isRequestStateOwnedBy(
            state.requests.permissions,
            action.meta.requestId
          )
        ) {
          return;
        }

        state.permissionsTargetId = null;
        state.mutationSuccessMessage = action.payload.message;
        setRequestSucceeded(state.requests.permissions);
      })
      .addCase(updateAdminPermissionsThunk.rejected, (state, action) => {
        if (
          !isRequestStateOwnedBy(
            state.requests.permissions,
            action.meta.requestId
          )
        ) {
          return;
        }

        state.permissionsTargetId = null;

        if (action.meta.aborted || action.meta.condition) {
          resetRequestState(state.requests.permissions);
          return;
        }

        setRequestFailed(
          state.requests.permissions,
          getRejectedActionErrorMessage(
            action,
            "Unable to update Admin permissions. Please try again."
          )
        );
      })
      .addCase(deleteAdminThunk.pending, (state, action) => {
        state.deleteTargetId = getAdminId(action.meta.arg);
        state.mutationSuccessMessage = null;
        setRequestPending(state.requests.delete, action.meta.requestId);
      })
      .addCase(deleteAdminThunk.fulfilled, (state, action) => {
        if (!isRequestStateOwnedBy(state.requests.delete, action.meta.requestId)) {
          return;
        }

        state.deleteTargetId = null;
        state.mutationSuccessMessage = action.payload.message;
        setRequestSucceeded(state.requests.delete);
      })
      .addCase(deleteAdminThunk.rejected, (state, action) => {
        if (!isRequestStateOwnedBy(state.requests.delete, action.meta.requestId)) {
          return;
        }

        state.deleteTargetId = null;

        if (action.meta.aborted || action.meta.condition) {
          resetRequestState(state.requests.delete);
          return;
        }

        setRequestFailed(
          state.requests.delete,
          getRejectedActionErrorMessage(
            action,
            "Unable to delete the Admin. Please try again."
          )
        );
      });
  },
});

export const {
  adminCreateStarted,
  adminCreateSucceeded,
  adminCreateFailed,
  clearAdminMutationFeedback,
  resetAdminsState,
} = adminsSlice.actions;

export const {
  selectAdmins,
  selectAdminsPagination,
  selectAdminsRequestedQueryKey,
  selectAdminsLoadedQueryKey,
  selectAdminsListLoadedAt,
  selectAdminsListIsStale,
  selectAdminsListStatus,
  selectAdminsListError,
  selectIsAdminsListPending,
  selectAdminCreateError,
  selectIsAdminCreatePending,
  selectAdminUpdateError,
  selectIsAdminUpdatePending,
  selectAdminUpdateTargetId,
  selectAdminPermissionsError,
  selectIsAdminPermissionsPending,
  selectAdminPermissionsTargetId,
  selectAdminDeleteError,
  selectIsAdminDeletePending,
  selectAdminDeleteTargetId,
  selectAdminMutationSuccessMessage,
} = adminsSlice.selectors;

export function createAdminThunk(values) {
  return async (dispatch, getState) => {
    if (
      getState().admins?.requests.create.status === REQUEST_STATUS.PENDING
    ) {
      return { success: false, skipped: true };
    }

    const requestId = `create-admin-${Date.now()}-${++createAdminRequestSequence}`;
    dispatch(adminCreateStarted({ requestId }));

    try {
      const response = await createAdminAccount(values);
      const message =
        normalizeText(response?.message) || "Admin created successfully.";

      dispatch(adminCreateSucceeded({ requestId, message }));

      return { success: true, message };
    } catch (error) {
      const errorMessage = getApiErrorMessage(
        error,
        "Unable to create the Admin. Please try again."
      );

      dispatch(adminCreateFailed({ requestId, error: errorMessage }));

      return { success: false, error: errorMessage };
    }
  };
}

export default adminsSlice.reducer;
