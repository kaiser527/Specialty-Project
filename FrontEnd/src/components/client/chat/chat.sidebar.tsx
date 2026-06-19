import { useConversation } from "@/hooks/useConversation";
import { useGetAccount } from "@/hooks/useGetAccount";
import { useFetchConversationQuery } from "@/redux/api/aiApi";
import { PlusOutlined } from "@ant-design/icons";
import { skipToken } from "@reduxjs/toolkit/query";
import { Button, Flex, Grid, List, Skeleton, Typography } from "antd";
import { useEffect } from "react";
import styles from "styles/floating-chat.module.scss";

const { Text } = Typography;
const { useBreakpoint } = Grid;

interface IProps {
  openModal: boolean;
  collapsed: boolean;
}

const ChatSidebar = ({ openModal, collapsed }: IProps) => {
  const screen = useBreakpoint();

  const { isAuthenticated } = useGetAccount();
  const { conversationId, setConversationId } = useConversation();

  const { data, isLoading } = useFetchConversationQuery(
    openModal && isAuthenticated ? "pageSize=100&current=1" : skipToken,
    { refetchOnMountOrArgChange: true }
  );

  const conversations = data?.data?.result || [];

  useEffect(() => {
    if (!openModal || isLoading) return;

    if (!isAuthenticated) return;

    if (conversationId) return;

    if (conversations.length > 0) {
      setConversationId(conversations[0].id);
    } else {
      setConversationId(crypto.randomUUID());
    }
  }, [conversations, openModal, conversationId, isAuthenticated, isLoading]);

  return (
    <>
      <div className={styles.sidebarHeader}>
        {!collapsed && screen.lg && (
          <Flex justify="space-between" align="center">
            <Text strong>Conversations</Text>
            <Button
              size="small"
              type="primary"
              shape="circle"
              icon={<PlusOutlined />}
              className={styles.orangeFloatBtn}
              onClick={() => setConversationId(crypto.randomUUID())}
            />
          </Flex>
        )}
      </div>

      {!collapsed && (
        <>
          {isLoading ? (
            <Skeleton active paragraph={{ rows: 20 }} />
          ) : (
            <List
              dataSource={conversations}
              renderItem={(item) => {
                const isActive = item.id === conversationId;
                return (
                  <List.Item
                    className={`${styles.conversationItem} ${
                      isActive ? styles.active : ""
                    }`}
                    onClick={() => setConversationId(item.id)}
                    style={{ cursor: "pointer" }}
                  >
                    <div>
                      <Text
                        strong={isActive}
                        ellipsis={{ tooltip: item.title }}
                        style={{ maxWidth: 200 }}
                      >
                        {item.title}
                      </Text>
                    </div>
                  </List.Item>
                );
              }}
            />
          )}
        </>
      )}
    </>
  );
};

export default ChatSidebar;
