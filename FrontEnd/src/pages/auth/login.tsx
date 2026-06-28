import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  Row,
  Space,
  Typography,
} from "antd";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { setUserLoginInfo } from "@/redux/slice/accountSlice";
import { FacebookFilled, GoogleOutlined } from "@ant-design/icons";
import { useLoginMutation, useResendMutation } from "@/redux/api/accountApi";
import { useGetAccount } from "@/hooks/useGetAccount";
import { useMessage } from "@/hooks/useMessage";
import { setCountDown } from "@/redux/slice/timerSlice";
import { socket } from "@/config/constants/utils";
import { useBackground } from "@/hooks/useBackground";

const { Title, Text } = Typography;

const LoginPage = () => {
  const [resend] = useResendMutation();
  const [login, { isLoading }] = useLoginMutation();

  const { isAuthenticated } = useGetAccount();
  const { background } = useBackground();
  const { messageApi, notificationApi } = useMessage();

  const navigate = useNavigate();
  const dispatch = useDispatch();

  const location = useLocation();
  const from = location.state?.from || "/";

  const emailRef = useRef("");

  useEffect(() => {
    if (isAuthenticated) {
      navigate(from, { replace: true });
    }
  }, []);

  const onFinish = async (values: any) => {
    const { username, password } = values;
    const res = await login({ username, password }).unwrap();
    if (res.data) {
      if (socket.connected) {
        socket.disconnect();
        socket.connect();
      }
      localStorage.setItem("access_token", res.data.access_token);
      dispatch(setUserLoginInfo(res.data.user));
      messageApi.success("Login successfully!");
      navigate(from, { replace: true });
    } else {
      notificationApi.error({
        message: "Error occurred",
        description: res.message,
        duration: 5,
      });
    }
  };

  const handleClickForgot = async () => {
    const type = "reset";
    const res = await resend({
      email: emailRef.current,
      type,
    }).unwrap();
    if (res?.data) {
      messageApi.success(res.message);
      dispatch(setCountDown(60));
      navigate(`/verify/${emailRef.current}?type=${type}`);
    } else {
      notificationApi.error({
        message: "Error occurred",
        description: res.message,
        duration: 5,
      });
    }
  };

  return (
    <div
      style={{
        minHeight: "calc(100vh - 39.7px)",
        background:
          background === "dark"
            ? "linear-gradient(135deg, #121212 0%, #102a43 50%, #1677ff 100%)"
            : "linear-gradient(135deg,#1677ff 0%,#69b1ff 40%,#e6f4ff 100%)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        padding: 20,
      }}
    >
      <Card
        style={{
          width: 420,
          borderRadius: 16,
          boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
        }}
      >
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div style={{ textAlign: "center" }}>
            <Title level={2}>Welcome back</Title>
            <Text type="secondary">Login to your account</Text>
          </div>

          <Form layout="vertical" onFinish={onFinish}>
            <Form.Item
              label="Email"
              name="username"
              rules={[{ required: true }]}
            >
              <Input
                onChange={(e) => (emailRef.current = e.target.value)}
                size="large"
                placeholder="Enter your email"
              />
            </Form.Item>

            <Form.Item
              label="Password"
              name="password"
              rules={[{ required: true }]}
            >
              <Input.Password size="large" placeholder="Enter password" />
            </Form.Item>

            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={isLoading}
            >
              Login
            </Button>
          </Form>

          <Divider>Or continue with</Divider>

          <Row gutter={12}>
            <Col span={12}>
              <Button
                icon={<GoogleOutlined />}
                block
                size="large"
                href={`${
                  import.meta.env.VITE_BACKEND_URL
                }/api/v1/auth/google/login`}
              >
                Google
              </Button>
            </Col>

            <Col span={12}>
              <Button
                icon={<FacebookFilled />}
                block
                size="large"
                style={{ background: "#1877f2", color: "#fff" }}
                href={`${
                  import.meta.env.VITE_BACKEND_URL
                }/api/v1/auth/facebook/login`}
              >
                Facebook
              </Button>
            </Col>
          </Row>

          <Row>
            <Col span={12}>
              <Text style={{ textAlign: "center" }}>
                Don’t have an account? <Link to="/register">Register</Link>
              </Text>
            </Col>
            <Col span={12}>
              <Text style={{ textAlign: "center" }} onClick={handleClickForgot}>
                <Link to="">Forgot account password</Link>
              </Text>
            </Col>
          </Row>
        </Space>
      </Card>
    </div>
  );
};

export default LoginPage;
