import DataTable from "@/components/admin/extra/protable";
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/constants/permissions";
import { roleGradients, socket } from "@/config/constants/utils";
import {
  dateRangeValidate,
  formatCurrency,
  FORMATE_DATE,
} from "@/config/helpers/global";
import { useGetAccount } from "@/hooks/useGetAccount";
import { useMessage } from "@/hooks/useMessage";
import {
  useQuickUpdateProviderFeeStatusMutation,
  useUpdateProviderFeeStatusMutation,
} from "@/redux/api/providerApi";
import {
  IDashboardDateRange,
  IMeta,
  IModelPaginate,
  IProviderFee,
  IProviderFeeDashboard,
  IProviderFeeItem,
  IUser,
} from "@/types/backend";
import { ProColumns } from "@ant-design/pro-components";
import {
  Button,
  Card,
  Col,
  Empty,
  Grid,
  Image,
  Popover,
  Row,
  Select,
  Skeleton,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from "antd";
import dayjs from "dayjs";
import { useEffect, useState } from "react";
import CardPopover from "@/components/client/card/card.popover";
import styles from "styles/admin.module.scss";
import RangePickerDashboard from "@/components/admin/dashboard/RangePickerDashboard";
import { DualAxes } from "@ant-design/plots";

const { Text } = Typography;

const statusOptions = [
  { label: "CANCELLED", value: "CANCELLED" },
  { label: "PAID", value: "PAID" },
  { label: "PENDING", value: "PENDING" },
];

const { useBreakpoint } = Grid;

const StatusEditor = ({
  record,
  onSubmit,
  user,
}: {
  record: IProviderFeeItem;
  onSubmit: (id: string, value: string) => void;
  user: IUser;
}) => {
  const [value, setValue] = useState(record.status);

  useEffect(() => {
    setValue(record.status);
  }, [record.status]);

  return (
    <Space>
      <Select
        value={value}
        style={{ width: 120 }}
        options={statusOptions}
        disabled={
          !user.permissions.some(
            (p) =>
              p.apiPath === ALL_PERMISSIONS.PROVIDERS.UPDATE_FEE.apiPath &&
              p.method === ALL_PERMISSIONS.PROVIDERS.UPDATE_FEE.method
          )
        }
        onChange={(val) => setValue(val)}
      />
      <Access permission={ALL_PERMISSIONS.PROVIDERS.UPDATE_FEE} hideChildren>
        <Button
          type="primary"
          size="small"
          onClick={() => onSubmit(record.id, value)}
        >
          Submit
        </Button>
      </Access>
    </Space>
  );
};

const ProviderFeePage = () => {
  const PAGE_SIZE = 10;

  const screen = useBreakpoint();

  const [expandPagination, setExpandPagination] = useState<
    Record<string, { current: number; pageSize: number }>
  >({});
  const [providers, setProviders] = useState<IProviderFee[]>([]);
  const [meta, setMeta] = useState<IMeta | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [rangeLoading, setRangeLoading] = useState(true);
  const [dashboardLoading, setDashboardLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<"day" | "month">("day");
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [minMax, setMinMax] = useState<{ min: string; max: string } | null>(
    null
  );
  const [dashboardData, setDashboardData] =
    useState<IProviderFeeDashboard | null>(null);

  const { messageApi, notificationApi } = useMessage();
  const { user } = useGetAccount();

  const [update] = useUpdateProviderFeeStatusMutation();
  const [quickUpdate] = useQuickUpdateProviderFeeStatusMutation();

  const summary = dashboardData?.summary;
  const chart = dashboardData?.chart;

  useEffect(() => {
    setIsLoading(true);
    const handleUpdate = (data: IModelPaginate<IProviderFee>) => {
      setProviders(data.result);
      setMeta(data.meta);
      setIsLoading(false);
    };
    const handleError = (err: any) => {
      setIsLoading(false);
      messageApi.error(err.message || "Failed to load orders");
    };
    socket.on("findAllProviderFee:update", handleUpdate);
    socket.on("findAllProviderFee:error", handleError);
    return () => {
      socket.off("findAllProviderFee:update");
      socket.off("findAllProviderFee:error");
    };
  }, []);

  useEffect(() => {
    if (
      !user.permissions.some(
        ({ apiPath, method }) =>
          apiPath ===
            ALL_PERMISSIONS.PROVIDERS.GET_FEE_DASHBOARD_DATERANGE.apiPath &&
          method ===
            ALL_PERMISSIONS.PROVIDERS.GET_FEE_DASHBOARD_DATERANGE.method
      )
    )
      return;

    socket.emit("providerFeeDashboardDateRange:subscribe");

    const handleUpdate = (data: IDashboardDateRange) => {
      const max = dayjs(data.maxDate);
      const min = dayjs(data.minDate);

      const start = max.subtract(8, "day");

      setMinMax({
        min: min.format(FORMATE_DATE),
        max: max.format(FORMATE_DATE),
      });

      setDateRange([start.format(FORMATE_DATE), max.format(FORMATE_DATE)]);

      setRangeLoading(false);
    };

    const handleError = (err: any) => {
      setRangeLoading(false);
      messageApi.error(err.message || "Failed to load date range");
    };

    socket.on("providerFeeDashboardDateRange:update", handleUpdate);
    socket.on("providerFeeDashboardDateRange:error", handleError);

    return () => {
      socket.off("providerFeeDashboardDateRange:update", handleUpdate);
      socket.off("providerFeeDashboardDateRange:error", handleError);
    };
  }, []);

  useEffect(() => {
    if (
      !user.permissions.some(
        ({ apiPath, method }) =>
          apiPath === ALL_PERMISSIONS.PROVIDERS.GET_FEE_DASHBOARD.apiPath &&
          method === ALL_PERMISSIONS.PROVIDERS.GET_FEE_DASHBOARD.method
      ) ||
      !dateRange
    )
      return;

    if (isFirstLoad) setDashboardLoading(true);
    socket.emit("providerFeeDashboard:subscribe", {
      groupBy,
      startDate: dateRange[0],
      endDate: dateRange[1],
    });
    const handler = (data: IProviderFeeDashboard) => {
      setDashboardData(data);
      setDashboardLoading(false);
      setIsFirstLoad(false);
    };
    const handlerError = (err: any) => {
      setDashboardLoading(false);
      messageApi.error(err.message || "Failed to load dashboard data");
    };
    socket.on("providerFeeDashboard:update", handler);
    socket.on("providerFeeDashboard:error", handlerError);
    return () => {
      socket.off("providerFeeDashboard:update", handler);
      socket.off("providerFeeDashboard:error", handlerError);
    };
  }, [groupBy, dateRange]);

  useEffect(() => {
    if (!minMax) return;

    const max = dayjs(minMax.max);
    const min = dayjs(minMax.min);

    const newRange: [string, string] =
      groupBy === "month"
        ? [min.format(FORMATE_DATE), max.format(FORMATE_DATE)]
        : [
            max.subtract(8, "day").format(FORMATE_DATE),
            max.format(FORMATE_DATE),
          ];

    setDateRange((prev) => {
      if (prev?.[0] === newRange[0] && prev?.[1] === newRange[1]) {
        return prev;
      }
      return newRange;
    });
  }, [groupBy, minMax]);

  const dualData =
    chart?.labels.map((label: string, i: number) => ({
      time: label,
      revenue: Number(chart.revenue?.[i] || 0),
    })) || [];

  const dualConfig = {
    xField: "time",
    data: dualData,
    children: [
      {
        type: "interval",
        yField: "revenue",
        style: { fill: "#1677ff" },
        axis: { y: { position: "left" } },
      },
    ],
  };

  const isPageLoading = isFirstLoad && (dashboardLoading || rangeLoading);

  const columns: ProColumns<IProviderFee>[] = [
    {
      title: "Provider",
      dataIndex: "user",
      render: (_, record) => (
        <Space align="center" size={16} style={{ width: "100%" }}>
          <Image
            src={`${import.meta.env.VITE_BACKEND_URL}/images/user/${
              record.user?.image
            }`}
            width={64}
            height={64}
            preview={false}
            style={{
              borderRadius: "50%",
              objectFit: "cover",
              border: "2px solid #fff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.1)",
            }}
          />

          <div style={{ flex: 1 }}>
            <Space size={8} align="center" wrap>
              <Text strong style={{ fontSize: 16 }}>
                {record.user?.name || "Unknown User"}
              </Text>

              <Tag
                style={{
                  borderRadius: 6,
                  padding: "2px 8px",
                  fontWeight: 500,
                  border: "none",
                  color: "#fff",
                  background:
                    roleGradients[record.user?.role?.name ?? "USER"] || "#999",
                }}
              >
                {record.user?.role?.name || "USER"}
              </Tag>

              <Text
                type="secondary"
                style={{
                  fontSize: 12,
                  background: "#f5f5f5",
                  padding: "2px 8px",
                  borderRadius: 6,
                }}
                copyable={{ text: record.user?._id }}
              >
                {record.user?._id}
              </Text>
            </Space>

            <div>
              <Text type="secondary">{record.user?.email}</Text>
            </div>
          </div>
        </Space>
      ),
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
      title: "Order ID",
      dataIndex: "orderId",
      key: "orderId",
      hideInTable: true,
    },
    {
      title: "ID",
      dataIndex: "orderId",
      key: "id",
      hideInTable: true,
    },
    {
      valueType: "select",
      valueEnum: {
        PENDING: { text: "Pending" },
        PAID: { text: "Paid" },
        CANCELLED: { text: "Cancelled" },
      },
      title: "status",
      dataIndex: "status",
      key: "status",
      hideInTable: true,
    },
  ];

  return (
    <>
      <Access permission={ALL_PERMISSIONS.PROVIDERS.GET_FEE_PAGINATE}>
        <DataTable<IProviderFee>
          rowKey={(record) => record.user._id}
          loading={isLoading}
          columns={columns}
          dataSource={providers ?? []}
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
          headerTitle="List Providers"
          bordered
          rowSelection={false}
          request={async (params, sort): Promise<any> => {
            let query = "";
            if (params) {
              const queryParams = [
                { key: "current", value: params.current },
                { key: "status", value: params.status },
                { key: "pageSize", value: params.pageSize },
                { key: "ownerId", value: params.user },
                { key: "orderId", value: params.orderId },
                { key: "id", value: params.id },
              ];
              queryParams.forEach((param) => {
                if (param.value) {
                  query += `&${param.key}=${param.value}`;
                }
              });
              const createdDateRange = dateRangeValidate(params.createdAtRange);
              if (createdDateRange) {
                query += `&createdAt=${createdDateRange[0]}&createdAt=${createdDateRange[1]}`;
              }
              const updatedDateRange = dateRangeValidate(params.updatedAtRange);
              if (updatedDateRange) {
                query += `&updatedAt=${updatedDateRange[0]}&updatedAt=${updatedDateRange[1]}`;
              }
            }
            socket.emit("findAllProviderFee:subscribe", {
              currentPage: params.current,
              limit: params.pageSize,
              qs: query,
            });
          }}
          expandable={{
            expandRowByClick: true,
            expandedRowRender: (record) => {
              const pagination = expandPagination[record.user._id] || {
                current: 1,
                pageSize: 7,
              };

              const totalOrders = record.orders.length;

              const maxPage = Math.ceil(totalOrders / pagination.pageSize);

              const safeCurrent =
                pagination.current > maxPage
                  ? maxPage || 1
                  : pagination.current;

              const start = (safeCurrent - 1) * pagination.pageSize;

              const end = start + pagination.pageSize;

              const paginatedOrders = record.orders.slice(start, end);

              return (
                <Card
                  variant="borderless"
                  style={{
                    background: "#fafafa",
                    borderRadius: 12,
                  }}
                  styles={{ body: { padding: 16 } }}
                >
                  <Table
                    rowKey="orderId"
                    dataSource={paginatedOrders}
                    rowClassName={(record) => {
                      const statuses = record.items.map(
                        (item: IProviderFeeItem) => item.status
                      );

                      const allPaid = statuses.every((s) => s === "PAID");

                      const allCancelled = statuses.every(
                        (s) => s === "CANCELLED"
                      );

                      if (allPaid) {
                        return styles["row-approved"];
                      }

                      if (allCancelled) {
                        return styles["row-rejected"];
                      }

                      return "";
                    }}
                    pagination={{
                      current: pagination.current,
                      pageSize: pagination.pageSize,
                      total: totalOrders,
                      showSizeChanger: true,
                      onChange: (current, pageSize) => {
                        setExpandPagination((prev) => ({
                          ...prev,
                          [record.user._id]: {
                            current,
                            pageSize,
                          },
                        }));
                      },
                    }}
                    columns={[
                      {
                        title: "Order ID",
                        dataIndex: "orderId",
                        render: (text) => (
                          <Text copyable style={{ fontSize: 13 }}>
                            {text}
                          </Text>
                        ),
                      },
                      {
                        title: "Total Items",
                        render: (_, entity) => entity.items.length,
                      },
                      {
                        title: "Total Fee",
                        render: (_, entity) => {
                          const total = entity.items.reduce(
                            (sum: number, item: IProviderFeeItem) =>
                              sum + Number(item.feeAmount),
                            0
                          );

                          return (
                            <Text strong style={{ color: "#52c41a" }}>
                              {formatCurrency(total)}
                            </Text>
                          );
                        },
                      },
                      {
                        title: "Bulk Actions",
                        key: "bulkActions",
                        render: (_, orderEntity) => {
                          const handleBulk = async (status: string) => {
                            const res = await quickUpdate({
                              ownerId: record.user._id,
                              orderId: orderEntity.orderId,
                              status,
                            }).unwrap();

                            if (res?.data) {
                              messageApi.success(res.data.message);
                            } else {
                              notificationApi.error({
                                message: "Error occurred",
                                description: res.message,
                              });
                            }
                          };

                          return (
                            <Access
                              permission={
                                ALL_PERMISSIONS.PROVIDERS.UPDATE_FEE_BULK
                              }
                              hideChildren
                            >
                              <div
                                onClick={(e) => e.stopPropagation()}
                                style={{ display: "flex", gap: 8 }}
                              >
                                <Button
                                  danger
                                  size="small"
                                  onClick={() => handleBulk("CANCELLED")}
                                >
                                  Cancel All
                                </Button>

                                <Button
                                  type="primary"
                                  size="small"
                                  className={styles["green-btn"]}
                                  onClick={() => handleBulk("PAID")}
                                >
                                  Paid All
                                </Button>

                                <Button
                                  size="small"
                                  onClick={() => handleBulk("PENDING")}
                                >
                                  Pending All
                                </Button>
                              </div>
                            </Access>
                          );
                        },
                      },
                    ]}
                    expandable={{
                      expandRowByClick: true,
                      expandedRowRender: (orderRecord) => {
                        return (
                          <Table
                            rowKey="id"
                            size="small"
                            dataSource={orderRecord.items}
                            pagination={false}
                            columns={[
                              {
                                title: "Fee",
                                dataIndex: "feeAmount",
                                render: (value) => (
                                  <Text strong style={{ color: "#1677ff" }}>
                                    {formatCurrency(value)}
                                  </Text>
                                ),
                              },
                              {
                                title: "Percent",
                                dataIndex: "percent",
                                render: (value) => <Text>{value}%</Text>,
                              },
                              {
                                title: "Image",
                                dataIndex: "variant",
                                render(_, entity) {
                                  return (
                                    <Popover
                                      content={
                                        <CardPopover variant={entity.variant} />
                                      }
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
                                          src={`${
                                            import.meta.env.VITE_BACKEND_URL
                                          }/images/product/${
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
                                title: "Status",
                                dataIndex: "status",
                                width: 150,
                                render: (status, record) => (
                                  <StatusEditor
                                    user={user}
                                    record={record}
                                    onSubmit={async (
                                      id: string,
                                      newStatus: string
                                    ) => {
                                      const res = await update({
                                        id,
                                        status: newStatus,
                                      }).unwrap();

                                      if (res?.data) {
                                        messageApi.success(res.message);
                                      } else {
                                        notificationApi.error({
                                          message: "Error occured",
                                          description: res.message,
                                          duration: 5,
                                        });
                                      }
                                    }}
                                  />
                                ),
                              },
                              {
                                title: "Created at",
                                dataIndex: "createdAt",
                                render: (date) => (
                                  <Text type="secondary">
                                    {dayjs(date).format(FORMATE_DATE)}
                                  </Text>
                                ),
                              },
                              {
                                title: "Updated at",
                                dataIndex: "updatedAt",
                                render: (date) => (
                                  <Text type="secondary">
                                    {dayjs(date).format(FORMATE_DATE)}
                                  </Text>
                                ),
                              },
                              {
                                title: "Due Date",
                                dataIndex: "dueDate",
                                render: (_, record) => {
                                  const isExpired =
                                    record.variant.dueDate &&
                                    dayjs(record.variant.dueDate).isBefore(
                                      dayjs(),
                                      "day"
                                    );

                                  return (
                                    <Tag color={isExpired ? "red" : "green"}>
                                      {record.variant.dueDate
                                        ? dayjs(record.variant.dueDate).format(
                                            FORMATE_DATE
                                          )
                                        : "N/A"}
                                    </Tag>
                                  );
                                },
                              },
                            ]}
                          />
                        );
                      },
                    }}
                  />
                </Card>
              );
            },
          }}
        />
      </Access>
      <Access
        permission={ALL_PERMISSIONS.PROVIDERS.GET_FEE_DASHBOARD_DATERANGE}
        hideChildren
      >
        <RangePickerDashboard
          dashboardLoading={dashboardLoading}
          setDateRange={setDateRange}
          minMax={minMax}
          isPageLoading={isPageLoading}
          dateRange={dateRange}
          groupBy={groupBy}
          setGroupBy={setGroupBy}
          style={{ margin: "16px 0" }}
        />
      </Access>
      <Access
        permission={ALL_PERMISSIONS.PROVIDERS.GET_FEE_DASHBOARD}
        hideChildren
      >
        {isPageLoading ? (
          <>
            <Row gutter={20} style={{ margin: "16px -10px" }}>
              {[1, 2].map((i) => (
                <Col key={i} span={12}>
                  <Card>
                    <Skeleton active paragraph={{ rows: 1 }} />
                  </Card>
                </Col>
              ))}
            </Row>
            <Card title="Revenue Trend">
              <Skeleton active paragraph={{ rows: 8 }} />
            </Card>
          </>
        ) : !dashboardData ? (
          <Empty />
        ) : (
          <>
            <Row gutter={20} style={{ margin: "16px -10px" }}>
              <Col span={12}>
                <Card>
                  <Statistic
                    title="Avg Revenue"
                    value={summary?.avgFeeAmount}
                    formatter={(v) => formatCurrency(Number(v))}
                  />
                </Card>
              </Col>
              <Col span={12}>
                <Card>
                  <Statistic
                    title="Total Revenue"
                    value={summary?.totalFeeRevenue}
                    formatter={(v) => formatCurrency(Number(v))}
                  />
                </Card>
              </Col>
            </Row>
            <Card title="Revenue Fee">
              <DualAxes {...dualConfig} height={300} />
            </Card>
          </>
        )}
      </Access>
    </>
  );
};

export default ProviderFeePage;
