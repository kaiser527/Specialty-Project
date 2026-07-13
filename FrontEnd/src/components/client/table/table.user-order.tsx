import ViewOrderDetail from "@/components/admin/order/order.view";
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/constants/permissions";
import {
  paymentRefColors,
  socket,
  statusColors,
} from "@/config/constants/utils";
import { formatCurrency, FORMATE_DATE } from "@/config/helpers/global";
import { useBackground } from "@/hooks/useBackground";
import { useMessage } from "@/hooks/useMessage";
import { useUpdateOrderStatusMutation } from "@/redux/api/orderApi";
import { IMeta, IModelPaginate, IOrder } from "@/types/backend";
import { Button, Popconfirm, Space, Tag, Table } from "antd";
import { ColumnsType } from "antd/es/table";
import dayjs from "dayjs";
import { useEffect, useState } from "react";

const PAGE_SIZE = 5;

const UserOrderTable = () => {
  const [update] = useUpdateOrderStatusMutation();

  const [current, setCurrent] = useState(1);
  const [openViewDetail, setOpenViewDetail] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [meta, setMeta] = useState<IMeta | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [qs, setQs] = useState<string | null>(null);

  const { messageApi, notificationApi } = useMessage();
  const { background } = useBackground();

  useEffect(() => {
    setIsLoading(true);
    const handleUpdate = (data: IModelPaginate<IOrder>) => {
      setOrders(data.result);
      setMeta(data.meta);
      setIsLoading(false);
    };
    const handleError = (err: any) => {
      setIsLoading(false);
      messageApi.error(err.message);
    };
    socket.on("findAllOrderUser:error", handleError);
    socket.on("findAllOrderUser:update", handleUpdate);
    return () => {
      socket.off("findAllOrderUser:error", handleError);
      socket.off("findAllOrderUser:update", handleUpdate);
    };
  }, []);

  useEffect(() => {
    const query = `&current=${current}&pageSize=${PAGE_SIZE}${qs || ""}`;

    socket.emit("findAllOrderUser:subscribe", {
      currentPage: current,
      limit: PAGE_SIZE,
      qs: query,
    });
  }, [current, qs]);

  const handleChangeOrder = async (id: string, status: string) => {
    const res = await update({ id, status }).unwrap();
    if (res?.data) {
      messageApi.success(res.message);
    } else {
      notificationApi.error({
        message: "Error occured",
        description: res.message,
      });
    }
  };

  const columns: ColumnsType<IOrder> = [
    {
      title: "Order ID",
      dataIndex: "id",
      ellipsis: true,
      render: (_, record) => {
        return (
          <a
            href="#"
            onClick={() => {
              setOpenViewDetail(true);
              setOrderId(record.id);
            }}
          >
            {record.id}
          </a>
        );
      },
    },
    {
      title: "Total",
      dataIndex: "totalPrice",
      sorter: true,
      render: (value: number) => formatCurrency(value),
    },
    {
      title: "Payment",
      dataIndex: "paymentRef",
      filters: [
        { text: "Local", value: "LOCAL" },
        { text: "VNPay", value: "VNPAY" },
        { text: "Credit Card", value: "CREDIT_CARD" },
      ],
      render(dom, entity) {
        const paymentRef = entity.paymentRef || "LOCAL";
        return (
          <Tag color={paymentRefColors[paymentRef]}>
            {paymentRef.replaceAll("_", " ")}
          </Tag>
        );
      },
    },
    {
      title: "Type",
      dataIndex: "type",
      render: (value: string) => {
        return (
          <Tag color={value === "BANKING" ? "error" : "gold"}>{value}</Tag>
        );
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      filters: [
        { text: "Success", value: "SUCCESS" },
        { text: "Failed", value: "FAILED" },
        { text: "Cancelled", value: "CANCELLED" },
        { text: "Delivering", value: "DELIVERING" },
        { text: "Packaging", value: "PACKAGING" },
      ],
      render: (status: string) => (
        <Tag color={statusColors[status] || "default"}>{status}</Tag>
      ),
    },
    {
      title: "Created",
      dataIndex: "createdAt",
      sorter: true,
      render: (value: string) => dayjs(value).format(FORMATE_DATE),
    },
    {
      title: "Action",
      render: (_, record) => {
        const isPending = record.status === "PENDING";
        const isSuccess = record.status === "SUCCESS";

        const isDisabled =
          record.status === "SUCCESS" ||
          record.status === "FAILED" ||
          record.status === "REFUNDED";

        const isBankingOrder = record.type === "BANKING";

        const disableCancel = isBankingOrder || isDisabled || !isPending;

        const disableRefund = isBankingOrder
          ? ["FAILED", "REFUNDED", "CANCELLED"].includes(record.status)
          : !isSuccess;

        return (
          <Access permission={ALL_PERMISSIONS.ORDERS.UPDATE} hideChildren>
            <Space>
              <Popconfirm
                title="Cancel this order?"
                onConfirm={() => handleChangeOrder(record.id, "CANCELLED")}
                okText="Yes"
                cancelText="No"
                disabled={disableCancel}
              >
                <Button danger disabled={disableCancel}>
                  Cancel
                </Button>
              </Popconfirm>
              <Popconfirm
                title="Restore this order?"
                onConfirm={() => handleChangeOrder(record.id, "PENDING")}
                okText="Yes"
                cancelText="No"
                disabled={isDisabled || isPending}
              >
                <Button disabled={isDisabled || isPending}>Restore</Button>
              </Popconfirm>
              <Popconfirm
                title="Refund this order?"
                onConfirm={() => handleChangeOrder(record.id, "REFUNDED")}
                okText="Yes"
                cancelText="No"
                disabled={disableRefund}
              >
                <Button
                  type={background === "dark" ? "default" : "primary"}
                  danger
                  disabled={disableRefund}
                >
                  Refund
                </Button>
              </Popconfirm>
            </Space>
          </Access>
        );
      },
    },
  ];

  return (
    <div>
      <Table<IOrder>
        rowKey="id"
        columns={columns}
        dataSource={orders}
        loading={isLoading}
        onChange={(pagination, filters, sorter: any) => {
          let query = ``;

          if (sorter.order && sorter.field) {
            const order =
              sorter.order === "ascend" ? `-${sorter.field}` : sorter.field;

            query += `&sort=${order}`;
          }

          if (filters.paymentRef?.length) {
            query += `&paymentRef=${filters.paymentRef.join(",")}`;
          }

          if (filters.status?.length) {
            query += `&status=${filters.status.join(",")}`;
          }

          setQs(query);

          socket.emit("findAllOrderUser:subscribe", {
            currentPage: pagination.current,
            limit: PAGE_SIZE,
            qs: query,
          });

          setCurrent(pagination.current as number);
        }}
        pagination={{
          current: meta?.current || 1,
          pageSize: PAGE_SIZE,
          total: meta?.total || 0,
          onChange: (page) => setCurrent(page),
          showSizeChanger: false,
        }}
        scroll={{ x: true }}
      />
      <ViewOrderDetail
        onClose={setOpenViewDetail}
        open={openViewDetail}
        setOrderId={setOrderId}
        orderId={orderId}
        area="CLIENT"
      />
    </div>
  );
};

export default UserOrderTable;
