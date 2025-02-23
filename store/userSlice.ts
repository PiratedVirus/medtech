import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";
import CryptoJS from "crypto-js";
import { encryptData, decryptData } from "@/lib/encryption";

const SECRET_KEY = process.env.NEXT_PUBLIC_SESSION_SECRET_KEY || "default_secret_key"; // Store this securely in env variables

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
    });

    const userProfile = response.data.user as UserProfile;
    const encryptedProfile = encryptData(userProfile);
    sessionStorage.setItem("userProfile", encryptedProfile);

    return userProfile;
  },
);

// Logout user & remove profile
export const logoutUser = createAsyncThunk("user/logoutUser", async () => {
  await axios.post("/api/auth/logout", {}, { withCredentials: true });
  sessionStorage.removeItem("userProfile");
});

// Load user profile from session storage
const loadUserProfileFromSession = () => {
  const encryptedProfile = sessionStorage.getItem("userProfile");
  return encryptedProfile ? decryptData(encryptedProfile) : null;
};

const userSlice = createSlice({
  name: "user",
  initialState: {
    ...initialState,
    profile: loadUserProfileFromSession(),
  },
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
