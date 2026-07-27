import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { loginAdmin } from "./authApi";

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

const authSlice = createSlice({
  name: "auth",
  initialState,

  reducers: {},

  selectors: {
    selectIsLoading: (sliceState) => sliceState.isLoading,
    selectError: (sliceState) => sliceState.error,
  },

  extraReducers: (builder) => {
    builder
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
      });
  },
});

export const { selectIsLoading, selectError } = authSlice.selectors;

export default authSlice.reducer;
