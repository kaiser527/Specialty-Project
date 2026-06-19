import { useMessage } from "@/hooks/useMessage";
import { useUpdateOrderStatusMutation } from "@/redux/api/orderApi";
import { IOrder } from "@/types/backend";
import { Button, Card, Grid, Select, Space } from "antd";
import { useEffect, useState } from "react";

const { useBreakpoint } = Grid;

interface IProps {
  order: IOrder;
}

const OrderActionCard = ({ order }: IProps) => {
  const screen = useBreakpoint();

  const { messageApi, notificationApi } = useMessage();

  const [selectedStatus, setSelectedStatus] = useState<string>("");

  const [update, { isLoading: updating }] = useUpdateOrderStatusMutation();

  useEffect(() => {
    if (order?.status) {
      setSelectedStatus(order.status);
    }
  }, [order?.status]);

  const handleUpdateStatus = async (status: string) => {
    if (!order.id) return;
    const res = await update({ id: order.id, status }).unwrap();
    if (res?.data) {
      messageApi.success(res.message);
    } else {
      notificationApi.error({
        message: "Error occured",
        description: res.message,
      });
    }
  };

  return (
    <Card size="small" style={{ borderRadius: 12 }}>
      <Space
        direction={screen.xs ? "vertical" : "horizontal"}
        style={{ width: "100%" }}
      >
        <Select
          value={selectedStatus}
          style={{
            width: screen.xs ? "100%" : 240,
          }}
          onChange={setSelectedStatus}
          options={[
            {
              label: "Pending",
              value: "PENDING",
            },
            {
              label: "Packaging",
              value: "PACKAGING",
            },
            {
              label: "Delivering",
              value: "DELIVERING",
            },
            {
              label: "Success",
              value: "SUCCESS",
            },
            {
              label: "Cancelled",
              value: "CANCELLED",
            },
            {
              label: "Failed",
              value: "FAILED",
            },
          ]}
        />

        <Button
          type="primary"
          loading={updating}
          disabled={selectedStatus === order.status}
          onClick={() => handleUpdateStatus(selectedStatus)}
        >
          Update Status
        </Button>
      </Space>
    </Card>
  );
};

export default OrderActionCard;
