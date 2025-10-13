import axios from "axios";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { encryptData, decryptData } from "@/lib/encryption";

interface UserState {
  profile: any;
  loading: boolean;
  error: string | null;
}

interface UserProfile {
  id: string;
  name: string;
  email: string;
  clinicId?: string;
  role: string;
}

const initialState: UserState = {
  profile: null,
  loading: false,
  error: null,
};

// Safe storage functions
const safeSetItem = (key: string, value: string) => {
  if (typeof window !== "undefined") {
    sessionStorage.setItem(key, value);
  }
};

const safeRemoveItem = (key: string) => {
  if (typeof window !== "undefined") {
    sessionStorage.removeItem(key);
  }
};

// Fetch user profile from `/api/auth/get-user-profile`
export const fetchUserProfile = createAsyncThunk(
  "user/fetchUserProfile",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get("/api/auth/get-user-profile", {
        withCredentials: true,
      });
      
      const userProfile = response.data.user;
      const encryptedProfile = encryptData(userProfile);
      safeSetItem("userProfile", encryptedProfile);
      
      return userProfile;
    } catch (error) {
      return rejectWithValue("Failed to fetch user profile");
    }
  },
);

// Logout user & remove profile
export const logoutUser = createAsyncThunk("user/logoutUser", async () => {
  await axios.post("/api/auth/logout", {}, { withCredentials: true });
  safeRemoveItem("userProfile");
});

// Create an initialization thunk to load from storage
export const initializeUserProfile = createAsyncThunk(
  "user/initializeProfile",
  async (_, { rejectWithValue }) => {
    if (typeof window === "undefined") return null;
    
    try {
      const encryptedProfile = sessionStorage.getItem("userProfile");
      if (encryptedProfile) {
        const decryptedProfile = decryptData(encryptedProfile);
        // Check if the profile is still valid (e.g., not expired)
        if (decryptedProfile && !isProfileExpired(decryptedProfile)) {
          return decryptedProfile;
        }
      }
      return null;
    } catch (error) {
      return rejectWithValue("Failed to initialize profile");
    }
  }
);

// Helper function to check if profile is expired (e.g., after 24 hours)
const isProfileExpired = (profile: any) => {
  if (!profile.lastUpdated) return true;
  const lastUpdated = new Date(profile.lastUpdated);
  const now = new Date();
  const hoursDiff = (now.getTime() - lastUpdated.getTime()) / (1000 * 60 * 60);
  return hoursDiff > 24; // Profile expires after 24 hours
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    updateProfile: (state, action) => {
      state.profile = { ...state.profile, ...action.payload, lastUpdated: new Date().toISOString() };
      const encryptedProfile = encryptData(state.profile);
      safeSetItem("userProfile", encryptedProfile);
    },
    clearProfile: (state) => {
      state.profile = null;
      state.loading = false;
      state.error = null;
      safeRemoveItem("userProfile");
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = { ...action.payload, lastUpdated: new Date().toISOString() };
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || "Failed to fetch user profile";
      })
      .addCase(initializeUserProfile.fulfilled, (state, action) => {
        if (action.payload) {
          state.profile = action.payload;
        }
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.profile = null;
        state.loading = false;
        state.error = null;
      });
  },
});

export const { updateProfile, clearProfile } = userSlice.actions;
export default userSlice.reducer;