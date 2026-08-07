import { createSlice } from "@reduxjs/toolkit";

import { getApiErrorMessage } from "../../utils/api/getApiErrorMessage.js";

import {
  REQUEST_STATUS,
  clearRequestFeedback,
  createRequestState,
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
let changePasswordRequestSequence = 0;

const settingsSlice = createSlice({
  name: "settings",
  initialState,

  reducers: {
    changeAdminPasswordStarted(state, action) {
      setRequestPending(
        state.requests.changePassword,
        action.payload.requestId
      );
    },

    changeAdminPasswordSucceeded(state, action) {
      if (
        !isRequestStateOwnedBy(
          state.requests.changePassword,
          action.payload.requestId
        )
      ) {
        return;
      }

      setRequestSucceeded(
        state.requests.changePassword,
        action.payload.message || "Password changed successfully."
      );
    },

    changeAdminPasswordFailed(state, action) {
      if (
        !isRequestStateOwnedBy(
          state.requests.changePassword,
          action.payload.requestId
        )
      ) {
        return;
      }

      setRequestFailed(
        state.requests.changePassword,
        action.payload.error
      );
    },

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
});

export const {
  changeAdminPasswordStarted,
  changeAdminPasswordSucceeded,
  changeAdminPasswordFailed,
  clearSettingsChangePasswordRequestFeedback,
} = settingsSlice.actions;

export const {
  selectIsSettingsChangePasswordPending,
  selectSettingsChangePasswordError,
  selectSettingsChangePasswordSuccessMessage,
} = settingsSlice.selectors;

export function changeAdminPasswordThunk(passwordData) {
  return async (dispatch, getState) => {
    if (
      getState().settings.requests.changePassword.status ===
      REQUEST_STATUS.PENDING
    ) {
      return { success: false, skipped: true };
    }

    const requestId = `change-admin-password-${Date.now()}-${++changePasswordRequestSequence}`;

    dispatch(changeAdminPasswordStarted({ requestId }));

    try {
      const response = await changeAdminPassword(passwordData);

      if (
        !isRequestStateOwnedBy(
          getState().settings.requests.changePassword,
          requestId
        )
      ) {
        return { success: false, stale: true };
      }

      const resultAction = changeAdminPasswordSucceeded({
        requestId,
        message: response.message || null,
      });

      dispatch(resultAction);
      return resultAction;
    } catch (error) {
      if (
        !isRequestStateOwnedBy(
          getState().settings.requests.changePassword,
          requestId
        )
      ) {
        return { success: false, stale: true };
      }

      const resultAction = changeAdminPasswordFailed({
        requestId,
        error: getApiErrorMessage(
          error,
          "Unable to change your password. Please try again."
        ),
      });

      dispatch(resultAction);
      return resultAction;
    }
  };
}

export default settingsSlice.reducer;
