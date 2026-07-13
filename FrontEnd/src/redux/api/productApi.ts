import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "./baseQuery";
import {
  IBackendRes,
  IBulkCreateProduct,
  IMinMaxPrice,
  IMinMaxPriceQuery,
  IModelPaginate,
  IProduct,
  IVariant,
} from "@/types/backend";

export const productApi = createApi({
  reducerPath: "productApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Product", "Variant"],
  endpoints: (builder) => ({
    fetchProduct: builder.query<IBackendRes<IModelPaginate<IProduct>>, string>({
      query: (qs) => ({
        url: `/api/v1/products?${qs}`,
        method: "GET",
      }),
      providesTags: ["Product"],
    }),

    getMinMaxPrice: builder.query<IBackendRes<IMinMaxPrice>, IMinMaxPriceQuery>(
      {
        query: (body) => ({
          url: `/api/v1/products/min_max`,
          method: "POST",
          data: body,
        }),
      }
    ),

    fetchVariant: builder.query<IBackendRes<IModelPaginate<IVariant>>, string>({
      query: (qs) => ({
        url: `/api/v1/products/variants?${qs}`,
        method: "GET",
      }),
      providesTags: ["Variant"],
    }),

    fetchSingleProduct: builder.query<IBackendRes<IProduct>, string>({
      query: (id) => ({
        url: `/api/v1/products/${id}`,
        method: "GET",
      }),
      providesTags: ["Product"],
    }),

    fetchSingleVariant: builder.query<IBackendRes<IVariant>, string>({
      query: (id) => ({
        url: `/api/v1/products/variants/${id}`,
        method: "GET",
      }),
      providesTags: ["Variant"],
    }),

    findAllVariantsByIds: builder.query<
      IBackendRes<IModelPaginate<IVariant>>,
      { variantIds: string[] }
    >({
      query: (body) => ({
        url: `/api/v1/products/variants-by-ids`,
        method: "POST",
        data: body,
      }),
    }),

    createProduct: builder.mutation<IBackendRes<IProduct>, IProduct>({
      query: (body) => ({
        url: "/api/v1/products",
        method: "POST",
        data: body,
      }),
      invalidatesTags: ["Product", "Variant"],
    }),

    bulkCreateProduct: builder.mutation<
      IBackendRes<IProduct>,
      IBulkCreateProduct[]
    >({
      query: (body) => ({
        url: "/api/v1/products/import",
        method: "POST",
        data: body,
      }),
      invalidatesTags: ["Product", "Variant"],
    }),

    updateProduct: builder.mutation<
      IBackendRes<IProduct>,
      {
        id: string;
        product: IProduct;
      }
    >({
      query: ({ id, product }) => ({
        url: `/api/v1/products/${id}`,
        method: "PATCH",
        data: product,
      }),
      invalidatesTags: ["Product", "Variant"],
    }),

    deleteProduct: builder.mutation<IBackendRes<any>, { id: string }>({
      query: ({ id }) => ({
        url: `/api/v1/products/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Product", "Variant"],
    }),

    switchProductAuthor: builder.mutation<
      IBackendRes<any>,
      { productId: string; newAuthorEmail: string }
    >({
      query: (body) => ({
        url: "/api/v1/products/switch/switch-author",
        method: "PATCH",
        data: body,
      }),
      invalidatesTags: ["Product"],
    }),
  }),
});

export const {
  useFetchProductQuery,
  useFetchSingleProductQuery,
  useCreateProductMutation,
  useUpdateProductMutation,
  useGetMinMaxPriceQuery,
  useDeleteProductMutation,
  useBulkCreateProductMutation,
  useFetchVariantQuery,
  useFetchSingleVariantQuery,
  useSwitchProductAuthorMutation,
  useFindAllVariantsByIdsQuery,
} = productApi;
