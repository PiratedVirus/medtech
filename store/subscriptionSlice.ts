import {createSlice, PayloadAction} from '@reduxjs/toolkit';

interface SubscriptionState {
  subscriptionData: any | null;
}

const initialState: SubscriptionState = {
  subscriptionData: null,
};

const subscriptionSlice = createSlice({
  name: 'subscription',
  initialState,
  reducers: {
    setSubscriptionData: (state, action: PayloadAction<SubscriptionState['subscriptionData']>) => {
      state.subscriptionData = action.payload;
    },
    clearSubscriptionData: (state) => {
      state.subscriptionData = null;
    },
  },
});

export const {setSubscriptionData, clearSubscriptionData} = subscriptionSlice.actions;
export default subscriptionSlice.reducer;