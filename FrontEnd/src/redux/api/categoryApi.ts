import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "./baseQuery";
import { IBackendRes, IModelPaginate, ICategory } from "@/types/backend";

export const categoryApi = createApi({
  reducerPath: "categoryApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Category"],
  endpoints: (builder) => ({
    fetchCategory: builder.query<
      IBackendRes<IModelPaginate<ICategory>>,
      string
    >({
      query: (qs) => ({
        url: `/api/v1/categories?${qs}`,
        method: "GET",
      }),
      providesTags: ["Category"],
    }),

    createCategory: builder.mutation<
      IBackendRes<ICategory>,
      {
        name: string;
        description: string;
      }
    >({
      query: (body) => ({
        url: "/api/v1/categories",
        method: "POST",
        data: body,
      }),
      invalidatesTags: ["Category"],
    }),

    updateCategory: builder.mutation<
      IBackendRes<any>,
      {
        id: string;
        category: {
          name: string;
          description: string;
        };
      }
    >({
      query: ({ id, category }) => ({
        url: `/api/v1/categories/${id}`,
        method: "PATCH",
        data: category,
      }),
      invalidatesTags: ["Category"],
    }),

    deleteCategory: builder.mutation<IBackendRes<any>, { id: string }>({
      query: ({ id }) => ({
        url: `/api/v1/categories/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Category"],
    }),
  }),
});

export const {
  useFetchCategoryQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} = categoryApi;
