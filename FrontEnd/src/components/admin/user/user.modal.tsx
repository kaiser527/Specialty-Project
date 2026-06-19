import { useMessage } from "@/hooks/useMessage";
import { useFetchRoleQuery } from "@/redux/api/roleApi";
import { IUser } from "@/types/backend";
import { IImage } from "@/types/frontend";
import { Col, Form, Grid, Row } from "antd";
import { v4 as uuidv4 } from "uuid";
import { useEffect, useState } from "react";
import {
  ModalForm,
  ProFormDigit,
  ProFormRadio,
  ProFormSelect,
  ProFormSwitch,
  ProFormText,
} from "@ant-design/pro-components";
import UploadImage from "@/components/share/upload";
import {
  useCreateUserMutation,
  useUpdateUserMutation,
} from "@/redux/api/userApi";

interface IProps {
  openModal: boolean;
  setOpenModal: (v: boolean) => void;
  dataInit?: IUser | null;
  setDataInit: (v: IUser | null) => void;
}

const { useBreakpoint } = Grid;

const ModalUser = (props: IProps) => {
  const screens = useBreakpoint();

  const { openModal, setOpenModal, dataInit, setDataInit } = props;

  const [update, { isLoading: isLoadingUpdate }] = useUpdateUserMutation();
  const [create, { isLoading: isLoadingCreate }] = useCreateUserMutation();
  const isSubmitting = isLoadingCreate || isLoadingUpdate;

  const { data } = useFetchRoleQuery("pageSize=100&current=1");
  const roles = data?.data?.result ?? [];

  const [dataImage, setDataImage] = useState<IImage[]>([]);

  const [form] = Form.useForm();

  const { messageApi, notificationApi } = useMessage();

  useEffect(() => {
    if (dataInit?._id) {
      setDataImage([
        {
          name: dataInit?.image,
          uid: uuidv4(),
        },
      ]);
    }
  }, [dataInit]);

  const handleReset = async () => {
    setDataImage([]);
    form.resetFields();
    setDataInit(null);
    setOpenModal(false);
  };

  const onFinish = async (values: any) => {
    const { email, password, accountType, ...rest } = values;
    const image = dataImage[0]?.name ?? "user.png";
    const res = dataInit?._id
      ? await update({ _id: dataInit._id, user: { ...rest, image } }).unwrap()
      : await create({ email, password, image, accountType, ...rest }).unwrap();
    if (res?.data) {
      messageApi.success(res.message);
      handleReset();
    } else {
      notificationApi.error({
        message: "Error occurred!",
        description: res.message,
        duration: 3,
      });
    }
  };

  return (
    <ModalForm
      title={dataInit ? "Update user" : "Create user"}
      onFinish={onFinish}
      submitter={{
        submitButtonProps: {
          loading: isSubmitting,
        },
      }}
      modalProps={{
        onCancel: () => handleReset(),
        confirmLoading: isSubmitting,
        afterClose: () => handleReset(),
        destroyOnClose: true,
        keyboard: false,
        maskClosable: false,
        width: screens.xs ? "100%" : 800,
        okText: <>{dataInit?._id ? "Update" : "Create"}</>,
        cancelText: "Cancel",
      }}
      scrollToFirstError={true}
      preserve={false}
      open={openModal}
      form={form}
      initialValues={
        dataInit?._id
          ? {
              ...dataInit,
              role: dataInit.role?._id,
            }
          : {}
      }
    >
      <Row gutter={16}>
        <Col lg={12} md={12} sm={12} xs={24}>
          <ProFormText
            disabled={dataInit && dataInit?._id ? true : false}
            label="Email"
            name="email"
            rules={[
              { required: true },
              { type: "email", message: "Incorrect email format" },
            ]}
            placeholder={"Enter user email"}
          />
        </Col>
        <Col lg={12} md={12} sm={12} xs={24}>
          <ProFormText.Password
            disabled={dataInit?._id ? true : false}
            label={"Password"}
            name="password"
            rules={[
              {
                required: dataInit?._id ? false : true,
              },
            ]}
            placeholder={"Enter user password"}
          />
        </Col>
        <Col lg={6} md={6} sm={12} xs={24}>
          <ProFormText
            label={"Name"}
            name="name"
            rules={[{ required: true }]}
            placeholder={"Enter user name"}
          />
        </Col>
        <Col lg={6} md={6} sm={12} xs={24}>
          <ProFormText
            label={"Address"}
            name="address"
            rules={[{ required: true }]}
            placeholder={"Enter user address"}
          />
        </Col>
        <Col lg={6} md={6} sm={8} xs={24}>
          <ProFormDigit
            label={"Age"}
            name="age"
            rules={[{ required: true }]}
            placeholder={"Enter user age"}
          />
        </Col>
        <Col lg={6} md={6} sm={8} xs={24}>
          <ProFormSelect
            name="gender"
            label={"Gender"}
            valueEnum={{
              MALE: "Male",
              FEMALE: "Female",
              OTHER: "Other",
            }}
            placeholder={"Select user gender"}
            rules={[{ required: true }]}
          />
        </Col>
        <Col lg={6} md={6} sm={8} xs={24}>
          <ProFormSelect
            name="accountType"
            label={"Account type"}
            valueEnum={{
              LOCAL: "Local",
              GOOGLE: "Google",
              FACEBOOK: "Facebook",
            }}
            disabled={dataInit?._id !== undefined}
            placeholder={"Select user account type"}
            rules={[{ required: true }]}
          />
        </Col>
        <Col lg={8} md={6} sm={8} xs={8}>
          <p style={{ marginBottom: 9 }}>Image</p>
          <UploadImage
            renderChild="upload"
            folder="user"
            dataImage={dataImage}
            showList={true}
            setDataImage={setDataImage}
          />
        </Col>
        <Col lg={4} md={6} sm={8} xs={8}>
          <ProFormRadio.Group
            layout="vertical"
            name="role"
            label={"Role"}
            options={roles.map((item) => {
              return {
                label: item.name,
                value: item._id,
              };
            })}
            rules={[{ required: true }]}
          />
        </Col>
        <Col lg={6} md={6} sm={8} xs={8}>
          <ProFormSwitch label={"Active"} name="isActive" />
        </Col>
      </Row>
    </ModalForm>
  );
};

export default ModalUser;
