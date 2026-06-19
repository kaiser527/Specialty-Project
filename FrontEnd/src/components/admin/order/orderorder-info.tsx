import { formatCurrency } from "@/config/helpers/global";
import { IOrder } from "@/types/backend";
import { Card, Descriptions, Flex, Grid, Typography } from "antd";

const { Text } = Typography;

const { useBreakpoint } = Grid;

interface IProps {
  order: IOrder;
}

const OrderInfoCard = ({ order }: IProps) => {
  const screen = useBreakpoint();

  return (
    <Card size="small" style={{ borderRadius: 12 }}>
      <Descriptions column={1} size="small">
        <Descriptions.Item label="Order ID">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                maxWidth: screen.xs ? 180 : "100%",
                fontWeight: 600,
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {order.id}
            </div>

            <Text copyable={{ text: order.id }} />
          </div>
        </Descriptions.Item>
        <Descriptions.Item label="Subtotal">
          {formatCurrency(order.subTotal)}
        </Descriptions.Item>
        <Descriptions.Item label="Shipping">
          {formatCurrency(order.shippingFee)}
        </Descriptions.Item>
        {order.voucherCode && (
          <Descriptions.Item label="Voucher">
            <Flex gap={5}>
              <Text>{order.voucherCode}</Text>
              <span>|</span>
              {order.discountAmount && (
                <Text>{formatCurrency(order.discountAmount)}</Text>
              )}
            </Flex>
          </Descriptions.Item>
        )}
        <Descriptions.Item label="Total">
          <Text strong style={{ fontSize: 16, marginTop: -2 }}>
            {formatCurrency(order.totalPrice)}
          </Text>
        </Descriptions.Item>
      </Descriptions>
    </Card>
  );
};

export default OrderInfoCard;
