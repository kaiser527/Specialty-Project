import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "./baseQuery";
import { IBackendRes } from "@/types/backend";

export const reviewApi = createApi({
  reducerPath: "reviewApi",
  baseQuery: axiosBaseQuery(),
  endpoints: (builder) => ({
    createReview: builder.mutation<
      IBackendRes<any>,
      { comment: string; variantId: string; rating?: number; parentId?: string }
    >({
      query: (body) => ({
        url: `/api/v1/reviews`,
        method: "POST",
        data: body,
      }),
    }),

    editReview: builder.mutation<
      IBackendRes<any>,
      { id: string; dto: { comment: string; rating?: number } }
    >({
      query: ({ id, dto }) => ({
        url: `/api/v1/reviews/${id}`,
        method: "PATCH",
        data: dto,
      }),
    }),

    deleteReview: builder.mutation<IBackendRes<any>, { id: string }>({
      query: ({ id }) => ({
        url: `/api/v1/reviews/${id}`,
        method: "DELETE",
      }),
    }),
  }),
});

export const {
  useCreateReviewMutation,
  useEditReviewMutation,
  useDeleteReviewMutation,
} = reviewApi;
