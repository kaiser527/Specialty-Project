import { ICartItem } from "./backend";

export interface IImage {
  name: string;
  uid: string;
}

export interface IVariantAttribute {
  key: string;
  value: string;
}

export interface IVariant {
  id: string;
  stock: number;
  price: number;
  sku?: string;
  discount: number;
  images: string[];
  attributes: IVariantAttribute[];
  dueDate: string;
}

export type Cart = Omit<ICartItem, "cart" | "cartId"> & { totalPrice: number };
