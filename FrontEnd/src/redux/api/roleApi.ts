import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "./baseQuery";
import { IBackendRes, IModelPaginate, IRole } from "@/types/backend";

export const roleApi = createApi({
  reducerPath: "roleApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["Role"],
  endpoints: (builder) => ({
    fetchRole: builder.query<IBackendRes<IModelPaginate<IRole>>, string>({
      query: (qs) => ({
        url: `/api/v1/roles?${qs}`,
        method: "GET",
      }),
      providesTags: ["Role"],
    }),

    fetchRoleById: builder.query<IBackendRes<IRole>, string>({
      query: (_id) => ({
        url: `/api/v1/roles/${_id}`,
        method: "GET",
      }),
    }),

    createRole: builder.mutation<
      IBackendRes<IRole>,
      {
        name: string;
        description: string;
        isActive: string;
        permissions: string[];
      }
    >({
      query: (body) => ({
        url: "/api/v1/roles",
        method: "POST",
        data: body,
      }),
      invalidatesTags: ["Role"],
    }),

    updateRole: builder.mutation<
      IBackendRes<any>,
      {
        _id: string;
        role: {
          name: string;
          description: string;
          isActive: string;
          permissions: string[];
        };
      }
    >({
      query: ({ _id, role }) => ({
        url: `/api/v1/roles/${_id}`,
        method: "PATCH",
        data: role,
      }),
      invalidatesTags: ["Role"],
    }),

    deleteRole: builder.mutation<IBackendRes<any>, { _id: string }>({
      query: ({ _id }) => ({
        url: `/api/v1/roles/${_id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Role"],
    }),
  }),
});

export const {
  useFetchRoleQuery,
  useCreateRoleMutation,
  useFetchRoleByIdQuery,
  useUpdateRoleMutation,
  useDeleteRoleMutation,
} = roleApi;
