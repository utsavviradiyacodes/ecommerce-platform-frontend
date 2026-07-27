import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  loginAdmin,
  refreshAdminAccessToken,
  getCurrentAdmin,
} from "./authApi";

const initialState = {
  user: null,
  accessToken: null,
  isInitializing: true,
  isLoading: false,
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
      user: currentAdminResponse.data,
    };
  }
);

const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {},

  selectors: {
    selectIsAuthenticated: (sliceState) =>
      Boolean(sliceState.user && sliceState.accessToken),

    selectIsInitializing: (sliceState) => sliceState.isInitializing,
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
        const { token, ...user } = action.payload.data;

        state.isLoading = false;
        state.accessToken = token;
        state.user = user;
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
        state.user = action.payload.user;
        state.accessToken = action.payload.accessToken;
        state.isInitializing = false;
      })
      .addCase(initializeAdminSessionThunk.rejected, (state) => {
        state.user = null;
        state.accessToken = null;
        state.isInitializing = false;
      });
  },
});

export const {
  selectIsAuthenticated,
  selectIsInitializing,
  selectIsLoading,
  selectError,
} = authSlice.selectors;

export default authSlice.reducer;
