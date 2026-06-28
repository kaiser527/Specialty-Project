import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Select,
  Space,
  Typography,
} from "antd";
import { Link, useNavigate } from "react-router-dom";
import { IUser } from "@/types/backend";
import { useRegisterMutation } from "@/redux/api/accountApi";
import { useMessage } from "@/hooks/useMessage";
import { useBackground } from "@/hooks/useBackground";

const { Option } = Select;
const { Title, Text } = Typography;

const RegisterPage = () => {
  const [register, { isLoading }] = useRegisterMutation();

  const { messageApi, notificationApi } = useMessage();
  const { background } = useBackground();

  const navigate = useNavigate();

  const onFinish = async (values: IUser) => {
    const { name, email, password, age, gender, address } = values;

    const res = await register({
      name,
      email,
      password: password as string,
      age: +age,
      gender,
      address,
    }).unwrap();

    if (res.data) {
      messageApi.success(res.message);
      navigate(`/verify/${res.data.email}?type=register`);
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
          width: 650,
          borderRadius: 16,
          boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
        }}
      >
        <Space direction="vertical" size="large" style={{ width: "100%" }}>
          <div style={{ textAlign: "center" }}>
            <Title level={2}>Create account</Title>
            <Text type="secondary">Start your journey with us</Text>
          </div>

          <Form layout="vertical" onFinish={onFinish}>
            <Row gutter={16}>
              <Col xs={24} sm={12} md={12} lg={12}>
                <Form.Item
                  label="Name"
                  name="name"
                  rules={[{ required: true }]}
                >
                  <Input placeholder="Enter your name" size="large" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={12} lg={12}>
                <Form.Item
                  label="Email"
                  name="email"
                  rules={[{ required: true }]}
                >
                  <Input placeholder="Enter your email" size="large" />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={12} lg={12}>
                <Form.Item
                  label="Password"
                  name="password"
                  rules={[{ required: true }]}
                >
                  <Input.Password
                    placeholder="Enter your password"
                    size="large"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={12} lg={12}>
                <Form.Item label="Age" name="age" rules={[{ required: true }]}>
                  <Input
                    placeholder="Enter your age"
                    type="number"
                    size="large"
                  />
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={12} lg={12}>
                <Form.Item
                  label="Gender"
                  name="gender"
                  rules={[{ required: true }]}
                >
                  <Select placeholder="Select your gender" size="large">
                    <Option value="male">Male</Option>
                    <Option value="female">Female</Option>
                    <Option value="other">Other</Option>
                  </Select>
                </Form.Item>
              </Col>

              <Col xs={24} sm={12} md={12} lg={12}>
                <Form.Item
                  label="Address"
                  name="address"
                  rules={[{ required: true }]}
                >
                  <Input placeholder="Enter your address" size="large" />
                </Form.Item>
              </Col>
            </Row>

            <Button
              type="primary"
              htmlType="submit"
              block
              size="large"
              loading={isLoading}
            >
              Register
            </Button>
          </Form>

          <Text style={{ textAlign: "center" }}>
            Already have an account? <Link to="/login">Login</Link>
          </Text>
        </Space>
      </Card>
    </div>
  );
};

export default RegisterPage;
