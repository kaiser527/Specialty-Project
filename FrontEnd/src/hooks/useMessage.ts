import { AntdContext } from "@/context/antd.context";
import { useContext } from "react";

export const useMessage = () => {
  const { messageApi, notificationApi } = useContext(AntdContext)!;

  return { messageApi, notificationApi };
};
