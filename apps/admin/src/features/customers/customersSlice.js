import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

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
  activateCustomer,
  deactivateCustomer,
  getCustomers,
} from "./customersApi.js";

export const CUSTOMERS_PAGE_SIZE = 10;

const UNEXPECTED_CUSTOMER_RESPONSE_MESSAGE =
  "Received an unexpected Customer list response.";

const pendingCustomersListRequests = new Map();
let customersListRequestSequence = 0;

function toPositiveInteger(value, fallback) {
  const number = Number(value);

  return Number.isInteger(number) && number > 0 ? number : fallback;
}

function normalizeActiveFilter(value) {
  if (value === true || value === false) {
    return value;
  }

  if (value === "true") {
    return true;
  }

  if (value === "false") {
    return false;
  }

  return undefined;
}

function normalizeCustomersQuery(options = {}) {
  return {
    page: toPositiveInteger(options.page, 1),
    limit: toPositiveInteger(options.limit, CUSTOMERS_PAGE_SIZE),
    search: typeof options.search === "string" ? options.search.trim() : "",
    isActive: normalizeActiveFilter(options.isActive),
  };
}

export function createCustomersQueryKey(options = {}) {
  const query = normalizeCustomersQuery(options);

  return JSON.stringify([
    query.page,
    query.limit,
    query.search,
    query.isActive ?? null,
  ]);
}

function resolveCustomersQueryKey(options = {}) {
  return typeof options.queryKey === "string" && options.queryKey
    ? options.queryKey
    : createCustomersQueryKey(options);
}

function normalizeCustomerId(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return typeof value === "string" ? value.trim() : "";
}

function getCustomerId(argument) {
  if (typeof argument === "string" || typeof argument === "number") {
    return normalizeCustomerId(argument);
  }

  return normalizeCustomerId(
    argument?.customerId ?? argument?._id ?? argument?.id
  );
}

function getTargetActiveStatus(argument) {
  return argument?.nextIsActive === true || argument?.nextIsActive === false
    ? argument.nextIsActive
    : null;
}

function isNonArrayObject(value) {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function isUsableText(value) {
  return typeof value === "string" && Boolean(value.trim());
}

function parseSupportedInteger(value, { positive = false } = {}) {
  const normalizedValue =
    typeof value === "number"
      ? value
      : typeof value === "string" && /^\d+$/.test(value.trim())
        ? Number(value.trim())
        : Number.NaN;

  if (
    !Number.isFinite(normalizedValue) ||
    !Number.isInteger(normalizedValue) ||
    (positive ? normalizedValue < 1 : normalizedValue < 0)
  ) {
    return null;
  }

  return normalizedValue;
}

function isUsableCustomer(value) {
  return (
    isNonArrayObject(value) &&
    Boolean(getCustomerId(value)) &&
    isUsableText(value.name) &&
    isUsableText(value.email)
  );
}

function normalizeCustomersListResponse(response) {
  const data = response?.data;
  const customers = data?.customers;
  const total = parseSupportedInteger(data?.total);
  const page = parseSupportedInteger(data?.page, { positive: true });
  const totalPages = parseSupportedInteger(data?.totalPages);

  if (
    response?.success !== true ||
    !isNonArrayObject(data) ||
    !Array.isArray(customers) ||
    !customers.every(isUsableCustomer) ||
    total === null ||
    page === null ||
    totalPages === null
  ) {
    throw new Error(UNEXPECTED_CUSTOMER_RESPONSE_MESSAGE);
  }

  return {
    customers,
    total,
    page,
    totalPages,
  };
}

function createInitialState() {
  return {
    customers: [],
    total: 0,
    page: 1,
    totalPages: 1,
    requestedQueryKey: "",
    loadedQueryKey: "",
    pendingListRequestIdsByQuery: {},
    listRefreshRequirement: {
      afterSequence: null,
      version: 0,
    },
    statusTargetId: null,
    requests: {
      list: createRequestState(),
      status: createRequestState(),
    },
  };
}

const initialState = createInitialState();

export const fetchCustomersThunk = createAsyncThunk(
  "customers/fetchCustomers",
  async (options = {}, { rejectWithValue }) => {
    const query = normalizeCustomersQuery(options);
    const queryKey = resolveCustomersQueryKey(options);

    try {
      const response = await getCustomers(query);
      return {
        normalizedList: normalizeCustomersListResponse(response),
        response,
        query,
        queryKey,
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Unable to load customers. Please try again.")
      );
    }
  },
  {
    condition: (options = {}, { getState }) => {
      const customersState = getState().customers;
      const queryKey = resolveCustomersQueryKey(options);

      return !customersState?.pendingListRequestIdsByQuery?.[queryKey];
    },
  }
);

export const changeCustomerStatusThunk = createAsyncThunk(
  "customers/changeCustomerStatus",
  async (argument, { rejectWithValue }) => {
    const customerId = getCustomerId(argument);
    const nextIsActive = getTargetActiveStatus(argument);

    try {
      if (!customerId) {
        throw new Error("Customer ID is required.");
      }

      if (nextIsActive === null) {
        throw new Error("The target Customer status is required.");
      }

      return nextIsActive
        ? await activateCustomer(customerId)
        : await deactivateCustomer(customerId);
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          nextIsActive
            ? "Unable to reactivate customer. Please try again."
            : "Unable to deactivate customer. Please try again."
        )
      );
    }
  },
  {
    condition: (_, { getState }) =>
      getState().customers?.requests.status.status !== REQUEST_STATUS.PENDING,
  }
);

const customersSlice = createSlice({
  name: "customers",
  initialState,
  reducers: {
    setCustomersRequestedQuery(state, action) {
      const queryKey = action.payload?.queryKey;
      const requestId = action.payload?.requestId;

      if (typeof queryKey !== "string" || !queryKey) {
        return;
      }

      state.requestedQueryKey = queryKey;

      if (
        requestId &&
        state.pendingListRequestIdsByQuery[queryKey] === requestId
      ) {
        setRequestPending(state.requests.list, requestId);
      }
    },

    requestCustomersListRefresh(state, action) {
      const afterSequence = Number(action.payload);

      state.listRefreshRequirement.afterSequence =
        Number.isInteger(afterSequence) && afterSequence >= 0
          ? afterSequence
          : 0;
      state.listRefreshRequirement.version += 1;
    },

    clearCustomersListRefreshRequirement(state, action) {
      if (state.listRefreshRequirement.version === action.payload) {
        state.listRefreshRequirement.afterSequence = null;
      }
    },

    clearCustomersListRequestFeedback(state) {
      clearRequestFeedback(state.requests.list);
    },

    clearCustomerStatusRequestFeedback(state) {
      clearRequestFeedback(state.requests.status);
    },

    resetCustomerMutationRequestStates(state) {
      resetRequestState(state.requests.status);
      state.statusTargetId = null;
    },

    resetCustomersState() {
      return createInitialState();
    },
  },
  selectors: {
    selectCustomers: (sliceState) => sliceState.customers,
    selectCustomersTotal: (sliceState) => sliceState.total,
    selectCustomersPage: (sliceState) => sliceState.page,
    selectCustomersTotalPages: (sliceState) => sliceState.totalPages,
    selectCustomersRequestedQueryKey: (sliceState) =>
      sliceState.requestedQueryKey,
    selectCustomersLoadedQueryKey: (sliceState) => sliceState.loadedQueryKey,
    selectCustomersPendingListRequestIdsByQuery: (sliceState) =>
      sliceState.pendingListRequestIdsByQuery,
    selectCustomersListRefreshRequirement: (sliceState) =>
      sliceState.listRefreshRequirement,
    selectCustomersListStatus: (sliceState) =>
      sliceState.requests.list.status,
    selectIsCustomersListPending: (sliceState) =>
      sliceState.requests.list.status === REQUEST_STATUS.PENDING,
    selectCustomersListError: (sliceState) => sliceState.requests.list.error,
    selectIsCustomerStatusPending: (sliceState) =>
      sliceState.requests.status.status === REQUEST_STATUS.PENDING,
    selectCustomerStatusError: (sliceState) =>
      sliceState.requests.status.error,
    selectCustomerStatusSuccessMessage: (sliceState) =>
      sliceState.requests.status.successMessage,
    selectCustomerStatusTargetId: (sliceState) => sliceState.statusTargetId,
  },
  extraReducers: (builder) => {
    builder
      // -------------------- Fetch Customers --------------------
      .addCase(fetchCustomersThunk.pending, (state, action) => {
        const queryKey = resolveCustomersQueryKey(action.meta.arg);

        state.requestedQueryKey = queryKey;
        state.pendingListRequestIdsByQuery[queryKey] = action.meta.requestId;
        setRequestPending(state.requests.list, action.meta.requestId);
      })
      .addCase(fetchCustomersThunk.fulfilled, (state, action) => {
        if (
          state.pendingListRequestIdsByQuery[action.payload.queryKey] ===
          action.meta.requestId
        ) {
          delete state.pendingListRequestIdsByQuery[action.payload.queryKey];
        }

        if (!isRequestStateOwnedBy(state.requests.list, action.meta.requestId)) {
          return;
        }

        const normalizedList = action.payload.normalizedList;

        state.customers = normalizedList.customers;
        state.total = normalizedList.total;
        state.page = normalizedList.page;
        state.totalPages = normalizedList.totalPages;
        state.loadedQueryKey = action.payload.queryKey;
        setRequestSucceeded(state.requests.list);
      })
      .addCase(fetchCustomersThunk.rejected, (state, action) => {
        const queryKey = resolveCustomersQueryKey(action.meta.arg);

        if (
          state.pendingListRequestIdsByQuery[queryKey] === action.meta.requestId
        ) {
          delete state.pendingListRequestIdsByQuery[queryKey];
        }

        if (!isRequestStateOwnedBy(state.requests.list, action.meta.requestId)) {
          return;
        }

        setRequestFailed(
          state.requests.list,
          getRejectedActionErrorMessage(
            action,
            "Unable to load customers. Please try again."
          )
        );
      })

      // -------------------- Change Customer Status --------------------
      .addCase(changeCustomerStatusThunk.pending, (state, action) => {
        state.statusTargetId = getCustomerId(action.meta.arg);
        setRequestPending(state.requests.status, action.meta.requestId);
      })
      .addCase(changeCustomerStatusThunk.fulfilled, (state, action) => {
        if (
          !isRequestStateOwnedBy(state.requests.status, action.meta.requestId)
        ) {
          return;
        }

        state.statusTargetId = null;
        setRequestSucceeded(
          state.requests.status,
          action.payload?.message || "Customer status changed successfully"
        );
      })
      .addCase(changeCustomerStatusThunk.rejected, (state, action) => {
        if (
          !isRequestStateOwnedBy(state.requests.status, action.meta.requestId)
        ) {
          return;
        }

        state.statusTargetId = null;
        setRequestFailed(
          state.requests.status,
          getRejectedActionErrorMessage(
            action,
            "Unable to change Customer status. Please try again."
          )
        );
      });
  },
});

export const {
  setCustomersRequestedQuery,
  requestCustomersListRefresh,
  clearCustomersListRefreshRequirement,
  clearCustomersListRequestFeedback,
  clearCustomerStatusRequestFeedback,
  resetCustomerMutationRequestStates,
  resetCustomersState,
} = customersSlice.actions;

export const {
  selectCustomers,
  selectCustomersTotal,
  selectCustomersPage,
  selectCustomersTotalPages,
  selectCustomersRequestedQueryKey,
  selectCustomersLoadedQueryKey,
  selectCustomersPendingListRequestIdsByQuery,
  selectCustomersListRefreshRequirement,
  selectCustomersListStatus,
  selectIsCustomersListPending,
  selectCustomersListError,
  selectIsCustomerStatusPending,
  selectCustomerStatusError,
  selectCustomerStatusSuccessMessage,
  selectCustomerStatusTargetId,
} = customersSlice.selectors;

export function getCustomersListRequestSequence() {
  return customersListRequestSequence;
}

export function getPendingCustomersListRequest(options = {}) {
  return (
    pendingCustomersListRequests.get(resolveCustomersQueryKey(options)) ?? null
  );
}

export function abortAndClearPendingCustomersListRequests() {
  const pendingRequests = Array.from(pendingCustomersListRequests.values());

  pendingCustomersListRequests.clear();
  pendingRequests.forEach((request) => request.promise?.abort?.());
}

export function requestCustomersListThunk(options = {}) {
  return (dispatch) => {
    const queryKey = resolveCustomersQueryKey(options);
    const pendingRequest = pendingCustomersListRequests.get(queryKey);

    dispatch(
      setCustomersRequestedQuery({
        queryKey,
        requestId: pendingRequest?.requestId ?? null,
      })
    );

    if (pendingRequest) {
      return pendingRequest.promise;
    }

    const sequence = ++customersListRequestSequence;
    const requestPromise = dispatch(
      fetchCustomersThunk({ ...options, queryKey })
    );
    const requestRecord = {
      promise: requestPromise,
      requestId: requestPromise.requestId,
      sequence,
    };

    pendingCustomersListRequests.set(queryKey, requestRecord);

    requestPromise.finally(() => {
      if (pendingCustomersListRequests.get(queryKey) === requestRecord) {
        pendingCustomersListRequests.delete(queryKey);
      }
    });

    return requestPromise;
  };
}

export default customersSlice.reducer;
