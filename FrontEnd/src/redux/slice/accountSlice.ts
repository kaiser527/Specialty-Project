import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { accountApi } from "../api/accountApi";
import { IUser } from "@/types/backend";

interface IState {
  isAuthenticated: boolean;
  isRefreshToken: boolean;
  user: IUser;
}

const INIT_USER = {
  _id: "",
  email: "",
  name: "",
  image: "",
  age: 0,
  gender: "",
  address: "",
  accountType: "",
  role: {
    _id: "",
    name: "",
    isActive: false,
  },
  permissions: [],
};

const initialState: IState = {
  isAuthenticated: false,
  isRefreshToken: false,
  user: { ...INIT_USER },
};

export const accountSlice = createSlice({
  name: "account",
  initialState,
  reducers: {
    setUserLoginInfo: (state, action: PayloadAction<IUser>) => {
      state.isAuthenticated = true;
      state.user = action.payload;
    },
    setLogoutAction: (state) => {
      localStorage.removeItem("access_token");
      state.isAuthenticated = false;
      state.user = { ...INIT_USER };
    },
    setRefreshTokenAction: (state, action: PayloadAction<boolean>) => {
      state.isRefreshToken = action.payload ?? false;
      state.isAuthenticated = false;
    },
    resetAccountState: (state) => {
      state.isRefreshToken = true;
    },
  },
  extraReducers: (builder) => {
    builder.addMatcher(
      accountApi.endpoints.fetchAccount.matchFulfilled,
      (state, { payload }) => {
        state.isAuthenticated = true;

        const user = payload.data?.user;

        if (user) state.user = user;
        else state.isAuthenticated = false;
      }
    );
    builder.addMatcher(
      accountApi.endpoints.fetchAccount.matchRejected,
      (state) => {
        state.isAuthenticated = false;
      }
    );
  },
});

export const {
  resetAccountState,
  setUserLoginInfo,
  setLogoutAction,
  setRefreshTokenAction,
} = accountSlice.actions;

export default accountSlice.reducer;
