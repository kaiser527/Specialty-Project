import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "./baseQuery";
import { IBackendRes, IModelPaginate, IOrder } from "@/types/backend";

export const orderApi = createApi({
  reducerPath: "orderApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Order"],
  endpoints: (builder) => ({
    fetchOrder: builder.query<IBackendRes<IModelPaginate<IOrder>>, string>({
      query: (qs: string) => ({
        url: `/api/v1/orders?${qs}`,
        method: "GET",
      }),
      providesTags: ["Order"],
    }),

    fetchSingleOrder: builder.query<IBackendRes<IOrder>, string>({
      query: (id: string) => ({
        url: `/api/v1/orders/${id}`,
        method: "GET",
      }),
      providesTags: ["Order"],
    }),

    fetchSingleOrderByUser: builder.query<IBackendRes<IOrder>, string>({
      query: (id: string) => ({
        url: `/api/v1/orders/user/${id}`,
        method: "GET",
      }),
      providesTags: ["Order"],
    }),

    fetchUserOrder: builder.query<IBackendRes<IModelPaginate<IOrder>>, string>({
      query: (qs: string) => ({
        url: `/api/v1/orders/user/paginate?${qs}`,
        method: "GET",
      }),
      providesTags: ["Order"],
    }),

    updateOrderStatus: builder.mutation<
      IBackendRes<any>,
      { id: string; status: string }
    >({
      query: ({ id, status }) => ({
        url: `/api/v1/orders/${id}`,
        method: "PATCH",
        data: { status },
      }),
      invalidatesTags: ["Order"],
    }),

    deleteOrder: builder.mutation<IBackendRes<any>, { id: string }>({
      query: ({ id }) => ({
        url: `/api/v1/orders/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Order"],
    }),

    placeOrder: builder.mutation<IBackendRes<{ orderId: string }>, IOrder>({
      query: (body) => ({
        url: `/api/v1/orders/place-order`,
        method: "POST",
        data: body,
      }),
      invalidatesTags: ["Order"],
    }),
  }),
});

export const {
  useFetchOrderQuery,
  useFetchSingleOrderQuery,
  useDeleteOrderMutation,
  useFetchUserOrderQuery,
  useUpdateOrderStatusMutation,
  usePlaceOrderMutation,
  useFetchSingleOrderByUserQuery,
} = orderApi;
