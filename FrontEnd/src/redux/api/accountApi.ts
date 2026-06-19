import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "./baseQuery";
import { IBackendRes, IGetAccount, IUser, IAccount } from "@/types/backend";

export const accountApi = createApi({
  reducerPath: "accountApi",
  baseQuery: axiosBaseQuery(),
  endpoints: (builder) => ({
    register: builder.mutation<
      IBackendRes<IUser>,
      {
        name: string;
        email: string;
        password: string;
        age: number;
        gender: string;
        address: string;
      }
    >({
      query: (body) => ({
        url: "/api/v1/auth/register",
        method: "POST",
        data: body,
      }),
    }),

    login: builder.mutation<
      IBackendRes<IAccount>,
      { username: string; password: string }
    >({
      query: (body) => ({
        url: "/api/v1/auth/login",
        method: "POST",
        data: body,
      }),
    }),

    fetchAccount: builder.query<IBackendRes<IGetAccount>, void>({
      query: () => ({
        url: "/api/v1/auth/account",
        method: "GET",
      }),
    }),

    logout: builder.mutation<IBackendRes<string>, void>({
      query: () => ({
        url: "/api/v1/auth/logout",
        method: "POST",
      }),
    }),

    resend: builder.mutation<
      IBackendRes<string>,
      { email: string; type: string }
    >({
      query: (body) => ({
        url: "/api/v1/auth/resend",
        method: "POST",
        data: body,
      }),
    }),

    verify: builder.mutation<IBackendRes<any>, { otp: string; email: string }>({
      query: (body) => ({
        url: "/api/v1/auth/verify",
        method: "POST",
        data: body,
      }),
    }),

    reset: builder.mutation<
      IBackendRes<any>,
      {
        password: string;
        confirmedPassword: string;
        otp: string;
        email: string;
      }
    >({
      query: (body) => ({
        url: "/api/v1/auth/reset",
        method: "POST",
        data: body,
      }),
    }),

    updateUserClient: builder.mutation<
      IBackendRes<IAccount>,
      {
        name: string;
        email: string;
        newPassword: string;
        age: number;
        gender: string;
        address: string;
        image: string;
      }
    >({
      query: (body) => ({
        url: "/api/v1/auth/profile",
        method: "PATCH",
        data: body,
      }),
    }),
  }),
});

export const {
  useRegisterMutation,
  useLoginMutation,
  useFetchAccountQuery,
  useLogoutMutation,
  useResendMutation,
  useVerifyMutation,
  useUpdateUserClientMutation,
  useResetMutation,
} = accountApi;
