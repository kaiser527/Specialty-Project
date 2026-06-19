import { useAppSelector } from "@/redux/hooks";
import { Cart } from "@/types/frontend";

export const useGetUnAuthenticateCart = () => {
  return useAppSelector((state) => state.cart.cartArray) as Cart[];
};
