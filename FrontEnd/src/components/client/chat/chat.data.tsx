import { Card, Avatar, Space, Typography, Tag, Image, Flex, Grid } from "antd";
import { UserOutlined } from "@ant-design/icons";
import {
  DARKTHEME,
  paymentRefColors,
  statusColors,
} from "@/config/constants/utils";
import {
  formatCurrency,
  FORMATE_DATE,
  getFinalPrice,
} from "@/config/helpers/global";
import { useGetAccount } from "@/hooks/useGetAccount";
import dayjs from "dayjs";
import { useNavigate } from "react-router-dom";
import { IVariant } from "@/types/backend";
import { useBackground } from "@/hooks/useBackground";
import RoleTag from "@/components/share/role.tag";

const { Text } = Typography;
const { useBreakpoint } = Grid;

interface IProps {
  data: any[];
  setOrderId: (v: string) => void;
  setOpenViewDetail: (v: boolean) => void;
}

const accountTypeLabel: Record<number, string> = {
  0: "LOCAL",
  1: "GOOGLE",
  2: "FACEBOOK",
};

const accountTypeColors: Record<number, string> = {
  0: "#fa8c16",
  2: "#1677ff",
  1: "#ff4d4f",
};

const ChatData = ({ data, setOrderId, setOpenViewDetail }: IProps) => {
  const { user, isAuthenticated } = useGetAccount();
  const { background } = useBackground();

  const navigate = useNavigate();
  const screen = useBreakpoint();

  const canViewDueDate = isAuthenticated && user?.role?.name !== "USER";

  const borderStyle =
    background === "dark" ? { border: `1px solid ${DARKTHEME.border}` } : {};

  if (!data || data?.length === 0) return null;

  const first = data[0];

  if ("role" in first && "email" in first) {
    return data.map((user, index) => (
      <Card
        key={`user-${index}`}
        size="small"
        style={{ marginTop: 10, ...borderStyle }}
      >
        <Space align="center" style={{ display: "flex" }}>
          <Avatar
            src={`${import.meta.env.VITE_BACKEND_URL}/images/user/${
              user?.image
            }`}
            icon={!user.image && <UserOutlined />}
            size={40}
          />
          <Space direction="vertical" size={0}>
            <Space align="center" size={8}>
              <Text strong>{user.name}</Text>
              <RoleTag
                user={user}
                customStyle={{ borderRadius: 10, padding: "0px 10px" }}
              />
            </Space>
            <Text type="secondary">{user.email}</Text>
          </Space>
          <Tag
            style={{
              background:
                background === "light"
                  ? accountTypeColors[user.accountType || 0]
                  : "transparent",
              color:
                background === "light"
                  ? "#fff"
                  : accountTypeColors[user.accountType || 0],
              border:
                background === "light"
                  ? "none"
                  : `1px solid ${accountTypeColors[user.accountType || 0]}`,
              borderRadius: 10,
              padding: "0px 10px",
            }}
          >
            {accountTypeLabel[user.accountType as any] || "UNKNOWN"}
          </Tag>
        </Space>
      </Card>
    ));
  }

  if ("sku" in first && "price" in first) {
    return data.map((variant: IVariant, index) => {
      const image =
        variant.images?.[0] || variant.product?.thumbnail || "empty.jpg";

      const isExpired = dayjs(variant.dueDate).isBefore(dayjs());

      return (
        <Card
          onClick={() => navigate(`/product/${variant.id}`)}
          key={`variant-${index}`}
          size="small"
          hoverable
          style={{
            marginTop: 10,
            borderRadius: 16,
            overflow: "hidden",
            border: "1px solid #f3f4f6",
            boxShadow: "0 4px 14px rgba(0,0,0,0.05)",
            ...borderStyle,
          }}
        >
          <Space align="start" size={14}>
            <Image
              src={`${
                import.meta.env.VITE_BACKEND_URL
              }/images/product/${image}`}
              width={80}
              height={80}
              style={{
                borderRadius: 12,
                objectFit: "cover",
              }}
              preview={false}
              fallback="https://placehold.co/88x88?text=No+Image"
            />

            <Flex
              justify="space-between"
              align={screen.lg ? "center" : "start"}
              gap={12}
              vertical={!screen.lg}
              style={{ width: "100%" }}
            >
              <Space direction="vertical" size={4} style={{ flex: 1 }}>
                <Space align="center" wrap>
                  <Text
                    copyable={{ text: variant.sku }}
                    ellipsis={{ tooltip: variant.sku }}
                    style={{
                      fontSize: 15,
                      fontFamily: "monospace",
                      color: "#8c8c8c",
                      display: "block",
                      maxWidth: "100%",
                      marginBottom: 8,
                    }}
                  >
                    SKU: {variant.sku || "N/A"}
                  </Text>
                </Space>

                <Space align="center" size={10} wrap>
                  <Text
                    strong
                    style={{
                      color: "#f97316",
                      fontSize: 16,
                    }}
                  >
                    {formatCurrency(getFinalPrice(variant))}
                  </Text>

                  {variant.discount > 0 && (
                    <Text delete type="secondary">
                      {formatCurrency(variant.price)}
                    </Text>
                  )}

                  <Tag color={variant.stock > 0 ? "green" : "red"}>
                    {variant.stock > 0
                      ? `Stock: ${variant.stock}`
                      : "Out of stock"}
                  </Tag>
                </Space>

                <Flex justify="space-between" align="center" wrap>
                  <Text type="secondary">Brand: {variant.product?.brand}</Text>
                  <Text type="secondary">
                    Created at: {dayjs(variant.createdAt).format(FORMATE_DATE)}
                  </Text>
                </Flex>
              </Space>

              {canViewDueDate && variant.dueDate && (
                <Tag
                  style={{
                    height: "fit-content",

                    background:
                      background === "dark"
                        ? isExpired
                          ? "#3a1515"
                          : "#3b2a12"
                        : isExpired
                        ? "#fef2f2"
                        : "#fff7ed",

                    color:
                      background === "dark"
                        ? isExpired
                          ? "#ff8a8a"
                          : "#ffcf70"
                        : isExpired
                        ? "#ef4444"
                        : "#f97316",

                    border: `1px solid ${
                      background === "dark"
                        ? isExpired
                          ? "#8b2c2c"
                          : "#8b5e1a"
                        : isExpired
                        ? "#fca5a5"
                        : "#fdba74"
                    }`,

                    borderRadius: 10,
                    fontWeight: 600,
                    padding: "2px 8px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {isExpired ? "Expired" : "Due"} :{" "}
                  {dayjs(variant.dueDate).format(FORMATE_DATE)}
                </Tag>
              )}
            </Flex>
          </Space>
        </Card>
      );
    });
  }

  if ("totalPrice" in first && "status" in first) {
    return data.map((order: any, index) => (
      <Card
        key={`order-${index}`}
        size="small"
        hoverable
        onClick={() => {
          setOrderId(order.id);
          setOpenViewDetail(true);
        }}
        style={{
          marginTop: 10,
          borderRadius: 16,
          border: "1px solid #f3f4f6",
          boxShadow: "0 4px 14px rgba(0,0,0,0.05)",
          ...borderStyle,
        }}
      >
        <Flex vertical gap={10}>
          <Flex justify="space-between" align="center" wrap="wrap">
            <Space direction="vertical" size={2}>
              <Text strong style={{ fontSize: 15 }}>
                Order #{order.id}
              </Text>

              <Text type="secondary">
                {dayjs(order.createdAt).format(FORMATE_DATE)}
              </Text>
            </Space>
          </Flex>

          <Flex gap={8} wrap>
            <Tag
              color={order.type === "COD" ? "gold" : "error"}
              style={{
                borderRadius: 10,
                padding: "2px 10px",
              }}
            >
              {order.type}
            </Tag>

            <Tag
              color={paymentRefColors[order.paymentRef]}
              style={{
                borderRadius: 10,
                padding: "2px 10px",
              }}
            >
              {order.paymentRef}
            </Tag>

            <Tag
              color={statusColors[order.status]}
              style={{
                borderRadius: 10,
                padding: "2px 10px",
                fontWeight: 600,
              }}
            >
              {order.status}
            </Tag>
          </Flex>

          <Flex justify="space-between" wrap="wrap">
            <Space direction="vertical" size={2}>
              <Text type="secondary">Subtotal</Text>
              <Text strong>{formatCurrency(order.subTotal)}</Text>
            </Space>

            <Space direction="vertical" size={2}>
              <Text type="secondary">Shipping</Text>
              <Text strong>{formatCurrency(order.shippingFee)}</Text>
            </Space>

            <Space direction="vertical" size={2}>
              <Text type="secondary">Total</Text>
              <Text
                strong
                style={{
                  color: "#f97316",
                  fontSize: 16,
                }}
              >
                {formatCurrency(order.totalPrice)}
              </Text>
            </Space>
          </Flex>
        </Flex>
      </Card>
    ));
  }
};

export default ChatData;
