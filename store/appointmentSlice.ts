import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface AppointmentState {
  bookingData: {
    doctor: any;
    type: 'video' | 'clinic' | null;
    isDietician?: boolean;
  } | null;
}

const initialState: AppointmentState = {
  bookingData: null
};

const appointmentSlice = createSlice({
  name: 'appointment',
  initialState,
  reducers: {
    setBookingData: (state, action: PayloadAction<AppointmentState['bookingData']>) => {
      state.bookingData = action.payload;
    },
    clearBookingData: (state) => {
      state.bookingData = null;
    }
  }
});

export const { setBookingData, clearBookingData } = appointmentSlice.actions;
export default appointmentSlice.reducer;