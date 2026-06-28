import { useBackground } from "@/hooks/useBackground";
import { Card, Space, Typography } from "antd";

const { Text } = Typography;

const InfoItem = ({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value?: React.ReactNode;
}) => {
  const { background } = useBackground();

  const isDark = background === "dark";

  return (
    <Card
      size="small"
      hoverable
      style={{
        borderRadius: 16,
        height: "100%",
        background: isDark ? "#141414" : "#fff",
        border: isDark ? "1px solid #303030" : "1px solid #f0f0f0",
        boxShadow: isDark
          ? "0 4px 12px rgba(0,0,0,0.35)"
          : "0 4px 12px rgba(0,0,0,0.05)",
        transition: "all 0.3s",
      }}
      styles={{ body: { padding: 12 } }}
    >
      <Space align="start">
        <div
          style={{
            fontSize: 18,
            padding: 10,
            borderRadius: 10,
            background: isDark ? "rgba(79,70,229,0.15)" : "#eef2ff",
            color: isDark ? "#818cf8" : "#4f46e5",
          }}
        >
          {icon}
        </div>

        <Space direction="vertical" size={4}>
          <Text
            style={{
              fontSize: 11,
              color: isDark ? "#8c8c8c" : "#94a3b8",
              textTransform: "uppercase",
              letterSpacing: 0.5,
              fontWeight: 500,
            }}
          >
            {label}
          </Text>

          <Text
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: isDark ? "#f5f5f5" : "#0f172a",
              lineHeight: 1.4,
              wordBreak: "break-word",
            }}
          >
            {value || "-"}
          </Text>
        </Space>
      </Space>
    </Card>
  );
};

export default InfoItem;
