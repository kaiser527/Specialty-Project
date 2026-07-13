import { formatCurrency, FORMATE_DATE } from "@/config/helpers/global";
import { useFetchVoucherUsageQuery } from "@/redux/api/voucherApi";
import { IVoucherUsage } from "@/types/backend";
import { Empty, Table, Tag, Typography } from "antd";
import { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useState } from "react";

const { Text } = Typography;

const PAGE_SIZE = 5;

const VoucherUsageTable = () => {
  const [current, setCurrent] = useState(1);

  const { data, isLoading } = useFetchVoucherUsageQuery(
    `current=${current}&limit=${PAGE_SIZE}`,
    {
      refetchOnMountOrArgChange: true,
    }
  );

  const columns: ColumnsType<IVoucherUsage> = [
    {
      title: "Voucher Code",
      dataIndex: ["order", "voucherCode"],
      key: "code",
      render: (_, record) =>
        record.order ? (
          <Tag color="blue">{record.order.voucherCode}</Tag>
        ) : (
          <Tag color="default">Deleted Order</Tag>
        ),
    },
    {
      title: "Discount",
      dataIndex: ["order", "discountAmount"],
      key: "discountAmount",
      render: (_, record) =>
        record.order ? (
          formatCurrency(record.order.discountAmount)
        ) : (
          <Text type="secondary">-</Text>
        ),
    },
    {
      title: "Order ID",
      dataIndex: "orderId",
      key: "orderId",
      render: (orderId: string) => (
        <Text code copyable>
          {orderId}
        </Text>
      ),
    },
    {
      title: "Used At",
      dataIndex: "createdAt",
      key: "createdAt",
      render: (date: string) => <>{dayjs(date).format(FORMATE_DATE)}</>,
    },
  ];

  return (
    <Table
      rowKey="id"
      loading={isLoading}
      columns={columns}
      dataSource={data?.data?.result || []}
      locale={{
        emptyText: (
          <Empty
            description="No voucher usage found"
            image={Empty.PRESENTED_IMAGE_SIMPLE}
          />
        ),
      }}
      pagination={{
        current,
        pageSize: PAGE_SIZE,
        total: data?.data?.meta?.total ?? 0,
        showSizeChanger: false,
        onChange: (page) => setCurrent(page),
      }}
    />
  );
};

export default VoucherUsageTable;
