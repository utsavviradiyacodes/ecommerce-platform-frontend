import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  loginAdmin,
  refreshAdminAccessToken,
  getCurrentAdmin,
  logoutAdmin,
} from "./authApi";

const initialState = {
  admin: null,
  accessToken: null,
  isInitializing: true,
  isLoading: false,
  isLoggingOut: false,
  error: null,
};

export const loginAdminThunk = createAsyncThunk(
  "auth/loginAdmin",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await loginAdmin(credentials);

      return response;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Unable to log in. Please try again.";

      return rejectWithValue(errorMessage);
    }
  }
);

export const initializeAdminSessionThunk = createAsyncThunk(
  "auth/initializeAdminSession",
  async () => {
    const refreshResponse = await refreshAdminAccessToken();
    const accessToken = refreshResponse.token;

    const currentAdminResponse = await getCurrentAdmin(accessToken);

    return {
      accessToken,
      admin: currentAdminResponse.data,
    };
  }
);

export const logoutAdminThunk = createAsyncThunk(
  "auth/logoutAdmin",
  async (_, { rejectWithValue }) => {
    try {
      const response = await logoutAdmin();

      return response;
    } catch (error) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        "Unable to log out. Please try again.";

      return rejectWithValue(errorMessage);
    }
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {},

  selectors: {
    selectCurrentAdmin: (sliceState) => sliceState.admin,
    selectIsAuthenticated: (sliceState) =>
      Boolean(sliceState.admin && sliceState.accessToken),
    selectAccessToken: (sliceState) => sliceState.accessToken,
    selectIsInitializing: (sliceState) => sliceState.isInitializing,
    selectIsLoggingOut: (sliceState) => sliceState.isLoggingOut,
    selectIsLoading: (sliceState) => sliceState.isLoading,
    selectError: (sliceState) => sliceState.error,
  },

  extraReducers: (builder) => {
    builder

      // ----------------------------loginAdminThunk------------------------------
      .addCase(loginAdminThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginAdminThunk.fulfilled, (state, action) => {
        const { token, ...admin } = action.payload.data;

        state.isLoading = false;
        state.accessToken = token;
        state.admin = admin;
        state.error = null;
      })
      .addCase(loginAdminThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // ----------------------------initializeAdminSessionThunk--------------------

      .addCase(initializeAdminSessionThunk.pending, (state) => {
        state.isInitializing = true;
      })
      .addCase(initializeAdminSessionThunk.fulfilled, (state, action) => {
        state.admin = action.payload.admin;
        state.accessToken = action.payload.accessToken;
        state.isInitializing = false;
      })
      .addCase(initializeAdminSessionThunk.rejected, (state) => {
        state.admin = null;
        state.accessToken = null;
        state.isInitializing = false;
      })

      // ----------------------------logoutAdminThunk----------------------

      .addCase(logoutAdminThunk.pending, (state) => {
        state.isLoggingOut = true;
        state.error = null;
      })
      .addCase(logoutAdminThunk.fulfilled, (state) => {
        state.admin = null;
        state.accessToken = null;
        state.isLoggingOut = false;
        state.error = null;
      })
      .addCase(logoutAdminThunk.rejected, (state, action) => {
        state.isLoggingOut = false;
        state.error = action.payload;
      });
  },
});

export const {
  selectAccessToken,
  selectCurrentAdmin,
  selectIsAuthenticated,
  selectIsInitializing,
  selectIsLoggingOut,
  selectIsLoading,
  selectError,
} = authSlice.selectors;

export default authSlice.reducer;
