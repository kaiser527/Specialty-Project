import { createApi } from "@reduxjs/toolkit/query/react";
import { axiosBaseQuery } from "./baseQuery";
import {
  IBackendRes,
  IChatMessage,
  IConversation,
  ICusorPaginateMessage,
  IModelPaginate,
  IModelPaginateCursor,
} from "@/types/backend";

export const aiApi = createApi({
  reducerPath: "aiApi",
  baseQuery: axiosBaseQuery(),
  endpoints: (builder) => ({
    fetchConversation: builder.query<
      IBackendRes<IModelPaginate<IConversation>>,
      string
    >({
      query: (qs) => ({
        url: `/api/v1/ai/conversation?${qs}`,
        method: "GET",
      }),
    }),

    fetchMessages: builder.query<
      IBackendRes<IModelPaginateCursor<IChatMessage>>,
      ICusorPaginateMessage
    >({
      query: ({ conversationId, limit = 10, lastCreatedAt, lastId }) => {
        const params = new URLSearchParams();

        params.append("limit", String(limit));

        if (lastCreatedAt) {
          params.append("lastCreatedAt", lastCreatedAt);
        }

        if (lastId) {
          params.append("lastId", lastId);
        }

        return {
          url: `/api/v1/ai/message/${conversationId}?${params.toString()}`,
          method: "GET",
        };
      },
    }),
  }),
});

export const { useFetchConversationQuery, useFetchMessagesQuery } = aiApi;
