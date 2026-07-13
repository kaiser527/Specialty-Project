import { formatCurrency, FORMATE_DATE } from "@/config/helpers/global";
import { useBackground } from "@/hooks/useBackground";
import { useGetAccount } from "@/hooks/useGetAccount";
import { useFetchVariantQuery } from "@/redux/api/productApi";
import { IVariant } from "@/types/backend";
import { HistoryOutlined, ReloadOutlined } from "@ant-design/icons";
import {
  Avatar,
  Table,
  Space,
  Tag,
  Typography,
  Popover,
  Card,
  Flex,
  Statistic,
  Button,
} from "antd";
import { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "styles/home.module.scss";

const PAGE_SIZE = 5;

const { Text } = Typography;

const TableExpiredVariant = () => {
  const [current, setCurrent] = useState(1);

  const { background } = useBackground();
  const { user } = useGetAccount();

  const { data, isLoading } = useFetchVariantQuery(
    `current=${current}&limit=${PAGE_SIZE}&product.createdBy=${
      user.email
    }&dueDate<${dayjs().format(FORMATE_DATE)}`
  );

  const navigate = useNavigate();

  const columns: ColumnsType<IVariant> = [
    {
      title: "Product",
      dataIndex: "product",
      width: 280,
      render: (_, record) => (
        <Space>
          <Popover content={<Text copyable>{record.sku}</Text>}>
            <Avatar
              shape="square"
              size={60}
              src={`${import.meta.env.VITE_BACKEND_URL}/images/product/${
                record.product?.thumbnail
              }`}
            />
          </Popover>
          <div>
            <Text strong>{record.product?.name}</Text>
            <br />
            <Text type="secondary">{record.product?.brand}</Text>
          </div>
        </Space>
      ),
    },
    {
      title: "Variant",
      dataIndex: "attributes",
      render: (attributes: Record<string, string>) => (
        <Space wrap>
          {Object.entries(attributes).map(([key, value]) => (
            <Tag key={key} color="blue">
              {key}: {value}
            </Tag>
          ))}
        </Space>
      ),
    },
    {
      title: "Price",
      dataIndex: "price",
      align: "right",
      render: (price) => formatCurrency(price),
    },
    {
      title: "Discount",
      dataIndex: "discount",
      align: "center",
      render: (discount) => (
        <Tag color={discount ? "red" : "default"}>{discount}%</Tag>
      ),
    },
    {
      title: "Stock",
      dataIndex: "stock",
      align: "center",
      render: (stock) => (
        <Tag color={stock > 20 ? "green" : stock > 0 ? "orange" : "red"}>
          {stock}
        </Tag>
      ),
    },
    {
      title: "Expired",
      dataIndex: "dueDate",
      width: 100,
      sorter: (a, b) => dayjs(a.dueDate).unix() - dayjs(b.dueDate).unix(),
      render: (date: string, record) => {
        const days = dayjs().diff(dayjs(date), "day");

        return (
          <Space direction="vertical">
            <Text>{dayjs(date).format(FORMATE_DATE)}</Text>
            <Tag color="red">
              {days} day{days > 1 ? "s" : ""} ago
            </Tag>
          </Space>
        );
      },
    },
  ];

  const handleClickRenew = (variantIds: string[]) => {
    navigate("/renew-product", { state: { variantIds } });
  };

  return (
    <>
      <Card style={{ marginBottom: 16 }}>
        <Flex justify="space-between" align="center">
          <Statistic
            title="Expired Variants"
            value={data?.data?.meta.total ?? 0}
            prefix={<HistoryOutlined />}
          />
          {(data?.data?.meta?.total ?? 0) > 0 && (
            <Button
              type={background === "dark" ? "default" : "primary"}
              loading={isLoading}
              danger
              icon={<ReloadOutlined />}
              className={background === "dark" ? styles.darkButtonDanger : ""}
              onClick={() =>
                handleClickRenew(
                  data?.data?.result
                    ?.map((variant) => variant.id)
                    .filter(Boolean) as string[]
                )
              }
            >
              Renew All
            </Button>
          )}
        </Flex>
      </Card>
      <Table<IVariant>
        rowKey="id"
        columns={columns}
        dataSource={data?.data?.result}
        loading={isLoading}
        bordered
        pagination={{
          current,
          pageSize: PAGE_SIZE,
          total: data?.data?.meta.total,
          onChange: setCurrent,
        }}
        scroll={{ x: 1200 }}
      />
    </>
  );
};

export default TableExpiredVariant;
