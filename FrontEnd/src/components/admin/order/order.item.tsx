import {
  DARKTHEME,
  roleColorsDark,
  roleGradients,
} from "@/config/constants/utils";
import { buildVariantName, formatCurrency } from "@/config/helpers/global";
import { useBackground } from "@/hooks/useBackground";
import { IOrderItem, IVariant } from "@/types/backend";
import { Card, Grid, Image, Tag, Typography } from "antd";

const { Text } = Typography;

const statusStyles = {
  PENDING: {
    color: "#1677ff",
    bg: "linear-gradient(135deg, #f0f5ff, #d6e4ff)",
    border: "#91caff",
  },
  PACKAGING: {
    color: "#722ed1",
    bg: "linear-gradient(135deg, #f9f0ff, #efdbff)",
    border: "#d3adf7",
  },
  DELIVERING: {
    color: "#08979c",
    bg: "linear-gradient(135deg, #e6fffb, #b5f5ec)",
    border: "#87e8de",
  },
  APPROVED: {
    color: "#52c41a",
    bg: "linear-gradient(135deg, #f6ffed, #d9f7be)",
    border: "#b7eb8f",
  },
  REJECTED: {
    color: "#ff4d4f",
    bg: "linear-gradient(135deg, #fff1f0, #ffa39e)",
    border: "#ffccc7",
  },
};

interface IProps {
  item: IOrderItem;
  area: "ADMIN" | "CLIENT";
}

const { useBreakpoint } = Grid;

const OrderCardItem = ({ item, area }: IProps) => {
  const screen = useBreakpoint();

  const { background } = useBackground();

  const hasProvider = !!item.provider && area === "ADMIN";
  const status = item?.provider?.status || "PENDING";
  //@ts-ignore
  const style = statusStyles[status];

  return (
    <Card
      size="small"
      hoverable
      style={{
        borderRadius: 16,
        border: hasProvider
          ? `1px solid ${style.border}`
          : `1px solid ${background === "dark" ? DARKTHEME.border : "#f0f0f0"}`,
        transition: "all 0.25s ease",
      }}
      styles={{ body: { padding: 14 } }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = hasProvider
          ? "0 6px 16px rgba(0,0,0,0.08)"
          : "0 4px 10px rgba(0,0,0,0.05)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0)";
        e.currentTarget.style.boxShadow = "none";
      }}
    >
      <div
        style={{
          display: "flex",
          gap: 12,
          flexDirection: screen.xs ? "column" : "row",
        }}
      >
        <Image
          src={`${import.meta.env.VITE_BACKEND_URL}/images/product/${
            item?.variant?.product?.thumbnail
          }`}
          width={64}
          height={64}
          preview={false}
          style={{
            borderRadius: 12,
            objectFit: "cover",
            border: "1px solid #f0f0f0",
          }}
        />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: 15,
              lineHeight: "18px",
              marginBottom: 6,
              color: background === "dark" ? "#ddd" : "#1f1f1f",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {buildVariantName(item?.variant as IVariant)}
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              flexWrap: "wrap",
              fontSize: 12,
              color: background === "dark" ? "#bbb" : "#666",
            }}
          >
            <span
              style={{
                maxWidth: screen.xs ? "90%" : 250,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                color: background === "dark" ? "#ddd" : "#999",
                fontSize: 13,
              }}
            >
              SKU: {item?.variant?.sku}
            </span>
            <Text copyable={{ text: item?.variant?.sku }} />
            <span
              style={{
                fontSize: 14,
              }}
            >
              <b>{item.quantity}</b>
            </span>
            <span
              style={{
                fontSize: 14,
              }}
            >
              {formatCurrency(item.unitPrice)}
            </span>
            <span
              style={{
                fontSize: 16,
                fontWeight: 700,
                color: "#1677ff",
              }}
            >
              {formatCurrency(item.unitPrice * item.quantity)}
            </span>
          </div>
          {item.provider && area === "ADMIN" && (
            <div
              style={{
                marginTop: 12,
                padding: 10,
                borderRadius: 12,
                background:
                  background === "dark" ? DARKTHEME.card : "#ffffffcc",
                border: `1px solid ${style.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                }}
              >
                <Image
                  src={`${import.meta.env.VITE_BACKEND_URL}/images/user/${
                    item.provider?.image
                  }`}
                  width={40}
                  height={40}
                  preview={false}
                  style={{
                    borderRadius: "50%",
                    objectFit: "cover",
                    border: "2px solid #fff",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                  }}
                />
                <div>
                  <Text style={{ fontWeight: 600, fontSize: 14 }}>
                    {item.provider?.name}
                  </Text>
                  {!screen.xs && (
                    <Tag
                      style={{
                        borderRadius: 6,
                        padding: "0 7px",
                        fontWeight: 500,
                        marginLeft: 5,
                        border:
                          background === "light"
                            ? "none"
                            : `1px solid ${
                                roleColorsDark[item.provider?.role ?? "USER"]
                              }`,
                        color:
                          background === "light"
                            ? "#fff"
                            : roleColorsDark[item.provider?.role ?? "USER"],
                        fontSize: 10,
                        background:
                          background === "light"
                            ? roleGradients[item.provider?.role ?? "USER"] ||
                              "#999"
                            : "transparent",
                      }}
                    >
                      {item.provider?.role || "USER"}
                    </Tag>
                  )}
                  <br />
                  {!screen.xs && (
                    <Text style={{ fontSize: 12, color: "#888" }}>
                      {item.provider?.email}
                    </Text>
                  )}
                </div>
              </div>
              <Tag
                style={{
                  borderRadius: 999,
                  fontWeight: 600,
                  fontSize: 12,
                  padding: "2px 10px",
                  background:
                    background === "light" ? style.color : "transparent",
                  color: background === "light" ? "#fff" : style.color,
                  border:
                    background === "light"
                      ? "none"
                      : `1px solid ${style.color}`,
                }}
              >
                {style.icon} {item.provider.status}
              </Tag>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};

export default OrderCardItem;
