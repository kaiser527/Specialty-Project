import { formatterNumber, parserNumber } from "@/config/helpers/global";
import { useMessage } from "@/hooks/useMessage";
import {
  useCreateVoucherMutation,
  useUpdateVoucherMutation,
} from "@/redux/api/voucherApi";
import { IVoucher } from "@/types/backend";
import {
  ModalForm,
  ProFormDatePicker,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
} from "@ant-design/pro-components";
import { Col, Form, Grid, Row } from "antd";

interface IProps {
  openModal: boolean;
  setOpenModal: (v: boolean) => void;
  dataInit?: IVoucher | null;
  setDataInit: (v: IVoucher | null) => void;
}

const { useBreakpoint } = Grid;

const VoucherModal = (props: IProps) => {
  const screens = useBreakpoint();

  const [form] = Form.useForm();

  const { openModal, setOpenModal, dataInit, setDataInit } = props;

  const [update, { isLoading: isLoadingUpdate }] = useUpdateVoucherMutation();
  const [create, { isLoading: isLoadingCreate }] = useCreateVoucherMutation();
  const isSubmitting = isLoadingCreate || isLoadingUpdate;

  const { messageApi, notificationApi } = useMessage();

  const handleReset = async () => {
    form.resetFields();
    setDataInit(null);
    setOpenModal(false);
  };

  const onFinish = async (values: any) => {
    if (!values.code?.trim()) {
      delete values.code;
    }
    const res = dataInit?.id
      ? await update({ id: dataInit.id, ...values }).unwrap()
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
      title={<>{dataInit?.id ? "Update Voucher" : "Create Voucher"}</>}
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
        <Col lg={6} sm={6} md={6} xs={12}>
          <ProFormText
            getValueFromEvent={(e) => e.target.value.toUpperCase()}
            label="Code"
            name="code"
            placeholder="Enter code"
          />
        </Col>
        <Col lg={6} sm={6} md={6} xs={12}>
          <ProFormDigit
            label="Discount amount"
            name="discountAmount"
            rules={[{ required: true }]}
            placeholder="Enter discount amount"
            fieldProps={{
              formatter: (value) => formatterNumber(value),
              parser: (value) => parserNumber(value),
            }}
          />
        </Col>
        <Col lg={6} sm={6} md={6} xs={12}>
          <ProFormSelect
            name="active"
            label="Active"
            options={[
              { label: "Active", value: true },
              { label: "Inactive", value: false },
            ]}
            placeholder="Select Voucher Active status"
          />
        </Col>
        <Col lg={6} sm={6} md={6} xs={12}>
          <ProFormDatePicker
            label="Expiry Date"
            name="expirationDate"
            rules={[{ required: true }]}
            placeholder="Select Expiry Date"
          />
        </Col>
      </Row>
    </ModalForm>
  );
};

export default VoucherModal;
