import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface IState {
  countDown: number;
}

const initialState: IState = {
  countDown: 0,
};

export const timerSlice = createSlice({
  name: "timer",
  initialState,
  reducers: {
    setCountDown: (state, action: PayloadAction<number>) => {
      state.countDown = action.payload;
    },
  },
});

export const { setCountDown } = timerSlice.actions;

export default timerSlice.reducer;
