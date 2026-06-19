import { notification, message as messageAntd, ConfigProvider } from "antd";
import { MessageInstance } from "antd/es/message/interface";
import { NotificationInstance } from "antd/es/notification/interface";
import { createContext, ReactNode } from "react";
import enUS from "antd/locale/en_US";
import dayjs from "dayjs";

dayjs.locale("en");

interface IAntdContext {
  notificationApi: NotificationInstance;
  messageApi: MessageInstance;
}

export const AntdContext = createContext<IAntdContext | null>(null);

const AntdProvider = ({ children }: { children: ReactNode }) => {
  const [notificationApi, contextHolderNotify] = notification.useNotification();
  const [messageApi, contextHolderMessage] = messageAntd.useMessage();

  return (
    <ConfigProvider locale={enUS}>
      <AntdContext.Provider value={{ notificationApi, messageApi }}>
        {contextHolderNotify}
        {contextHolderMessage}
        {children}
      </AntdContext.Provider>
    </ConfigProvider>
  );
};

export default AntdProvider;
