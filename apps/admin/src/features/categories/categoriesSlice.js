import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  addCategory,
  getAllCategories,
  updateCategory,
} from "./categoriesApi.js";

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

const initialState = {
  categories: [],
  total: 0,

  requests: {
    list: createRequestState(),
    create: createRequestState(),
    update: createRequestState(),
  },
};

export const fetchCategoriesThunk = createAsyncThunk(
  "categories/fetchCategories",
  async (_options, { rejectWithValue }) => {
    try {
      const response = await getAllCategories();

      return response;
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Unable to load categories. Please try again."
        )
      );
    }
  },
  {
    condition: (options, { getState }) => {
      if (options?.force) {
        return true;
      }

      const listStatus = getState().categories.requests.list.status;

      return listStatus !== REQUEST_STATUS.PENDING;
    },
  }
);

export const createCategoryThunk = createAsyncThunk(
  "categories/createCategory",
  async (categoryData, { rejectWithValue }) => {
    try {
      const response = await addCategory(categoryData);

      return response;
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(error, "Unable to add category. Please try again.")
      );
    }
  },
  {
    condition: (_, { getState }) => {
      const createStatus = getState().categories.requests.create.status;

      return createStatus !== REQUEST_STATUS.PENDING;
    },
  }
);

export const updateCategoryThunk = createAsyncThunk(
  "categories/updateCategory",
  async (categoryData, { rejectWithValue }) => {
    try {
      const response = await updateCategory(categoryData);

      return response;
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Unable to update category. Please try again."
        )
      );
    }
  },
  {
    condition: (_, { getState }) => {
      const updateStatus = getState().categories.requests.update.status;

      return updateStatus !== REQUEST_STATUS.PENDING;
    },
  }
);

const categoriesSlice = createSlice({
  name: "categories",
  initialState,

  reducers: {
    clearCreateCategoryRequestFeedback(state) {
      clearRequestFeedback(state.requests.create);
    },

    clearUpdateCategoryRequestFeedback(state) {
      clearRequestFeedback(state.requests.update);
    },

    resetCategoryMutationRequestStates(state) {
      resetRequestState(state.requests.create);
      resetRequestState(state.requests.update);
    },
  },

  selectors: {
    selectCategories: (sliceState) => sliceState.categories,

    selectCategoriesListStatus: (sliceState) =>
      sliceState.requests.list.status,

    selectIsCategoriesListPending: (sliceState) =>
      sliceState.requests.list.status === REQUEST_STATUS.PENDING,

    selectCategoriesListError: (sliceState) => sliceState.requests.list.error,

    selectIsCategoryCreatePending: (sliceState) =>
      sliceState.requests.create.status === REQUEST_STATUS.PENDING,

    selectCategoryCreateError: (sliceState) => sliceState.requests.create.error,

    selectCategoryCreateSuccessMessage: (sliceState) =>
      sliceState.requests.create.successMessage,

    selectIsCategoryUpdatePending: (sliceState) =>
      sliceState.requests.update.status === REQUEST_STATUS.PENDING,

    selectCategoryUpdateError: (sliceState) => sliceState.requests.update.error,

    selectCategoryUpdateSuccessMessage: (sliceState) =>
      sliceState.requests.update.successMessage,
  },

  extraReducers: (builder) => {
    builder

      // -------------------- Fetch Categories --------------------

      .addCase(fetchCategoriesThunk.pending, (state, action) => {
        setRequestPending(state.requests.list, action.meta.requestId);
      })
      .addCase(fetchCategoriesThunk.fulfilled, (state, action) => {
        if (
          !isRequestStateOwnedBy(state.requests.list, action.meta.requestId)
        ) {
          return;
        }

        state.categories = action.payload.data.categories;
        state.total = action.payload.data.total;

        setRequestSucceeded(
          state.requests.list,
          action.payload.message || null
        );
      })
      .addCase(fetchCategoriesThunk.rejected, (state, action) => {
        if (
          !isRequestStateOwnedBy(state.requests.list, action.meta.requestId)
        ) {
          return;
        }

        setRequestFailed(
          state.requests.list,
          getRejectedActionErrorMessage(
            action,
            "Unable to load categories. Please try again."
          )
        );
      })

      // -------------------- Create Category --------------------

      .addCase(createCategoryThunk.pending, (state, action) => {
        setRequestPending(state.requests.create, action.meta.requestId);
      })
      .addCase(createCategoryThunk.fulfilled, (state, action) => {
        if (
          !isRequestStateOwnedBy(state.requests.create, action.meta.requestId)
        ) {
          return;
        }

        setRequestSucceeded(
          state.requests.create,
          action.payload.message || "Category added successfully"
        );
      })
      .addCase(createCategoryThunk.rejected, (state, action) => {
        if (
          !isRequestStateOwnedBy(state.requests.create, action.meta.requestId)
        ) {
          return;
        }

        setRequestFailed(
          state.requests.create,
          getRejectedActionErrorMessage(
            action,
            "Unable to add category. Please try again."
          )
        );
      })

      // -------------------- Update Category --------------------

      .addCase(updateCategoryThunk.pending, (state, action) => {
        setRequestPending(state.requests.update, action.meta.requestId);
      })
      .addCase(updateCategoryThunk.fulfilled, (state, action) => {
        if (
          !isRequestStateOwnedBy(state.requests.update, action.meta.requestId)
        ) {
          return;
        }

        setRequestSucceeded(
          state.requests.update,
          action.payload.message || "Category updated successfully"
        );
      })
      .addCase(updateCategoryThunk.rejected, (state, action) => {
        if (
          !isRequestStateOwnedBy(state.requests.update, action.meta.requestId)
        ) {
          return;
        }

        setRequestFailed(
          state.requests.update,
          getRejectedActionErrorMessage(
            action,
            "Unable to update category. Please try again."
          )
        );
      });
  },
});

export const {
  clearCreateCategoryRequestFeedback,
  clearUpdateCategoryRequestFeedback,
  resetCategoryMutationRequestStates,
} = categoriesSlice.actions;

export const {
  selectCategories,
  selectCategoriesListStatus,
  selectIsCategoriesListPending,
  selectCategoriesListError,
  selectIsCategoryCreatePending,
  selectCategoryCreateError,
  selectCategoryCreateSuccessMessage,
  selectIsCategoryUpdatePending,
  selectCategoryUpdateError,
  selectCategoryUpdateSuccessMessage,
} = categoriesSlice.selectors;

export default categoriesSlice.reducer;
