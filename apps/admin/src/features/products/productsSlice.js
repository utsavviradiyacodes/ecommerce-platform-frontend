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
  addProduct,
  approveProduct,
  archiveProduct,
  getProductDetails,
  getProducts,
  rejectProduct,
  toggleProductStatus,
  updateProduct,
} from "./productsApi.js";

export const PRODUCTS_PAGE_SIZE = 10;

const pendingProductsListRequests = new Map();
let productsListRequestSequence = 0;

function toPositiveInteger(value, fallback) {
  const number = Number(value);

  return Number.isInteger(number) && number > 0 ? number : fallback;
}

function normalizeAvailability(value) {
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

function normalizeProductsQuery(options = {}) {
  return {
    page: toPositiveInteger(options.page, 1),
    limit: toPositiveInteger(options.limit, PRODUCTS_PAGE_SIZE),
    search: typeof options.search === "string" ? options.search.trim() : "",
    approvalStatus:
      typeof options.approvalStatus === "string"
        ? options.approvalStatus.trim()
        : "",
    isActive: normalizeAvailability(options.isActive),
  };
}

export function createProductsQueryKey(options = {}) {
  const query = normalizeProductsQuery(options);

  return JSON.stringify([
    query.page,
    query.limit,
    query.search,
    query.approvalStatus,
    query.isActive ?? null,
  ]);
}

function resolveProductsQueryKey(options = {}) {
  return typeof options.queryKey === "string" && options.queryKey
    ? options.queryKey
    : createProductsQueryKey(options);
}

function getProductId(argument) {
  return typeof argument === "string" ? argument : argument?.productId;
}

function canStartProductRequest(getState, requestName) {
  const requestState = getState().products?.requests?.[requestName];

  return requestState?.status !== REQUEST_STATUS.PENDING;
}

function normalizeProductsListResponse(response, fallbackPage) {
  const data = response?.data ?? {};
  const products = Array.isArray(data.products) ? data.products : [];
  const parsedTotal = Number(data.total);
  const parsedPage = Number(data.page);
  const parsedTotalPages = Number(data.totalPages);

  return {
    products,
    total:
      Number.isFinite(parsedTotal) && parsedTotal >= 0
        ? parsedTotal
        : products.length,
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

function createInitialState() {
  return {
    products: [],
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
    detailsProductId: null,

    mutationTargetIds: {
      update: null,
      approve: null,
      reject: null,
      toggle: null,
      archive: null,
    },

    requests: {
      list: createRequestState(),
      details: createRequestState(),
      create: createRequestState(),
      update: createRequestState(),
      approve: createRequestState(),
      reject: createRequestState(),
      toggle: createRequestState(),
      archive: createRequestState(),
    },
  };
}

const initialState = createInitialState();

export const fetchProductsThunk = createAsyncThunk(
  "products/fetchProducts",
  async (options = {}, { rejectWithValue }) => {
    const query = normalizeProductsQuery(options);
    const queryKey = resolveProductsQueryKey(options);

    try {
      const response = await getProducts(query);

      return { response, query, queryKey };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Unable to load products. Please try again.")
      );
    }
  },
  {
    condition: (options = {}, { getState }) => {
      const productsState = getState().products;
      const queryKey = resolveProductsQueryKey(options);

      return !productsState?.pendingListRequestIdsByQuery?.[queryKey];
    },
  }
);

export const fetchProductDetailsThunk = createAsyncThunk(
  "products/fetchProductDetails",
  async (argument, { rejectWithValue }) => {
    const productId = getProductId(argument);

    try {
      const response = await getProductDetails(productId);

      return { response, productId };
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Unable to load product details. Please try again."
        )
      );
    }
  },
  {
    condition: (argument, { getState }) => {
      const productsState = getState().products;
      const productId = getProductId(argument);

      return !(
        productsState?.requests.details.status === REQUEST_STATUS.PENDING &&
        productsState.detailsProductId === productId
      );
    },
  }
);

export const createProductThunk = createAsyncThunk(
  "products/createProduct",
  async (productData, { rejectWithValue }) => {
    try {
      return await addProduct(productData);
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Unable to add product. Please try again.")
      );
    }
  },
  {
    condition: (_, { getState }) =>
      canStartProductRequest(getState, "create"),
  }
);

export const updateProductThunk = createAsyncThunk(
  "products/updateProduct",
  async (productData, { rejectWithValue }) => {
    try {
      return await updateProduct(productData);
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Unable to update product. Please try again.")
      );
    }
  },
  {
    condition: (_, { getState }) =>
      canStartProductRequest(getState, "update"),
  }
);

export const approveProductThunk = createAsyncThunk(
  "products/approveProduct",
  async (argument, { rejectWithValue }) => {
    try {
      return await approveProduct(getProductId(argument));
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Unable to approve product. Please try again."
        )
      );
    }
  },
  {
    condition: (_, { getState }) =>
      canStartProductRequest(getState, "approve"),
  }
);

export const rejectProductThunk = createAsyncThunk(
  "products/rejectProduct",
  async (productData, { rejectWithValue }) => {
    try {
      return await rejectProduct(productData);
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Unable to reject product. Please try again."
        )
      );
    }
  },
  {
    condition: (_, { getState }) =>
      canStartProductRequest(getState, "reject"),
  }
);

export const toggleProductStatusThunk = createAsyncThunk(
  "products/toggleProductStatus",
  async (argument, { rejectWithValue }) => {
    try {
      return await toggleProductStatus(getProductId(argument));
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Unable to change product availability. Please try again."
        )
      );
    }
  },
  {
    condition: (_, { getState }) =>
      canStartProductRequest(getState, "toggle"),
  }
);

export const archiveProductThunk = createAsyncThunk(
  "products/archiveProduct",
  async (argument, { rejectWithValue }) => {
    try {
      return await archiveProduct(getProductId(argument));
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Unable to archive product. Please try again."
        )
      );
    }
  },
  {
    condition: (_, { getState }) =>
      canStartProductRequest(getState, "archive"),
  }
);

const productsSlice = createSlice({
  name: "products",
  initialState,

  reducers: {
    setProductsRequestedQuery(state, action) {
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

    requestProductsListRefresh(state, action) {
      const afterSequence = Number(action.payload);

      state.listRefreshRequirement.afterSequence =
        Number.isInteger(afterSequence) && afterSequence >= 0
          ? afterSequence
          : 0;
      state.listRefreshRequirement.version += 1;
    },

    clearProductsListRefreshRequirement(state, action) {
      if (state.listRefreshRequirement.version === action.payload) {
        state.listRefreshRequirement.afterSequence = null;
      }
    },

    clearProductsListRequestFeedback(state) {
      clearRequestFeedback(state.requests.list);
    },

    clearProductDetailsRequestFeedback(state) {
      clearRequestFeedback(state.requests.details);
    },

    clearProductDetails(state) {
      state.details = null;
      state.detailsProductId = null;
      resetRequestState(state.requests.details);
    },

    clearCreateProductRequestFeedback(state) {
      clearRequestFeedback(state.requests.create);
    },

    clearUpdateProductRequestFeedback(state) {
      clearRequestFeedback(state.requests.update);
    },

    clearApproveProductRequestFeedback(state) {
      clearRequestFeedback(state.requests.approve);
    },

    clearRejectProductRequestFeedback(state) {
      clearRequestFeedback(state.requests.reject);
    },

    clearToggleProductRequestFeedback(state) {
      clearRequestFeedback(state.requests.toggle);
    },

    clearArchiveProductRequestFeedback(state) {
      clearRequestFeedback(state.requests.archive);
    },

    clearProductMutationRequestFeedback(state) {
      clearRequestFeedback(state.requests.create);
      clearRequestFeedback(state.requests.update);
      clearRequestFeedback(state.requests.approve);
      clearRequestFeedback(state.requests.reject);
      clearRequestFeedback(state.requests.toggle);
      clearRequestFeedback(state.requests.archive);
    },

    resetProductMutationRequestStates(state) {
      resetRequestState(state.requests.create);
      resetRequestState(state.requests.update);
      resetRequestState(state.requests.approve);
      resetRequestState(state.requests.reject);
      resetRequestState(state.requests.toggle);
      resetRequestState(state.requests.archive);

      state.mutationTargetIds.update = null;
      state.mutationTargetIds.approve = null;
      state.mutationTargetIds.reject = null;
      state.mutationTargetIds.toggle = null;
      state.mutationTargetIds.archive = null;
    },

    resetProductsState() {
      return createInitialState();
    },
  },

  selectors: {
    selectProducts: (sliceState) => sliceState.products,
    selectProductsTotal: (sliceState) => sliceState.total,
    selectProductsPage: (sliceState) => sliceState.page,
    selectProductsTotalPages: (sliceState) => sliceState.totalPages,
    selectProductsRequestedQueryKey: (sliceState) =>
      sliceState.requestedQueryKey,
    selectProductsLoadedQueryKey: (sliceState) => sliceState.loadedQueryKey,
    selectProductsPendingListRequestIdsByQuery: (sliceState) =>
      sliceState.pendingListRequestIdsByQuery,
    selectProductsListRefreshRequirement: (sliceState) =>
      sliceState.listRefreshRequirement,

    selectProductsListStatus: (sliceState) =>
      sliceState.requests.list.status,
    selectIsProductsListPending: (sliceState) =>
      sliceState.requests.list.status === REQUEST_STATUS.PENDING,
    selectProductsListError: (sliceState) => sliceState.requests.list.error,

    selectProductDetails: (sliceState) => sliceState.details,
    selectProductDetailsProductId: (sliceState) =>
      sliceState.detailsProductId,
    selectProductDetailsStatus: (sliceState) =>
      sliceState.requests.details.status,
    selectIsProductDetailsPending: (sliceState) =>
      sliceState.requests.details.status === REQUEST_STATUS.PENDING,
    selectProductDetailsError: (sliceState) =>
      sliceState.requests.details.error,

    selectIsProductCreatePending: (sliceState) =>
      sliceState.requests.create.status === REQUEST_STATUS.PENDING,
    selectProductCreateError: (sliceState) =>
      sliceState.requests.create.error,
    selectProductCreateSuccessMessage: (sliceState) =>
      sliceState.requests.create.successMessage,

    selectIsProductUpdatePending: (sliceState) =>
      sliceState.requests.update.status === REQUEST_STATUS.PENDING,
    selectProductUpdateError: (sliceState) =>
      sliceState.requests.update.error,
    selectProductUpdateSuccessMessage: (sliceState) =>
      sliceState.requests.update.successMessage,

    selectIsProductApprovePending: (sliceState) =>
      sliceState.requests.approve.status === REQUEST_STATUS.PENDING,
    selectProductApproveError: (sliceState) =>
      sliceState.requests.approve.error,
    selectProductApproveSuccessMessage: (sliceState) =>
      sliceState.requests.approve.successMessage,

    selectIsProductRejectPending: (sliceState) =>
      sliceState.requests.reject.status === REQUEST_STATUS.PENDING,
    selectProductRejectError: (sliceState) =>
      sliceState.requests.reject.error,
    selectProductRejectSuccessMessage: (sliceState) =>
      sliceState.requests.reject.successMessage,

    selectIsProductTogglePending: (sliceState) =>
      sliceState.requests.toggle.status === REQUEST_STATUS.PENDING,
    selectProductToggleError: (sliceState) =>
      sliceState.requests.toggle.error,
    selectProductToggleSuccessMessage: (sliceState) =>
      sliceState.requests.toggle.successMessage,

    selectIsProductArchivePending: (sliceState) =>
      sliceState.requests.archive.status === REQUEST_STATUS.PENDING,
    selectProductArchiveError: (sliceState) =>
      sliceState.requests.archive.error,
    selectProductArchiveSuccessMessage: (sliceState) =>
      sliceState.requests.archive.successMessage,

    selectProductMutationTargetIds: (sliceState) =>
      sliceState.mutationTargetIds,
    selectProductUpdateTargetId: (sliceState) =>
      sliceState.mutationTargetIds.update,
    selectProductApproveTargetId: (sliceState) =>
      sliceState.mutationTargetIds.approve,
    selectProductRejectTargetId: (sliceState) =>
      sliceState.mutationTargetIds.reject,
    selectProductToggleTargetId: (sliceState) =>
      sliceState.mutationTargetIds.toggle,
    selectProductArchiveTargetId: (sliceState) =>
      sliceState.mutationTargetIds.archive,
  },

  extraReducers: (builder) => {
    builder

      // -------------------- Fetch Products --------------------

      .addCase(fetchProductsThunk.pending, (state, action) => {
        const queryKey = resolveProductsQueryKey(action.meta.arg);

        state.requestedQueryKey = queryKey;
        state.pendingListRequestIdsByQuery[queryKey] = action.meta.requestId;
        setRequestPending(state.requests.list, action.meta.requestId);
      })
      .addCase(fetchProductsThunk.fulfilled, (state, action) => {
        if (
          state.pendingListRequestIdsByQuery[action.payload.queryKey] ===
          action.meta.requestId
        ) {
          delete state.pendingListRequestIdsByQuery[action.payload.queryKey];
        }

        if (!isRequestStateOwnedBy(state.requests.list, action.meta.requestId)) {
          return;
        }

        const normalizedList = normalizeProductsListResponse(
          action.payload.response,
          action.payload.query.page
        );

        state.products = normalizedList.products;
        state.total = normalizedList.total;
        state.page = normalizedList.page;
        state.totalPages = normalizedList.totalPages;
        state.loadedQueryKey = action.payload.queryKey;

        setRequestSucceeded(state.requests.list);
      })
      .addCase(fetchProductsThunk.rejected, (state, action) => {
        const queryKey = resolveProductsQueryKey(action.meta.arg);

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
            "Unable to load products. Please try again."
          )
        );
      })

      // -------------------- Fetch Product Details --------------------

      .addCase(fetchProductDetailsThunk.pending, (state, action) => {
        state.details = null;
        state.detailsProductId = getProductId(action.meta.arg);
        setRequestPending(state.requests.details, action.meta.requestId);
      })
      .addCase(fetchProductDetailsThunk.fulfilled, (state, action) => {
        if (
          !isRequestStateOwnedBy(
            state.requests.details,
            action.meta.requestId
          )
        ) {
          return;
        }

        state.details = action.payload.response?.data ?? null;
        state.detailsProductId = action.payload.productId;

        setRequestSucceeded(state.requests.details);
      })
      .addCase(fetchProductDetailsThunk.rejected, (state, action) => {
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
            "Unable to load product details. Please try again."
          )
        );
      })

      // -------------------- Create Product --------------------

      .addCase(createProductThunk.pending, (state, action) => {
        setRequestPending(state.requests.create, action.meta.requestId);
      })
      .addCase(createProductThunk.fulfilled, (state, action) => {
        if (
          !isRequestStateOwnedBy(state.requests.create, action.meta.requestId)
        ) {
          return;
        }

        setRequestSucceeded(
          state.requests.create,
          action.payload?.message || "Product added successfully"
        );
      })
      .addCase(createProductThunk.rejected, (state, action) => {
        if (
          !isRequestStateOwnedBy(state.requests.create, action.meta.requestId)
        ) {
          return;
        }

        setRequestFailed(
          state.requests.create,
          getRejectedActionErrorMessage(
            action,
            "Unable to add product. Please try again."
          )
        );
      })

      // -------------------- Update Product --------------------

      .addCase(updateProductThunk.pending, (state, action) => {
        state.mutationTargetIds.update = getProductId(action.meta.arg);
        setRequestPending(state.requests.update, action.meta.requestId);
      })
      .addCase(updateProductThunk.fulfilled, (state, action) => {
        if (
          !isRequestStateOwnedBy(state.requests.update, action.meta.requestId)
        ) {
          return;
        }

        state.mutationTargetIds.update = null;
        setRequestSucceeded(
          state.requests.update,
          action.payload?.message || "Product updated successfully"
        );
      })
      .addCase(updateProductThunk.rejected, (state, action) => {
        if (
          !isRequestStateOwnedBy(state.requests.update, action.meta.requestId)
        ) {
          return;
        }

        state.mutationTargetIds.update = null;
        setRequestFailed(
          state.requests.update,
          getRejectedActionErrorMessage(
            action,
            "Unable to update product. Please try again."
          )
        );
      })

      // -------------------- Approve Product --------------------

      .addCase(approveProductThunk.pending, (state, action) => {
        state.mutationTargetIds.approve = getProductId(action.meta.arg);
        setRequestPending(state.requests.approve, action.meta.requestId);
      })
      .addCase(approveProductThunk.fulfilled, (state, action) => {
        if (
          !isRequestStateOwnedBy(state.requests.approve, action.meta.requestId)
        ) {
          return;
        }

        state.mutationTargetIds.approve = null;
        setRequestSucceeded(
          state.requests.approve,
          action.payload?.message || "Product approved successfully"
        );
      })
      .addCase(approveProductThunk.rejected, (state, action) => {
        if (
          !isRequestStateOwnedBy(state.requests.approve, action.meta.requestId)
        ) {
          return;
        }

        state.mutationTargetIds.approve = null;
        setRequestFailed(
          state.requests.approve,
          getRejectedActionErrorMessage(
            action,
            "Unable to approve product. Please try again."
          )
        );
      })

      // -------------------- Reject Product --------------------

      .addCase(rejectProductThunk.pending, (state, action) => {
        state.mutationTargetIds.reject = getProductId(action.meta.arg);
        setRequestPending(state.requests.reject, action.meta.requestId);
      })
      .addCase(rejectProductThunk.fulfilled, (state, action) => {
        if (
          !isRequestStateOwnedBy(state.requests.reject, action.meta.requestId)
        ) {
          return;
        }

        state.mutationTargetIds.reject = null;
        setRequestSucceeded(
          state.requests.reject,
          action.payload?.message || "Product rejected successfully"
        );
      })
      .addCase(rejectProductThunk.rejected, (state, action) => {
        if (
          !isRequestStateOwnedBy(state.requests.reject, action.meta.requestId)
        ) {
          return;
        }

        state.mutationTargetIds.reject = null;
        setRequestFailed(
          state.requests.reject,
          getRejectedActionErrorMessage(
            action,
            "Unable to reject product. Please try again."
          )
        );
      })

      // -------------------- Toggle Product Availability --------------------

      .addCase(toggleProductStatusThunk.pending, (state, action) => {
        state.mutationTargetIds.toggle = getProductId(action.meta.arg);
        setRequestPending(state.requests.toggle, action.meta.requestId);
      })
      .addCase(toggleProductStatusThunk.fulfilled, (state, action) => {
        if (
          !isRequestStateOwnedBy(state.requests.toggle, action.meta.requestId)
        ) {
          return;
        }

        state.mutationTargetIds.toggle = null;
        setRequestSucceeded(
          state.requests.toggle,
          action.payload?.message ||
            "Product availability changed successfully"
        );
      })
      .addCase(toggleProductStatusThunk.rejected, (state, action) => {
        if (
          !isRequestStateOwnedBy(state.requests.toggle, action.meta.requestId)
        ) {
          return;
        }

        state.mutationTargetIds.toggle = null;
        setRequestFailed(
          state.requests.toggle,
          getRejectedActionErrorMessage(
            action,
            "Unable to change product availability. Please try again."
          )
        );
      })

      // -------------------- Archive Product --------------------

      .addCase(archiveProductThunk.pending, (state, action) => {
        state.mutationTargetIds.archive = getProductId(action.meta.arg);
        setRequestPending(state.requests.archive, action.meta.requestId);
      })
      .addCase(archiveProductThunk.fulfilled, (state, action) => {
        if (
          !isRequestStateOwnedBy(state.requests.archive, action.meta.requestId)
        ) {
          return;
        }

        state.mutationTargetIds.archive = null;
        setRequestSucceeded(
          state.requests.archive,
          action.payload?.message || "Product archived successfully"
        );
      })
      .addCase(archiveProductThunk.rejected, (state, action) => {
        if (
          !isRequestStateOwnedBy(state.requests.archive, action.meta.requestId)
        ) {
          return;
        }

        state.mutationTargetIds.archive = null;
        setRequestFailed(
          state.requests.archive,
          getRejectedActionErrorMessage(
            action,
            "Unable to archive product. Please try again."
          )
        );
      });
  },
});

export const {
  setProductsRequestedQuery,
  requestProductsListRefresh,
  clearProductsListRefreshRequirement,
  clearProductsListRequestFeedback,
  clearProductDetailsRequestFeedback,
  clearProductDetails,
  clearCreateProductRequestFeedback,
  clearUpdateProductRequestFeedback,
  clearApproveProductRequestFeedback,
  clearRejectProductRequestFeedback,
  clearToggleProductRequestFeedback,
  clearArchiveProductRequestFeedback,
  clearProductMutationRequestFeedback,
  resetProductMutationRequestStates,
  resetProductsState,
} = productsSlice.actions;

export const {
  selectProducts,
  selectProductsTotal,
  selectProductsPage,
  selectProductsTotalPages,
  selectProductsRequestedQueryKey,
  selectProductsLoadedQueryKey,
  selectProductsPendingListRequestIdsByQuery,
  selectProductsListRefreshRequirement,
  selectProductsListStatus,
  selectIsProductsListPending,
  selectProductsListError,
  selectProductDetails,
  selectProductDetailsProductId,
  selectProductDetailsStatus,
  selectIsProductDetailsPending,
  selectProductDetailsError,
  selectIsProductCreatePending,
  selectProductCreateError,
  selectProductCreateSuccessMessage,
  selectIsProductUpdatePending,
  selectProductUpdateError,
  selectProductUpdateSuccessMessage,
  selectIsProductApprovePending,
  selectProductApproveError,
  selectProductApproveSuccessMessage,
  selectIsProductRejectPending,
  selectProductRejectError,
  selectProductRejectSuccessMessage,
  selectIsProductTogglePending,
  selectProductToggleError,
  selectProductToggleSuccessMessage,
  selectIsProductArchivePending,
  selectProductArchiveError,
  selectProductArchiveSuccessMessage,
  selectProductMutationTargetIds,
  selectProductUpdateTargetId,
  selectProductApproveTargetId,
  selectProductRejectTargetId,
  selectProductToggleTargetId,
  selectProductArchiveTargetId,
} = productsSlice.selectors;

export function getProductsListRequestSequence() {
  return productsListRequestSequence;
}

export function getPendingProductsListRequest(options = {}) {
  return (
    pendingProductsListRequests.get(resolveProductsQueryKey(options)) ?? null
  );
}

export function requestProductsListThunk(options = {}) {
  return (dispatch) => {
    const queryKey = resolveProductsQueryKey(options);
    const pendingRequest = pendingProductsListRequests.get(queryKey);

    dispatch(
      setProductsRequestedQuery({
        queryKey,
        requestId: pendingRequest?.requestId ?? null,
      })
    );

    if (pendingRequest) {
      return pendingRequest.promise;
    }

    const sequence = ++productsListRequestSequence;
    const requestPromise = dispatch(
      fetchProductsThunk({ ...options, queryKey })
    );
    const requestRecord = {
      promise: requestPromise,
      requestId: requestPromise.requestId,
      sequence,
    };

    pendingProductsListRequests.set(queryKey, requestRecord);

    requestPromise.finally(() => {
      if (pendingProductsListRequests.get(queryKey) === requestRecord) {
        pendingProductsListRequests.delete(queryKey);
      }
    });

    return requestPromise;
  };
}

export default productsSlice.reducer;
