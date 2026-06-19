import { useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { socket } from "@/config/constants/utils";
import { useMessage } from "@/hooks/useMessage";

const RedirectUser = () => {
  const { messageApi, notificationApi } = useMessage();

  const navigate = useNavigate();
  const location = useLocation();
  const hasRun = useRef(false);

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    const params = new URLSearchParams(location.search);
    const status = params.get("status");
    const errorMessage = params.get("message");
    const isPayment = params.get("isPayment");
    const error = params.get("error");

    if (status === "success") {
      if (!isPayment) {
        messageApi.success("Login successfully!");
        if (socket.connected) {
          socket.disconnect();
          socket.connect();
        }
      } else {
        messageApi.success("Payment successfully");
      }
      navigate("/", { replace: true });
    } else {
      if (isPayment) {
        messageApi.error(error ?? "Payment failed");
      } else {
        notificationApi.error({
          message: "Login failed!",
          description: errorMessage,
          duration: 3,
        });
      }
      navigate(isPayment ? "/" : "/login", { replace: true });
    }
  }, []);

  return null;
};

export default RedirectUser;
