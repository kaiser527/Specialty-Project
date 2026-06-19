import { roleGradients, statusColors } from "@/config/constants/utils";
import { IOrder, IUser } from "@/types/backend";
import {
  CreditCardOutlined,
  PhoneOutlined,
  PinterestOutlined,
} from "@ant-design/icons";
import { Card, Divider, Image, Space, Tag, Typography } from "antd";

const { Text } = Typography;

interface IProps {
  order: IOrder;
  area: "CLIENT" | "ADMIN";
  user?: IUser;
}

const UserOrderDetailCard = ({ order, area, user }: IProps) => {
  const currentUser = area === "CLIENT" && user ? user : order.user;

  return (
    <Card
      size="small"
      style={{
        borderRadius: 16,
        border: "1px solid #f0f0f0",
        boxShadow: "0 4px 12px rgba(0,0,0,0.04)",
      }}
    >
      <Space align="start" size={16} style={{ width: "100%" }}>
        <Image
          src={`${import.meta.env.VITE_BACKEND_URL}/images/user/${
            currentUser?.image
          }`}
          width={72}
          height={72}
          preview={false}
          style={{
            borderRadius: "50%",
            objectFit: "cover",
            border: "3px solid #fff",
            boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
          }}
        />

        <div style={{ flex: 1 }}>
          <Space direction="vertical" size={4} style={{ width: "100%" }}>
            <Text strong style={{ fontSize: 16 }}>
              {currentUser?.name || "Unknown User"}
            </Text>
            <Text type="secondary">{currentUser?.email}</Text>
            <Tag
              style={{
                width: "fit-content",
                borderRadius: 8,
                padding: "2px 10px",
                fontWeight: 500,
                border: "none",
                color: "#fff",
                background:
                  roleGradients[currentUser?.role?.name ?? "USER"] || "#999",
              }}
            >
              {currentUser?.role?.name || "USER"}
            </Tag>
          </Space>
        </div>
        <Tag
          color={statusColors[order.status] || "blue"}
          style={{
            marginTop: 26,
            fontWeight: 600,
            borderRadius: 8,
            padding: "4px 10px",
          }}
        >
          {order.status}
        </Tag>
      </Space>

      <Divider style={{ margin: "12px 0" }} />

      <Space direction="vertical" size={6}>
        <Text>
          <PhoneOutlined /> <b>{order.phone}</b>
        </Text>
        <Text>
          <PinterestOutlined /> {order.address}
        </Text>
        <Text type="secondary">
          <CreditCardOutlined /> {order.type} - {order.paymentRef}
        </Text>
      </Space>
    </Card>
  );
};

export default UserOrderDetailCard;
