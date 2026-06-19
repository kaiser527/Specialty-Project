import { useMessage } from "@/hooks/useMessage";
import {
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
} from "@/redux/api/categoryApi";
import { ICategory } from "@/types/backend";
import { ModalForm, ProFormText } from "@ant-design/pro-components";
import { Col, Form, Grid, Input, Row } from "antd";

interface IProps {
  openModal: boolean;
  setOpenModal: (v: boolean) => void;
  dataInit?: ICategory | null;
  setDataInit: (v: ICategory | null) => void;
}

const { useBreakpoint } = Grid;

const CategoryModal = (props: IProps) => {
  const screens = useBreakpoint();
  const [form] = Form.useForm();

  const { openModal, setOpenModal, dataInit, setDataInit } = props;

  const [update, { isLoading: isLoadingUpdate }] = useUpdateCategoryMutation();
  const [create, { isLoading: isLoadingCreate }] = useCreateCategoryMutation();
  const isSubmitting = isLoadingCreate || isLoadingUpdate;

  const { messageApi, notificationApi } = useMessage();

  const handleReset = async () => {
    form.resetFields();
    setDataInit(null);
    setOpenModal(false);
  };

  const onFinish = async (values: any) => {
    const res = dataInit?.id
      ? await update({ id: dataInit.id, category: values }).unwrap()
      : await create(values).unwrap();
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
      title={<>{dataInit?.id ? "Update Category" : "Create Category"}</>}
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
        okText: <>{dataInit?.id ? "Update" : "Create"}</>,
        cancelText: "Cancel",
      }}
      scrollToFirstError={true}
      preserve={false}
      form={form}
      onFinish={onFinish}
      initialValues={dataInit?.id ? dataInit : {}}
    >
      <Row gutter={16}>
        <Col lg={7} md={7} sm={7} xs={24}>
          <ProFormText
            label="Category name"
            name="name"
            rules={[{ required: true }]}
            placeholder="Enter name"
          />
        </Col>
        <Col lg={17} md={17} sm={17} xs={24}>
          <Form.Item
            label="Category description"
            name="description"
            rules={[{ required: true }]}
          >
            <Input.TextArea
              autoSize={{ minRows: 3, maxRows: 3 }}
              placeholder="Enter description"
            />
          </Form.Item>
        </Col>
      </Row>
    </ModalForm>
  );
};

export default CategoryModal;
