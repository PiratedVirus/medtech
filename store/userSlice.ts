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
  async () => {
    const response = await axios.get("/api/auth/get-user-profile", {
      withCredentials: true,
    });
    
    const userProfile = response.data.user as UserProfile;
    const encryptedProfile = encryptData(userProfile);
    safeSetItem("userProfile", encryptedProfile);
    
    return userProfile;
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
  async (_, { dispatch }) => {
    if (typeof window === "undefined") return null;
    
    const encryptedProfile = sessionStorage.getItem("userProfile");
    if (encryptedProfile) {
      return decryptData(encryptedProfile);
    }
    return null;
  }
);

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
      })
      .addCase(initializeUserProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
      });
  },
});

export default userSlice.reducer;