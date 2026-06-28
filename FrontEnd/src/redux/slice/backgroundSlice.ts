import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface IState {
  theme: "light" | "dark";
}

const initialState: IState = {
  theme: "dark",
};

export const backgroundSlice = createSlice({
  name: "background",
  initialState,
  reducers: {
    setTheme: (state, action: PayloadAction<"light" | "dark">) => {
      state.theme = action.payload;
    },
  },
});

export const { setTheme } = backgroundSlice.actions;

export default backgroundSlice.reducer;
