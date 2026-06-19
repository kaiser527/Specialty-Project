import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setSelectedConversationId } from "@/redux/slice/conversationSlice";

export const useConversation = () => {
  const conversationId: string | null = useAppSelector(
    (state) => state.conversation.selectedConversationId
  );

  const dispatch = useAppDispatch();

  const setConversationId = (conversationId: string | null) => {
    dispatch(setSelectedConversationId(conversationId));
  };

  return { conversationId, setConversationId };
};
