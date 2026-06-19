import instance from "@/config/axios/axios-customize";
import { BaseQueryFn } from "@reduxjs/toolkit/query";
import { AxiosRequestConfig } from "axios";
import { IBackendRes } from "@/types/backend";

type AxiosBaseQueryArgs = {
  url: string;
  method?: AxiosRequestConfig["method"];
  data?: unknown;
  params?: unknown;
  headers?: AxiosRequestConfig["headers"];
};

export const axiosBaseQuery =
  (): BaseQueryFn<AxiosBaseQueryArgs, IBackendRes<any>> =>
  async ({ url, method = "GET", data, params, headers }) => {
    const result = await instance({
      url,
      method,
      data,
      params,
      headers,
    });

    return { data: result };
  };
