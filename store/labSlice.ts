import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AppointmentState {
  labBookingData: any | null;
}

const initialState: AppointmentState = {
  labBookingData: null
};

const labSlice = createSlice({
  name: 'appointment',
  initialState,
  reducers: {
    setLabBookingData: (state, action: PayloadAction<AppointmentState['labBookingData']>) => {
      state.labBookingData = action.payload;
    },
    clearLabBookingData: (state) => {
      state.labBookingData = null;
    }
  }
});

export const { setLabBookingData, clearLabBookingData } = labSlice.actions;
export default labSlice.reducer;