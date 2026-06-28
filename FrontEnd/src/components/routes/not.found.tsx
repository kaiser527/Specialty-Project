import { useNavigate } from "react-router-dom";
import { Button, Flex, Result } from "antd";
import { useBackground } from "@/hooks/useBackground";
import { DARKTHEME } from "@/config/constants/utils";

const NotFound = () => {
  const navigate = useNavigate();

  const { background } = useBackground();

  return (
    <Flex
      align="center"
      justify="center"
      style={{
        background: background === "dark" ? DARKTHEME.bg : "#fff",
        height: "100vh",
      }}
    >
      <Result
        status="404"
        title="404"
        subTitle="Sorry, the page you visited does not exist."
        extra={
          <Button
            type={background === "dark" ? "default" : "primary"}
            onClick={() => {
              if (window.history.length > 1) {
                navigate(-1);
              } else {
                navigate("/");
              }
            }}
          >
            Back Home
          </Button>
        }
      />
    </Flex>
  );
};

export default NotFound;
