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
  getPayments,
  getPaymentStats,
  processPaymentRefund,
} from "./paymentsApi.js";

export const PAYMENTS_PAGE_SIZE = 10;

const PAYMENT_STATUSES = new Set(["paid", "pending", "failed", "refunded"]);
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

function normalizePaymentsQuery(options = {}) {
  return {
    page: toPositiveInteger(options.page, 1),
    limit: toPositiveInteger(options.limit, PAYMENTS_PAGE_SIZE),
    status: normalizeFilter(options.status, PAYMENT_STATUSES),
    method: normalizeFilter(options.method, PAYMENT_METHODS),
  };
}

export function createPaymentsQueryKey(options = {}) {
  const query = normalizePaymentsQuery(options);

  return JSON.stringify([
    query.page,
    query.limit,
    query.status || null,
    query.method || null,
  ]);
}

function normalizePaymentId(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return normalizeText(value);
}

function getPaymentId(argument) {
  if (typeof argument === "string" || typeof argument === "number") {
    return normalizePaymentId(argument);
  }

  return normalizePaymentId(
    argument?.paymentId ?? argument?.payment?._id ?? argument?._id ?? argument?.id
  );
}

function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

function normalizePaymentsResponse(response, query) {
  const data = response?.data;

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("The Payment list response was invalid.");
  }

  if (!Array.isArray(data.payments)) {
    throw new Error("The Payment list response did not include a payments array.");
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
    throw new Error("The Payment list pagination response was invalid.");
  }

  return {
    payments: data.payments,
    pagination: {
      total,
      page,
      totalPages,
      limit: query.limit,
    },
  };
}

function normalizePaymentStatsResponse(response) {
  const data = response?.data;

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("The Payment statistics response was invalid.");
  }

  return data;
}

function normalizeRefundResponse(response) {
  const message = normalizeText(response?.message);

  return {
    response,
    message: message || "Refund processed successfully.",
  };
}

function createInitialState() {
  return {
    payments: [],
    pagination: {
      total: 0,
      page: 1,
      totalPages: 0,
      limit: PAYMENTS_PAGE_SIZE,
    },
    requestedQueryKey: "",
    loadedQueryKey: "",
    listLoadedAt: null,
    listIsStale: false,
    stats: null,
    statsLoadedAt: null,
    statsIsStale: false,
    refundTargetId: null,
    refundSuccessMessage: null,
    requests: {
      list: createRequestState(),
      stats: createRequestState(),
      refund: createRequestState(),
    },
  };
}

const initialState = createInitialState();

export const fetchPaymentsThunk = createAsyncThunk(
  "payments/fetchPayments",
  async (options = {}, { rejectWithValue, signal }) => {
    const query = normalizePaymentsQuery(options);
    const queryKey = createPaymentsQueryKey(query);

    try {
      const response = await getPayments({ ...query, signal });

      return {
        ...normalizePaymentsResponse(response, query),
        queryKey,
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Unable to load Payments. Please try again.")
      );
    }
  },
  {
    condition: (options = {}, { getState }) => {
      if (options.force === true) {
        return true;
      }

      const paymentsState = getState().payments;
      const queryKey = createPaymentsQueryKey(options);

      return !(
        paymentsState?.requests.list.status === REQUEST_STATUS.PENDING &&
        paymentsState.requestedQueryKey === queryKey
      );
    },
  }
);

export const fetchPaymentStatsThunk = createAsyncThunk(
  "payments/fetchPaymentStats",
  async (_options, { rejectWithValue, signal }) => {
    try {
      const response = await getPaymentStats({ signal });

      return normalizePaymentStatsResponse(response);
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Unable to load Payment statistics. Please try again."
        )
      );
    }
  },
  {
    condition: (options = {}, { getState }) =>
      options.force === true ||
      getState().payments?.requests.stats.status !== REQUEST_STATUS.PENDING,
  }
);

function isPaymentRefundRequestOwned(getState, requestId) {
  const requestState = getState().payments?.requests?.refund;

  return (
    Boolean(requestState) && isRequestStateOwnedBy(requestState, requestId)
  );
}

export const processPaymentRefundThunk = createAsyncThunk(
  "payments/processRefund",
  async (
    argument,
    { fulfillWithValue, getState, rejectWithValue, requestId, signal }
  ) => {
    const paymentId = getPaymentId(argument);

    try {
      const response = await processPaymentRefund({
        paymentId,
        refundAmount: argument?.refundAmount,
        refundReason: argument?.refundReason,
        signal,
      });

      return fulfillWithValue(normalizeRefundResponse(response), {
        wasRequestOwned: isPaymentRefundRequestOwned(getState, requestId),
      });
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Unable to process the refund. Please try again.")
      );
    }
  },
  {
    condition: (_argument, { getState }) =>
      getState().payments?.requests.refund.status !== REQUEST_STATUS.PENDING,
  }
);

const paymentsSlice = createSlice({
  name: "payments",
  initialState,
  reducers: {
    clearPaymentRefundFeedback(state) {
      clearRequestFeedback(state.requests.refund);
      state.refundSuccessMessage = null;
    },
    resetPaymentsState() {
      return createInitialState();
    },
  },
  selectors: {
    selectPayments: (sliceState) => sliceState.payments,
    selectPaymentsPagination: (sliceState) => sliceState.pagination,
    selectPaymentsRequestedQueryKey: (sliceState) =>
      sliceState.requestedQueryKey,
    selectPaymentsLoadedQueryKey: (sliceState) => sliceState.loadedQueryKey,
    selectPaymentsListLoadedAt: (sliceState) => sliceState.listLoadedAt,
    selectPaymentsListIsStale: (sliceState) => sliceState.listIsStale,
    selectPaymentsListStatus: (sliceState) => sliceState.requests.list.status,
    selectPaymentsListError: (sliceState) => sliceState.requests.list.error,
    selectIsPaymentsListPending: (sliceState) =>
      sliceState.requests.list.status === REQUEST_STATUS.PENDING,
    selectPaymentStats: (sliceState) => sliceState.stats,
    selectPaymentStatsLoadedAt: (sliceState) => sliceState.statsLoadedAt,
    selectPaymentStatsIsStale: (sliceState) => sliceState.statsIsStale,
    selectPaymentStatsStatus: (sliceState) => sliceState.requests.stats.status,
    selectPaymentStatsError: (sliceState) => sliceState.requests.stats.error,
    selectIsPaymentStatsPending: (sliceState) =>
      sliceState.requests.stats.status === REQUEST_STATUS.PENDING,
    selectPaymentRefundError: (sliceState) => sliceState.requests.refund.error,
    selectIsPaymentRefundPending: (sliceState) =>
      sliceState.requests.refund.status === REQUEST_STATUS.PENDING,
    selectPaymentRefundTargetId: (sliceState) => sliceState.refundTargetId,
    selectPaymentRefundSuccessMessage: (sliceState) =>
      sliceState.refundSuccessMessage,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPaymentsThunk.pending, (state, action) => {
        state.requestedQueryKey = createPaymentsQueryKey(action.meta.arg);
        state.listIsStale = false;
        setRequestPending(state.requests.list, action.meta.requestId);
      })
      .addCase(fetchPaymentsThunk.fulfilled, (state, action) => {
        if (!isRequestStateOwnedBy(state.requests.list, action.meta.requestId)) {
          return;
        }

        state.payments = action.payload.payments;
        state.pagination = action.payload.pagination;
        state.loadedQueryKey = action.payload.queryKey;
        state.listLoadedAt = new Date().toISOString();
        state.listIsStale = false;
        setRequestSucceeded(state.requests.list);
      })
      .addCase(fetchPaymentsThunk.rejected, (state, action) => {
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
            "Unable to load Payments. Please try again."
          )
        );
      })
      .addCase(fetchPaymentStatsThunk.pending, (state, action) => {
        state.statsIsStale = false;
        setRequestPending(state.requests.stats, action.meta.requestId);
      })
      .addCase(fetchPaymentStatsThunk.fulfilled, (state, action) => {
        if (!isRequestStateOwnedBy(state.requests.stats, action.meta.requestId)) {
          return;
        }

        state.stats = action.payload;
        state.statsLoadedAt = new Date().toISOString();
        state.statsIsStale = false;
        setRequestSucceeded(state.requests.stats);
      })
      .addCase(fetchPaymentStatsThunk.rejected, (state, action) => {
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
            "Unable to load Payment statistics. Please try again."
          )
        );
      })
      .addCase(processPaymentRefundThunk.pending, (state, action) => {
        state.refundTargetId = getPaymentId(action.meta.arg);
        state.refundSuccessMessage = null;
        setRequestPending(state.requests.refund, action.meta.requestId);
      })
      .addCase(processPaymentRefundThunk.fulfilled, (state, action) => {
        if (!isRequestStateOwnedBy(state.requests.refund, action.meta.requestId)) {
          return;
        }

        state.refundTargetId = null;
        state.refundSuccessMessage = action.payload.message;
        setRequestSucceeded(state.requests.refund);
      })
      .addCase(processPaymentRefundThunk.rejected, (state, action) => {
        if (!isRequestStateOwnedBy(state.requests.refund, action.meta.requestId)) {
          return;
        }

        state.refundTargetId = null;

        if (action.meta.aborted || action.meta.condition) {
          resetRequestState(state.requests.refund);
          return;
        }

        setRequestFailed(
          state.requests.refund,
          getRejectedActionErrorMessage(
            action,
            "Unable to process the refund. Please try again."
          )
        );
      });
  },
});

export const { clearPaymentRefundFeedback, resetPaymentsState } =
  paymentsSlice.actions;

export const {
  selectPayments,
  selectPaymentsPagination,
  selectPaymentsRequestedQueryKey,
  selectPaymentsLoadedQueryKey,
  selectPaymentsListLoadedAt,
  selectPaymentsListIsStale,
  selectPaymentsListStatus,
  selectPaymentsListError,
  selectIsPaymentsListPending,
  selectPaymentStats,
  selectPaymentStatsLoadedAt,
  selectPaymentStatsIsStale,
  selectPaymentStatsStatus,
  selectPaymentStatsError,
  selectIsPaymentStatsPending,
  selectPaymentRefundError,
  selectIsPaymentRefundPending,
  selectPaymentRefundTargetId,
  selectPaymentRefundSuccessMessage,
} = paymentsSlice.selectors;

export default paymentsSlice.reducer;
