import { useEffect, useRef, useState } from "react";
import {
  Button,
  Checkbox,
  Col,
  Form,
  Grid,
  Input,
  Row,
  Select,
  Space,
  Tooltip,
  Typography,
} from "antd";
import axios from "axios";
import styles from "styles/cart.module.scss";
import {
  CheckOutlined,
  FileExcelOutlined,
  PrinterOutlined,
  TagOutlined,
} from "@ant-design/icons";
import {
  DARKTHEME,
  PaymentMethod,
  paymentMethodLabels,
} from "@/config/constants/utils";
import { usePlaceOrderMutation } from "@/redux/api/orderApi";
import { useMessage } from "@/hooks/useMessage";
import { useGetAccount } from "@/hooks/useGetAccount";
import { useNavigate } from "react-router-dom";
import {
  buildVariantName,
  formatCurrency,
  getFinalPrice,
} from "@/config/helpers/global";
import { ICart, IVoucher } from "@/types/backend";
import {
  useCreateStripeUrlMutation,
  useCreateVNPayUrlMutation,
} from "@/redux/api/paymentApi";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { useFetchVoucherByCodeMutation } from "@/redux/api/voucherApi";
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/constants/permissions";
import { useBackground } from "@/hooks/useBackground";

const { Text } = Typography;
const { Option } = Select;
const { useBreakpoint } = Grid;

const HCM_CODE = 79;
const HANOI_CODE = 1;
const INNER_DISTRICTS_HCM = [760, 761, 762, 763, 764];
const OUTER_DISTRICTS_HCM = [765, 766, 767, 768, 769];

interface District {
  code: number;
  name: string;
}

interface Province {
  code: number;
  name: string;
  districts: District[];
}

interface IProps {
  totalPrice: number;
  cart: ICart;
  refetch: () => void;
}

const OrderInfoForm = ({ totalPrice, cart, refetch }: IProps) => {
  const screens = useBreakpoint();
  const navigate = useNavigate();

  const [form] = Form.useForm();

  const { messageApi, notificationApi } = useMessage();
  const { isAuthenticated, user } = useGetAccount();
  const { background } = useBackground();

  const [shippingFee, setShippingFee] = useState(0);
  const [provinces, setProvinces] = useState<Province[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);

  const [placeOrder] = usePlaceOrderMutation();
  const [createUrl] = useCreateVNPayUrlMutation();
  const [createStripe] = useCreateStripeUrlMutation();
  const [fetchVoucher, { isLoading }] = useFetchVoucherByCodeMutation();

  const voucher = useRef<IVoucher | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProvinces = async () => {
      const res = await axios.get("https://provinces.open-api.vn/api/?depth=2");
      setProvinces(res.data);
    };
    fetchProvinces();
  }, []);

  const handleProvinceChange = (value: number) => {
    const selectedProvince = provinces.find((p) => p.code === value);
    setDistricts(selectedProvince?.districts || []);
    form.setFieldsValue({ district: undefined });
    setShippingFee(0);
  };

  const getBaseFee = (provinceCode: number) => {
    const base: Record<number, number> = {
      79: 2.5,
      1: 3,
      48: 3.5,
    };
    return base[provinceCode] ?? 5;
  };

  const calculateShippingFee = (
    provinceCode?: number,
    districtCode?: number
  ) => {
    if (!provinceCode || !districtCode) return 0;

    let fee = getBaseFee(provinceCode);

    const isSameCity = provinceCode === HCM_CODE || provinceCode === HANOI_CODE;

    fee += isSameCity ? 1 : 2.5;

    if (provinceCode === HCM_CODE) {
      if (INNER_DISTRICTS_HCM.includes(districtCode)) fee += 0.5;
      else if (OUTER_DISTRICTS_HCM.includes(districtCode)) fee += 1.5;
      else fee += 2.5;
    }

    const orderImpact = Math.min(totalPrice * 0.02, 3);
    fee += orderImpact;
    const randomFactor = Math.random() * 0.5;
    fee += randomFactor;

    return Number(fee.toFixed(2));
  };

  const handleDistrictChange = (districtCode: number) => {
    const provinceCode = form.getFieldValue("province");
    const fee = calculateShippingFee(provinceCode, districtCode);
    setShippingFee(fee);
  };

  const onFinish = async (values: any) => {
    if (!isAuthenticated) {
      navigate("/login");
      notificationApi.error({
        message: "Error occurred",
        description: "To continue order you must login",
        duration: 5,
      });
    }

    const { province, district, paymentMethod, agree, address, ...rest } =
      values;

    const getProvinceName = (code: number) => {
      return provinces.find((p) => p.code === code)?.name || "";
    };

    const getDistrictName = (code: number) => {
      return districts.find((d) => d.code === code)?.name || "";
    };

    const fullAddress = [
      address,
      getDistrictName(district),
      getProvinceName(province),
    ]
      .filter(Boolean)
      .join(", ");

    const payload = {
      shippingFee,
      type: paymentMethod === "COD" ? "COD" : "BANKING",
      paymentRef: paymentMethod === "COD" ? "LOCAL" : paymentMethod,
      address: fullAddress,
      items: cart.items.map((i) => ({
        variantId: i.variant.id,
        quantity: i.quantity,
      })),
      ...(voucher?.current?.code && { voucherCode: voucher.current.code }),
    };

    const handleOrder = async () => {
      const res = await placeOrder({ ...rest, ...payload }).unwrap();
      if (res?.data) {
        messageApi.success("Order successfully!");
        form.resetFields();
        setShippingFee(0);
        voucher.current = null;
        if (inputRef.current && inputRef.current.value) {
          inputRef.current.value = "";
        }
        refetch();
      } else {
        notificationApi.error({
          message: "Error occurred",
          description: res.message,
          duration: 5,
        });
      }
      return res;
    };

    if (paymentMethod === "COD") {
      await handleOrder();
    }

    if (paymentMethod === "VNPAY") {
      const USD_TO_VND = 2400;
      const amountVND = Math.round(finalTotal * USD_TO_VND);
      const MAX_VNPAY_AMOUNT = 200_000_000;
      if (amountVND > MAX_VNPAY_AMOUNT) {
        notificationApi.error({
          message: "Payment Error",
          description:
            "Amount is too large for VNPay. Please use another payment method.",
          duration: 5,
        });
        return;
      }
      const order = await handleOrder();
      if (order.data?.orderId) {
        const res = await createUrl({
          orderId: order.data?.orderId,
        }).unwrap();
        if (res.data?.paymentUrl) {
          window.location.href = res.data.paymentUrl;
        } else {
          notificationApi.error({
            message: "Error occurred",
            description: res.message,
            duration: 5,
          });
        }
      }
    }

    if (paymentMethod === "CREDIT_CARD") {
      const MAX_STRIPE_AMOUNT = 999999;
      if (finalTotal > MAX_STRIPE_AMOUNT) {
        notificationApi.error({
          message: "Payment Error",
          description: "Amount exceeds allowed limit for card payments.",
          duration: 5,
        });
        return;
      }
      const order = await handleOrder();
      if (order.data?.orderId) {
        const res = await createStripe({
          orderId: order.data?.orderId,
        }).unwrap();
        if (res.data?.paymentUrl) {
          window.location.href = res.data.paymentUrl;
        } else {
          notificationApi.error({
            message: "Error occurred",
            description: res.message,
            duration: 5,
          });
        }
      }
    }
  };

  const handleExportExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Cart Items");

    worksheet.columns = [
      { header: "Sku", key: "sku", width: 20 },
      { header: "Product", key: "name", width: 30 },
      { header: "Price", key: "price", width: 15 },
      { header: "Quantity", key: "quantity", width: 10 },
      { header: "Total", key: "total", width: 15 },
    ];

    let rowIndex = 2;

    for (const item of cart.items) {
      worksheet.addRow({
        sku: item.variant.sku,
        name: buildVariantName(item.variant),
        price: getFinalPrice(item.variant),
        quantity: item.quantity,
        total: getFinalPrice(item.variant) * item.quantity,
      });

      rowIndex++;
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer]);

    saveAs(blob, "cart.xlsx");
  };

  const handleSubmitVoucher = async () => {
    const voucherInput = inputRef?.current?.value;

    if (!voucherInput?.trim()) {
      messageApi.warning("Voucher code is missing");
      return;
    }

    const res = await fetchVoucher({ code: voucherInput }).unwrap();

    if (res?.data) {
      if (res.data.discountAmount > totalPrice + shippingFee) {
        messageApi.warning(
          "Voucher discount amount cannot exceed cart total price"
        );
      } else {
        voucher.current = res.data;
        messageApi.success("Voucher applied");
      }
    } else {
      notificationApi.error({
        message: "Error occurred",
        description: res.message,
        duration: 5,
      });
    }
  };

  const finalTotal =
    totalPrice + shippingFee - (voucher.current?.discountAmount ?? 0);

  return (
    <Form
      layout="horizontal"
      form={form}
      onFinish={onFinish}
      labelCol={{ flex: screens.xs ? "100px" : "130px" }}
      wrapperCol={{ flex: 1 }}
      labelAlign="left"
      style={{ marginBottom: -23 }}
    >
      <Row gutter={[16, 16]}>
        <Col lg={12} sm={24} xs={24}>
          <Form.Item>
            <div
              style={
                background === "dark" ? { background: DARKTHEME.border } : {}
              }
              className={styles["title-box"]}
            >
              <Text style={{ fontWeight: 700, fontSize: 17 }}>
                ORDER INFORMATION
              </Text>
            </div>
          </Form.Item>
          <Form.Item
            label="Full Name"
            name="name"
            rules={[{ required: true, message: "Please enter your full name" }]}
          >
            <Input placeholder="Enter your full name" />
          </Form.Item>
          <Form.Item
            label="Phone Number"
            name="phone"
            rules={[
              { required: true, message: "Please enter your phone number" },
            ]}
          >
            <Input placeholder="Enter your phone number" />
          </Form.Item>
          <Form.Item
            label="Address"
            name="address"
            rules={[{ required: true, message: "Please enter your address" }]}
          >
            <Input.TextArea
              placeholder="Street address, house number, ward..."
              autoSize={{ minRows: 2, maxRows: 2 }}
            />
          </Form.Item>
          <Form.Item
            label="Payment Method"
            name="paymentMethod"
            rules={[
              { required: true, message: "Please select payment method" },
            ]}
          >
            <Select placeholder="Select payment method">
              {Object.values(PaymentMethod).map((method) => (
                <Option key={method} value={method}>
                  {paymentMethodLabels[method]}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="Province/City"
            name="province"
            rules={[{ required: true, message: "Please select a province" }]}
          >
            <Select
              placeholder="Select province / city"
              onChange={handleProvinceChange}
              showSearch
              optionFilterProp="children"
            >
              {provinces.map((p) => (
                <Option key={p.code} value={p.code}>
                  {p.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item
            label="District"
            name="district"
            rules={[{ required: true, message: "Please select a district" }]}
          >
            <Select
              placeholder="Select district"
              disabled={!districts.length}
              onChange={handleDistrictChange}
              showSearch
              optionFilterProp="children"
            >
              {districts.map((d) => (
                <Option key={d.code} value={d.code}>
                  {d.name}
                </Option>
              ))}
            </Select>
          </Form.Item>
        </Col>
        <Col lg={12} sm={24} xs={24}>
          <Form.Item>
            <div
              style={
                background === "dark" ? { background: DARKTHEME.border } : {}
              }
              className={styles["title-box"]}
            >
              <Text style={{ fontWeight: 700, fontSize: 17 }}>GRAND TOTAL</Text>
            </div>
            {isAuthenticated && (
              <Access
                permission={ALL_PERMISSIONS.VOUCHERS.FIND_BY_CODE_USER}
                hideChildren
              >
                <div
                  style={background === "dark" ? { background: "#262626" } : {}}
                  className={styles["discount-box"]}
                >
                  <Space.Compact block>
                    <input
                      ref={inputRef}
                      className={`${styles["voucher-input"]} ${
                        background === "dark"
                          ? styles["voucher-input-dark"]
                          : ""
                      }`}
                      placeholder="Voucher code"
                    />
                    <Tooltip
                      title={
                        screens.xs
                          ? "Select a voucher code to apply a discount"
                          : null
                      }
                    >
                      <Button
                        type="primary"
                        loading={isLoading}
                        icon={screens.xs ? null : <TagOutlined />}
                        className={`${styles["voucher-btn"]} ${
                          background === "dark"
                            ? styles["voucher-btn-dark"]
                            : ""
                        }`}
                        onClick={handleSubmitVoucher}
                      >
                        {screens.xs ? <TagOutlined /> : "Select Voucher code"}
                      </Button>
                    </Tooltip>
                  </Space.Compact>
                </div>
              </Access>
            )}
            <div className={styles["grand-total-wrapper"]}>
              <div className={styles["label-total-price"]}>
                <Text style={{ fontSize: 16 }}>Sub total</Text>
                <Text style={{ fontSize: 16 }}>Shipping fee (estimated)</Text>
                {voucher.current && (
                  <Text style={{ fontSize: 16 }}>Voucher discount amount</Text>
                )}
                <Text style={{ fontSize: 17, fontWeight: 700, marginTop: 3 }}>
                  Total price
                </Text>
              </div>
              <div className={styles["label-total-price"]}>
                <Text style={{ fontSize: 16 }}>
                  {formatCurrency(totalPrice)}
                </Text>
                <Text style={{ fontSize: 16 }}>
                  {formatCurrency(shippingFee)}
                </Text>
                {voucher.current && (
                  <Text style={{ fontSize: 16 }}>
                    {formatCurrency(voucher.current?.discountAmount ?? 0)}
                  </Text>
                )}
                <Text
                  style={{
                    fontSize: 17,
                    fontWeight: 700,
                    marginTop: 3,
                    color: "#e20505",
                  }}
                >
                  {formatCurrency(finalTotal)}
                </Text>
                <Text style={{ fontSize: 16 }}>(Already include VAT)</Text>
              </div>
            </div>
          </Form.Item>
          <Form.Item
            name="agree"
            valuePropName="checked"
            style={{ marginTop: -22 }}
            rules={[
              {
                validator: (_, value) =>
                  value
                    ? Promise.resolve()
                    : Promise.reject("You must accept the terms"),
              },
            ]}
          >
            <Checkbox style={{ fontSize: 16, fontWeight: 700 }}>
              I have read and agree to the website terms & services
            </Checkbox>
          </Form.Item>
          <Form.Item>
            <Row gutter={[8, 8]}>
              <Col span={12}>
                <Button
                  icon={<PrinterOutlined />}
                  className={`${styles["btn-secondary"]} ${
                    background === "dark" ? styles["btn-secondary-dark"] : ""
                  }`}
                  onClick={() =>
                    navigate("/print?name=cart", { state: { cart, user } })
                  }
                  block
                >
                  Print Quote
                </Button>
              </Col>
              <Col span={12}>
                <Button
                  icon={<FileExcelOutlined />}
                  className={`${styles["btn-secondary"]} ${
                    background === "dark" ? styles["btn-secondary-dark"] : ""
                  }`}
                  block
                  onClick={handleExportExcel}
                >
                  Export Excel
                </Button>
              </Col>
              <Col span={24}>
                <Button
                  icon={<CheckOutlined />}
                  htmlType="submit"
                  className={`${styles["btn-primary"]} ${
                    background === "dark" ? styles["btn-primary-dark"] : ""
                  }`}
                  block
                >
                  Place Order
                </Button>
              </Col>
            </Row>
          </Form.Item>
        </Col>
      </Row>
    </Form>
  );
};

export default OrderInfoForm;
