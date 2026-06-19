import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "./baseQuery";
import { IBackendRes, IModelPaginate, IUser } from "@/types/backend";

export const userApi = createApi({
  reducerPath: "userApi",
  baseQuery: axiosBaseQuery(),
  tagTypes: ["User"],
  endpoints: (builder) => ({
    fetchUser: builder.query<IBackendRes<IModelPaginate<IUser>>, string>({
      query: (qs) => ({
        url: `/api/v1/users?${qs}`,
        method: "GET",
      }),
      providesTags: ["User"],
    }),

    createUser: builder.mutation<
      IBackendRes<IUser>,
      {
        email: string;
        password: string;
        name: string;
        role: string;
        accountType: string;
        age: number;
        gender: string;
        address: string;
        image: string;
      }
    >({
      query: (body) => ({
        url: "/api/v1/users",
        method: "POST",
        data: body,
      }),
      invalidatesTags: ["User"],
    }),

    updateUser: builder.mutation<
      IBackendRes<any>,
      {
        _id: string;
        user: {
          name: string;
          role: string;
          accountType: string;
          age: number;
          gender: string;
          address: string;
          image: string;
        };
      }
    >({
      query: ({ _id, user }) => ({
        url: `/api/v1/users/${_id}`,
        method: "PATCH",
        data: user,
      }),
      invalidatesTags: ["User"],
    }),

    deleteUser: builder.mutation<IBackendRes<any>, { _id: string }>({
      query: ({ _id }) => ({
        url: `/api/v1/users/${_id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["User"],
    }),
  }),
});

export const {
  useFetchUserQuery,
  useCreateUserMutation,
  useDeleteUserMutation,
  useUpdateUserMutation,
} = userApi;
