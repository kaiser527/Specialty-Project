import DataTable from "@/components/admin/extra/protable";
import CardPopover from "@/components/client/card/card.popover";
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/constants/permissions";
import { socket } from "@/config/constants/utils";
import {
  dateRangeValidate,
  formatCurrency,
  FORMATE_DATE,
} from "@/config/helpers/global";
import { useMessage } from "@/hooks/useMessage";
import {
  useUpdateProviderOrderStatusByOrderIdMutation,
  useUpdateProviderOrderStatusMutation,
} from "@/redux/api/providerApi";
import {
  IMeta,
  IModelPaginate,
  IProviderOrder,
  IProviderOrderGroup,
} from "@/types/backend";
import { ProColumns } from "@ant-design/pro-components";
import { Button, Grid, Image, Popover, Select } from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import styles from "styles/admin.module.scss";

interface ISearch {
  orderId: string;
  status: string;
  createdAtRange: Date;
  updatedAtRange: Date;
}

const { useBreakpoint } = Grid;

const ProviderOrderPage = () => {
  const PAGE_SIZE = 10;

  const screen = useBreakpoint();

  const [statusMap, setStatusMap] = useState<Record<string, string>>({});
  const [orders, setOrders] = useState<IProviderOrder[]>([]);
  const [meta, setMeta] = useState<IMeta | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [updateOrder] = useUpdateProviderOrderStatusMutation();
  const [bulkUpdateOrder] = useUpdateProviderOrderStatusByOrderIdMutation();

  const { messageApi, notificationApi } = useMessage();

  useEffect(() => {
    setIsLoading(true);
    const handleUpdate = (data: IModelPaginate<IProviderOrder>) => {
      setOrders(data.result);
      setMeta(data.meta);
      setIsLoading(false);
    };
    const handleError = (err: any) => {
      setIsLoading(false);
      messageApi.error(err.message || "Failed to load orders");
    };
    socket.on("findAllProviderOrder:update", handleUpdate);
    socket.on("findAllProviderOrder:error", handleError);
    return () => {
      socket.off("findAllProviderOrder:update");
      socket.off("findAllProviderOrder:error");
    };
  }, []);

  const columns: ProColumns<IProviderOrderGroup>[] = [
    {
      title: "Order ID",
      dataIndex: "orderId",
    },
    {
      title: "Created at range",
      dataIndex: "createdAtRange",
      valueType: "dateRange",
      hideInTable: true,
    },
    {
      title: "Updated at range",
      dataIndex: "updatedAtRange",
      valueType: "dateRange",
      hideInTable: true,
    },
    {
      valueEnum: {
        PENDING: { text: "Pending" },
        APPROVED: { text: "Approved" },
        PACKAGING: { text: "Packaging" },
        DELIVERING: { text: "Delivering" },
        REJECTED: { text: "Rejected" },
      },
      valueType: "select",
      title: "Status",
      dataIndex: "status",
      hideInTable: true,
    },
    {
      title: "Bulk Status",
      dataIndex: "bulkStatus",
      hideInSearch: true,
      render: (_, record) => {
        const currentValue = statusMap[`bulk-${record.orderId}`] ?? "";
        return (
          <Access
            permission={ALL_PERMISSIONS.PROVIDERS.UPDATE_ORDER_BULK}
            hideChildren
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{ display: "flex", gap: 8 }}
            >
              <Select
                placeholder="Select status"
                value={currentValue || undefined}
                style={{ width: 160 }}
                onChange={(value) => {
                  setStatusMap((prev) => ({
                    ...prev,
                    [`bulk-${record.orderId}`]: value,
                  }));
                }}
                options={[
                  { label: "Approved All", value: "APPROVED" },
                  { label: "Packaging All", value: "PACKAGING" },
                  { label: "Delivering All", value: "DELIVERING" },
                  { label: "Pending All", value: "PENDING" },
                  { label: "Rejected All", value: "REJECTED" },
                ]}
              />

              <Button
                type="primary"
                disabled={!currentValue}
                className={
                  currentValue === "APPROVED"
                    ? styles["green-btn"]
                    : currentValue === "PACKAGING"
                    ? styles["packaging-btn"]
                    : currentValue === "DELIVERING"
                    ? styles["delivering-btn"]
                    : currentValue === "REJECTED"
                    ? styles["rejected-btn"]
                    : undefined
                }
                onClick={async () => {
                  const res = await bulkUpdateOrder({
                    orderId: record.orderId,
                    status: currentValue,
                  }).unwrap();

                  if (res?.data) {
                    messageApi.success(res.message);

                    setStatusMap((prev) => {
                      const next = {
                        ...prev,
                        [`bulk-${record.orderId}`]: "",
                      };

                      record.items.forEach((item: any) => {
                        next[item.id] = currentValue;
                      });

                      return next;
                    });
                  } else {
                    notificationApi.error({
                      message: "Error occurred",
                      description: res.message,
                    });
                  }
                }}
              >
                Save
              </Button>
            </div>
          </Access>
        );
      },
    },
  ];

  const childColumns: ProColumns<IProviderOrder>[] = [
    {
      title: "Quantity",
      hideInSearch: true,
      dataIndex: "quantity",
    },
    {
      title: "Unit price",
      dataIndex: "unitPrice",
      hideInSearch: true,
      render(dom, entity: any, index, action) {
        return <>{formatCurrency(entity.unitPrice)}</>;
      },
    },
    {
      title: "Total price",
      dataIndex: "totalPrice",
      hideInSearch: true,
      render(dom, entity: any, index, action) {
        return <>{formatCurrency(entity.totalPrice)}</>;
      },
    },
    {
      title: "Image",
      dataIndex: "variant",
      hideInSearch: true,
      render(dom, entity: any, index, action) {
        return (
          <Popover
            content={<CardPopover variant={entity.variant} />}
            placement={screen.lg ? "right" : "top"}
            trigger={screen.xs ? "click" : "hover"}
            mouseEnterDelay={0.2}
            mouseLeaveDelay={0.1}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
              }}
            >
              <Image
                src={`${import.meta.env.VITE_BACKEND_URL}/images/product/${
                  entity?.variant.images[0]
                }`}
                preview={false}
                width={66}
                height={66}
              />
            </div>
          </Popover>
        );
      },
    },
    {
      title: "CreatedAt",
      dataIndex: "createdAt",
      width: 200,
      render: (text, record, index, action) => {
        return <>{dayjs(record.createdAt).format(FORMATE_DATE)}</>;
      },
      hideInSearch: true,
    },
    {
      title: "UpdatedAt",
      dataIndex: "updatedAt",
      width: 200,
      render: (text, record, index, action) => {
        return <>{dayjs(record.updatedAt).format(FORMATE_DATE)}</>;
      },
      hideInSearch: true,
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (_value, record) => {
        const currentValue = statusMap[record.id] ?? record.status;
        return (
          <Access
            permission={ALL_PERMISSIONS.PROVIDERS.UPDATE_ORDER}
            hideChildren
          >
            <div style={{ display: "flex", gap: 8 }}>
              <Select
                value={currentValue}
                style={{ width: 100 }}
                onChange={(value) => {
                  setStatusMap((prev) => ({
                    ...prev,
                    [record.id]: value,
                  }));
                }}
                options={[
                  { label: "Approved", value: "APPROVED" },
                  { label: "Packaging", value: "PACKAGING" },
                  { label: "Delivering", value: "DELIVERING" },
                  { label: "Pending", value: "PENDING" },
                  { label: "Rejected", value: "REJECTED" },
                ]}
              />
              <Button
                type="primary"
                size="middle"
                disabled={currentValue === record.status}
                onClick={async () => {
                  const res = await updateOrder({
                    id: record.id,
                    status: currentValue,
                  }).unwrap();
                  if (res?.data) {
                    messageApi.success(res.message);
                    setStatusMap((prev) => ({
                      ...prev,
                      [record.id]: currentValue,
                    }));
                  } else {
                    notificationApi.error({
                      message: "Error occured",
                      description: res.message,
                      duration: 5,
                    });
                  }
                }}
              >
                Save
              </Button>
            </div>
          </Access>
        );
      },
    },
  ];

  return (
    <Access permission={ALL_PERMISSIONS.PROVIDERS.GET_ORDER_PAGINATE}>
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
        rowKey="orderId"
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
              { key: "orderId", value: params.orderId },
              { key: "pageSize", value: params.pageSize },
            ];
            queryParams.forEach((param) => {
              if (param.value) {
                query += `&${param.key}=${param.value}`;
              }
            });
            const sortFields = ["createdAt", "updatedAt", "status", "orderId"];
            for (const field of sortFields) {
              if (sort[field]) {
                query += `&sort=${
                  sort[field] === "ascend" ? field : "-" + field
                }`;
              }
            }
            const createdDateRange = dateRangeValidate(params.createdAtRange);
            if (createdDateRange) {
              query += `&createdAt=${createdDateRange[0]}&createdAt=${createdDateRange[1]}`;
            }
            const updatedDateRange = dateRangeValidate(params.updatedAtRange);
            if (updatedDateRange) {
              query += `&updatedAt=${updatedDateRange[0]}&updatedAt=${updatedDateRange[1]}`;
            }
          }
          socket.emit("findAllProviderOrder:subscribe", {
            currentPage: params.current,
            limit: params.pageSize,
            qs: query,
          });
        }}
        columns={columns}
        rowClassName={(record) => {
          const items = record.items || [];

          if (!items.length) return "";

          const statuses = items.map(
            (item: any) => statusMap[item.id] ?? item.status
          );

          const allApproved = statuses.every((s: any) => s === "APPROVED");
          const allRejected = statuses.every((s: any) => s === "REJECTED");
          const allPackaging = statuses.every((s: any) => s === "PACKAGING");
          const allDelivering = statuses.every((s: any) => s === "DELIVERING");

          if (allApproved) return styles["row-approved"];
          if (allRejected) return styles["row-rejected"];
          if (allPackaging) return styles["row-packaging"];
          if (allDelivering) return styles["row-delivering"];

          return "";
        }}
        expandable={{
          expandRowByClick: true,
          expandedRowRender: (record) => {
            const items = record?.items.map((item: IProviderOrder) => ({
              id: item.id,
              orderId: item.orderId,
              status: item.status,
              quantity: item.orderItem.quantity,
              unitPrice: item.orderItem.unitPrice,
              totalPrice: item.orderItem.quantity * item.orderItem.unitPrice,
              variant: item.orderItem.variant,
              createdAt: item.createdAt,
              updatedAt: item.updatedAt,
            }));
            return (
              <DataTable
                rowKey="id"
                search={false}
                options={false}
                pagination={false}
                dataSource={items}
                columns={childColumns}
              />
            );
          },
        }}
      />
    </Access>
  );
};

export default ProviderOrderPage;
