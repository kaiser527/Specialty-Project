import { IVariant } from "@/types/backend";
import { Cart } from "@/types/frontend";
import { v4 as uuidv4 } from "uuid";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface IState {
  cartArray: Cart[];
}

const initialState: IState = {
  cartArray: [],
};

export const cartSlice = createSlice({
  name: "cart",
  initialState,
  reducers: {
    addToCart: (
      state,
      action: PayloadAction<IVariant & { quantity: number }>
    ) => {
      const existingItemIndex = state.cartArray.findIndex(
        (item) => item.variant.id === action.payload.id
      );
      if (existingItemIndex >= 0) {
        const item = state.cartArray[existingItemIndex];
        item.quantity += action.payload.quantity;
        item.totalPrice = item.quantity * item.variant.price;
        if (item.quantity <= 0) {
          state.cartArray.splice(existingItemIndex, 1);
        }
      } else {
        if (action.payload.quantity > 0) {
          state.cartArray.push({
            id: uuidv4(),
            variant: action.payload,
            quantity: action.payload.quantity,
            totalPrice: action.payload.price * action.payload.quantity,
          });
        }
      }
    },
    clearCart: (state) => {
      state.cartArray = [];
    },
  },
});

export const { addToCart, clearCart } = cartSlice.actions;

export default cartSlice.reducer;
