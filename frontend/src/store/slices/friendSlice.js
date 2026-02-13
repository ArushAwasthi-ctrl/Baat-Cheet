import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import friendService from "../../services/friendService";

const getErrorMessage = (error, fallback) => {
  return (
    error.response?.data?.error?.message ||
    error.response?.data?.message ||
    error.message ||
    fallback
  );
};

// Async Thunks
export const fetchFriends = createAsyncThunk(
  "friends/fetchFriends",
  async ({ cursor = null, limit = 20 } = {}, { rejectWithValue }) => {
    try {
      const response = await friendService.getFriends(cursor, limit);
      return response.data;
    } catch (error) {
      return rejectWithValue(getErrorMessage(error, "Failed to fetch friends"));
    }
  }
);

export const fetchReceivedRequests = createAsyncThunk(
  "friends/fetchReceivedRequests",
  async ({ cursor = null, limit = 20 } = {}, { rejectWithValue }) => {
    try {
      const response = await friendService.getReceivedRequests(cursor, limit);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch friend requests")
      );
    }
  }
);

export const fetchSentRequests = createAsyncThunk(
  "friends/fetchSentRequests",
  async ({ cursor = null, limit = 20 } = {}, { rejectWithValue }) => {
    try {
      const response = await friendService.getSentRequests(cursor, limit);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to fetch sent requests")
      );
    }
  }
);

export const sendFriendRequest = createAsyncThunk(
  "friends/sendRequest",
  async (userId, { rejectWithValue }) => {
    try {
      const response = await friendService.sendRequest(userId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to send friend request")
      );
    }
  }
);

export const acceptFriendRequest = createAsyncThunk(
  "friends/acceptRequest",
  async (requestId, { rejectWithValue }) => {
    try {
      const response = await friendService.acceptRequest(requestId);
      return response.data;
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to accept friend request")
      );
    }
  }
);

export const rejectFriendRequest = createAsyncThunk(
  "friends/rejectRequest",
  async (requestId, { rejectWithValue }) => {
    try {
      await friendService.rejectRequest(requestId);
      return { requestId };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to reject friend request")
      );
    }
  }
);

export const removeFriend = createAsyncThunk(
  "friends/removeFriend",
  async (userId, { rejectWithValue }) => {
    try {
      await friendService.removeFriend(userId);
      return { userId };
    } catch (error) {
      return rejectWithValue(
        getErrorMessage(error, "Failed to remove friend")
      );
    }
  }
);

const initialState = {
  friends: [],
  receivedRequests: [],
  sentRequests: [],
  isLoading: false,
  error: null,
};

const friendSlice = createSlice({
  name: "friends",
  initialState,
  reducers: {
    // Real-time: new friend request received
    addReceivedRequest: (state, action) => {
      const request = action.payload;
      const exists = state.receivedRequests.some((r) => r._id === request._id);
      if (!exists) {
        state.receivedRequests.unshift(request);
      }
    },
    // Real-time: friend request accepted by other user
    friendRequestAccepted: (state, action) => {
      const { request } = action.payload;
      // Remove from sent requests
      state.sentRequests = state.sentRequests.filter(
        (r) => r._id !== request._id
      );
      // Add the other user to friends
      if (request.receiver) {
        const exists = state.friends.some(
          (f) => f._id === request.receiver._id
        );
        if (!exists) {
          state.friends.push(request.receiver);
        }
      }
    },
    // Real-time: friend removed by other user
    friendRemoved: (state, action) => {
      const { userId } = action.payload;
      state.friends = state.friends.filter((f) => f._id !== userId);
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Friends
      .addCase(fetchFriends.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(fetchFriends.fulfilled, (state, action) => {
        state.isLoading = false;
        state.friends = action.payload.friends;
      })
      .addCase(fetchFriends.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload;
      })
      // Fetch Received Requests
      .addCase(fetchReceivedRequests.fulfilled, (state, action) => {
        state.receivedRequests = action.payload.requests;
      })
      // Fetch Sent Requests
      .addCase(fetchSentRequests.fulfilled, (state, action) => {
        state.sentRequests = action.payload.requests;
      })
      // Send Friend Request
      .addCase(sendFriendRequest.fulfilled, (state, action) => {
        state.sentRequests.unshift(action.payload.request);
      })
      // Accept Friend Request
      .addCase(acceptFriendRequest.fulfilled, (state, action) => {
        const { request } = action.payload;
        state.receivedRequests = state.receivedRequests.filter(
          (r) => r._id !== request._id
        );
        if (request.sender) {
          const exists = state.friends.some(
            (f) => f._id === request.sender._id
          );
          if (!exists) {
            state.friends.push(request.sender);
          }
        }
      })
      // Reject Friend Request
      .addCase(rejectFriendRequest.fulfilled, (state, action) => {
        state.receivedRequests = state.receivedRequests.filter(
          (r) => r._id !== action.payload.requestId
        );
      })
      // Remove Friend
      .addCase(removeFriend.fulfilled, (state, action) => {
        state.friends = state.friends.filter(
          (f) => f._id !== action.payload.userId
        );
      });
  },
});

export const { addReceivedRequest, friendRequestAccepted, friendRemoved } =
  friendSlice.actions;

export default friendSlice.reducer;
