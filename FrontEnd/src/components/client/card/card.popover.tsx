import { buildVariantName, formatCurrency } from "@/config/helpers/global";
import { IVariant } from "@/types/backend";
import { CheckOutlined } from "@ant-design/icons";
import { Typography } from "antd";

interface IProps {
  variant: IVariant;
}

const { Text } = Typography;

const CardPopover = ({ variant }: IProps) => {
  return (
    <div
      style={{
        maxWidth: 280,
        padding: "12px",
        borderRadius: "12px",
        background: "#fff",
        boxShadow: "0 6px 18px rgba(0,0,0,0.12)",
        fontFamily: "Inter, sans-serif",
        color: "#1a1a1a",
        wordBreak: "break-word",
      }}
    >
      <div
        style={{
          fontWeight: 700,
          fontSize: 14,
          color: "#fff",
          background: "#ff4d4f",
          padding: "4px 8px",
          borderRadius: "6px",
          marginBottom: 8,
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          textOverflow: "ellipsis",
        }}
      >
        {buildVariantName(variant)}
      </div>

      <div style={{ fontSize: 14 }}>
        <div>
          Price:{" "}
          <span style={{ color: "#ff4d4f", fontWeight: 700 }}>
            {formatCurrency(variant.price)}
          </span>
        </div>
      </div>

      <Text
        copyable={{ text: variant.sku }}
        ellipsis={{ tooltip: variant.sku }}
        style={{
          fontSize: 14,
          fontFamily: "monospace",
          color: "#8c8c8c",
          display: "block",
          maxWidth: "100%",
          marginBottom: 8,
        }}
      >
        SKU: {variant.sku || "N/A"}
      </Text>

      {variant.attributes && Object.keys(variant.attributes).length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <div
            style={{
              background: "#ff4d4f",
              color: "#fff",
              display: "inline-block",
              padding: "2px 6px",
              borderRadius: "4px",
              fontSize: 12,
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            Attributes:
          </div>
          <ul
            style={{
              paddingLeft: 0,
              margin: 0,
              fontSize: 13,
              color: "#595959",
              listStyle: "none",
            }}
          >
            {Object.entries(variant.attributes).map(([key, value]) => (
              <li
                key={key}
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  marginBottom: 4,
                }}
              >
                <CheckOutlined
                  style={{ color: "#52c41a", marginRight: 6, marginTop: 2 }}
                />
                <div style={{ wordBreak: "break-word" }}>
                  <span style={{ fontWeight: 500, marginRight: 4 }}>
                    {key}:
                  </span>
                  <span>{value}</span>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default CardPopover;
