import { configureStore } from "@reduxjs/toolkit";
import userReducer from "./userSlice";
import appointmentReducer from "./appointmentSlice";
import labBookingReducer from "./labSlice";
import subscriptionReducer from "./subscriptionSlice";

const store = configureStore({
  reducer: {
    user: userReducer,
    appointment: appointmentReducer,
    labBooking: labBookingReducer,
    subscriptionsStore: subscriptionReducer,

  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export default store;
