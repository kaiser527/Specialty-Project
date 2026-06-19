import { ALL_MODULES } from "@/config/constants/permissions";
import { useMessage } from "@/hooks/useMessage";
import {
  useCreatePermissionMutation,
  useUpdatePermissionMutation,
} from "@/redux/api/permissionApi";
import { IPermission } from "@/types/backend";
import {
  ModalForm,
  ProFormSelect,
  ProFormText,
} from "@ant-design/pro-components";
import { Col, Form, Grid, Row } from "antd";

interface IProps {
  openModal: boolean;
  setOpenModal: (v: boolean) => void;
  dataInit?: IPermission | null;
  setDataInit: (v: any) => void;
}

const { useBreakpoint } = Grid;

const ModalPermission = (props: IProps) => {
  const screens = useBreakpoint();

  const [create, { isLoading: isLoadingCreate }] =
    useCreatePermissionMutation();
  const [update, { isLoading: isLoadingUpdate }] =
    useUpdatePermissionMutation();
  const isSubmitting = isLoadingCreate || isLoadingUpdate;

  const { openModal, setOpenModal, dataInit, setDataInit } = props;
  const [form] = Form.useForm();

  const { messageApi, notificationApi } = useMessage();

  const submitPermission = async (valuesForm: any) => {
    const res = dataInit?._id
      ? await update({ _id: dataInit._id, permission: valuesForm }).unwrap()
      : await create(valuesForm).unwrap();
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

  const handleReset = async () => {
    form.resetFields();
    setDataInit(null);
    setOpenModal(false);
  };

  return (
    <ModalForm
      title={<>{dataInit?._id ? "Update Permission" : "Create Permission"}</>}
      open={openModal}
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
        width: screens.xs ? "100%" : 720,
        keyboard: false,
        maskClosable: false,
        okText: <>{dataInit?._id ? "Update" : "Create"}</>,
        cancelText: "Cancel",
      }}
      scrollToFirstError={true}
      preserve={false}
      form={form}
      onFinish={submitPermission}
      initialValues={dataInit?._id ? dataInit : {}}
    >
      <Row gutter={16}>
        <Col lg={12} md={12} sm={12} xs={24}>
          <ProFormText
            label="Permission name"
            name="name"
            rules={[{ required: true }]}
            placeholder="Enter name"
          />
        </Col>
        <Col lg={12} md={12} sm={12} xs={24}>
          <ProFormText
            label="API Path"
            name="apiPath"
            rules={[{ required: true }]}
            placeholder="Enter path"
          />
        </Col>
        <Col lg={12} md={12} sm={12} xs={24}>
          <ProFormSelect
            name="method"
            label="Method"
            valueEnum={{
              GET: "GET",
              POST: "POST",
              PUT: "PUT",
              PATCH: "PATCH",
              DELETE: "DELETE",
            }}
            placeholder="Please select a method"
            rules={[{ required: true }]}
          />
        </Col>
        <Col lg={12} md={12} sm={12} xs={24}>
          <ProFormSelect
            name="module"
            label="Belong to Module"
            valueEnum={ALL_MODULES}
            placeholder="Please select a module"
            rules={[{ required: true }]}
          />
        </Col>
      </Row>
    </ModalForm>
  );
};

export default ModalPermission;
