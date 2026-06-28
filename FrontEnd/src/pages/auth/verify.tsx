import { Card, Typography, Button, Input, Space, Form } from "antd";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import {
  useResendMutation,
  useResetMutation,
  useVerifyMutation,
} from "@/redux/api/accountApi";
import { useMessage } from "@/hooks/useMessage";
import { useEffect } from "react";
import { useGetAccount } from "@/hooks/useGetAccount";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setCountDown } from "@/redux/slice/timerSlice";
import { useBackground } from "@/hooks/useBackground";

const { Title, Text } = Typography;

const VerifyPage = () => {
  const [verify, { isLoading: isLoadingVerify }] = useVerifyMutation();
  const [resend, { isLoading: isLoadingResend }] = useResendMutation();
  const [reset, { isLoading: isLoadingReset }] = useResetMutation();

  const countDown = useAppSelector((state) => state.timer.countDown);

  const { messageApi, notificationApi } = useMessage();
  const { isAuthenticated } = useGetAccount();
  const { background } = useBackground();

  const { email } = useParams();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const [form] = Form.useForm();

  const [searchParams] = useSearchParams();
  const type = searchParams.get("type");

  const handleVerify = async (values: any) => {
    const { otp, password, confirmedPassword } = values;

    const res =
      type === "reset"
        ? await reset({
            otp,
            password,
            confirmedPassword,
            email: email as string,
          }).unwrap()
        : await verify({
            email: email as string,
            otp,
          }).unwrap();

    if (res?.data) {
      messageApi.success(
        type === "reset"
          ? "Reset password successfully"
          : "Verify account successfully"
      );

      form.resetFields();
      navigate("/login");
    } else {
      notificationApi.error({
        message: "Error occurred",
        description: res.message,
        duration: 5,
      });
    }
  };

  const handleResend = async () => {
    const res = await resend({
      email: email as string,
      type: type ?? "register",
    }).unwrap();
    if (res?.data) {
      dispatch(setCountDown(60));
      messageApi.success(res.message);
      form.resetFields(["otp"]);
    } else {
      notificationApi.error({
        message: "Error occurred",
        description: res.message,
        duration: 5,
      });
    }
  };

  useEffect(() => {
    if (countDown === 0) return;

    const timer = setTimeout(() => {
      dispatch(setCountDown(countDown - 1));
    }, 1000);

    return () => clearTimeout(timer);
  }, [countDown]);

  useEffect(() => {
    if (isAuthenticated) {
      navigate("/");
    }
  }, []);

  return (
    <div
      style={{
        minHeight: "calc(100vh - 39.7px)",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background:
          background === "dark"
            ? "linear-gradient(135deg, #121212 0%, #102a43 50%, #1677ff 100%)"
            : "linear-gradient(135deg,#1677ff 0%,#69b1ff 40%,#e6f4ff 100%)",
        padding: 20,
      }}
    >
      {(type === "reset" || type === "register") && (
        <Form
          form={form}
          layout="vertical"
          onFinish={handleVerify}
          style={{ width: 420 }}
        >
          <Card
            style={{
              borderRadius: 16,
              backdropFilter: "blur(10px)",
              boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
              textAlign: "center",
            }}
          >
            <Space direction="vertical" size="middle" style={{ width: "100%" }}>
              <Title level={2} style={{ marginBottom: 0 }}>
                {type === "register"
                  ? "Verify your account"
                  : "Reset account password"}
              </Title>

              <Text type="secondary">Enter the 6-digit code sent to</Text>

              <Text strong style={{ fontSize: 16 }}>
                {email}
              </Text>

              <Form.Item
                name="otp"
                rules={[{ required: true, message: "OTP is required" }]}
              >
                <Input.OTP
                  length={6}
                  size="large"
                  style={{ justifyContent: "center", marginTop: 10 }}
                />
              </Form.Item>

              {type === "reset" && (
                <>
                  <Form.Item
                    name="password"
                    rules={[
                      { required: true, message: "Password is required" },
                      {
                        min: 6,
                        message: "Password must be at least 6 characters",
                      },
                    ]}
                  >
                    <Input.Password placeholder="New password" size="large" />
                  </Form.Item>

                  <Form.Item
                    name="confirmedPassword"
                    dependencies={["password"]}
                    rules={[
                      {
                        required: true,
                        message: "Confirm password is required",
                      },
                      ({ getFieldValue }) => ({
                        validator(_, value) {
                          if (!value || getFieldValue("password") === value) {
                            return Promise.resolve();
                          }
                          return Promise.reject(
                            new Error("Passwords do not match")
                          );
                        },
                      }),
                    ]}
                  >
                    <Input.Password
                      placeholder="Confirm password"
                      size="large"
                    />
                  </Form.Item>
                </>
              )}

              <Button
                type="primary"
                block
                size="large"
                htmlType="submit"
                loading={type === "reset" ? isLoadingReset : isLoadingVerify}
                style={{
                  borderRadius: 8,
                  height: 45,
                  fontWeight: 500,
                }}
              >
                {type === "register" ? "Verify OTP" : "Reset password"}
              </Button>

              <Text type="secondary">
                Didn’t receive the code?{" "}
                {countDown > 0 && !isLoadingResend ? (
                  <span>Resend in {countDown}s</span>
                ) : (
                  <a onClick={handleResend}>Resend OTP</a>
                )}
              </Text>
            </Space>
          </Card>
        </Form>
      )}
    </div>
  );
};

export default VerifyPage;
