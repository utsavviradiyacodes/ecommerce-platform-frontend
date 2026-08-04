import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import { synchronizeCurrentAdmin } from "../auth/authSlice.js";

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
  deleteAdminAvatar,
  getAdminProfile,
  updateAdminProfile,
} from "./profileApi.js";

function createInitialState() {
  return {
    requests: {
      fetch: createRequestState(),
      update: createRequestState(),
      deleteAvatar: createRequestState(),
    },
  };
}

const initialState = createInitialState();

function isAnyProfileRequestPending(profileState) {
  return (
    profileState?.requests.fetch.status === REQUEST_STATUS.PENDING ||
    profileState?.requests.update.status === REQUEST_STATUS.PENDING ||
    profileState?.requests.deleteAvatar.status === REQUEST_STATUS.PENDING
  );
}

function canSynchronizeCurrentAdmin(
  getState,
  requestKey,
  requestId,
  responseAdmin
) {
  const state = getState();

  const requestState = state.profile?.requests?.[requestKey];
  const currentAdminId = state.auth?.admin?._id;
  const responseAdminId = responseAdmin?._id;

  return (
    Boolean(requestState) &&
    isRequestStateOwnedBy(requestState, requestId) &&
    typeof currentAdminId === "string" &&
    typeof responseAdminId === "string" &&
    currentAdminId === responseAdminId
  );
}

// -----------------------------------------------------------------------------
// Fetch Profile
// -----------------------------------------------------------------------------

export const fetchAdminProfileThunk = createAsyncThunk(
  "profile/fetchAdminProfile",
  async (_, { dispatch, getState, rejectWithValue, requestId, signal }) => {
    try {
      const response = await getAdminProfile({ signal });

      if (
        canSynchronizeCurrentAdmin(getState, "fetch", requestId, response.data)
      ) {
        dispatch(synchronizeCurrentAdmin(response.data));
      }

      return response;
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Unable to load your profile. Please try again."
        )
      );
    }
  },
  {
    condition: (_, { getState }) =>
      !isAnyProfileRequestPending(getState().profile),
  }
);

// -----------------------------------------------------------------------------
// Update Profile
// -----------------------------------------------------------------------------

export const updateAdminProfileThunk = createAsyncThunk(
  "profile/updateAdminProfile",
  async (formData, { dispatch, getState, rejectWithValue, requestId }) => {
    try {
      const response = await updateAdminProfile(formData);

      if (
        canSynchronizeCurrentAdmin(getState, "update", requestId, response.data)
      ) {
        dispatch(synchronizeCurrentAdmin(response.data));
      }

      return response;
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Unable to update your profile. Please try again."
        )
      );
    }
  },
  {
    condition: (_, { getState }) =>
      !isAnyProfileRequestPending(getState().profile),
  }
);

// -----------------------------------------------------------------------------
// Delete Avatar
// -----------------------------------------------------------------------------

export const deleteAdminAvatarThunk = createAsyncThunk(
  "profile/deleteAdminAvatar",
  async (_, { dispatch, getState, rejectWithValue, requestId }) => {
    try {
      const response = await deleteAdminAvatar();

      if (
        canSynchronizeCurrentAdmin(
          getState,
          "deleteAvatar",
          requestId,
          response.data
        )
      ) {
        dispatch(synchronizeCurrentAdmin(response.data));
      }

      return response;
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Unable to remove your profile photo. Please try again."
        )
      );
    }
  },
  {
    condition: (_, { getState }) =>
      !isAnyProfileRequestPending(getState().profile),
  }
);

const profileSlice = createSlice({
  name: "profile",
  initialState,

  reducers: {
    clearProfileFetchRequestFeedback(state) {
      clearRequestFeedback(state.requests.fetch);
    },

    clearProfileUpdateRequestFeedback(state) {
      clearRequestFeedback(state.requests.update);
    },

    clearProfileAvatarDeleteRequestFeedback(state) {
      clearRequestFeedback(state.requests.deleteAvatar);
    },

    resetProfileState() {
      return createInitialState();
    },
  },

  selectors: {
    // -------------------- Fetch Profile --------------------

    selectProfileFetchStatus: (sliceState) => sliceState.requests.fetch.status,

    selectIsProfileFetchPending: (sliceState) =>
      sliceState.requests.fetch.status === REQUEST_STATUS.PENDING,

    selectProfileFetchError: (sliceState) => sliceState.requests.fetch.error,

    // -------------------- Update Profile --------------------

    selectIsProfileUpdatePending: (sliceState) =>
      sliceState.requests.update.status === REQUEST_STATUS.PENDING,

    selectProfileUpdateError: (sliceState) => sliceState.requests.update.error,

    selectProfileUpdateSuccessMessage: (sliceState) =>
      sliceState.requests.update.successMessage,

    // -------------------- Delete Avatar --------------------

    selectIsProfileAvatarDeletePending: (sliceState) =>
      sliceState.requests.deleteAvatar.status === REQUEST_STATUS.PENDING,

    selectProfileAvatarDeleteError: (sliceState) =>
      sliceState.requests.deleteAvatar.error,

    selectProfileAvatarDeleteSuccessMessage: (sliceState) =>
      sliceState.requests.deleteAvatar.successMessage,

    // -------------------- Combined mutation state --------------------

    selectIsProfileMutationPending: (sliceState) =>
      sliceState.requests.update.status === REQUEST_STATUS.PENDING ||
      sliceState.requests.deleteAvatar.status === REQUEST_STATUS.PENDING,
  },

  extraReducers: (builder) => {
    builder

      // -------------------- Fetch Profile --------------------

      .addCase(fetchAdminProfileThunk.pending, (state, action) => {
        setRequestPending(state.requests.fetch, action.meta.requestId);
      })
      .addCase(fetchAdminProfileThunk.fulfilled, (state, action) => {
        if (
          !isRequestStateOwnedBy(state.requests.fetch, action.meta.requestId)
        ) {
          return;
        }

        setRequestSucceeded(state.requests.fetch);
      })
      .addCase(fetchAdminProfileThunk.rejected, (state, action) => {
        if (
          !isRequestStateOwnedBy(state.requests.fetch, action.meta.requestId)
        ) {
          return;
        }

        if (action.meta.aborted) {
          resetRequestState(state.requests.fetch);
          return;
        }

        setRequestFailed(
          state.requests.fetch,
          getRejectedActionErrorMessage(
            action,
            "Unable to load your profile. Please try again."
          )
        );
      })

      // -------------------- Update Profile --------------------

      .addCase(updateAdminProfileThunk.pending, (state, action) => {
        setRequestPending(state.requests.update, action.meta.requestId);
      })
      .addCase(updateAdminProfileThunk.fulfilled, (state, action) => {
        if (
          !isRequestStateOwnedBy(state.requests.update, action.meta.requestId)
        ) {
          return;
        }

        setRequestSucceeded(
          state.requests.update,
          action.payload?.message || "Profile updated successfully."
        );
      })
      .addCase(updateAdminProfileThunk.rejected, (state, action) => {
        if (
          !isRequestStateOwnedBy(state.requests.update, action.meta.requestId)
        ) {
          return;
        }

        setRequestFailed(
          state.requests.update,
          getRejectedActionErrorMessage(
            action,
            "Unable to update your profile. Please try again."
          )
        );
      })

      // -------------------- Delete Avatar --------------------

      .addCase(deleteAdminAvatarThunk.pending, (state, action) => {
        setRequestPending(state.requests.deleteAvatar, action.meta.requestId);
      })
      .addCase(deleteAdminAvatarThunk.fulfilled, (state, action) => {
        if (
          !isRequestStateOwnedBy(
            state.requests.deleteAvatar,
            action.meta.requestId
          )
        ) {
          return;
        }

        setRequestSucceeded(
          state.requests.deleteAvatar,
          action.payload?.message || "Profile photo removed successfully."
        );
      })
      .addCase(deleteAdminAvatarThunk.rejected, (state, action) => {
        if (
          !isRequestStateOwnedBy(
            state.requests.deleteAvatar,
            action.meta.requestId
          )
        ) {
          return;
        }

        setRequestFailed(
          state.requests.deleteAvatar,
          getRejectedActionErrorMessage(
            action,
            "Unable to remove your profile photo. Please try again."
          )
        );
      });
  },
});

export const {
  clearProfileFetchRequestFeedback,
  clearProfileUpdateRequestFeedback,
  clearProfileAvatarDeleteRequestFeedback,
  resetProfileState,
} = profileSlice.actions;

export const {
  selectProfileFetchStatus,
  selectIsProfileFetchPending,
  selectProfileFetchError,
  selectIsProfileUpdatePending,
  selectProfileUpdateError,
  selectProfileUpdateSuccessMessage,
  selectIsProfileAvatarDeletePending,
  selectProfileAvatarDeleteError,
  selectProfileAvatarDeleteSuccessMessage,
  selectIsProfileMutationPending,
} = profileSlice.selectors;

export default profileSlice.reducer;
