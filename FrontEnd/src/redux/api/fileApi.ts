import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "./baseQuery";
import { IBackendRes } from "@/types/backend";

export const fileApi = createApi({
  reducerPath: "fileApi",
  baseQuery: axiosBaseQuery(),
  endpoints: (builder) => ({
    uploadSingleFile: builder.mutation<
      IBackendRes<{ fileName: string }>,
      { file: File; folderType: string }
    >({
      query: ({ file, folderType }) => {
        const formData = new FormData();
        formData.append("fileUpload", file);
        return {
          url: "/api/v1/files/upload",
          method: "POST",
          data: formData,
          headers: {
            "Content-Type": "multipart/form-data",
            folder_type: folderType,
          },
        };
      },
    }),
  }),
});

export const { useUploadSingleFileMutation } = fileApi;
