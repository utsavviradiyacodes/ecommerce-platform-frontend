import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import {
  clearRequestFeedback,
  createRequestState,
  getRejectedActionErrorMessage,
  isRequestStateOwnedBy,
  REQUEST_STATUS,
  resetRequestState,
  setRequestFailed,
  setRequestPending,
  setRequestSucceeded,
} from "../../utils/redux/requestState.js";
import { getApiErrorMessage } from "../../utils/api/getApiErrorMessage.js";
import {
  addSubcategory,
  deleteSubcategory,
  getAllSubcategories,
  updateSubcategory,
} from "./subcategoriesApi.js";

const initialState = {
  subcategories: [],
  total: 0,

  requests: {
    list: createRequestState(),
    create: createRequestState(),
    update: createRequestState(),
    delete: createRequestState(),
  },
};

export const fetchSubcategoriesThunk = createAsyncThunk(
  "subcategories/fetchSubcategories",
  async (_options, { rejectWithValue }) => {
    try {
      const response = await getAllSubcategories();

      return response;
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Unable to load subcategories. Please try again."
        )
      );
    }
  },
  {
    condition: (options, { getState }) => {
      if (options?.force) {
        return true;
      }

      const listStatus = getState().subcategories.requests.list.status;

      return listStatus !== REQUEST_STATUS.PENDING;
    },
  }
);

export const createSubcategoryThunk = createAsyncThunk(
  "subcategories/createSubcategory",
  async (subcategoryData, { rejectWithValue }) => {
    try {
      const response = await addSubcategory(subcategoryData);

      return response;
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Unable to add subcategory. Please try again."
        )
      );
    }
  },
  {
    condition: (_, { getState }) => {
      const createStatus = getState().subcategories.requests.create.status;

      return createStatus !== REQUEST_STATUS.PENDING;
    },
  }
);

export const updateSubcategoryThunk = createAsyncThunk(
  "subcategories/updateSubcategory",
  async (subcategoryData, { rejectWithValue }) => {
    try {
      const response = await updateSubcategory(subcategoryData);

      return response;
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Unable to update subcategory. Please try again."
        )
      );
    }
  },
  {
    condition: (_, { getState }) => {
      const updateStatus = getState().subcategories.requests.update.status;

      return updateStatus !== REQUEST_STATUS.PENDING;
    },
  }
);

export const deleteSubcategoryThunk = createAsyncThunk(
  "subcategories/deleteSubcategory",
  async (subcategoryId, { rejectWithValue }) => {
    try {
      const response = await deleteSubcategory(subcategoryId);

      return response;
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Unable to delete subcategory. Please try again."
        )
      );
    }
  },
  {
    condition: (_, { getState }) => {
      const deleteStatus = getState().subcategories.requests.delete.status;

      return deleteStatus !== REQUEST_STATUS.PENDING;
    },
  }
);

const subcategoriesSlice = createSlice({
  name: "subcategories",
  initialState,

  reducers: {
    clearCreateSubcategoryRequestFeedback(state) {
      clearRequestFeedback(state.requests.create);
    },
    clearUpdateSubcategoryRequestFeedback(state) {
      clearRequestFeedback(state.requests.update);
    },
    clearDeleteSubcategoryRequestFeedback(state) {
      clearRequestFeedback(state.requests.delete);
    },
    resetSubcategoryMutationRequestStates(state) {
      resetRequestState(state.requests.create);
      resetRequestState(state.requests.update);
      resetRequestState(state.requests.delete);
    },
  },

  selectors: {
    selectSubcategories: (sliceState) => sliceState.subcategories,

    selectSubcategoriesListStatus: (sliceState) =>
      sliceState.requests.list.status,

    selectIsSubcategoriesListPending: (sliceState) =>
      sliceState.requests.list.status === REQUEST_STATUS.PENDING,

    selectSubcategoriesListError: (sliceState) =>
      sliceState.requests.list.error,

    selectIsSubcategoryCreatePending: (sliceState) =>
      sliceState.requests.create.status === REQUEST_STATUS.PENDING,

    selectSubcategoryCreateError: (sliceState) =>
      sliceState.requests.create.error,

    selectSubcategoryCreateSuccessMessage: (sliceState) =>
      sliceState.requests.create.successMessage,

    selectIsSubcategoryUpdatePending: (sliceState) =>
      sliceState.requests.update.status === REQUEST_STATUS.PENDING,

    selectSubcategoryUpdateError: (sliceState) =>
      sliceState.requests.update.error,

    selectSubcategoryUpdateSuccessMessage: (sliceState) =>
      sliceState.requests.update.successMessage,

    selectIsSubcategoryDeletePending: (sliceState) =>
      sliceState.requests.delete.status === REQUEST_STATUS.PENDING,

    selectSubcategoryDeleteError: (sliceState) =>
      sliceState.requests.delete.error,

    selectSubcategoryDeleteSuccessMessage: (sliceState) =>
      sliceState.requests.delete.successMessage,
  },

  extraReducers: (builder) => {
    builder

      // -------------------- Fetch Subcategories --------------------

      .addCase(fetchSubcategoriesThunk.pending, (state, action) => {
        setRequestPending(state.requests.list, action.meta.requestId);
      })
      .addCase(fetchSubcategoriesThunk.fulfilled, (state, action) => {
        if (
          !isRequestStateOwnedBy(state.requests.list, action.meta.requestId)
        ) {
          return;
        }

        state.subcategories = action.payload.data;
        state.total = action.payload.total;

        setRequestSucceeded(
          state.requests.list,
          action.payload.message || null
        );
      })
      .addCase(fetchSubcategoriesThunk.rejected, (state, action) => {
        if (
          !isRequestStateOwnedBy(state.requests.list, action.meta.requestId)
        ) {
          return;
        }

        setRequestFailed(
          state.requests.list,
          getRejectedActionErrorMessage(
            action,
            "Unable to load subcategories. Please try again."
          )
        );
      })

      // -------------------- Create Subcategory --------------------

      .addCase(createSubcategoryThunk.pending, (state, action) => {
        setRequestPending(state.requests.create, action.meta.requestId);
      })
      .addCase(createSubcategoryThunk.fulfilled, (state, action) => {
        if (
          !isRequestStateOwnedBy(state.requests.create, action.meta.requestId)
        ) {
          return;
        }

        setRequestSucceeded(
          state.requests.create,
          action.payload.message || "Subcategory added successfully"
        );
      })
      .addCase(createSubcategoryThunk.rejected, (state, action) => {
        if (
          !isRequestStateOwnedBy(state.requests.create, action.meta.requestId)
        ) {
          return;
        }

        setRequestFailed(
          state.requests.create,
          getRejectedActionErrorMessage(
            action,
            "Unable to add subcategory. Please try again."
          )
        );
      })

      // -------------------- Update Subcategory --------------------

      .addCase(updateSubcategoryThunk.pending, (state, action) => {
        setRequestPending(state.requests.update, action.meta.requestId);
      })
      .addCase(updateSubcategoryThunk.fulfilled, (state, action) => {
        if (
          !isRequestStateOwnedBy(state.requests.update, action.meta.requestId)
        ) {
          return;
        }

        setRequestSucceeded(
          state.requests.update,
          action.payload.message || "Subcategory updated successfully"
        );
      })
      .addCase(updateSubcategoryThunk.rejected, (state, action) => {
        if (
          !isRequestStateOwnedBy(state.requests.update, action.meta.requestId)
        ) {
          return;
        }

        setRequestFailed(
          state.requests.update,
          getRejectedActionErrorMessage(
            action,
            "Unable to update subcategory. Please try again."
          )
        );
      })

      // -------------------- Delete Subcategory --------------------

      .addCase(deleteSubcategoryThunk.pending, (state, action) => {
        setRequestPending(state.requests.delete, action.meta.requestId);
      })
      .addCase(deleteSubcategoryThunk.fulfilled, (state, action) => {
        if (
          !isRequestStateOwnedBy(state.requests.delete, action.meta.requestId)
        ) {
          return;
        }

        setRequestSucceeded(
          state.requests.delete,
          action.payload.message || "Subcategory deleted successfully"
        );
      })
      .addCase(deleteSubcategoryThunk.rejected, (state, action) => {
        if (
          !isRequestStateOwnedBy(state.requests.delete, action.meta.requestId)
        ) {
          return;
        }

        setRequestFailed(
          state.requests.delete,
          getRejectedActionErrorMessage(
            action,
            "Unable to delete subcategory. Please try again."
          )
        );
      });
  },
});

export const {
  clearCreateSubcategoryRequestFeedback,
  clearUpdateSubcategoryRequestFeedback,
  clearDeleteSubcategoryRequestFeedback,
  resetSubcategoryMutationRequestStates,
} = subcategoriesSlice.actions;

export const {
  selectSubcategories,
  selectSubcategoriesListStatus,
  selectIsSubcategoriesListPending,
  selectSubcategoriesListError,
  selectIsSubcategoryCreatePending,
  selectSubcategoryCreateError,
  selectSubcategoryCreateSuccessMessage,
  selectIsSubcategoryUpdatePending,
  selectSubcategoryUpdateError,
  selectSubcategoryUpdateSuccessMessage,
  selectIsSubcategoryDeletePending,
  selectSubcategoryDeleteError,
  selectSubcategoryDeleteSuccessMessage,
} = subcategoriesSlice.selectors;

export default subcategoriesSlice.reducer;
