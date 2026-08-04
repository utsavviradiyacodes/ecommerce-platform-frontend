import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

import {
  invalidateAdminSession,
  signOutAdminThunk,
} from "../auth/authSlice.js";

import { getApiErrorMessage } from "../../utils/api/getApiErrorMessage.js";

import {
  REQUEST_STATUS,
  clearRequestFeedback,
  createRequestState,
  getRejectedActionErrorMessage,
  isRequestStateOwnedBy,
  setRequestFailed,
  setRequestPending,
  setRequestSucceeded,
} from "../../utils/redux/requestState.js";

import { changeAdminPassword } from "./settingsApi.js";

function createInitialState() {
  return {
    requests: {
      changePassword: createRequestState(),
    },
  };
}

const initialState = createInitialState();

// -----------------------------------------------------------------------------
// Change Password
// -----------------------------------------------------------------------------

export const changeAdminPasswordThunk = createAsyncThunk(
  "settings/changeAdminPassword",
  async (passwordData, { rejectWithValue }) => {
    try {
      return await changeAdminPassword(passwordData);
    } catch (error) {
      return rejectWithValue(
        getApiErrorMessage(
          error,
          "Unable to change your password. Please try again."
        )
      );
    }
  },
  {
    condition: (_, { getState }) =>
      getState().settings.requests.changePassword.status !==
      REQUEST_STATUS.PENDING,
  }
);

const settingsSlice = createSlice({
  name: "settings",
  initialState,

  reducers: {
    clearSettingsChangePasswordRequestFeedback(state) {
      clearRequestFeedback(state.requests.changePassword);
    },
  },

  selectors: {
    selectIsSettingsChangePasswordPending: (sliceState) =>
      sliceState.requests.changePassword.status === REQUEST_STATUS.PENDING,

    selectSettingsChangePasswordError: (sliceState) =>
      sliceState.requests.changePassword.error,

    selectSettingsChangePasswordSuccessMessage: (sliceState) =>
      sliceState.requests.changePassword.successMessage,
  },

  extraReducers: (builder) => {
    builder
      .addCase(changeAdminPasswordThunk.pending, (state, action) => {
        setRequestPending(
          state.requests.changePassword,
          action.meta.requestId
        );
      })
      .addCase(changeAdminPasswordThunk.fulfilled, (state, action) => {
        if (
          !isRequestStateOwnedBy(
            state.requests.changePassword,
            action.meta.requestId
          )
        ) {
          return;
        }

        setRequestSucceeded(
          state.requests.changePassword,
          action.payload?.message || "Password changed successfully."
        );
      })
      .addCase(changeAdminPasswordThunk.rejected, (state, action) => {
        if (
          !isRequestStateOwnedBy(
            state.requests.changePassword,
            action.meta.requestId
          )
        ) {
          return;
        }

        setRequestFailed(
          state.requests.changePassword,
          getRejectedActionErrorMessage(
            action,
            "Unable to change your password. Please try again."
          )
        );
      })
      .addCase(invalidateAdminSession, () => createInitialState())
      .addCase(signOutAdminThunk.fulfilled, () => createInitialState());
  },
});

export const { clearSettingsChangePasswordRequestFeedback } =
  settingsSlice.actions;

export const {
  selectIsSettingsChangePasswordPending,
  selectSettingsChangePasswordError,
  selectSettingsChangePasswordSuccessMessage,
} = settingsSlice.selectors;

export default settingsSlice.reducer;
