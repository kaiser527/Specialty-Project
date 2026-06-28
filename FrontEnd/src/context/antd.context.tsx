import { notification, message as messageAntd } from "antd";
import { MessageInstance } from "antd/es/message/interface";
import { NotificationInstance } from "antd/es/notification/interface";
import { createContext, ReactNode } from "react";

interface IAntdContext {
  notificationApi: NotificationInstance;
  messageApi: MessageInstance;
}

export const AntdContext = createContext<IAntdContext | null>(null);

const AntdProvider = ({ children }: { children: ReactNode }) => {
  const [notificationApi, contextHolderNotify] = notification.useNotification();
  const [messageApi, contextHolderMessage] = messageAntd.useMessage();

  return (
    <AntdContext.Provider value={{ notificationApi, messageApi }}>
      {contextHolderNotify}
      {contextHolderMessage}
      {children}
    </AntdContext.Provider>
  );
};

export default AntdProvider;
