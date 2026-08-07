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
  approveReturn,
  getReturnDetails,
  getReturns,
  getReturnStats,
  rejectReturn,
} from "./returnsApi.js";

export const RETURNS_PAGE_SIZE = 10;

export const RETURN_STATUS_KEYS = [
  "requested",
  "approved",
  "rejected",
  "refunded",
];

const RETURN_STATUSES = new Set(RETURN_STATUS_KEYS);

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
}

function toPositiveInteger(value, fallback) {
  const number = Number(value);

  return Number.isInteger(number) && number > 0 ? number : fallback;
}

function normalizeStatus(value) {
  const normalizedValue = normalizeText(value).toLowerCase();

  return RETURN_STATUSES.has(normalizedValue) ? normalizedValue : "";
}

function normalizeReturnsQuery(options = {}) {
  return {
    page: toPositiveInteger(options.page, 1),
    limit: toPositiveInteger(options.limit, RETURNS_PAGE_SIZE),
    status: normalizeStatus(options.status),
  };
}

export function createReturnsQueryKey(options = {}) {
  const query = normalizeReturnsQuery(options);

  return JSON.stringify([
    query.page,
    query.limit,
    query.status || null,
  ]);
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

function getReturnId(argument) {
  if (typeof argument === "string" || typeof argument === "number") {
    return getEntityId(argument);
  }

  return getEntityId(
    argument?.returnId ?? argument?.returnRequest ?? argument?.return ?? argument
  );
}

function isValidReturnId(value) {
  return /^[0-9a-fA-F]{24}$/.test(value);
}

function isNonNegativeInteger(value) {
  return Number.isInteger(value) && value >= 0;
}

function normalizeReturnsResponse(response, query) {
  const data = response?.data;

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("The Return list response was invalid.");
  }

  if (!Array.isArray(data.returns)) {
    throw new Error("The Return list response did not include a returns array.");
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
    throw new Error("The Return list pagination response was invalid.");
  }

  return {
    returns: data.returns,
    pagination: {
      total,
      page,
      totalPages,
      limit: query.limit,
    },
  };
}

function normalizeReturnStatsResponse(response) {
  const data = response?.data;

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("The Return statistics response was invalid.");
  }

  return data;
}

function normalizeReturnDetailsResponse(response, requestedReturnId) {
  const data = response?.data;
  const normalizedRequestedReturnId = getEntityId(requestedReturnId);
  const responseReturnId = getEntityId(data);

  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    !isValidReturnId(normalizedRequestedReturnId) ||
    !isValidReturnId(responseReturnId) ||
    responseReturnId !== normalizedRequestedReturnId
  ) {
    throw new Error("The Return details response was invalid.");
  }

  return data;
}

function normalizeMutationResponse(response, fallbackMessage) {
  const message = normalizeText(response?.message);

  return {
    response,
    message: message || fallbackMessage,
  };
}

function createInitialState() {
  return {
    returns: [],
    pagination: {
      total: 0,
      page: 1,
      totalPages: 0,
      limit: RETURNS_PAGE_SIZE,
    },
    requestedQueryKey: "",
    loadedQueryKey: "",
    listLoadedAt: null,
    listIsStale: false,
    stats: null,
    statsLoadedAt: null,
    statsIsStale: false,
    details: null,
    detailsReturnId: null,
    approveTargetId: null,
    rejectTargetId: null,
    mutationSuccessMessage: null,
    requests: {
      list: createRequestState(),
      stats: createRequestState(),
      details: createRequestState(),
      approve: createRequestState(),
      reject: createRequestState(),
    },
  };
}

const initialState = createInitialState();

export const fetchReturnsThunk = createAsyncThunk(
  "returns/fetchReturns",
  async (options = {}, { rejectWithValue, signal }) => {
    const query = normalizeReturnsQuery(options);
    const queryKey = createReturnsQueryKey(query);

    try {
      const response = await getReturns({ ...query, signal });

      return {
        ...normalizeReturnsResponse(response, query),
        queryKey,
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Unable to load Returns. Please try again.")
      );
    }
  },
  {
    condition: (options = {}, { getState }) => {
      if (options.force === true) {
        return true;
      }

      const returnsState = getState().returns;
      const queryKey = createReturnsQueryKey(options);

      return !(
        returnsState?.requests.list.status === REQUEST_STATUS.PENDING &&
        returnsState.requestedQueryKey === queryKey
      );
    },
  }
);

export const fetchReturnStatsThunk = createAsyncThunk(
  "returns/fetchStats",
  async (_options, { rejectWithValue, signal }) => {
    try {
      const response = await getReturnStats({ signal });

      return normalizeReturnStatsResponse(response);
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Unable to load Return statistics. Please try again."
        )
      );
    }
  },
  {
    condition: (options = {}, { getState }) =>
      options.force === true ||
      getState().returns?.requests.stats.status !== REQUEST_STATUS.PENDING,
  }
);

export const fetchReturnDetailsThunk = createAsyncThunk(
  "returns/fetchDetails",
  async (argument, { rejectWithValue, signal }) => {
    const returnId = getReturnId(argument);

    try {
      if (!isValidReturnId(returnId)) {
        throw new Error("A valid Return ID is required.");
      }

      const response = await getReturnDetails(returnId, { signal });

      return {
        details: normalizeReturnDetailsResponse(response, returnId),
        returnId,
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Unable to load Return details. Please try again."
        )
      );
    }
  },
  {
    condition: (argument, { getState }) => {
      if (argument?.force === true) {
        return true;
      }

      const returnsState = getState().returns;
      const returnId = getReturnId(argument);

      return !(
        returnsState?.requests.details.status === REQUEST_STATUS.PENDING &&
        returnsState.detailsReturnId === returnId
      );
    },
  }
);

function isReturnMutationRequestOwned(getState, requestKey, requestId) {
  const requestState = getState().returns?.requests?.[requestKey];

  return (
    Boolean(requestState) && isRequestStateOwnedBy(requestState, requestId)
  );
}

export const approveReturnThunk = createAsyncThunk(
  "returns/approveReturn",
  async (
    argument,
    { fulfillWithValue, getState, rejectWithValue, requestId, signal }
  ) => {
    const returnId = getReturnId(argument);

    try {
      const response = await approveReturn({
        returnId,
        refundNote: argument?.refundNote,
        signal,
      });

      return fulfillWithValue(
        normalizeMutationResponse(
          response,
          "Return approved and refund processed successfully."
        ),
        {
          wasRequestOwned: isReturnMutationRequestOwned(
            getState,
            "approve",
            requestId
          ),
        }
      );
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Unable to approve the Return. Please inspect its current state before trying again."
        )
      );
    }
  },
  {
    condition: (argument, { getState }) => {
      const returnsState = getState().returns;
      const returnId = getReturnId(argument);
      const hasMatchingReject =
        returnsState?.requests.reject.status === REQUEST_STATUS.PENDING &&
        returnsState.rejectTargetId === returnId;

      return (
        returnsState?.requests.approve.status !== REQUEST_STATUS.PENDING &&
        !hasMatchingReject
      );
    },
  }
);

export const rejectReturnThunk = createAsyncThunk(
  "returns/rejectReturn",
  async (
    argument,
    { fulfillWithValue, getState, rejectWithValue, requestId, signal }
  ) => {
    const returnId = getReturnId(argument);

    try {
      const response = await rejectReturn({
        returnId,
        rejectedReason: argument?.rejectedReason,
        signal,
      });

      return fulfillWithValue(
        normalizeMutationResponse(response, "Return rejected successfully."),
        {
          wasRequestOwned: isReturnMutationRequestOwned(
            getState,
            "reject",
            requestId
          ),
        }
      );
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Unable to reject the Return. Please try again.")
      );
    }
  },
  {
    condition: (argument, { getState }) => {
      const returnsState = getState().returns;
      const returnId = getReturnId(argument);
      const hasMatchingApprove =
        returnsState?.requests.approve.status === REQUEST_STATUS.PENDING &&
        returnsState.approveTargetId === returnId;

      return (
        returnsState?.requests.reject.status !== REQUEST_STATUS.PENDING &&
        !hasMatchingApprove
      );
    },
  }
);

const returnsSlice = createSlice({
  name: "returns",
  initialState,
  reducers: {
    clearReturnDetails(state) {
      state.details = null;
      state.detailsReturnId = null;
      resetRequestState(state.requests.details);
    },
    clearReturnMutationFeedback(state) {
      clearRequestFeedback(state.requests.approve);
      clearRequestFeedback(state.requests.reject);
      state.mutationSuccessMessage = null;
    },
    resetReturnsState() {
      return createInitialState();
    },
  },
  selectors: {
    selectReturns: (sliceState) => sliceState.returns,
    selectReturnsPagination: (sliceState) => sliceState.pagination,
    selectReturnsRequestedQueryKey: (sliceState) =>
      sliceState.requestedQueryKey,
    selectReturnsLoadedQueryKey: (sliceState) => sliceState.loadedQueryKey,
    selectReturnsListLoadedAt: (sliceState) => sliceState.listLoadedAt,
    selectReturnsListIsStale: (sliceState) => sliceState.listIsStale,
    selectReturnsListStatus: (sliceState) => sliceState.requests.list.status,
    selectReturnsListError: (sliceState) => sliceState.requests.list.error,
    selectIsReturnsListPending: (sliceState) =>
      sliceState.requests.list.status === REQUEST_STATUS.PENDING,
    selectReturnStats: (sliceState) => sliceState.stats,
    selectReturnStatsLoadedAt: (sliceState) => sliceState.statsLoadedAt,
    selectReturnStatsIsStale: (sliceState) => sliceState.statsIsStale,
    selectReturnStatsStatus: (sliceState) => sliceState.requests.stats.status,
    selectReturnStatsError: (sliceState) => sliceState.requests.stats.error,
    selectIsReturnStatsPending: (sliceState) =>
      sliceState.requests.stats.status === REQUEST_STATUS.PENDING,
    selectReturnDetails: (sliceState) => sliceState.details,
    selectReturnDetailsReturnId: (sliceState) => sliceState.detailsReturnId,
    selectReturnDetailsError: (sliceState) => sliceState.requests.details.error,
    selectIsReturnDetailsPending: (sliceState) =>
      sliceState.requests.details.status === REQUEST_STATUS.PENDING,
    selectApproveReturnError: (sliceState) =>
      sliceState.requests.approve.error,
    selectIsApproveReturnPending: (sliceState) =>
      sliceState.requests.approve.status === REQUEST_STATUS.PENDING,
    selectApproveReturnTargetId: (sliceState) => sliceState.approveTargetId,
    selectRejectReturnError: (sliceState) => sliceState.requests.reject.error,
    selectIsRejectReturnPending: (sliceState) =>
      sliceState.requests.reject.status === REQUEST_STATUS.PENDING,
    selectRejectReturnTargetId: (sliceState) => sliceState.rejectTargetId,
    selectReturnMutationSuccessMessage: (sliceState) =>
      sliceState.mutationSuccessMessage,
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchReturnsThunk.pending, (state, action) => {
        state.requestedQueryKey = createReturnsQueryKey(action.meta.arg);
        state.listIsStale = false;
        setRequestPending(state.requests.list, action.meta.requestId);
      })
      .addCase(fetchReturnsThunk.fulfilled, (state, action) => {
        if (!isRequestStateOwnedBy(state.requests.list, action.meta.requestId)) {
          return;
        }

        state.returns = action.payload.returns;
        state.pagination = action.payload.pagination;
        state.loadedQueryKey = action.payload.queryKey;
        state.listLoadedAt = new Date().toISOString();
        state.listIsStale = false;
        setRequestSucceeded(state.requests.list);
      })
      .addCase(fetchReturnsThunk.rejected, (state, action) => {
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
            "Unable to load Returns. Please try again."
          )
        );
      })
      .addCase(fetchReturnStatsThunk.pending, (state, action) => {
        state.statsIsStale = false;
        setRequestPending(state.requests.stats, action.meta.requestId);
      })
      .addCase(fetchReturnStatsThunk.fulfilled, (state, action) => {
        if (!isRequestStateOwnedBy(state.requests.stats, action.meta.requestId)) {
          return;
        }

        state.stats = action.payload;
        state.statsLoadedAt = new Date().toISOString();
        state.statsIsStale = false;
        setRequestSucceeded(state.requests.stats);
      })
      .addCase(fetchReturnStatsThunk.rejected, (state, action) => {
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
            "Unable to load Return statistics. Please try again."
          )
        );
      })
      .addCase(fetchReturnDetailsThunk.pending, (state, action) => {
        state.details = null;
        state.detailsReturnId = getReturnId(action.meta.arg);
        setRequestPending(state.requests.details, action.meta.requestId);
      })
      .addCase(fetchReturnDetailsThunk.fulfilled, (state, action) => {
        if (
          !isRequestStateOwnedBy(state.requests.details, action.meta.requestId)
        ) {
          return;
        }

        state.details = action.payload.details;
        state.detailsReturnId = action.payload.returnId;
        setRequestSucceeded(state.requests.details);
      })
      .addCase(fetchReturnDetailsThunk.rejected, (state, action) => {
        if (
          !isRequestStateOwnedBy(state.requests.details, action.meta.requestId)
        ) {
          return;
        }

        if (action.meta.aborted || action.meta.condition) {
          resetRequestState(state.requests.details);
          return;
        }

        setRequestFailed(
          state.requests.details,
          getRejectedActionErrorMessage(
            action,
            "Unable to load Return details. Please try again."
          )
        );
      })
      .addCase(approveReturnThunk.pending, (state, action) => {
        state.approveTargetId = getReturnId(action.meta.arg);
        state.mutationSuccessMessage = null;
        clearRequestFeedback(state.requests.reject);
        setRequestPending(state.requests.approve, action.meta.requestId);
      })
      .addCase(approveReturnThunk.fulfilled, (state, action) => {
        if (
          !isRequestStateOwnedBy(state.requests.approve, action.meta.requestId)
        ) {
          return;
        }

        state.approveTargetId = null;
        state.mutationSuccessMessage = action.payload.message;
        setRequestSucceeded(state.requests.approve);
      })
      .addCase(approveReturnThunk.rejected, (state, action) => {
        if (
          !isRequestStateOwnedBy(state.requests.approve, action.meta.requestId)
        ) {
          return;
        }

        state.approveTargetId = null;

        if (action.meta.aborted || action.meta.condition) {
          resetRequestState(state.requests.approve);
          return;
        }

        setRequestFailed(
          state.requests.approve,
          getRejectedActionErrorMessage(
            action,
            "Unable to approve the Return. Please inspect its current state before trying again."
          )
        );
      })
      .addCase(rejectReturnThunk.pending, (state, action) => {
        state.rejectTargetId = getReturnId(action.meta.arg);
        state.mutationSuccessMessage = null;
        clearRequestFeedback(state.requests.approve);
        setRequestPending(state.requests.reject, action.meta.requestId);
      })
      .addCase(rejectReturnThunk.fulfilled, (state, action) => {
        if (!isRequestStateOwnedBy(state.requests.reject, action.meta.requestId)) {
          return;
        }

        state.rejectTargetId = null;
        state.mutationSuccessMessage = action.payload.message;
        setRequestSucceeded(state.requests.reject);
      })
      .addCase(rejectReturnThunk.rejected, (state, action) => {
        if (!isRequestStateOwnedBy(state.requests.reject, action.meta.requestId)) {
          return;
        }

        state.rejectTargetId = null;

        if (action.meta.aborted || action.meta.condition) {
          resetRequestState(state.requests.reject);
          return;
        }

        setRequestFailed(
          state.requests.reject,
          getRejectedActionErrorMessage(
            action,
            "Unable to reject the Return. Please try again."
          )
        );
      });
  },
});

export const {
  clearReturnDetails,
  clearReturnMutationFeedback,
  resetReturnsState,
} = returnsSlice.actions;

export const {
  selectReturns,
  selectReturnsPagination,
  selectReturnsRequestedQueryKey,
  selectReturnsLoadedQueryKey,
  selectReturnsListLoadedAt,
  selectReturnsListIsStale,
  selectReturnsListStatus,
  selectReturnsListError,
  selectIsReturnsListPending,
  selectReturnStats,
  selectReturnStatsLoadedAt,
  selectReturnStatsIsStale,
  selectReturnStatsStatus,
  selectReturnStatsError,
  selectIsReturnStatsPending,
  selectReturnDetails,
  selectReturnDetailsReturnId,
  selectReturnDetailsError,
  selectIsReturnDetailsPending,
  selectApproveReturnError,
  selectIsApproveReturnPending,
  selectApproveReturnTargetId,
  selectRejectReturnError,
  selectIsRejectReturnPending,
  selectRejectReturnTargetId,
  selectReturnMutationSuccessMessage,
} = returnsSlice.selectors;

export default returnsSlice.reducer;
