import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "./baseQuery";
import { IBackendRes, IPaymentResponse } from "@/types/backend";

export const paymentApi = createApi({
  reducerPath: "paymentApi",
  baseQuery: axiosBaseQuery(),
  endpoints: (builder) => ({
    createVNPayUrl: builder.mutation<
      IBackendRes<IPaymentResponse>,
      { orderId: string }
    >({
      query: (body) => ({
        url: `/api/v1/payment/vnpay`,
        method: "POST",
        data: body,
      }),
    }),

    createStripeUrl: builder.mutation<
      IBackendRes<IPaymentResponse>,
      { orderId: string }
    >({
      query: (body) => ({
        url: `/api/v1/payment/stripe`,
        method: "POST",
        data: body,
      }),
    }),
  }),
});

export const { useCreateVNPayUrlMutation, useCreateStripeUrlMutation } =
  paymentApi;
