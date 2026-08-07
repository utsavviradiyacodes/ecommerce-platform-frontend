import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { getApiErrorMessage } from "../../utils/api/getApiErrorMessage.js";
import {
  REQUEST_STATUS,
  createRequestState,
  getRejectedActionErrorMessage,
  isRequestStateOwnedBy,
  resetRequestState,
  setRequestFailed,
  setRequestPending,
  setRequestSucceeded,
} from "../../utils/redux/requestState.js";
import {
  getOrderDetails,
  getOrders,
  getOrderStats,
} from "./ordersApi.js";

export const ORDERS_PAGE_SIZE = 10;

export const ORDER_STATUS_KEYS = [
  "placed",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

const ORDER_STATUSES = new Set(ORDER_STATUS_KEYS);
const PAYMENT_STATUSES = new Set(["pending", "paid", "failed", "refunded"]);
const PAYMENT_METHODS = new Set(["online", "upi"]);

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toPositiveInteger(value, fallback) {
  const number = Number(value);

  return Number.isInteger(number) && number > 0 ? number : fallback;
}

function normalizeFilter(value, allowedValues) {
  const normalizedValue = normalizeText(value).toLowerCase();

  return allowedValues.has(normalizedValue) ? normalizedValue : "";
}

function normalizeOrdersQuery(options = {}) {
  return {
    page: toPositiveInteger(options.page, 1),
    limit: toPositiveInteger(options.limit, ORDERS_PAGE_SIZE),
    orderStatus: normalizeFilter(options.orderStatus, ORDER_STATUSES),
    paymentStatus: normalizeFilter(options.paymentStatus, PAYMENT_STATUSES),
    paymentMethod: normalizeFilter(options.paymentMethod, PAYMENT_METHODS),
  };
}

export function createOrdersQueryKey(options = {}) {
  const query = normalizeOrdersQuery(options);

  return JSON.stringify([
    query.page,
    query.limit,
    query.orderStatus || null,
    query.paymentStatus || null,
    query.paymentMethod || null,
  ]);
}

function normalizeEntityId(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return normalizeText(value);
}

function getEntityId(entity) {
  if (typeof entity === "string" || typeof entity === "number") {
    return normalizeEntityId(entity);
  }

  return normalizeEntityId(entity?._id ?? entity?.id);
}

function getOrderId(argument) {
  if (typeof argument === "string" || typeof argument === "number") {
    return normalizeEntityId(argument);
  }

  return getEntityId(argument?.orderId ?? argument);
}

function isValidOrderId(value) {
  return /^[0-9a-fA-F]{24}$/.test(value);
}

function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

function normalizeOrdersResponse(response, query) {
  const data = response?.data;

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("The Order list response was invalid.");
  }

  if (!Array.isArray(data.orders)) {
    throw new Error("The Order list response did not include an orders array.");
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
    throw new Error("The Order list pagination response was invalid.");
  }

  return {
    orders: data.orders,
    pagination: {
      total,
      page,
      totalPages,
      limit: query.limit,
    },
  };
}

function normalizeOrderStatsResponse(response) {
  const data = response?.data;

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("The Order statistics response was invalid.");
  }

  return data;
}

function createInitialState() {
  return {
    orders: [],
    pagination: {
      total: 0,
      page: 1,
      totalPages: 0,
      limit: ORDERS_PAGE_SIZE,
    },
    requestedQueryKey: "",
    loadedQueryKey: "",
    listLoadedAt: null,
    listIsStale: false,
    stats: null,
    statsLoadedAt: null,
    statsIsStale: false,
    details: null,
    detailsOrderId: null,
    requests: {
      list: createRequestState(),
      stats: createRequestState(),
      details: createRequestState(),
    },
  };
}

const initialState = createInitialState();

export const fetchOrdersThunk = createAsyncThunk(
  "orders/fetchOrders",
  async (options = {}, { rejectWithValue, signal }) => {
    const query = normalizeOrdersQuery(options);
    const queryKey = createOrdersQueryKey(query);

    try {
      const response = await getOrders({ ...query, signal });

      return {
        ...normalizeOrdersResponse(response, query),
        queryKey,
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Unable to load Orders. Please try again.")
      );
    }
  },
  {
    condition: (options = {}, { getState }) => {
      if (options.force === true) {
        return true;
      }

      const ordersState = getState().orders;
      const queryKey = createOrdersQueryKey(options);

      return !(
        ordersState?.requests.list.status === REQUEST_STATUS.PENDING &&
        ordersState.requestedQueryKey === queryKey
      );
    },
  }
);

export const fetchOrderStatsThunk = createAsyncThunk(
  "orders/fetchStats",
  async (_options, { rejectWithValue, signal }) => {
    try {
      const response = await getOrderStats({ signal });

      return normalizeOrderStatsResponse(response);
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Unable to load Order statistics. Please try again."
        )
      );
    }
  },
  {
    condition: (options = {}, { getState }) =>
      options.force === true ||
      getState().orders?.requests.stats.status !== REQUEST_STATUS.PENDING,
  }
);

export const fetchOrderDetailsThunk = createAsyncThunk(
  "orders/fetchDetails",
  async (argument, { rejectWithValue, signal }) => {
    const orderId = getOrderId(argument);

    try {
      if (!isValidOrderId(orderId)) {
        throw new Error("A valid Order ID is required.");
      }

      const response = await getOrderDetails(orderId, { signal });
      const order = response?.data;

      if (
        !order ||
        typeof order !== "object" ||
        Array.isArray(order) ||
        getEntityId(order).toLowerCase() !== orderId.toLowerCase()
      ) {
        throw new Error("The Order details response was invalid.");
      }

      return { order, orderId };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Unable to load full Order details. Please try again."
        )
      );
    }
  },
  {
    condition: (argument, { getState }) => {
      const ordersState = getState().orders;
      const orderId = getOrderId(argument);

      return !(
        ordersState?.requests.details.status === REQUEST_STATUS.PENDING &&
        ordersState.detailsOrderId === orderId
      );
    },
  }
);

const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    clearOrderDetails(state) {
      state.details = null;
      state.detailsOrderId = null;
      resetRequestState(state.requests.details);
    },
    resetOrdersState() {
      return createInitialState();
    },
  },
  selectors: {
    selectOrders: (sliceState) => sliceState.orders,
    selectOrdersPagination: (sliceState) => sliceState.pagination,
    selectOrdersRequestedQueryKey: (sliceState) =>
      sliceState.requestedQueryKey,
    selectOrdersLoadedQueryKey: (sliceState) => sliceState.loadedQueryKey,
    selectOrdersListLoadedAt: (sliceState) => sliceState.listLoadedAt,
    selectOrdersListIsStale: (sliceState) => sliceState.listIsStale,
    selectOrdersListStatus: (sliceState) => sliceState.requests.list.status,
    selectOrdersListError: (sliceState) => sliceState.requests.list.error,
    selectIsOrdersListPending: (sliceState) =>
      sliceState.requests.list.status === REQUEST_STATUS.PENDING,
    selectOrderStats: (sliceState) => sliceState.stats,
    selectOrderStatsLoadedAt: (sliceState) => sliceState.statsLoadedAt,
    selectOrderStatsIsStale: (sliceState) => sliceState.statsIsStale,
    selectOrderStatsStatus: (sliceState) => sliceState.requests.stats.status,
    selectOrderStatsError: (sliceState) => sliceState.requests.stats.error,
    selectIsOrderStatsPending: (sliceState) =>
      sliceState.requests.stats.status === REQUEST_STATUS.PENDING,
    selectOrderDetails: (sliceState) => sliceState.details,
    selectOrderDetailsOrderId: (sliceState) => sliceState.detailsOrderId,
    selectOrderDetailsStatus: (sliceState) =>
      sliceState.requests.details.status,
    selectOrderDetailsError: (sliceState) =>
      sliceState.requests.details.error,
    selectIsOrderDetailsPending: (sliceState) =>
      sliceState.requests.details.status === REQUEST_STATUS.PENDING,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchOrdersThunk.pending, (state, action) => {
        state.requestedQueryKey = createOrdersQueryKey(action.meta.arg);
        state.listIsStale = false;
        setRequestPending(state.requests.list, action.meta.requestId);
      })
      .addCase(fetchOrdersThunk.fulfilled, (state, action) => {
        if (!isRequestStateOwnedBy(state.requests.list, action.meta.requestId)) {
          return;
        }

        state.orders = action.payload.orders;
        state.pagination = action.payload.pagination;
        state.loadedQueryKey = action.payload.queryKey;
        state.listLoadedAt = new Date().toISOString();
        state.listIsStale = false;
        setRequestSucceeded(state.requests.list);
      })
      .addCase(fetchOrdersThunk.rejected, (state, action) => {
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
            "Unable to load Orders. Please try again."
          )
        );
      })
      .addCase(fetchOrderStatsThunk.pending, (state, action) => {
        state.statsIsStale = false;
        setRequestPending(state.requests.stats, action.meta.requestId);
      })
      .addCase(fetchOrderStatsThunk.fulfilled, (state, action) => {
        if (!isRequestStateOwnedBy(state.requests.stats, action.meta.requestId)) {
          return;
        }

        state.stats = action.payload;
        state.statsLoadedAt = new Date().toISOString();
        state.statsIsStale = false;
        setRequestSucceeded(state.requests.stats);
      })
      .addCase(fetchOrderStatsThunk.rejected, (state, action) => {
        if (!isRequestStateOwnedBy(state.requests.stats, action.meta.requestId)) {
          return;
        }

        if (action.meta.aborted || action.meta.condition) {
          resetRequestState(state.requests.stats);
          return;
        }

        state.statsIsStale = Boolean(state.statsLoadedAt);
        setRequestFailed(
          state.requests.stats,
          getRejectedActionErrorMessage(
            action,
            "Unable to load Order statistics. Please try again."
          )
        );
      })
      .addCase(fetchOrderDetailsThunk.pending, (state, action) => {
        state.details = null;
        state.detailsOrderId = getOrderId(action.meta.arg);
        setRequestPending(state.requests.details, action.meta.requestId);
      })
      .addCase(fetchOrderDetailsThunk.fulfilled, (state, action) => {
        if (
          !isRequestStateOwnedBy(
            state.requests.details,
            action.meta.requestId
          )
        ) {
          return;
        }

        state.details = action.payload.order;
        state.detailsOrderId = action.payload.orderId;
        setRequestSucceeded(state.requests.details);
      })
      .addCase(fetchOrderDetailsThunk.rejected, (state, action) => {
        if (
          !isRequestStateOwnedBy(
            state.requests.details,
            action.meta.requestId
          )
        ) {
          return;
        }

        if (action.meta.aborted || action.meta.condition) {
          resetRequestState(state.requests.details);
          return;
        }

        state.details = null;
        setRequestFailed(
          state.requests.details,
          getRejectedActionErrorMessage(
            action,
            "Unable to load full Order details. Please try again."
          )
        );
      });
  },
});

export const { clearOrderDetails, resetOrdersState } = ordersSlice.actions;

export const {
  selectOrders,
  selectOrdersPagination,
  selectOrdersRequestedQueryKey,
  selectOrdersLoadedQueryKey,
  selectOrdersListLoadedAt,
  selectOrdersListIsStale,
  selectOrdersListStatus,
  selectOrdersListError,
  selectIsOrdersListPending,
  selectOrderStats,
  selectOrderStatsLoadedAt,
  selectOrderStatsIsStale,
  selectOrderStatsStatus,
  selectOrderStatsError,
  selectIsOrderStatsPending,
  selectOrderDetails,
  selectOrderDetailsOrderId,
  selectOrderDetailsStatus,
  selectOrderDetailsError,
  selectIsOrderDetailsPending,
} = ordersSlice.selectors;

export default ordersSlice.reducer;
