import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

interface UserState {
  profile: any;
  loading: boolean;
  error: string | null;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
}

const initialState: UserState = {
  profile: null,
  loading: false,
  error: null,
};

// Fetch user profile from `/api/auth/get-user-profile`
export const fetchUserProfile = createAsyncThunk(
  "user/fetchUserProfile",
  async () => {
    const response = await axios.get("/api/auth/get-user-profile", {
      withCredentials: true,
    }); // Ensures cookie is sent
    return response.data.user as UserProfile;
  },
);

export const logoutUser = createAsyncThunk("user/logoutUser", async () => {
  await axios.post("/api/auth/logout", {}, { withCredentials: true });
});

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Failed to fetch user profile";
      });
  },
});

export default userSlice.reducer;
