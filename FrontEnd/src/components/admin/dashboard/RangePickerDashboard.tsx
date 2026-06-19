import { FORMATE_DATE } from "@/config/helpers/global";
import { Button, Col, DatePicker, Row, Segmented, Skeleton } from "antd";
import dayjs from "dayjs";

interface IProps {
  dateRange: [string, string] | null;
  setDateRange: (range: [string, string] | null) => void;
  minMax: { min: string; max: string } | null;
  isPageLoading: boolean;
  dashboardLoading: boolean;
  groupBy: "day" | "month";
  setGroupBy: (group: "day" | "month") => void;
  style?: React.CSSProperties;
}

const { RangePicker } = DatePicker;

const RangePickerDashboard = ({
  dashboardLoading,
  setDateRange,
  minMax,
  isPageLoading,
  dateRange,
  groupBy,
  style,
  setGroupBy,
}: IProps) => {
  const handleResetDate = () => {
    if (!minMax) return;

    const max = dayjs(minMax.max);
    const min = dayjs(minMax.min);

    if (groupBy === "month") {
      setDateRange([min.format(FORMATE_DATE), max.format(FORMATE_DATE)]);
    } else {
      const start = max.subtract(8, "day");
      setDateRange([start.format(FORMATE_DATE), max.format(FORMATE_DATE)]);
    }
  };

  return (
    <Row justify="space-between" align="middle" style={style}>
      <Col>
        <Segmented
          value={groupBy}
          onChange={(val) => setGroupBy(val as any)}
          options={[
            { label: "Day", value: "day" },
            { label: "Month", value: "month" },
          ]}
        />
      </Col>
      <Col>
        {isPageLoading ? (
          <Skeleton.Input active style={{ width: 260 }} />
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <RangePicker
              value={
                dateRange
                  ? [dayjs(dateRange[0]), dayjs(dateRange[1])]
                  : undefined
              }
              disabled={!minMax}
              disabledDate={(current) => {
                if (!minMax) return false;

                return (
                  current.isBefore(dayjs(minMax.min)) ||
                  current.isAfter(dayjs(minMax.max))
                );
              }}
              onChange={(dates) => {
                if (!dates) return;

                if (dashboardLoading) return;

                setDateRange([
                  (dates as any)[0].format(FORMATE_DATE),
                  (dates as any)[1].format(FORMATE_DATE),
                ]);
              }}
            />
            <Button onClick={handleResetDate}>Restore Default</Button>
          </div>
        )}
      </Col>
    </Row>
  );
};

export default RangePickerDashboard;
