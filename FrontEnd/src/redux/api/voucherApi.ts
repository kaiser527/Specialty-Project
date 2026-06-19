import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "./baseQuery";
import {
  IBackendRes,
  IModelPaginate,
  IVoucher,
  IVoucherUsage,
} from "@/types/backend";

export const voucherApi = createApi({
  reducerPath: "voucherApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Voucher"],
  endpoints: (builder) => ({
    fetchVoucher: builder.query<IBackendRes<IModelPaginate<IVoucher>>, string>({
      query: (qs) => ({
        url: `/api/v1/vouchers?${qs}`,
        method: "GET",
      }),
      providesTags: ["Voucher"],
    }),

    fetchVoucherUsage: builder.query<
      IBackendRes<IModelPaginate<IVoucherUsage>>,
      string
    >({
      query: (qs) => ({
        url: `/api/v1/vouchers/usages?${qs}`,
        method: "GET",
      }),
    }),

    fetchVoucherByCode: builder.mutation<
      IBackendRes<IVoucher>,
      { code: string }
    >({
      query: (body) => ({
        url: `/api/v1/vouchers/code`,
        method: "POST",
        data: body,
      }),
    }),

    createVoucher: builder.mutation<IBackendRes<any>, Omit<IVoucher, "id">>({
      query: (body) => ({
        url: "/api/v1/vouchers",
        method: "POST",
        data: body,
      }),
      invalidatesTags: ["Voucher"],
    }),

    updateVoucher: builder.mutation<IBackendRes<any>, IVoucher>({
      query: (body) => ({
        url: `/api/v1/vouchers`,
        method: "PATCH",
        data: body,
      }),
      invalidatesTags: ["Voucher"],
    }),

    deleteVoucher: builder.mutation<IBackendRes<any>, { id: string }>({
      query: ({ id }) => ({
        url: `/api/v1/vouchers/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Voucher"],
    }),
  }),
});

export const {
  useFetchVoucherQuery,
  useFetchVoucherByCodeMutation,
  useFetchVoucherUsageQuery,
  useCreateVoucherMutation,
  useUpdateVoucherMutation,
  useDeleteVoucherMutation,
} = voucherApi;
