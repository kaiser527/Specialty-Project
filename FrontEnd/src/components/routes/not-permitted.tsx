import { useBackground } from "@/hooks/useBackground";
import { Button, Result } from "antd";
import { useNavigate } from "react-router-dom";

const NotPermitted = () => {
  const navigate = useNavigate();

  const { background } = useBackground();

  return (
    <Result
      status="403"
      title="403"
      subTitle="Sorry, you are not authorized to access this page."
      extra={
        <Button
          type={background === "dark" ? "default" : "primary"}
          onClick={() => navigate("/")}
        >
          Back Home
        </Button>
      }
    />
  );
};

export default NotPermitted;
