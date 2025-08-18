import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { combineReducers } from '@reduxjs/toolkit';
import authSlice from './slices/authSlice';
import rotaSlice from './slices/rotaSlice';
import holidaySlice from './slices/holidaySlice';
import timeTrackingSlice from './slices/timeTrackingSlice';
import notificationSlice from './slices/notificationSlice';
import staffSlice from './slices/staffSlice';
import companySlice from './slices/companySlice';
import chatSlice from './slices/chatSlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'rota', 'holiday', 'timeTracking', 'staff', 'company'], // Only persist these slices
};

const rootReducer = combineReducers({
  auth: authSlice,
  rota: rotaSlice,
  holiday: holidaySlice,
  timeTracking: timeTrackingSlice,
  notification: notificationSlice,
  staff: staffSlice,
  company: companySlice,
  chat: chatSlice,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;