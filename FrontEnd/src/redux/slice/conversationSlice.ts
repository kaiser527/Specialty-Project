import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface IState {
  selectedConversationId: string | null;
}

const initialState: IState = {
  selectedConversationId: null,
};

export const conversationSlice = createSlice({
  name: "conversation",
  initialState,
  reducers: {
    setSelectedConversationId: (
      state,
      action: PayloadAction<string | null>
    ) => {
      state.selectedConversationId = action.payload;
    },
  },
});

export const { setSelectedConversationId } = conversationSlice.actions;

export default conversationSlice.reducer;
