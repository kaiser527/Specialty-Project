import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "./baseQuery";
import { IBackendRes, IModelPaginate, IPermission } from "@/types/backend";

export const permissionApi = createApi({
  reducerPath: "permissionApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Permission"],
  endpoints: (builder) => ({
    fetchPermission: builder.query<
      IBackendRes<IModelPaginate<IPermission>>,
      string
    >({
      query: (qs) => ({
        url: `/api/v1/permissions?${qs}`,
        method: "GET",
      }),
      providesTags: ["Permission"],
    }),

    createPermission: builder.mutation<
      IBackendRes<IPermission>,
      {
        name: string;
        apiPath: string;
        method: string;
        module: string;
      }
    >({
      query: (body) => ({
        url: "/api/v1/permissions",
        method: "POST",
        data: body,
      }),
      invalidatesTags: ["Permission"],
    }),

    updatePermission: builder.mutation<
      IBackendRes<any>,
      {
        _id: string;
        permission: {
          name: string;
          apiPath: string;
          method: string;
          module: string;
        };
      }
    >({
      query: ({ _id, permission }) => ({
        url: `/api/v1/permissions/${_id}`,
        method: "PATCH",
        data: permission,
      }),
      invalidatesTags: ["Permission"],
    }),

    deletePermission: builder.mutation<IBackendRes<any>, { _id: string }>({
      query: ({ _id }) => ({
        url: `/api/v1/permissions/${_id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Permission"],
    }),
  }),
});

export const {
  useCreatePermissionMutation,
  useFetchPermissionQuery,
  useDeletePermissionMutation,
  useUpdatePermissionMutation,
} = permissionApi;
