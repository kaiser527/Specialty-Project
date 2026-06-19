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
}) => (
  <Card
    size="small"
    hoverable
    style={{
      borderRadius: 16,
      height: "100%",
      boxShadow: "0 4px 12px rgba(0,0,0,0.05)",
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
          background: "#eef2ff",
          color: "#4f46e5",
        }}
      >
        {icon}
      </div>

      <Space direction="vertical" size={4}>
        <Text
          style={{
            fontSize: 11,
            color: "#94a3b8", // softer gray
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
            color: "#0f172a", // darker, more contrast
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

export default InfoItem;
