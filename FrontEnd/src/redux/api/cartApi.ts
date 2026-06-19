import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "./baseQuery";
import { IBackendRes, ICart } from "@/types/backend";

export const cartApi = createApi({
  reducerPath: "cartApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Cart"],
  endpoints: (builder) => ({
    fetchCart: builder.query<IBackendRes<ICart>, void>({
      query: () => ({
        url: `/api/v1/cart`,
        method: "GET",
      }),
      providesTags: ["Cart"],
    }),

    upsertUserCart: builder.mutation<
      IBackendRes<any>,
      {
        variantId: string;
        quantity: number;
      }
    >({
      query: (body) => ({
        url: "/api/v1/cart",
        method: "POST",
        data: body,
      }),
      invalidatesTags: ["Cart"],
    }),

    mergeCart: builder.mutation<
      IBackendRes<any>,
      {
        items: {
          variantId: string;
          quantity: number;
        }[];
      }
    >({
      query: (body) => ({
        url: "/api/v1/cart/merge",
        method: "POST",
        data: body,
      }),
      invalidatesTags: ["Cart"],
    }),

    clearCart: builder.mutation<IBackendRes<any>, void>({
      query: () => ({
        url: "/api/v1/cart/clear",
        method: "DELETE",
      }),
      invalidatesTags: ["Cart"],
    }),
  }),
});

export const {
  useFetchCartQuery,
  useMergeCartMutation,
  useUpsertUserCartMutation,
  useClearCartMutation,
} = cartApi;
