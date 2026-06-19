import {
  Action,
  combineSlices,
  configureStore,
  ThunkAction,
} from "@reduxjs/toolkit";
import storage from "redux-persist/lib/storage";
import { getPersistConfig } from "redux-deep-persist";
import {
  persistReducer,
  persistStore,
  FLUSH,
  REHYDRATE,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
} from "redux-persist";
import accountSlice from "./slice/accountSlice";
import timerSlice from "./slice/timerSlice";
import cartSlice from "./slice/cartSlice";
import { injectStore } from "@/config/axios/axios-customize";
import { WHITELIST_REDUCER } from "@/config/constants/utils";
import { accountApi } from "./api/accountApi";
import { userApi } from "./api/userApi";
import { fileApi } from "./api/fileApi";
import { roleApi } from "./api/roleApi";
import { permissionApi } from "./api/permissionApi";
import { productApi } from "./api/productApi";
import { categoryApi } from "./api/categoryApi";
import { cartApi } from "./api/cartApi";
import { orderApi } from "./api/orderApi";
import { providerApi } from "./api/providerApi";
import { paymentApi } from "./api/paymentApi";
import { reviewApi } from "./api/reviewApi";
import { aiApi } from "./api/aiApi";
import conversationSlice from "./slice/conversationSlice";
import { voucherApi } from "./api/voucherApi";

const rootReducer = combineSlices({
  account: accountSlice,
  timer: timerSlice,
  cart: cartSlice,
  conversation: conversationSlice,

  [accountApi.reducerPath]: accountApi.reducer,
  [userApi.reducerPath]: userApi.reducer,
  [fileApi.reducerPath]: fileApi.reducer,
  [roleApi.reducerPath]: roleApi.reducer,
  [permissionApi.reducerPath]: permissionApi.reducer,
  [productApi.reducerPath]: productApi.reducer,
  [categoryApi.reducerPath]: categoryApi.reducer,
  [cartApi.reducerPath]: cartApi.reducer,
  [orderApi.reducerPath]: orderApi.reducer,
  [providerApi.reducerPath]: providerApi.reducer,
  [paymentApi.reducerPath]: paymentApi.reducer,
  [reviewApi.reducerPath]: reviewApi.reducer,
  [aiApi.reducerPath]: aiApi.reducer,
  [voucherApi.reducerPath]: voucherApi.reducer,
});

const persistConfig = getPersistConfig({
  key: "root",
  storage,
  whitelist: WHITELIST_REDUCER,
  rootReducer,
});

export const store = configureStore({
  reducer: persistReducer(persistConfig, rootReducer),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }).concat(
      accountApi.middleware,
      userApi.middleware,
      fileApi.middleware,
      roleApi.middleware,
      permissionApi.middleware,
      productApi.middleware,
      categoryApi.middleware,
      cartApi.middleware,
      orderApi.middleware,
      providerApi.middleware,
      paymentApi.middleware,
      reviewApi.middleware,
      aiApi.middleware,
      voucherApi.middleware
    ),
});

injectStore(store);

export type AppDispatch = typeof store.dispatch;
export const persistor = persistStore(store);
export type RootState = ReturnType<typeof store.getState>;
export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;
