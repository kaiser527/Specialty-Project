import { useGetAccount } from "@/hooks/useGetAccount";
import { IImage } from "@/types/frontend";
import { UserOutlined } from "@ant-design/icons";
import { Avatar, Button, Col, Form, Input, Row, Select } from "antd";
import { v4 as uuidv4 } from "uuid";
import { useEffect, useState } from "react";
import UploadImage from "@/components/share/upload";
import { useMessage } from "@/hooks/useMessage";
import { useAppDispatch } from "@/redux/hooks";
import { setLogoutAction, setUserLoginInfo } from "@/redux/slice/accountSlice";
import { useUpdateUserClientMutation } from "@/redux/api/accountApi";
import { useBackground } from "@/hooks/useBackground";
import styles from "styles/home.module.scss";

const UserProfileForm = () => {
  const [updateUserClient, { isLoading }] = useUpdateUserClientMutation();

  const [dataImage, setDataImage] = useState<IImage[]>([]);

  const dispatch = useAppDispatch();
  const [form] = Form.useForm();

  const { user } = useGetAccount();
  const { background } = useBackground();
  const { messageApi, notificationApi } = useMessage();

  useEffect(() => {
    if (user) {
      form.setFieldsValue(user);
      setDataImage(
        user.image
          ? [
              {
                name: user.image ?? "user.png",
                uid: uuidv4(),
              },
            ]
          : []
      );
    } else {
      setDataImage([]);
    }
  }, [user]);

  const onFinish = async (values: any) => {
    const res = await updateUserClient({
      ...values,
      image: dataImage[0]?.name ?? "user.png",
    }).unwrap();
    if (res?.data) {
      messageApi.success("Update profile successfully");
      dispatch(setLogoutAction());
      localStorage.setItem("access_token", res.data.access_token);
      dispatch(setUserLoginInfo(res.data.user));
    } else {
      notificationApi.error({
        message: "Error occurred",
        description: res.message,
        duration: 5,
      });
    }
  };

  return (
    <Form
      layout="vertical"
      form={form}
      onFinish={onFinish}
      style={{ marginTop: 10 }}
    >
      <Row gutter={[24, 0]}>
        <Col xs={24} md={6} style={{ textAlign: "center" }}>
          <Avatar
            size={160}
            src={`${import.meta.env.VITE_BACKEND_URL}/images/user/${
              dataImage[0]?.name
            }`}
            icon={<UserOutlined />}
            style={{ marginBottom: 16 }}
          />
          <br />
          <UploadImage
            folder="user"
            renderChild="button"
            setDataImage={setDataImage}
            dataImage={dataImage}
          />
        </Col>

        <Col xs={24} md={18}>
          <Row gutter={16}>
            <Col xs={24} sm={12} md={12} lg={12}>
              <Form.Item
                label="Full Name"
                name="name"
                rules={[{ required: true, message: "Name is required" }]}
              >
                <Input placeholder="Enter your name" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={12} lg={12}>
              <Form.Item
                label="Email"
                name="email"
                rules={[{ required: true }]}
              >
                <Input
                  disabled={user.accountType !== "LOCAL"}
                  placeholder="Enter your email"
                />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={12} lg={12}>
              <Form.Item label="Age" name="age" rules={[{ required: true }]}>
                <Input type="number" placeholder="Your age" />
              </Form.Item>
            </Col>

            <Col xs={24} sm={12} md={12} lg={12}>
              <Form.Item
                label="Gender"
                name="gender"
                rules={[{ required: true }]}
              >
                <Select
                  options={[
                    { value: "MALE", label: "Male" },
                    { value: "FEMALE", label: "Female" },
                    { value: "OTHER", label: "Other" },
                  ]}
                />
              </Form.Item>
            </Col>

            <Col span={user.accountType === "LOCAL" ? 24 : 0}>
              <Form.Item label="New Password" name="newPassword">
                <Input.Password placeholder="Leave empty if not changing password" />
              </Form.Item>
            </Col>

            <Col span={24}>
              <Form.Item
                label="Address"
                name="address"
                rules={[{ required: true }]}
              >
                <Input.TextArea
                  autoSize={{ minRows: 3, maxRows: 3 }}
                  placeholder="Your address"
                />
              </Form.Item>
            </Col>

            <Col span={24} style={{ textAlign: "right" }}>
              <Button
                type={background === "dark" ? "default" : "primary"}
                htmlType="submit"
                loading={isLoading}
                size="large"
                className={background === "dark" ? styles.darkButton : ""}
              >
                Update Profile
              </Button>
            </Col>
          </Row>
        </Col>
      </Row>
    </Form>
  );
};

export default UserProfileForm;
