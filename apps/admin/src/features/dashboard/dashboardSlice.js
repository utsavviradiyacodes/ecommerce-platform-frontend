import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  getDashboardStats,
  getPaymentStats,
  getRecentProducts,
  getReturnStats,
} from "./dashboardApi.js";

import { getApiErrorMessage } from "../../utils/api/getApiErrorMessage.js";
import {
  REQUEST_STATUS,
  createRequestState,
  getRejectedActionErrorMessage,
  isRequestStateOwnedBy,
  setRequestFailed,
  setRequestPending,
  setRequestSucceeded,
} from "../../utils/redux/requestState.js";

const initialState = {
  stats: null,
  paymentStats: null,
  returnStats: null,

  recentProducts: [],
  recentProductsTotal: 0,

  requests: {
    stats: createRequestState(),
    payments: createRequestState(),
    returns: createRequestState(),
    recentProducts: createRequestState(),
  },
};

export const fetchDashboardStatsThunk = createAsyncThunk(
  "dashboard/fetchStats",
  async (_options, { rejectWithValue }) => {
    try {
      return await getDashboardStats();
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Unable to load Dashboard statistics. Please try again."
        )
      );
    }
  },
  {
    condition: (options, { getState }) => {
      if (options?.force) {
        return true;
      }

      const status = getState().dashboard.requests.stats.status;

      return status !== REQUEST_STATUS.PENDING;
    },
  }
);

export const fetchDashboardPaymentStatsThunk = createAsyncThunk(
  "dashboard/fetchPaymentStats",
  async (_options, { rejectWithValue }) => {
    try {
      return await getPaymentStats();
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Unable to load payment statistics. Please try again."
        )
      );
    }
  },
  {
    condition: (options, { getState }) => {
      if (options?.force) {
        return true;
      }

      const status = getState().dashboard.requests.payments.status;

      return status !== REQUEST_STATUS.PENDING;
    },
  }
);

export const fetchDashboardReturnStatsThunk = createAsyncThunk(
  "dashboard/fetchReturnStats",
  async (_options, { rejectWithValue }) => {
    try {
      return await getReturnStats();
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Unable to load return statistics. Please try again."
        )
      );
    }
  },
  {
    condition: (options, { getState }) => {
      if (options?.force) {
        return true;
      }

      const status = getState().dashboard.requests.returns.status;

      return status !== REQUEST_STATUS.PENDING;
    },
  }
);

export const fetchDashboardRecentProductsThunk = createAsyncThunk(
  "dashboard/fetchRecentProducts",
  async (_options, { rejectWithValue }) => {
    try {
      return await getRecentProducts();
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Unable to load recent Products. Please try again."
        )
      );
    }
  },
  {
    condition: (options, { getState }) => {
      if (options?.force) {
        return true;
      }

      const status = getState().dashboard.requests.recentProducts.status;

      return status !== REQUEST_STATUS.PENDING;
    },
  }
);

const dashboardSlice = createSlice({
  name: "dashboard",

  initialState,

  selectors: {
    selectDashboardStats: (sliceState) => sliceState.stats,

    selectDashboardPaymentStats: (sliceState) => sliceState.paymentStats,

    selectDashboardReturnStats: (sliceState) => sliceState.returnStats,

    selectDashboardRecentProducts: (sliceState) => sliceState.recentProducts,

    selectDashboardRecentProductsTotal: (sliceState) =>
      sliceState.recentProductsTotal,

    selectDashboardStatsStatus: (sliceState) =>
      sliceState.requests.stats.status,

    selectDashboardStatsError: (sliceState) => sliceState.requests.stats.error,

    selectIsDashboardStatsPending: (sliceState) =>
      sliceState.requests.stats.status === REQUEST_STATUS.PENDING,

    selectDashboardPaymentStatsStatus: (sliceState) =>
      sliceState.requests.payments.status,

    selectDashboardPaymentStatsError: (sliceState) =>
      sliceState.requests.payments.error,

    selectIsDashboardPaymentStatsPending: (sliceState) =>
      sliceState.requests.payments.status === REQUEST_STATUS.PENDING,

    selectDashboardReturnStatsStatus: (sliceState) =>
      sliceState.requests.returns.status,

    selectDashboardReturnStatsError: (sliceState) =>
      sliceState.requests.returns.error,

    selectIsDashboardReturnStatsPending: (sliceState) =>
      sliceState.requests.returns.status === REQUEST_STATUS.PENDING,

    selectDashboardRecentProductsStatus: (sliceState) =>
      sliceState.requests.recentProducts.status,

    selectDashboardRecentProductsError: (sliceState) =>
      sliceState.requests.recentProducts.error,

    selectIsDashboardRecentProductsPending: (sliceState) =>
      sliceState.requests.recentProducts.status === REQUEST_STATUS.PENDING,
  },

  extraReducers: (builder) => {
    builder

      // -------------------- Dashboard Statistics --------------------

      .addCase(fetchDashboardStatsThunk.pending, (state, action) => {
        setRequestPending(state.requests.stats, action.meta.requestId);
      })

      .addCase(fetchDashboardStatsThunk.fulfilled, (state, action) => {
        if (
          !isRequestStateOwnedBy(state.requests.stats, action.meta.requestId)
        ) {
          return;
        }

        state.stats = action.payload?.data ?? null;

        setRequestSucceeded(
          state.requests.stats,
          action.payload?.message ?? null
        );
      })

      .addCase(fetchDashboardStatsThunk.rejected, (state, action) => {
        if (
          !isRequestStateOwnedBy(state.requests.stats, action.meta.requestId)
        ) {
          return;
        }

        setRequestFailed(
          state.requests.stats,
          getRejectedActionErrorMessage(
            action,
            "Unable to load Dashboard statistics. Please try again."
          )
        );
      })

      // -------------------- Payment Statistics --------------------

      .addCase(fetchDashboardPaymentStatsThunk.pending, (state, action) => {
        setRequestPending(state.requests.payments, action.meta.requestId);
      })

      .addCase(fetchDashboardPaymentStatsThunk.fulfilled, (state, action) => {
        if (
          !isRequestStateOwnedBy(state.requests.payments, action.meta.requestId)
        ) {
          return;
        }

        state.paymentStats = action.payload?.data ?? null;

        setRequestSucceeded(
          state.requests.payments,
          action.payload?.message ?? null
        );
      })

      .addCase(fetchDashboardPaymentStatsThunk.rejected, (state, action) => {
        if (
          !isRequestStateOwnedBy(state.requests.payments, action.meta.requestId)
        ) {
          return;
        }

        setRequestFailed(
          state.requests.payments,
          getRejectedActionErrorMessage(
            action,
            "Unable to load payment statistics. Please try again."
          )
        );
      })

      // -------------------- Return Statistics --------------------

      .addCase(fetchDashboardReturnStatsThunk.pending, (state, action) => {
        setRequestPending(state.requests.returns, action.meta.requestId);
      })

      .addCase(fetchDashboardReturnStatsThunk.fulfilled, (state, action) => {
        if (
          !isRequestStateOwnedBy(state.requests.returns, action.meta.requestId)
        ) {
          return;
        }

        state.returnStats = action.payload?.data ?? null;

        setRequestSucceeded(
          state.requests.returns,
          action.payload?.message ?? null
        );
      })

      .addCase(fetchDashboardReturnStatsThunk.rejected, (state, action) => {
        if (
          !isRequestStateOwnedBy(state.requests.returns, action.meta.requestId)
        ) {
          return;
        }

        setRequestFailed(
          state.requests.returns,
          getRejectedActionErrorMessage(
            action,
            "Unable to load return statistics. Please try again."
          )
        );
      })

      // -------------------- Recent Products --------------------

      .addCase(fetchDashboardRecentProductsThunk.pending, (state, action) => {
        setRequestPending(state.requests.recentProducts, action.meta.requestId);
      })

      .addCase(fetchDashboardRecentProductsThunk.fulfilled, (state, action) => {
        if (
          !isRequestStateOwnedBy(
            state.requests.recentProducts,
            action.meta.requestId
          )
        ) {
          return;
        }

        state.recentProducts = Array.isArray(action.payload?.data?.products)
          ? action.payload.data.products
          : [];

        state.recentProductsTotal = Number(action.payload?.data?.total) || 0;

        setRequestSucceeded(
          state.requests.recentProducts,
          action.payload?.message ?? null
        );
      })

      .addCase(fetchDashboardRecentProductsThunk.rejected, (state, action) => {
        if (
          !isRequestStateOwnedBy(
            state.requests.recentProducts,
            action.meta.requestId
          )
        ) {
          return;
        }

        setRequestFailed(
          state.requests.recentProducts,
          getRejectedActionErrorMessage(
            action,
            "Unable to load recent Products. Please try again."
          )
        );
      });
  },
});

export const {
  selectDashboardStats,
  selectDashboardPaymentStats,
  selectDashboardReturnStats,
  selectDashboardRecentProducts,
  selectDashboardRecentProductsTotal,
  selectDashboardStatsStatus,
  selectDashboardStatsError,
  selectIsDashboardStatsPending,
  selectDashboardPaymentStatsStatus,
  selectDashboardPaymentStatsError,
  selectIsDashboardPaymentStatsPending,
  selectDashboardReturnStatsStatus,
  selectDashboardReturnStatsError,
  selectIsDashboardReturnStatsPending,
  selectDashboardRecentProductsStatus,
  selectDashboardRecentProductsError,
  selectIsDashboardRecentProductsPending,
} = dashboardSlice.selectors;

export default dashboardSlice.reducer;
