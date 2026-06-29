import {
  Drawer,
  Space,
  Button,
  Spin,
  Typography,
  Card,
  Grid,
  Row,
  Col,
} from "antd";
import { useMessage } from "@/hooks/useMessage";
import OrderCardItem from "@/components/admin/order/order.item";
import UserOrderDetailCard from "@/components/admin/order/order.user";
import OrderInfoCard from "@/components/admin/order/order-info";
import { useEffect, useState } from "react";
import { hideScrollbar, socket } from "@/config/constants/utils";
import { IOrder, IVariant } from "@/types/backend";
import { useNavigate } from "react-router-dom";
import { FileExcelOutlined, PrinterOutlined } from "@ant-design/icons";
import { useGetAccount } from "@/hooks/useGetAccount";
import OrderPorgressCard from "@/components/admin/order/order.progress";
import OrderActionCard from "./order.action";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import { buildVariantName, getFinalPrice } from "@/config/helpers/global";

const { Text } = Typography;

interface IProps {
  onClose: (v: boolean) => void;
  open: boolean;
  orderId: string | null;
  setOrderId: (v: any) => void;
  area: "ADMIN" | "CLIENT";
}

const { useBreakpoint } = Grid;

const ViewOrderDetail = (props: IProps) => {
  const { onClose, open, orderId, setOrderId, area } = props;

  const screen = useBreakpoint();
  const navigate = useNavigate();

  const [order, setOrder] = useState<IOrder | null>(null);
  const [loading, setLoading] = useState(false);

  const { user } = useGetAccount();
  const { messageApi } = useMessage();

  useEffect(() => {
    if (!open || !orderId) return;
    setLoading(true);
    socket.emit("findOneOrder:subscribe", { id: orderId, area });
    const handleUpdate = (data: any) => {
      setOrder(data);
      setLoading(false);
    };
    const handleError = (err: any) => {
      messageApi.error(err.message || "Failed to load order");
      setLoading(false);
    };
    socket.on("findOneOrder:error", handleError);
    socket.on("findOneOrder:update", handleUpdate);
    return () => {
      socket.off("findOneOrder:error", handleError);
      socket.off("findOneOrder:update", handleUpdate);
    };
  }, [orderId]);

  const handleExportExcel = async () => {
    if (!order?.items?.length) return;

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

    for (const item of order.items) {
      worksheet.addRow({
        sku: item.variant?.sku,
        name: buildVariantName(item.variant as IVariant),
        price: getFinalPrice(item.variant as IVariant),
        quantity: item.quantity,
        total: getFinalPrice(item.variant as IVariant) * item.quantity,
      });

      rowIndex++;
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer]);

    saveAs(blob, "order.xlsx");
  };

  return (
    <Drawer
      title={<Text strong>Order Detail</Text>}
      width={screen.xs ? "100vw" : 700}
      onClose={() => {
        onClose(false);
        setOrderId(null);
      }}
      styles={{ body: hideScrollbar }}
      maskClosable={false}
      open={open}
    >
      {loading ? (
        <Spin />
      ) : order ? (
        <Space direction="vertical" size={16} style={{ width: "100%" }}>
          <UserOrderDetailCard user={user} area={area} order={order} />

          <OrderPorgressCard order={order} />

          <Card title="Order Items" size="small" style={{ borderRadius: 12 }}>
            <Space direction="vertical" style={{ width: "100%" }} size={12}>
              {order?.items?.map((item) => (
                <OrderCardItem area={area} key={item.id} item={item} />
              ))}
            </Space>
          </Card>

          <OrderInfoCard order={order} />

          {area === "ADMIN" && <OrderActionCard order={order} />}

          <Row>
            <Col span={5}>
              <Button
                icon={<PrinterOutlined />}
                type="primary"
                style={{ width: 120 }}
                onClick={() =>
                  navigate("/print?name=order", {
                    state: {
                      cart: { items: order?.items || [] },
                      user: {
                        email: order.user?.email ?? user.email,
                        name: order.name,
                        phone: order.phone,
                        address: order.address,
                      },
                    },
                  })
                }
              >
                Print Order
              </Button>
            </Col>
            <Col span={19}>
              <Button
                icon={<FileExcelOutlined />}
                type="primary"
                style={{ width: 120 }}
                onClick={handleExportExcel}
              >
                Export Order
              </Button>
            </Col>
          </Row>
        </Space>
      ) : null}
    </Drawer>
  );
};

export default ViewOrderDetail;
