import { socket } from "@/config/constants/utils";
import { useGetAccount } from "@/hooks/useGetAccount";
import { useMessage } from "@/hooks/useMessage";
import { useSkipPath } from "@/hooks/useSkipPath";
import { useAppDispatch } from "@/redux/hooks";
import { setRefreshTokenAction } from "@/redux/slice/accountSlice";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

interface IProps {
  children: React.ReactNode;
}

const LayoutApp = (props: IProps) => {
  const { isRefreshToken } = useGetAccount();
  const shouldSkip = useSkipPath();
  const { messageApi } = useMessage();

  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (isRefreshToken) {
      localStorage.removeItem("access_token");
      dispatch(setRefreshTokenAction(false));
      if (socket.connected) {
        socket.disconnect();
        socket.connect();
      }
      if (!shouldSkip) {
        messageApi.error("Your session is ended please login");
        navigate("/login");
      }
    }
  }, [isRefreshToken]);

  useEffect(() => {
    !socket.connected && socket.connect();

    const handler = async (err: any) => {
      messageApi.error(err.message);
    };

    socket.on("auth_error", handler);

    return () => {
      socket.off("auth_error", handler);
    };
  }, []);

  return <>{props.children}</>;
};

export default LayoutApp;
