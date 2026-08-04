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
  getOrdersDashboardStats,
  getOrdersSellerPage,
  getSellerOrdersPage,
} from "./ordersApi.js";

export const ORDERS_PAGE_SIZE = 10;

const INVENTORY_API_PAGE_SIZE = 50;
const SELLER_BATCH_SIZE = 4;

export const ORDER_STATUS_KEYS = [
  "placed",
  "confirmed",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

function normalizeText(value) {
  return typeof value === "string" ? value.trim() : "";
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

function getNonNegativeInteger(value) {
  const number = Number(value);

  return Number.isSafeInteger(number) && number >= 0 ? number : null;
}

function getNonNegativeNumber(value) {
  if (
    value === null ||
    value === undefined ||
    (typeof value === "string" && !value.trim())
  ) {
    return null;
  }

  const number = Number(value);

  return Number.isFinite(number) && number >= 0 ? number : null;
}

function getSafeTotalPages(value) {
  const totalPages = Number(value);

  if (Number.isSafeInteger(totalPages) && totalPages > 0) {
    return totalPages;
  }

  if (totalPages === 0) {
    return 1;
  }

  return null;
}

function createEmptyStatusCounts() {
  return ORDER_STATUS_KEYS.reduce((counts, status) => {
    counts[status] = 0;
    return counts;
  }, {});
}

function normalizeSellerPageResponse(response) {
  const data = response?.data;
  const total = getNonNegativeInteger(data?.total);
  const totalPages = getSafeTotalPages(data?.totalPages);

  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    !Array.isArray(data.sellers) ||
    total === null ||
    totalPages === null
  ) {
    throw new Error("The Seller directory response was invalid.");
  }

  return {
    sellers: data.sellers,
    total,
    totalPages,
  };
}

function normalizeSellerOrdersPageResponse(response) {
  const data = response?.data;
  const total = getNonNegativeInteger(data?.total);
  const totalPages = getSafeTotalPages(data?.totalPages);

  if (
    !data ||
    typeof data !== "object" ||
    Array.isArray(data) ||
    !Array.isArray(data.orders) ||
    total === null ||
    totalPages === null
  ) {
    throw new Error("The Seller Order response was invalid.");
  }

  return {
    orders: data.orders,
    total,
    totalPages,
  };
}

async function fetchAllSellers(signal) {
  const sellersById = new Map();
  let page = 1;
  let totalPages = 1;
  let expectedSellerTotal = null;
  let hasMalformedSeller = false;

  while (page <= totalPages) {
    const response = await getOrdersSellerPage({
      page,
      limit: INVENTORY_API_PAGE_SIZE,
      signal,
    });
    const normalizedPage = normalizeSellerPageResponse(response);

    expectedSellerTotal ??= normalizedPage.total;
    totalPages = Math.max(totalPages, normalizedPage.totalPages);

    normalizedPage.sellers.forEach((seller) => {
      const sellerId = getEntityId(seller);

      if (!sellerId || !seller || typeof seller !== "object") {
        hasMalformedSeller = true;
        return;
      }

      sellersById.set(sellerId, seller);
    });

    page += 1;
  }

  if (sellersById.size !== expectedSellerTotal) {
    hasMalformedSeller = true;
  }

  return {
    sellers: Array.from(sellersById.values()),
    hasMalformedSeller,
  };
}

async function fetchAllOrdersForSeller(sellerId, signal) {
  const orders = [];
  let page = 1;
  let totalPages = 1;
  let expectedOrderTotal = null;
  let hasPageDrift = false;

  while (page <= totalPages) {
    const response = await getSellerOrdersPage(sellerId, {
      page,
      limit: INVENTORY_API_PAGE_SIZE,
      signal,
    });
    const normalizedPage = normalizeSellerOrdersPageResponse(response);

    expectedOrderTotal ??= normalizedPage.total;
    totalPages = Math.max(totalPages, normalizedPage.totalPages);
    orders.push(...normalizedPage.orders);
    page += 1;
  }

  if (orders.length !== expectedOrderTotal) {
    hasPageDrift = true;
  }

  return { orders, hasPageDrift };
}

async function fetchSellerOrderBatches(sellers, signal) {
  const orderCopies = [];
  const failedSellerIds = [];
  let hasPageDrift = false;

  for (let index = 0; index < sellers.length; index += SELLER_BATCH_SIZE) {
    const batch = sellers.slice(index, index + SELLER_BATCH_SIZE);
    const batchResults = await Promise.all(
      batch.map(async (seller) => {
        const sellerId = getEntityId(seller);

        try {
          return {
            sellerId,
            success: true,
            ...(await fetchAllOrdersForSeller(sellerId, signal)),
          };
        } catch (error) {
          if (signal.aborted) {
            throw error;
          }

          return {
            sellerId,
            success: false,
            orders: [],
            hasPageDrift: false,
          };
        }
      })
    );

    batchResults.forEach((result) => {
      if (!result.success) {
        failedSellerIds.push(result.sellerId);
        return;
      }

      orderCopies.push(...result.orders);
      hasPageDrift ||= result.hasPageDrift;
    });
  }

  return { orderCopies, failedSellerIds, hasPageDrift };
}

function getTimestamp(value) {
  const normalizedValue = normalizeText(value);

  if (!normalizedValue) {
    return null;
  }

  const timestamp = new Date(normalizedValue).getTime();

  return Number.isNaN(timestamp) ? null : timestamp;
}

function choosePreferredOrder(currentOrder, candidateOrder) {
  const currentUpdatedAt = getTimestamp(currentOrder?.updatedAt);
  const candidateUpdatedAt = getTimestamp(candidateOrder?.updatedAt);

  if (
    candidateUpdatedAt !== null &&
    (currentUpdatedAt === null || candidateUpdatedAt > currentUpdatedAt)
  ) {
    return candidateOrder;
  }

  return currentOrder;
}

function createSellerDirectory(sellers) {
  return sellers.reduce((directory, seller) => {
    const sellerId = getEntityId(seller);

    if (!sellerId) {
      return directory;
    }

    directory.set(sellerId, {
      _id: sellerId,
      name: normalizeText(seller?.name),
      shopName: normalizeText(seller?.shopName),
      email: normalizeText(seller?.email),
    });

    return directory;
  }, new Map());
}

function enrichOrderSellers(order, sellerDirectory) {
  const orderItems = Array.isArray(order?.orderItems)
    ? order.orderItems.map((item) => {
        if (!item || typeof item !== "object" || Array.isArray(item)) {
          return item;
        }

        const sellerId = getEntityId(item.seller);
        const seller = sellerDirectory.get(sellerId);

        return seller ? { ...item, seller } : item;
      })
    : order?.orderItems;

  return { ...order, orderItems };
}

function reconstructOrders(orderCopies, sellers) {
  const ordersById = new Map();
  let hasMalformedOrder = false;

  orderCopies.forEach((order) => {
    const orderId = getEntityId(order);

    if (!orderId || !order || typeof order !== "object" || Array.isArray(order)) {
      hasMalformedOrder = true;
      return;
    }

    const existingOrder = ordersById.get(orderId);

    ordersById.set(
      orderId,
      existingOrder ? choosePreferredOrder(existingOrder, order) : order
    );
  });

  const sellerDirectory = createSellerDirectory(sellers);
  const orders = Array.from(ordersById.values()).map((order) =>
    enrichOrderSellers(order, sellerDirectory)
  );

  return { orders, hasMalformedOrder };
}

function createActualSummary(orders) {
  const byStatus = createEmptyStatusCounts();
  let hasUnknownStatus = false;

  orders.forEach((order) => {
    const orderStatus = normalizeText(order?.orderStatus).toLowerCase();

    if (!Object.hasOwn(byStatus, orderStatus)) {
      hasUnknownStatus = true;
      return;
    }

    byStatus[orderStatus] += 1;
  });

  return {
    summary: {
      total: orders.length,
      byStatus,
    },
    hasUnknownStatus,
  };
}

function normalizeDashboardSummary(response) {
  const data = response?.data;
  const total = getNonNegativeInteger(data?.orders?.total);
  const byStatus = createEmptyStatusCounts();
  let isValid = total !== null;

  ORDER_STATUS_KEYS.forEach((status) => {
    const count = getNonNegativeInteger(data?.orders?.[status]);

    if (count === null) {
      isValid = false;
    } else {
      byStatus[status] = count;
    }
  });

  const totalRevenue = getNonNegativeNumber(data?.totalRevenue);

  return {
    summary: isValid
      ? {
          total,
          byStatus,
          totalRevenue,
        }
      : null,
    isValid,
  };
}

function summariesMatch(actual, expected) {
  return (
    actual.total === expected.total &&
    ORDER_STATUS_KEYS.every(
      (status) => actual.byStatus[status] === expected.byStatus[status]
    )
  );
}

function createInitialState() {
  return {
    orders: [],
    coverage: {
      status: "idle",
      expected: null,
      actual: null,
      failedSellerIds: [],
      loadedAt: null,
      isStale: false,
    },
    details: null,
    detailsOrderId: null,
    requests: {
      inventory: createRequestState(),
      details: createRequestState(),
    },
  };
}

const initialState = createInitialState();

export const fetchOrdersInventoryThunk = createAsyncThunk(
  "orders/fetchInventory",
  async (_options, { getState, rejectWithValue, signal }) => {
    try {
      const { sellers, hasMalformedSeller } = await fetchAllSellers(signal);
      const { orderCopies, failedSellerIds, hasPageDrift } =
        await fetchSellerOrderBatches(sellers, signal);
      const { orders, hasMalformedOrder } = reconstructOrders(
        orderCopies,
        sellers
      );
      const { summary: actual, hasUnknownStatus } =
        createActualSummary(orders);
      const isSuperAdmin = getState().auth?.admin?.isSuperAdmin === true;

      let expected = null;
      let dashboardError = "";

      if (isSuperAdmin) {
        try {
          const dashboardResponse = await getOrdersDashboardStats({ signal });
          const normalizedDashboard =
            normalizeDashboardSummary(dashboardResponse);

          expected = normalizedDashboard.summary;

          if (!normalizedDashboard.isValid) {
            dashboardError = "The Dashboard statistics response was invalid.";
          }
        } catch (error) {
          if (signal.aborted) {
            throw error;
          }

          dashboardError = getApiErrorMessage(
            error,
            "Unable to load platform Order statistics."
          );
        }
      }

      const hasEnumerationProblem =
        hasMalformedSeller ||
        hasPageDrift ||
        hasMalformedOrder ||
        hasUnknownStatus ||
        failedSellerIds.length > 0;

      let coverageStatus = "partial";

      if (!hasEnumerationProblem && !dashboardError) {
        if (!isSuperAdmin) {
          coverageStatus = "enumerated";
        } else {
          coverageStatus = summariesMatch(actual, expected)
            ? "matched"
            : "mismatch";
        }
      }

      const partialReasons = [];

      if (failedSellerIds.length > 0) {
        partialReasons.push(
          `${failedSellerIds.length} Seller Order request${
            failedSellerIds.length === 1 ? "" : "s"
          } failed.`
        );
      }

      if (
        hasMalformedSeller ||
        hasPageDrift ||
        hasMalformedOrder ||
        hasUnknownStatus
      ) {
        partialReasons.push(
          "Some Seller or Order records could not be validated safely."
        );
      }

      if (dashboardError) {
        partialReasons.push(dashboardError);
      }

      return {
        orders,
        coverage: {
          status: coverageStatus,
          expected,
          actual,
          failedSellerIds,
          loadedAt: new Date().toISOString(),
          isStale: false,
        },
        shouldPreserveCachedOrders: hasEnumerationProblem,
        requestError: partialReasons.join(" "),
      };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Unable to reconstruct the available Order inventory. Please try again."
        )
      );
    }
  },
  {
    condition: (_options, { getState }) =>
      getState().orders?.requests.inventory.status !== REQUEST_STATUS.PENDING,
  }
);

export const fetchOrderDetailsThunk = createAsyncThunk(
  "orders/fetchDetails",
  async (argument, { rejectWithValue, signal }) => {
    const orderId = getOrderId(argument);

    try {
      if (!orderId) {
        throw new Error("Order ID is required.");
      }

      const response = await getOrderDetails(orderId, { signal });
      const order = response?.data;

      if (
        !order ||
        typeof order !== "object" ||
        Array.isArray(order) ||
        getEntityId(order) !== orderId
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
    selectOrdersCoverage: (sliceState) => sliceState.coverage,
    selectOrdersInventoryStatus: (sliceState) =>
      sliceState.requests.inventory.status,
    selectOrdersInventoryError: (sliceState) =>
      sliceState.requests.inventory.error,
    selectIsOrdersInventoryPending: (sliceState) =>
      sliceState.requests.inventory.status === REQUEST_STATUS.PENDING,
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
      .addCase(fetchOrdersInventoryThunk.pending, (state, action) => {
        setRequestPending(state.requests.inventory, action.meta.requestId);
      })
      .addCase(fetchOrdersInventoryThunk.fulfilled, (state, action) => {
        if (
          !isRequestStateOwnedBy(
            state.requests.inventory,
            action.meta.requestId
          )
        ) {
          return;
        }

        const hasCachedInventory = Boolean(state.coverage.loadedAt);
        const preserveCachedOrders =
          hasCachedInventory && action.payload.shouldPreserveCachedOrders;

        if (preserveCachedOrders) {
          state.coverage.status = "partial";
          state.coverage.failedSellerIds =
            action.payload.coverage.failedSellerIds;
          state.coverage.isStale = true;

          if (action.payload.coverage.expected) {
            state.coverage.expected = action.payload.coverage.expected;
          }
        } else {
          state.orders = action.payload.orders;
          state.coverage = action.payload.coverage;
        }

        if (action.payload.coverage.status === "partial") {
          setRequestFailed(
            state.requests.inventory,
            action.payload.requestError ||
              "The available Order inventory could not be refreshed completely."
          );
        } else {
          setRequestSucceeded(state.requests.inventory);
        }
      })
      .addCase(fetchOrdersInventoryThunk.rejected, (state, action) => {
        if (
          !isRequestStateOwnedBy(
            state.requests.inventory,
            action.meta.requestId
          )
        ) {
          return;
        }

        if (action.meta.aborted) {
          resetRequestState(state.requests.inventory);
          return;
        }

        const hasCachedInventory = Boolean(state.coverage.loadedAt);

        state.coverage.status = "partial";
        state.coverage.isStale = hasCachedInventory;
        setRequestFailed(
          state.requests.inventory,
          getRejectedActionErrorMessage(
            action,
            "Unable to reconstruct the available Order inventory. Please try again."
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

        if (action.meta.aborted) {
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
  selectOrdersCoverage,
  selectOrdersInventoryStatus,
  selectOrdersInventoryError,
  selectIsOrdersInventoryPending,
  selectOrderDetails,
  selectOrderDetailsOrderId,
  selectOrderDetailsStatus,
  selectOrderDetailsError,
  selectIsOrderDetailsPending,
} = ordersSlice.selectors;

export default ordersSlice.reducer;
