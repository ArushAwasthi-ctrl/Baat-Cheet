import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import authService from "@/services/authService";

// Async thunks
// Helper to extract error message from backend response
const getErrorMessage = (error, fallback) => {
  return (
    error.response?.data?.error?.message ||
    error.response?.data?.message ||
    fallback
  );
};

export const login = createAsyncThunk(
  "auth/login",
  async (credentials, { rejectWithValue }) => {
    try {
      const response = await authService.login(credentials);
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Login failed. Please try again."));
    }
  }
);

export const register = createAsyncThunk(
  "auth/register",
  async (data, { rejectWithValue }) => {
    try {
      const response = await authService.register(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Registration failed. Please try again."));
    }
  }
);

export const verifyOtp = createAsyncThunk(
  "auth/verifyOtp",
  async (data, { rejectWithValue }) => {
    try {
      const response = await authService.verifyOtp(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "OTP verification failed."));
    }
  }
);

export const resendOtp = createAsyncThunk(
  "auth/resendOtp",
  async (data, { rejectWithValue }) => {
    try {
      const response = await authService.resendOtp(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to resend OTP."));
    }
  }
);

export const forgotPassword = createAsyncThunk(
  "auth/forgotPassword",
  async (data, { rejectWithValue }) => {
    try {
      const response = await authService.forgotPassword(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to send reset email."));
    }
  }
);

export const resetPassword = createAsyncThunk(
  "auth/resetPassword",
  async (data, { rejectWithValue }) => {
    try {
      const response = await authService.resetPassword(data);
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to reset password."));
    }
  }
);

export const logout = createAsyncThunk(
  "auth/logout",
  async (_, { rejectWithValue }) => {
    try {
      await authService.logout();
      return null;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Logout failed."));
    }
  }
);

export const getCurrentUser = createAsyncThunk(
  "auth/getCurrentUser",
  async (_, { rejectWithValue }) => {
    try {
      const response = await authService.getCurrentUser();
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to get user."));
    }
  }
);

const initialState = {
  user: null,
  isAuthenticated: false,
  isLoading: false, // Start false, set to true only during async operations
  error: null,
  registrationEmail: null, // For OTP verification flow
  resetEmail: null, // For password reset flow
};

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setRegistrationEmail: (state, action) => {
      state.registrationEmail = action.payload;
    },
    setResetEmail: (state, action) => {
      state.resetEmail = action.payload;
    },
    updateUser: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      }
    },
    setAuthLoading: (state, action) => {
      state.isLoading = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(login.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.isLoading = false;
        // Backend returns { data: { user: {...} } }
        state.user = action.payload.data?.user || action.payload.data;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(login.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
        state.isAuthenticated = false;
      })

      // Register
      .addCase(register.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
        // Registration successful, user needs to verify OTP
      })
      .addCase(register.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Verify OTP
      .addCase(verifyOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.isLoading = false;
        // Backend returns { data: { user: {...} } }
        state.user = action.payload.data?.user || action.payload.data;
        state.isAuthenticated = true;
        state.registrationEmail = null;
        state.error = null;
      })
      .addCase(verifyOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Resend OTP
      .addCase(resendOtp.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resendOtp.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(resendOtp.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Forgot Password
      .addCase(forgotPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(forgotPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(forgotPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Reset Password
      .addCase(resetPassword.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(resetPassword.fulfilled, (state) => {
        state.isLoading = false;
        state.resetEmail = null;
        state.error = null;
      })
      .addCase(resetPassword.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })

      // Logout
      .addCase(logout.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logout.fulfilled, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      .addCase(logout.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      })

      // Get Current User
      .addCase(getCurrentUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getCurrentUser.fulfilled, (state, action) => {
        state.isLoading = false;
        // Backend returns { data: { user: {...} } } or { data: {...} }
        state.user = action.payload.data?.user || action.payload.data;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(getCurrentUser.rejected, (state) => {
        state.isLoading = false;
        state.user = null;
        state.isAuthenticated = false;
      });
  },
});

export const {
  clearError,
  setRegistrationEmail,
  setResetEmail,
  updateUser,
  setAuthLoading,
} = authSlice.actions;

export default authSlice.reducer;
