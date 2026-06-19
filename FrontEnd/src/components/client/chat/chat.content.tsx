import { socket, SUGGESTIONS } from "@/config/constants/utils";
import { useMessage } from "@/hooks/useMessage";
import { useFetchMessagesQuery } from "@/redux/api/aiApi";
import { IAction, IChatMessage } from "@/types/backend";
import {
  AppstoreOutlined,
  CustomerServiceOutlined,
  FileTextOutlined,
  HomeOutlined,
  LoginOutlined,
  OrderedListOutlined,
  PrinterOutlined,
  SafetyCertificateOutlined,
  SendOutlined,
  SettingOutlined,
  ShoppingCartOutlined,
  UserAddOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { skipToken } from "@reduxjs/toolkit/query";
import {
  Button,
  Empty,
  Flex,
  Layout,
  Pagination,
  Skeleton,
  Typography,
} from "antd";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { useNavigate } from "react-router-dom";
import styles from "styles/floating-chat.module.scss";
import ChatData from "./chat.data";
import { useGetAccount } from "@/hooks/useGetAccount";
import ViewOrderDetail from "@/components/admin/order/order.view";
import { useConversation } from "@/hooks/useConversation";

const { Content } = Layout;
const { Text } = Typography;

const ROUTE_ICON_MAP: Record<string, React.ReactNode> = {
  "/": <HomeOutlined />,
  "/filter": <AppstoreOutlined />,
  "/cart": <ShoppingCartOutlined />,
  "/print": <PrinterOutlined />,
  "/login": <LoginOutlined />,
  "/register": <UserAddOutlined />,
  "/verify/:email": <SafetyCertificateOutlined />,
  "/admin": <SettingOutlined />,
  "/admin/user": <UserOutlined />,
  "/admin/role": <UserOutlined />,
  "/admin/permission": <UserOutlined />,
  "/admin/product": <AppstoreOutlined />,
  "/admin/category": <AppstoreOutlined />,
  "/admin/order": <FileTextOutlined />,
  "/admin/provider-fee": <CustomerServiceOutlined />,
  "/admin/provider-order": <OrderedListOutlined />,
};

const PAGE_SIZE = 5;
const FETCH_LIMIT = 10;

const msgRoleWeight = (role: string) => {
  return role.toLowerCase() === "user" ? -1 : 1;
};

const sortMessages = (a: IChatMessage, b: IChatMessage) => {
  const timeA = Date.parse(a.createdAt);
  const timeB = Date.parse(b.createdAt);

  if (timeA !== timeB) {
    return timeA - timeB;
  }

  return msgRoleWeight(a.messageRole) - msgRoleWeight(b.messageRole);
};

const getRouteIcon = (route: string) => {
  const path = route.split("?")[0];

  const normalized = path.replace(/\d+/g, ":id");

  return ROUTE_ICON_MAP[normalized] ?? <FileTextOutlined />;
};

const ChatContent = () => {
  const navigate = useNavigate();

  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<IChatMessage[]>([]);
  const [dataPageMap, setDataPageMap] = useState<Record<string, number>>({});
  const [orderId, setOrderId] = useState<string | null>(null);
  const [openViewDetail, setOpenViewDetail] = useState(false);
  const [cursor, setCursor] = useState<{
    lastCreatedAt?: string;
    lastId?: string;
  }>({});

  const { messageApi } = useMessage();
  const { user } = useGetAccount();
  const { conversationId } = useConversation();

  const inputRef = useRef<HTMLInputElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const prevHeightRef = useRef<number>(0);
  const isInitialLoadRef = useRef<boolean>(true);

  const { data, isLoading, isFetching } = useFetchMessagesQuery(
    conversationId
      ? {
          conversationId,
          limit: FETCH_LIMIT,
          lastCreatedAt: cursor.lastCreatedAt,
          lastId: cursor.lastId,
        }
      : skipToken,
    {
      refetchOnMountOrArgChange: true,
    }
  );

  const meta = data?.data?.meta;
  const fetchedMessages = data?.data?.result || [];

  const role = user?.role?.name ?? "ANON";
  const suggestions =
    SUGGESTIONS[role as keyof typeof SUGGESTIONS] ?? SUGGESTIONS.ANON;

  useEffect(() => {
    setMessages([]);
    setCursor({});
    setDataPageMap({});
    prevHeightRef.current = 0;
    isInitialLoadRef.current = true;
  }, [conversationId]);

  useEffect(() => {
    if (!fetchedMessages.length) return;

    const sorted = [...fetchedMessages].sort(sortMessages);

    setMessages((prev) => {
      if (!cursor.lastCreatedAt && !cursor.lastId) {
        return sorted;
      }

      const combined = [...sorted, ...prev];

      const uniqueMap = new Map<string, IChatMessage>();

      for (const msg of combined) {
        uniqueMap.set(msg.id, msg);
      }

      return Array.from(uniqueMap.values()).sort(sortMessages);
    });

    requestAnimationFrame(() => {
      const el = messagesContainerRef.current;

      if (!el) return;

      if (prevHeightRef.current > 0) {
        el.scrollTop = el.scrollHeight - prevHeightRef.current;
        prevHeightRef.current = 0;
      }
    });
  }, [fetchedMessages]);

  useEffect(() => {
    const handler = (res: any) => {
      setSending(false);

      if (res.type === "error") {
        messageApi.error(res.message);

        setMessages((prev) => prev.filter((x) => x.id !== "loading"));

        return;
      }

      const assistantMessage: IChatMessage = {
        id: crypto.randomUUID(),
        conversationId: conversationId!,
        messageRole: "Assistant",
        content: res.data.answer,
        data: res.data.data,
        qs: res.data.qs,
        actions: res.data.actions || [],
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [
        ...prev.filter((x) => x.id !== "loading"),
        assistantMessage,
      ]);
    };

    socket.on("ai_reply", handler);

    return () => {
      socket.off("ai_reply", handler);
    };
  }, [conversationId]);

  useLayoutEffect(() => {
    const el = messagesContainerRef.current;

    if (!el || messages.length === 0) return;

    if (isInitialLoadRef.current) {
      el.scrollTop = el.scrollHeight;
      isInitialLoadRef.current = false;
      return;
    }

    const lastMessage = messages[messages.length - 1];

    const isUser = lastMessage?.messageRole === "User";
    const isLoadingState = lastMessage?.id === "loading";

    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 250;

    if (isUser || isLoadingState || isNearBottom) {
      messagesEndRef.current?.scrollIntoView({
        behavior: "smooth",
      });
    }
  }, [messages]);

  const handleScroll = useCallback(() => {
    const el = messagesContainerRef.current;

    if (!el || !meta || isFetching || sending) return;

    const isTop = el.scrollTop === 0;

    if (isTop && meta.hasMore) {
      prevHeightRef.current = el.scrollHeight;

      setCursor({
        lastCreatedAt: meta.nextCreatedAt,
        lastId: meta.nextId,
      });
    }
  }, [meta, isFetching, sending]);

  const setDataPage = (messageId: string, page: number) => {
    setDataPageMap((prev) => ({
      ...prev,
      [messageId]: page,
    }));
  };

  const renderActions = (actions: IAction[], qs?: string) => {
    if (!actions?.length) return null;

    return (
      <Flex gap={8} wrap style={{ marginTop: 10 }}>
        {actions.map((action, index) => {
          const finalRoute =
            qs && action.route.includes("/filter")
              ? `${action.route}?qs=${encodeURIComponent(qs)}`
              : action.route;

          return (
            <Button
              key={index}
              size="small"
              onClick={() => navigate(finalRoute)}
              className={styles.orangeOutlineBtn}
              icon={getRouteIcon(action.route)}
            >
              {action.label}
            </Button>
          );
        })}
      </Flex>
    );
  };

  const handleSend = () => {
    const value = inputRef?.current?.value?.trim();

    if (!value || sending) return;

    setSending(true);

    const userMessage: IChatMessage = {
      id: crypto.randomUUID(),
      conversationId: conversationId!,
      messageRole: "User",
      actions: [],
      data: [],
      content: value,
      createdAt: new Date().toISOString(),
    };

    const loadingMessage: IChatMessage = {
      id: "loading",
      conversationId: conversationId!,
      messageRole: "Assistant",
      actions: [],
      data: [],
      content: "Thinking...",
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage, loadingMessage]);

    socket.emit("ask_ai", { conversationId, prompt: value });

    if (inputRef.current && inputRef.current.value) {
      inputRef.current.value = "";
    }
  };

  return (
    <>
      <Content className={styles.chatContent}>
        <Flex vertical className={styles.chatWrapper}>
          <div
            ref={messagesContainerRef}
            onScroll={handleScroll}
            className={styles.messagesWrapper}
          >
            {isLoading ? (
              <Skeleton active paragraph={{ rows: 20 }} />
            ) : messages.length === 0 ? (
              <div className={styles.emptyMessages}>
                <Empty
                  image={Empty.PRESENTED_IMAGE_SIMPLE}
                  description={
                    <div>
                      <Text strong>Ask your ecommerce assistant</Text>
                      <div
                        style={{
                          marginTop: 8,
                          marginBottom: 16,
                          color: "#888",
                        }}
                      >
                        Try one of these:
                      </div>
                      <Flex
                        wrap
                        gap={12}
                        justify="center"
                        className={styles.suggestionContainer}
                      >
                        {suggestions.map((x) => (
                          <Button
                            key={x}
                            className={styles.suggestionButton}
                            onClick={() => {
                              if (inputRef.current) {
                                inputRef.current.value = x;
                              }
                              handleSend();
                            }}
                          >
                            {x}
                          </Button>
                        ))}
                      </Flex>
                    </div>
                  }
                />
              </div>
            ) : (
              <>
                {messages.map((msg) => {
                  const isUser = msg.messageRole === "User";

                  const currentPage = dataPageMap[msg.id] || 1;

                  const paginatedData = Array.isArray(msg.data)
                    ? msg.data.slice(
                        (currentPage - 1) * PAGE_SIZE,
                        currentPage * PAGE_SIZE
                      )
                    : [];

                  return (
                    <div
                      key={msg.id}
                      className={
                        isUser ? styles.userMessage : styles.assistantMessage
                      }
                    >
                      <div className={styles.messageText}>
                        <Text style={isUser ? { color: "#fff" } : {}}>
                          {msg.content}
                        </Text>
                      </div>

                      {!isUser && (
                        <ChatData
                          setOpenViewDetail={setOpenViewDetail}
                          setOrderId={setOrderId}
                          data={paginatedData}
                        />
                      )}

                      {!isUser &&
                        msg.actions?.length > 0 &&
                        renderActions(msg.actions, msg.qs)}

                      {!isUser &&
                        Array.isArray(msg.data) &&
                        msg.data?.length > PAGE_SIZE && (
                          <Flex justify="center" style={{ marginTop: 8 }}>
                            <Pagination
                              size="small"
                              current={dataPageMap[msg.id] || 1}
                              pageSize={PAGE_SIZE}
                              total={msg.data?.length}
                              onChange={(page) => setDataPage(msg.id, page)}
                              showSizeChanger={false}
                            />
                          </Flex>
                        )}
                    </div>
                  );
                })}
              </>
            )}
            <div
              ref={messagesEndRef}
              style={{ float: "left", clear: "both" }}
            />
          </div>
          <div className={styles.inputWrapper}>
            <Flex gap={12} align="flex-end">
              <input
                ref={inputRef}
                placeholder="Ask anything..."
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                className={styles.textArea}
              />
              <Button
                loading={sending}
                className={styles.sendBtn}
                onClick={handleSend}
                icon={<SendOutlined />}
              >
                Send
              </Button>
            </Flex>
          </div>
        </Flex>
      </Content>
      <ViewOrderDetail
        onClose={setOpenViewDetail}
        open={openViewDetail}
        setOrderId={setOrderId}
        orderId={orderId}
        area={["ADMIN", "STAFF"].includes(user.role.name) ? "ADMIN" : "CLIENT"}
      />
    </>
  );
};

export default ChatContent;
