import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';

interface UserState {
  profile: any;
  loading: boolean;
  error: string | null;
  phoneNumber: string | null;
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
  phoneNumber: null,
};



export const fetchUserProfile = createAsyncThunk(
  'user/fetchUserProfile',
  async (phoneNumber: string) => {
    const response = await axios.post('/api/auth/get-user-profile', { phoneNumber });
    return response.data as UserProfile;
  }
);

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    setPhoneNumberSlice: (state, action: PayloadAction<string>) => {
      state.phoneNumber = action.payload;
    },
  },
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
        state.error = action.error.message || 'Failed to fetch user profile';
      });
  },
});
export const { setPhoneNumberSlice } = userSlice.actions;
export default userSlice.reducer;