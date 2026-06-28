import { IOrder } from "@/types/backend";
import {
  CarOutlined,
  CheckCircleOutlined,
  ClockCircleOutlined,
  CloseCircleOutlined,
  InboxOutlined,
  StopOutlined,
} from "@ant-design/icons";
import { Card, Steps } from "antd";

const ORDER_FLOW = ["PENDING", "PACKAGING", "DELIVERING", "SUCCESS"];

interface IProps {
  order: IOrder;
}

const OrderPorgressCard = ({ order }: IProps) => {
  const currentStep = ORDER_FLOW.indexOf(order?.status || "PENDING");

  const isCancelled = order?.status === "CANCELLED";
  const isFailed = order?.status === "FAILED";

  return (
    <Card title="📦 Order Progress" size="small" style={{ borderRadius: 12 }}>
      {isCancelled || isFailed ? (
        <Steps
          current={-1}
          responsive
          items={[
            {
              title: "Pending",
              icon: <ClockCircleOutlined />,
              disabled: true,
            },
            {
              title: "Packaging",
              icon: <InboxOutlined />,
              disabled: true,
            },
            {
              title: "Delivering",
              icon: <CarOutlined />,
              disabled: true,
            },
            {
              title: isCancelled ? "Cancelled" : "Failed",
              status: "error",
              icon: isCancelled ? <StopOutlined /> : <CloseCircleOutlined />,
            },
          ]}
        />
      ) : (
        <Steps
          current={currentStep}
          responsive
          items={[
            {
              title: "Pending",
              icon: <ClockCircleOutlined />,
            },
            {
              title: "Packaging",
              icon: <InboxOutlined />,
            },
            {
              title: "Delivering",
              icon: <CarOutlined />,
            },
            {
              title: "Success",
              icon: <CheckCircleOutlined />,
            },
          ]}
        />
      )}
    </Card>
  );
};

export default OrderPorgressCard;
