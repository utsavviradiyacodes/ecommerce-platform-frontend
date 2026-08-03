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
  activateSeller,
  approveSeller,
  deactivateSeller,
  getSellerDetails,
  getSellers,
  revokeSellerApproval,
} from "./sellersApi.js";

export const SELLERS_PAGE_SIZE = 10;

const pendingSellersListRequests = new Map();
let sellersListRequestSequence = 0;

function toPositiveInteger(value, fallback) {
  const number = Number(value);

  return Number.isInteger(number) && number > 0 ? number : fallback;
}

function normalizeBooleanFilter(value) {
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

function normalizeSellersQuery(options = {}) {
  return {
    page: toPositiveInteger(options.page, 1),
    limit: toPositiveInteger(options.limit, SELLERS_PAGE_SIZE),
    search: typeof options.search === "string" ? options.search.trim() : "",
    isApproved: normalizeBooleanFilter(options.isApproved),
    isActive: normalizeBooleanFilter(options.isActive),
  };
}

export function createSellersQueryKey(options = {}) {
  const query = normalizeSellersQuery(options);

  return JSON.stringify([
    query.page,
    query.limit,
    query.search,
    query.isApproved ?? null,
    query.isActive ?? null,
  ]);
}

function resolveSellersQueryKey(options = {}) {
  return typeof options.queryKey === "string" && options.queryKey
    ? options.queryKey
    : createSellersQueryKey(options);
}

function normalizeSellerId(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return String(value);
  }

  return typeof value === "string" ? value.trim() : "";
}

function getSellerId(argument) {
  if (typeof argument === "string" || typeof argument === "number") {
    return normalizeSellerId(argument);
  }

  return normalizeSellerId(argument?.sellerId ?? argument?._id ?? argument?.id);
}

function getTargetApprovalStatus(argument) {
  return argument?.nextIsApproved === true ||
    argument?.nextIsApproved === false
    ? argument.nextIsApproved
    : null;
}

function getTargetActiveStatus(argument) {
  return argument?.nextIsActive === true || argument?.nextIsActive === false
    ? argument.nextIsActive
    : null;
}

function normalizeSellersListResponse(response, fallbackPage) {
  const data = response?.data ?? {};
  const sellers = Array.isArray(data.sellers) ? data.sellers : [];
  const parsedTotal = Number(data.total);
  const parsedPage = Number(data.page);
  const parsedTotalPages = Number(data.totalPages);

  return {
    sellers,
    total:
      Number.isFinite(parsedTotal) && parsedTotal >= 0
        ? parsedTotal
        : sellers.length,
    page:
      Number.isInteger(parsedPage) && parsedPage > 0
        ? parsedPage
        : fallbackPage,
    totalPages:
      Number.isInteger(parsedTotalPages) && parsedTotalPages > 0
        ? parsedTotalPages
        : 1,
  };
}

function normalizeSellerDetailsResponse(response) {
  const data = response?.data;
  const seller = data?.seller;

  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    !seller ||
    typeof seller !== "object" ||
    Array.isArray(seller)
  ) {
    return null;
  }

  return data;
}

function createInitialState() {
  return {
    sellers: [],
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
    details: null,
    detailsSellerId: null,
    mutationTargetIds: {
      approval: null,
      status: null,
    },
    requests: {
      list: createRequestState(),
      details: createRequestState(),
      approval: createRequestState(),
      status: createRequestState(),
    },
  };
}

const initialState = createInitialState();

export const fetchSellersThunk = createAsyncThunk(
  "sellers/fetchSellers",
  async (options = {}, { rejectWithValue }) => {
    const query = normalizeSellersQuery(options);
    const queryKey = resolveSellersQueryKey(options);

    try {
      const response = await getSellers(query);
      return { response, query, queryKey };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Unable to load sellers. Please try again.")
      );
    }
  },
  {
    condition: (options = {}, { getState }) => {
      const sellersState = getState().sellers;
      const queryKey = resolveSellersQueryKey(options);

      return !sellersState?.pendingListRequestIdsByQuery?.[queryKey];
    },
  }
);

export const fetchSellerDetailsThunk = createAsyncThunk(
  "sellers/fetchSellerDetails",
  async (argument, { rejectWithValue }) => {
    const sellerId = getSellerId(argument);

    try {
      if (!sellerId) {
        throw new Error("Seller ID is required.");
      }

      const response = await getSellerDetails(sellerId);
      return { response, sellerId };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Unable to load seller details. Please try again."
        )
      );
    }
  },
  {
    condition: (argument, { getState }) => {
      const sellersState = getState().sellers;
      const sellerId = getSellerId(argument);

      return !(
        sellersState?.requests.details.status === REQUEST_STATUS.PENDING &&
        sellersState.detailsSellerId === sellerId
      );
    },
  }
);

export const changeSellerApprovalThunk = createAsyncThunk(
  "sellers/changeSellerApproval",
  async (argument, { rejectWithValue }) => {
    const sellerId = getSellerId(argument);
    const nextIsApproved = getTargetApprovalStatus(argument);

    try {
      if (!sellerId) {
        throw new Error("Seller ID is required.");
      }

      if (nextIsApproved === null) {
        throw new Error("The target Seller approval state is required.");
      }

      return nextIsApproved
        ? await approveSeller(sellerId)
        : await revokeSellerApproval(sellerId);
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          nextIsApproved
            ? "Unable to approve seller. Please try again."
            : "Unable to revoke Seller approval. Please try again."
        )
      );
    }
  },
  {
    condition: (_, { getState }) =>
      getState().sellers?.requests.approval.status !== REQUEST_STATUS.PENDING,
  }
);

export const changeSellerStatusThunk = createAsyncThunk(
  "sellers/changeSellerStatus",
  async (argument, { rejectWithValue }) => {
    const sellerId = getSellerId(argument);
    const nextIsActive = getTargetActiveStatus(argument);

    try {
      if (!sellerId) {
        throw new Error("Seller ID is required.");
      }

      if (nextIsActive === null) {
        throw new Error("The target Seller account status is required.");
      }

      return nextIsActive
        ? await activateSeller(sellerId)
        : await deactivateSeller(sellerId);
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          nextIsActive
            ? "Unable to reactivate seller. Please try again."
            : "Unable to deactivate seller. Please try again."
        )
      );
    }
  },
  {
    condition: (_, { getState }) =>
      getState().sellers?.requests.status.status !== REQUEST_STATUS.PENDING,
  }
);

const sellersSlice = createSlice({
  name: "sellers",
  initialState,
  reducers: {
    setSellersRequestedQuery(state, action) {
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

    requestSellersListRefresh(state, action) {
      const afterSequence = Number(action.payload);

      state.listRefreshRequirement.afterSequence =
        Number.isInteger(afterSequence) && afterSequence >= 0
          ? afterSequence
          : 0;
      state.listRefreshRequirement.version += 1;
    },

    clearSellersListRefreshRequirement(state, action) {
      if (state.listRefreshRequirement.version === action.payload) {
        state.listRefreshRequirement.afterSequence = null;
      }
    },

    clearSellersListRequestFeedback(state) {
      clearRequestFeedback(state.requests.list);
    },

    clearSellerDetailsRequestFeedback(state) {
      clearRequestFeedback(state.requests.details);
    },

    clearSellerDetails(state) {
      state.details = null;
      state.detailsSellerId = null;
      resetRequestState(state.requests.details);
    },

    clearSellerApprovalRequestFeedback(state) {
      clearRequestFeedback(state.requests.approval);
    },

    clearSellerStatusRequestFeedback(state) {
      clearRequestFeedback(state.requests.status);
    },

    clearSellerMutationRequestFeedback(state) {
      clearRequestFeedback(state.requests.approval);
      clearRequestFeedback(state.requests.status);
    },

    resetSellerMutationRequestStates(state) {
      resetRequestState(state.requests.approval);
      resetRequestState(state.requests.status);
      state.mutationTargetIds.approval = null;
      state.mutationTargetIds.status = null;
    },

    resetSellersState() {
      return createInitialState();
    },
  },
  selectors: {
    selectSellers: (sliceState) => sliceState.sellers,
    selectSellersTotal: (sliceState) => sliceState.total,
    selectSellersPage: (sliceState) => sliceState.page,
    selectSellersTotalPages: (sliceState) => sliceState.totalPages,
    selectSellersRequestedQueryKey: (sliceState) =>
      sliceState.requestedQueryKey,
    selectSellersLoadedQueryKey: (sliceState) => sliceState.loadedQueryKey,
    selectSellersPendingListRequestIdsByQuery: (sliceState) =>
      sliceState.pendingListRequestIdsByQuery,
    selectSellersListRefreshRequirement: (sliceState) =>
      sliceState.listRefreshRequirement,
    selectSellersListStatus: (sliceState) => sliceState.requests.list.status,
    selectIsSellersListPending: (sliceState) =>
      sliceState.requests.list.status === REQUEST_STATUS.PENDING,
    selectSellersListError: (sliceState) => sliceState.requests.list.error,
    selectSellerDetails: (sliceState) => sliceState.details,
    selectSellerDetailsSellerId: (sliceState) => sliceState.detailsSellerId,
    selectSellerDetailsStatus: (sliceState) =>
      sliceState.requests.details.status,
    selectIsSellerDetailsPending: (sliceState) =>
      sliceState.requests.details.status === REQUEST_STATUS.PENDING,
    selectSellerDetailsError: (sliceState) =>
      sliceState.requests.details.error,
    selectIsSellerApprovalPending: (sliceState) =>
      sliceState.requests.approval.status === REQUEST_STATUS.PENDING,
    selectSellerApprovalError: (sliceState) =>
      sliceState.requests.approval.error,
    selectSellerApprovalSuccessMessage: (sliceState) =>
      sliceState.requests.approval.successMessage,
    selectIsSellerStatusPending: (sliceState) =>
      sliceState.requests.status.status === REQUEST_STATUS.PENDING,
    selectSellerStatusError: (sliceState) =>
      sliceState.requests.status.error,
    selectSellerStatusSuccessMessage: (sliceState) =>
      sliceState.requests.status.successMessage,
    selectSellerMutationTargetIds: (sliceState) =>
      sliceState.mutationTargetIds,
  },
  extraReducers: (builder) => {
    builder
      // -------------------- Fetch Sellers --------------------
      .addCase(fetchSellersThunk.pending, (state, action) => {
        const queryKey = resolveSellersQueryKey(action.meta.arg);

        state.requestedQueryKey = queryKey;
        state.pendingListRequestIdsByQuery[queryKey] = action.meta.requestId;
        setRequestPending(state.requests.list, action.meta.requestId);
      })
      .addCase(fetchSellersThunk.fulfilled, (state, action) => {
        if (
          state.pendingListRequestIdsByQuery[action.payload.queryKey] ===
          action.meta.requestId
        ) {
          delete state.pendingListRequestIdsByQuery[action.payload.queryKey];
        }

        if (!isRequestStateOwnedBy(state.requests.list, action.meta.requestId)) {
          return;
        }

        const normalizedList = normalizeSellersListResponse(
          action.payload.response,
          action.payload.query.page
        );

        state.sellers = normalizedList.sellers;
        state.total = normalizedList.total;
        state.page = normalizedList.page;
        state.totalPages = normalizedList.totalPages;
        state.loadedQueryKey = action.payload.queryKey;
        setRequestSucceeded(state.requests.list);
      })
      .addCase(fetchSellersThunk.rejected, (state, action) => {
        const queryKey = resolveSellersQueryKey(action.meta.arg);

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
            "Unable to load sellers. Please try again."
          )
        );
      })

      // -------------------- Fetch Seller Details --------------------
      .addCase(fetchSellerDetailsThunk.pending, (state, action) => {
        state.details = null;
        state.detailsSellerId = getSellerId(action.meta.arg);
        setRequestPending(state.requests.details, action.meta.requestId);
      })
      .addCase(fetchSellerDetailsThunk.fulfilled, (state, action) => {
        if (
          !isRequestStateOwnedBy(
            state.requests.details,
            action.meta.requestId
          )
        ) {
          return;
        }

        const normalizedDetails = normalizeSellerDetailsResponse(
          action.payload.response
        );

        state.detailsSellerId = action.payload.sellerId;

        if (!normalizedDetails) {
          state.details = null;
          setRequestFailed(
            state.requests.details,
            "Seller details response was invalid. Please try again."
          );
          return;
        }

        state.details = normalizedDetails;
        setRequestSucceeded(state.requests.details);
      })
      .addCase(fetchSellerDetailsThunk.rejected, (state, action) => {
        if (
          !isRequestStateOwnedBy(
            state.requests.details,
            action.meta.requestId
          )
        ) {
          return;
        }

        state.details = null;
        setRequestFailed(
          state.requests.details,
          getRejectedActionErrorMessage(
            action,
            "Unable to load seller details. Please try again."
          )
        );
      })

      // -------------------- Change Seller Approval --------------------
      .addCase(changeSellerApprovalThunk.pending, (state, action) => {
        state.mutationTargetIds.approval = getSellerId(action.meta.arg);
        setRequestPending(state.requests.approval, action.meta.requestId);
      })
      .addCase(changeSellerApprovalThunk.fulfilled, (state, action) => {
        if (
          !isRequestStateOwnedBy(
            state.requests.approval,
            action.meta.requestId
          )
        ) {
          return;
        }

        state.mutationTargetIds.approval = null;
        setRequestSucceeded(
          state.requests.approval,
          action.payload?.message || "Seller approval changed successfully"
        );
      })
      .addCase(changeSellerApprovalThunk.rejected, (state, action) => {
        if (
          !isRequestStateOwnedBy(
            state.requests.approval,
            action.meta.requestId
          )
        ) {
          return;
        }

        state.mutationTargetIds.approval = null;
        setRequestFailed(
          state.requests.approval,
          getRejectedActionErrorMessage(
            action,
            "Unable to change Seller approval. Please try again."
          )
        );
      })

      // -------------------- Change Seller Status --------------------
      .addCase(changeSellerStatusThunk.pending, (state, action) => {
        state.mutationTargetIds.status = getSellerId(action.meta.arg);
        setRequestPending(state.requests.status, action.meta.requestId);
      })
      .addCase(changeSellerStatusThunk.fulfilled, (state, action) => {
        if (
          !isRequestStateOwnedBy(state.requests.status, action.meta.requestId)
        ) {
          return;
        }

        state.mutationTargetIds.status = null;
        setRequestSucceeded(
          state.requests.status,
          action.payload?.message || "Seller account status changed successfully"
        );
      })
      .addCase(changeSellerStatusThunk.rejected, (state, action) => {
        if (
          !isRequestStateOwnedBy(state.requests.status, action.meta.requestId)
        ) {
          return;
        }

        state.mutationTargetIds.status = null;
        setRequestFailed(
          state.requests.status,
          getRejectedActionErrorMessage(
            action,
            "Unable to change Seller account status. Please try again."
          )
        );
      });
  },
});

export const {
  setSellersRequestedQuery,
  requestSellersListRefresh,
  clearSellersListRefreshRequirement,
  clearSellersListRequestFeedback,
  clearSellerDetailsRequestFeedback,
  clearSellerDetails,
  clearSellerApprovalRequestFeedback,
  clearSellerStatusRequestFeedback,
  clearSellerMutationRequestFeedback,
  resetSellerMutationRequestStates,
  resetSellersState,
} = sellersSlice.actions;

export const {
  selectSellers,
  selectSellersTotal,
  selectSellersPage,
  selectSellersTotalPages,
  selectSellersRequestedQueryKey,
  selectSellersLoadedQueryKey,
  selectSellersPendingListRequestIdsByQuery,
  selectSellersListRefreshRequirement,
  selectSellersListStatus,
  selectIsSellersListPending,
  selectSellersListError,
  selectSellerDetails,
  selectSellerDetailsSellerId,
  selectSellerDetailsStatus,
  selectIsSellerDetailsPending,
  selectSellerDetailsError,
  selectIsSellerApprovalPending,
  selectSellerApprovalError,
  selectSellerApprovalSuccessMessage,
  selectIsSellerStatusPending,
  selectSellerStatusError,
  selectSellerStatusSuccessMessage,
  selectSellerMutationTargetIds,
} = sellersSlice.selectors;

export function getSellersListRequestSequence() {
  return sellersListRequestSequence;
}

export function getPendingSellersListRequest(options = {}) {
  return pendingSellersListRequests.get(resolveSellersQueryKey(options)) ?? null;
}

export function requestSellersListThunk(options = {}) {
  return (dispatch) => {
    const queryKey = resolveSellersQueryKey(options);
    const pendingRequest = pendingSellersListRequests.get(queryKey);

    dispatch(
      setSellersRequestedQuery({
        queryKey,
        requestId: pendingRequest?.requestId ?? null,
      })
    );

    if (pendingRequest) {
      return pendingRequest.promise;
    }

    const sequence = ++sellersListRequestSequence;
    const requestPromise = dispatch(fetchSellersThunk({ ...options, queryKey }));
    const requestRecord = {
      promise: requestPromise,
      requestId: requestPromise.requestId,
      sequence,
    };

    pendingSellersListRequests.set(queryKey, requestRecord);

    requestPromise.finally(() => {
      if (pendingSellersListRequests.get(queryKey) === requestRecord) {
        pendingSellersListRequests.delete(queryKey);
      }
    });

    return requestPromise;
  };
}

export default sellersSlice.reducer;
