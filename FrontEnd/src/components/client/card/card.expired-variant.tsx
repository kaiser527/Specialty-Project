import { IVariant } from "@/types/backend";
import {
  Avatar,
  Badge,
  Card,
  Checkbox,
  ConfigProvider,
  Flex,
  Grid,
  List,
  Space,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useBackground } from "@/hooks/useBackground";
import React from "react";

const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

interface IProps {
  data: IVariant[];
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  isLoading: boolean;
}

const ExpiredVariantCard = ({
  isLoading,
  data,
  selectedIds,
  setSelectedIds,
}: IProps) => {
  const { background } = useBackground();

  const screen = useBreakpoint();

  const renderCheckbox = (variant: IVariant) => (
    <ConfigProvider
      theme={{
        token: {
          colorPrimary: "#ff9800",
        },
      }}
    >
      <Checkbox
        checked={selectedIds.includes(variant.id as string)}
        onChange={(e) => {
          if (e.target.checked) {
            setSelectedIds((prev) => [...prev, variant.id as string]);
          } else {
            setSelectedIds((prev) => prev.filter((id) => id !== variant.id));
          }
        }}
      />
    </ConfigProvider>
  );

  const renderTag = (expiredDays: number) => (
    <Tag
      color="error"
      style={{
        borderRadius: 999,
        padding: "4px 12px",
        fontWeight: 600,
      }}
    >
      {expiredDays} days overdue
    </Tag>
  );

  const allSelected =
    data.length > 0 && data.every((v) => selectedIds.includes(v.id as string));

  const indeterminate =
    !allSelected && data.some((v) => selectedIds.includes(v.id as string));

  return (
    <Card
      style={{ borderRadius: 16 }}
      styles={{ body: { padding: 20 } }}
      title={
        <Flex justify="space-between" align="center" wrap="wrap" gap={8}>
          <Title level={5} style={{ margin: 0 }}>
            Expired Variants
          </Title>

          <Space>
            <ConfigProvider
              theme={{
                token: {
                  colorPrimary: "#ff9800",
                },
              }}
            >
              <Checkbox
                checked={allSelected}
                indeterminate={indeterminate}
                onChange={(e) =>
                  setSelectedIds(
                    e.target.checked ? data.map((v) => v.id as string) : []
                  )
                }
              >
                Select All
              </Checkbox>
            </ConfigProvider>

            <Badge
              count={`${selectedIds.length}/${data.length}`}
              style={{
                background: background === "dark" ? "transparent" : "#fa8c16",
                color: background === "dark" ? "#fa8c16" : "#fff",
                border: "1px solid #fa8c16",
                fontWeight: 600,
                boxShadow: "none",
                fontSize: 15,
                height: 23,
              }}
            />
          </Space>
        </Flex>
      }
    >
      <List
        loading={isLoading}
        dataSource={data}
        split={false}
        renderItem={(variant) => {
          const expiredDays = dayjs().diff(variant.dueDate, "day");
          const selected = selectedIds.includes(variant.id as string);

          return (
            <List.Item style={{ padding: 0, marginBottom: 14 }}>
              <Card
                style={{
                  width: "100%",
                  borderRadius: 14,
                  cursor: "pointer",
                  border: selected ? "2px solid #ffb347" : undefined,
                  background: selected
                    ? background === "dark"
                      ? "#2f2418"
                      : "#fffaf0"
                    : undefined,
                  boxShadow: selected
                    ? "0 8px 24px rgba(255, 179, 71, 0.18)"
                    : undefined,
                  transition: "all .25s ease",
                }}
                styles={{ body: { padding: 18 } }}
                onClick={() =>
                  setSelectedIds((prev) =>
                    selected
                      ? prev.filter((id) => id !== variant.id)
                      : [...prev, variant.id as string]
                  )
                }
              >
                {screen.xs && renderCheckbox(variant)}
                <Flex style={{ marginBottom: 6 }} justify="center">
                  {screen.xs && (
                    <Avatar
                      size={100}
                      shape="square"
                      style={{ borderRadius: 12 }}
                      src={`${
                        import.meta.env.VITE_BACKEND_URL
                      }/images/product/${variant.images[0]}`}
                    />
                  )}
                </Flex>
                <Flex
                  vertical={screen.xs}
                  justify="space-between"
                  align="center"
                >
                  <Space
                    size={screen.xs ? 12 : 18}
                    align="start"
                    style={{ width: screen.xs ? "100%" : undefined }}
                  >
                    {!screen.xs && renderCheckbox(variant)}

                    {!screen.xs && (
                      <Avatar
                        size={85}
                        shape="square"
                        style={{ borderRadius: 12 }}
                        src={`${
                          import.meta.env.VITE_BACKEND_URL
                        }/images/product/${variant.images[0]}`}
                      />
                    )}

                    <Space direction="vertical" size={6}>
                      <Title
                        level={5}
                        style={{
                          margin: 0,
                          textAlign: screen.xs ? "center" : "start",
                        }}
                      >
                        {variant.product?.name}
                      </Title>

                      <Space wrap>
                        {Object.entries(variant.attributes).map(([k, v]) => (
                          <Tag
                            key={k}
                            bordered={false}
                            style={{
                              borderRadius: 999,
                              paddingInline: 10,
                              background:
                                background === "dark" ? "#2f2f2f" : "#f5f5f5",
                              color:
                                background === "dark" ? "#d9d9d9" : "#595959",
                              fontWeight: 500,
                            }}
                          >
                            <b>{k}</b>: {v}
                          </Tag>
                        ))}
                      </Space>

                      <Text ellipsis type="secondary" copyable>
                        SKU: {variant.sku}
                      </Text>

                      {screen.xs ? (
                        <Flex justify="space-between" align="center">
                          <Text type="secondary">
                            Expired on{" "}
                            {dayjs(variant.dueDate).format("DD MMM YYYY")}
                          </Text>
                          {renderTag(expiredDays)}
                        </Flex>
                      ) : (
                        <Text type="secondary">
                          Expired on{" "}
                          {dayjs(variant.dueDate).format("DD MMM YYYY")}
                        </Text>
                      )}
                    </Space>
                  </Space>

                  {!screen.xs && renderTag(expiredDays)}
                </Flex>
              </Card>
            </List.Item>
          );
        }}
      />
    </Card>
  );
};

export default ExpiredVariantCard;
