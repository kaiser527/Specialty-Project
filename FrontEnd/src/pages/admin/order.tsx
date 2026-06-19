import DataTable from "@/components/admin/extra/protable";
import ViewOrderDetail from "@/components/admin/order/order.view";
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/constants/permissions";
import {
  paymentRefColors,
  socket,
  statusColors,
} from "@/config/constants/utils";
import {
  dateRangeValidate,
  formatCurrency,
  FORMATE_DATE,
} from "@/config/helpers/global";
import Papa from "papaparse";
import { useMessage } from "@/hooks/useMessage";
import { useDeleteOrderMutation } from "@/redux/api/orderApi";
import { IMeta, IModelPaginate, IOrder } from "@/types/backend";
import { DeleteOutlined, ExportOutlined } from "@ant-design/icons";
import { ProColumns } from "@ant-design/pro-components";
import { Button, Popconfirm, Space, Tag } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import axios from "@/config/axios/axios-customize";

interface ISearch {
  userId: string;
  status: string;
  paymentRef: string;
  id: string;
  type: string;
  createdAtRange: Date;
  updatedAtRange: Date;
}

const OrderPage = () => {
  const PAGE_SIZE = 10;

  const [openViewDetail, setOpenViewDetail] = useState<boolean>(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orders, setOrders] = useState<IOrder[]>([]);
  const [meta, setMeta] = useState<IMeta | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const { messageApi, notificationApi } = useMessage();

  const [deleteOrder] = useDeleteOrderMutation();

  useEffect(() => {
    setIsLoading(true);
    const handleUpdate = (data: IModelPaginate<IOrder>) => {
      setOrders(data.result);
      setMeta(data.meta);
      setIsLoading(false);
    };
    const handleError = (err: any) => {
      setIsLoading(false);
      messageApi.error(err.message || "Failed to load orders");
    };
    socket.on("findAllOrder:update", handleUpdate);
    socket.on("findAllOrder:error", handleError);
    return () => {
      socket.off("findAllOrder:update");
      socket.off("findAllOrder:error");
    };
  }, []);

  const handleDeleteOrder = async (id: string | undefined) => {
    if (id) {
      const res = await deleteOrder({ id }).unwrap();
      if (res?.data) {
        messageApi.success(res.message);
      } else {
        notificationApi.error({
          message: "Error occured",
          description: res.message,
          duration: 5,
        });
      }
    }
  };

  const columns: ProColumns<IOrder>[] = [
    {
      title: "Order ID",
      dataIndex: "id",
      hideInTable: true,
    },
    {
      title: "User ID",
      dataIndex: "userId",
      sorter: true,
      width: 200,
      render: (text, record, index, action) => {
        return (
          <a
            href="#"
            onClick={() => {
              setOpenViewDetail(true);
              setOrderId(record.id);
            }}
          >
            {record.userId}
          </a>
        );
      },
    },
    {
      title: "Total price",
      dataIndex: "totalPrice",
      width: 150,
      render(dom, entity, index, action) {
        return <>{formatCurrency(entity.totalPrice)}</>;
      },
      sorter: true,
      hideInSearch: true,
    },
    {
      title: "Payment ref",
      dataIndex: "paymentRef",
      valueType: "select",
      valueEnum: {
        LOCAL: { text: "Local" },
        VNPAY: { text: "Vnpay" },
        CREDIT_CARD: { text: "Credit card" },
      },
      width: 150,
      render(dom, entity) {
        const paymentRef = entity.paymentRef || "LOCAL";
        return (
          <Tag color={paymentRefColors[paymentRef]}>
            {paymentRef.replaceAll("_", " ")}
          </Tag>
        );
      },
      sorter: true,
    },
    {
      title: "Type",
      dataIndex: "type",
      valueType: "select",
      valueEnum: {
        COD: { text: "COD" },
        BANKING: { text: "BANKING" },
      },
      width: 150,
      sorter: true,
      render: (_value, record) => {
        let color = "gold";
        let label = "COD";
        if (record.type === "BANKING") {
          color = "error";
          label = "BANKING";
        }
        return <Tag color={color}>{label}</Tag>;
      },
    },
    {
      title: "Status",
      dataIndex: "status",
      valueType: "select",
      valueEnum: {
        SUCCESS: { text: "Success" },
        PENDING: { text: "Pending" },
        FAILED: { text: "Failed" },
        CANCELLED: { text: "Cancelled" },
        REFUNDED: { text: "Refunded" },
        DELIVERING: { text: "Delivering" },
        PACKAGING: { text: "Packaging" },
      },
      width: 150,
      sorter: true,
      render: (_value, record) => {
        const status = record?.status;
        return <Tag color={statusColors[status] || "default"}>{status}</Tag>;
      },
    },
    {
      title: "CreatedAt",
      dataIndex: "createdAt",
      width: 200,
      sorter: true,
      render: (text, record, index, action) => {
        return <>{dayjs(record.createdAt).format(FORMATE_DATE)}</>;
      },
      hideInSearch: true,
    },
    {
      title: "UpdatedAt",
      dataIndex: "updatedAt",
      width: 200,
      sorter: true,
      render: (text, record, index, action) => {
        return <>{dayjs(record.updatedAt).format(FORMATE_DATE)}</>;
      },
      hideInSearch: true,
    },
    {
      title: "Created at range",
      dataIndex: "createdAtRange",
      key: "createdAtRange",
      valueType: "dateRange",
      hideInTable: true,
    },
    {
      title: "Updated at range",
      dataIndex: "updatedAtRange",
      key: "updatedAtRange",
      valueType: "dateRange",
      hideInTable: true,
    },
    {
      title: "Actions",
      hideInSearch: true,
      width: 50,
      render: (_value, entity, _index, _action) => (
        <Space>
          <Access permission={ALL_PERMISSIONS.ORDERS.DELETE} hideChildren>
            <Popconfirm
              placement="leftTop"
              title={"Delete confirmation"}
              description={"Are you sure to delete this order ?"}
              onConfirm={() => handleDeleteOrder(entity.id)}
              okText="Confirm"
              cancelText="Cancel"
            >
              <span style={{ cursor: "pointer", margin: "0 10px" }}>
                <DeleteOutlined
                  style={{
                    fontSize: 20,
                    color: "#ff4d4f",
                  }}
                />
              </span>
            </Popconfirm>
          </Access>
        </Space>
      ),
    },
  ];

  const handleExportCSV = async () => {
    try {
      setIsLoading(true);

      const res = await axios.get(`/api/v1/orders?current=1&pageSize=100000`);
      const allOrders = res.data?.result || [];

      if (!allOrders.length) {
        messageApi.warning("No data to export");
        return;
      }

      const csvData = allOrders.map((item: IOrder) => ({
        "Order ID": item.id,
        "User ID": item.userId,
        "Total Price": formatCurrency(item.totalPrice),
        "Payment Method": item.paymentRef,
        Type: item.type,
        Status: item.status,
        "Created At": dayjs(item.createdAt).format(FORMATE_DATE),
        "Updated At": dayjs(item.updatedAt).format(FORMATE_DATE),
      }));

      const csv = Papa.unparse(csvData);

      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);

      const link = document.createElement("a");
      link.href = url;
      link.download = "orders.csv";
      link.click();
    } catch (err) {
      messageApi.error("Export failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <Access permission={ALL_PERMISSIONS.ORDERS.GET_PAGINATE}>
        <DataTable<any, ISearch>
          defaultData={orders}
          pagination={{
            defaultPageSize: PAGE_SIZE,
            current: meta?.current ?? 1,
            total: meta?.total ?? 10,
            showSizeChanger: true,
            showTotal: (total, range) => {
              return (
                <div>
                  {range[0]}-{range[1]} per {total} rows
                </div>
              );
            },
          }}
          scroll={{ x: true }}
          headerTitle="List Orders"
          rowKey="id"
          loading={isLoading}
          bordered
          dataSource={orders}
          rowSelection={false}
          request={async (params, sort): Promise<any> => {
            let query = "";
            if (params) {
              const queryParams = [
                { key: "current", value: params.current },
                { key: "status", value: params.status },
                { key: "pageSize", value: params.pageSize },
                { key: "userId", value: params.userId },
                { key: "paymentRef", value: params.paymentRef },
                { key: "type", value: params.type },
                { key: "id", value: params.id },
              ];
              queryParams.forEach((param) => {
                if (param.value) {
                  query += `&${param.key}=${param.value}`;
                }
              });
              const sortFields = [
                "createdAt",
                "updatedAt",
                "userId",
                "paymentRef",
                "status",
                "type",
                "totalPrice",
              ];
              for (const field of sortFields) {
                if (sort[field]) {
                  query += `&sort=${
                    sort[field] === "ascend" ? field : "-" + field
                  }`;
                }
              }
              const createdDateRange = dateRangeValidate(params.createdAtRange);
              if (createdDateRange) {
                query += `&createdAt>=${createdDateRange[0]}&createdAt<=${createdDateRange[1]}`;
              }
              const updatedDateRange = dateRangeValidate(params.updatedAtRange);
              if (updatedDateRange) {
                query += `&updatedAt>=${updatedDateRange[0]}&updatedAt<=${updatedDateRange[1]}`;
              }
            }
            socket.emit("findAllOrder:subscribe", {
              currentPage: params.current,
              limit: params.pageSize,
              qs: query,
            });
          }}
          columns={columns}
          toolBarRender={(_action, _rows): any => {
            return (
              <Button
                style={{ backgroundColor: "#52c41a" }}
                icon={<ExportOutlined />}
                type="primary"
                loading={isLoading}
                onClick={handleExportCSV}
              >
                Export csv
              </Button>
            );
          }}
        />
      </Access>
      <ViewOrderDetail
        onClose={setOpenViewDetail}
        open={openViewDetail}
        setOrderId={setOrderId}
        orderId={orderId}
        area="ADMIN"
      />
    </div>
  );
};

export default OrderPage;
