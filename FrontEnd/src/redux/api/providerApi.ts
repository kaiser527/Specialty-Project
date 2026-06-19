import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "./baseQuery";
import { IBackendRes } from "@/types/backend";

export const providerApi = createApi({
  reducerPath: "providerApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["ProviderFee", "ProviderOrder"],
  endpoints: (builder) => ({
    updateProviderFeeStatus: builder.mutation<
      IBackendRes<any>,
      { id: string; status: string }
    >({
      query: ({ id, status }) => ({
        url: `/api/v1/providers/fee/${id}`,
        method: "PATCH",
        data: { status },
      }),
      invalidatesTags: ["ProviderFee"],
    }),

    quickUpdateProviderFeeStatus: builder.mutation<
      IBackendRes<any>,
      { ownerId: string; status: string; orderId: string }
    >({
      query: ({ ownerId, status, orderId }) => ({
        url: `/api/v1/providers/fee-bulk/${ownerId}`,
        method: "PATCH",
        data: { status, orderId },
      }),
      invalidatesTags: ["ProviderFee"],
    }),

    updateProviderOrderStatus: builder.mutation<
      IBackendRes<any>,
      { id: string; status: string }
    >({
      query: ({ id, status }) => ({
        url: `/api/v1/providers/order/${id}`,
        method: "PATCH",
        data: { status },
      }),
      invalidatesTags: ["ProviderOrder"],
    }),

    updateProviderOrderStatusByOrderId: builder.mutation<
      IBackendRes<any>,
      { orderId: string; status: string }
    >({
      query: ({ orderId, status }) => ({
        url: `/api/v1/providers/order-bulk/${orderId}`,
        method: "PATCH",
        data: { status },
      }),
      invalidatesTags: ["ProviderOrder"],
    }),
  }),
});

export const {
  useUpdateProviderFeeStatusMutation,
  useUpdateProviderOrderStatusMutation,
  useUpdateProviderOrderStatusByOrderIdMutation,
  useQuickUpdateProviderFeeStatusMutation,
} = providerApi;
