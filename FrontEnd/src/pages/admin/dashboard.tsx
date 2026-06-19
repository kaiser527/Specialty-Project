import { Card, Col, Row, Statistic, Empty, Grid, Skeleton } from "antd";
import { useEffect, useState } from "react";
import dayjs from "dayjs";
import { Column, DualAxes, Pie } from "@ant-design/plots";
import { formatCurrency, FORMATE_DATE } from "@/config/helpers/global";
import { socket } from "@/config/constants/utils";
import {
  IDashboardDateRange,
  IDashboardRevenue,
  IUserRoleChart,
} from "@/types/backend";
import { useMessage } from "@/hooks/useMessage";
import RangePickerDashboard from "@/components/admin/dashboard/RangePickerDashboard";
import { useGetAccount } from "@/hooks/useGetAccount";
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/constants/permissions";

const { useBreakpoint } = Grid;

const DashboardPage = () => {
  const screen = useBreakpoint();

  const { messageApi } = useMessage();
  const { user } = useGetAccount();

  const [isFirstLoad, setIsFirstLoad] = useState(true);
  const [rangeLoading, setRangeLoading] = useState(true);
  const [loading, setLoading] = useState(true);
  const [groupBy, setGroupBy] = useState<"day" | "month">("day");
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [minMax, setMinMax] = useState<{ min: string; max: string } | null>(
    null
  );
  const [dashboardData, setDashboardData] = useState<IDashboardRevenue | null>(
    null
  );
  const [userRoleChart, setUserRoleChart] = useState<IUserRoleChart | null>(
    null
  );
  const [userRoleLoading, setUserRoleLoading] = useState(true);

  const summary = dashboardData?.summary;
  const chart = dashboardData?.chart;

  const roleData =
    userRoleChart?.labels.map((label, index) => ({
      role: label,
      count: userRoleChart.datasets[0].data[index],
    })) || [];

  useEffect(() => {
    setRangeLoading(true);
    socket.emit("dashboardDaterange:subscribe");

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

    socket.on("dashboardDaterange:update", handleUpdate);
    socket.on("dashboardDaterange:error", handleError);

    return () => {
      socket.off("dashboardDaterange:update", handleUpdate);
      socket.off("dashboardDaterange:error", handleError);
    };
  }, []);

  useEffect(() => {
    if (
      !user.permissions.some(
        ({ apiPath, method }) =>
          apiPath === ALL_PERMISSIONS.USERS.CHART.apiPath &&
          method === ALL_PERMISSIONS.USERS.CHART.method
      )
    )
      return;

    setUserRoleLoading(true);
    socket.emit("userRoleChart:subscribe");

    const handleUpdate = (data: IUserRoleChart) => {
      setUserRoleChart(data);
      setUserRoleLoading(false);
    };

    const handleError = (err: any) => {
      setUserRoleLoading(false);
      messageApi.error(err.message || "Failed loading role chart");
    };

    socket.on("userRoleChart:update", handleUpdate);
    socket.on("userRoleChart:error", handleError);

    return () => {
      socket.off("userRoleChart:update", handleUpdate);
      socket.off("userRoleChart:error", handleError);
    };
  }, []);

  useEffect(() => {
    if (!dateRange) return;
    if (isFirstLoad) setLoading(true);
    socket.emit("dashboard:subscribe", {
      groupBy,
      startDate: dateRange[0],
      endDate: dateRange[1],
    });
    const handler = (data: IDashboardRevenue) => {
      setDashboardData(data);
      setLoading(false);
      setIsFirstLoad(false);
    };
    const handlerError = (err: any) => {
      setLoading(false);
      messageApi.error(err.message || "Failed to load dashboard data");
    };
    socket.on("dashboard:update", handler);
    socket.on("dashboard:error", handlerError);
    return () => {
      socket.off("dashboard:update", handler);
      socket.off("dashboard:error", handlerError);
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
      orders: Number(chart.orders?.[i] || 0),
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
      {
        type: "line",
        yField: "orders",
        shapeField: "smooth",
        style: {
          stroke: "#52c41a",
          lineWidth: 2,
        },
        axis: { y: { position: "right" } },
      },
    ],
  };

  const pieData = summary
    ? Object.entries(summary.paymentPercent).map(([type, value]) => ({
        type,
        value,
      }))
    : [];

  const pieConfig = {
    data: pieData,
    angleField: "value",
    colorField: "type",
    radius: 1,
    innerRadius: 0.65,
    label: {
      text: (d: any) => `${d.value}%`,
    },
  };

  const roleConfig = {
    data: roleData,
    xField: "role",
    yField: "count",
    colorField: "role",
    scale: {
      color: {
        range: ["#faad14", "#52c41a", "#1677ff", "#ff4d4f", "#722ed1"],
      },
    },
  };

  const isPageLoading =
    isFirstLoad && (loading || rangeLoading || userRoleLoading);

  return (
    <div>
      <RangePickerDashboard
        dashboardLoading={loading}
        setDateRange={setDateRange}
        minMax={minMax}
        isPageLoading={isPageLoading}
        dateRange={dateRange}
        setGroupBy={setGroupBy}
        groupBy={groupBy}
        style={{ marginBottom: 24 }}
      />
      {isPageLoading ? (
        <>
          <Row gutter={20}>
            {[1, 2, 3].map((i) => (
              <Col key={i} lg={8} sm={8} xs={24}>
                <Card>
                  <Skeleton active paragraph={{ rows: 1 }} />
                </Card>
              </Col>
            ))}
          </Row>
          <Row gutter={20} style={{ marginTop: 24 }}>
            <Col lg={16} sm={24} xs={24}>
              <Card title="Revenue & Orders Trend">
                <Skeleton active paragraph={{ rows: 8 }} />
              </Card>
            </Col>

            <Col
              style={screen.lg ? {} : { marginTop: 20 }}
              lg={8}
              sm={24}
              xs={24}
            >
              <Card title="Payment Distribution">
                <Skeleton active paragraph={{ rows: 8 }} />
              </Card>
            </Col>
            <Col style={{ marginTop: 20 }} span={24}>
              <Card title="User Role Distribution">
                <Skeleton active paragraph={{ rows: 8 }} />
              </Card>
            </Col>
          </Row>
        </>
      ) : !dashboardData ? (
        <Empty />
      ) : (
        <>
          <Row gutter={20}>
            <Col lg={8} sm={8} xs={24}>
              <Card>
                <Statistic
                  title="Total Revenue"
                  value={summary?.totalRevenue}
                  formatter={(v) => <>{formatCurrency(Number(v))}</>}
                />
              </Card>
            </Col>

            <Col lg={8} sm={8} xs={24}>
              <Card>
                <Statistic title="Total Orders" value={summary?.totalOrders} />
              </Card>
            </Col>

            <Col lg={8} sm={8} xs={24}>
              <Card>
                <Statistic
                  title="Avg Order"
                  value={summary?.avgOrderValue}
                  formatter={(v) => <>{formatCurrency(Number(v))}</>}
                />
              </Card>
            </Col>
          </Row>

          <Row gutter={20} style={{ marginTop: 24 }}>
            <Col lg={16} sm={24} xs={24}>
              <Card title="Revenue & Orders Trend">
                <DualAxes {...dualConfig} height={350} />
              </Card>
            </Col>

            <Col
              style={screen.lg ? {} : { marginTop: 20 }}
              lg={8}
              sm={24}
              xs={24}
            >
              <Card title="Payment Distribution">
                <Pie {...pieConfig} height={350} />
              </Card>
            </Col>
          </Row>
          <Access permission={ALL_PERMISSIONS.USERS.CHART} hideChildren>
            <Row style={{ marginTop: 20 }}>
              <Col span={24}>
                <Card title="User Role Distribution">
                  <Column {...roleConfig} height={350} />
                </Card>
              </Col>
            </Row>
          </Access>
        </>
      )}
    </div>
  );
};

export default DashboardPage;
