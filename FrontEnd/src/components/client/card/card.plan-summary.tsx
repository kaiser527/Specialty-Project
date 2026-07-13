import { DARKTHEME } from "@/config/constants/utils";
import { formatCurrency, FORMATE_DATE } from "@/config/helpers/global";
import { useBackground } from "@/hooks/useBackground";
import { useMessage } from "@/hooks/useMessage";
import {
  useCreateRenewStripeUrlMutation,
  useCreateRenewVNPayUrlMutation,
} from "@/redux/api/paymentApi";
import { RenewPlan } from "@/types/frontend";
import {
  BankOutlined,
  CheckCircleFilled,
  CreditCardOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import { Badge, Button, Card, Flex, Grid, Space, Typography } from "antd";
import dayjs from "dayjs";
import React, { useState } from "react";
import styles from "styles/home.module.scss";

const { Text, Title } = Typography;
const { useBreakpoint } = Grid;

interface IProps {
  plan: RenewPlan | undefined;
  selectedIds: string[];
  setSelectedIds: React.Dispatch<React.SetStateAction<string[]>>;
  setPlan: React.Dispatch<React.SetStateAction<RenewPlan | undefined>>;
}

const PlanSummaryCard = ({
  setSelectedIds,
  setPlan,
  selectedIds,
  plan,
}: IProps) => {
  const screen = useBreakpoint();

  const { notificationApi } = useMessage();

  const { background } = useBackground();
  const isDark = background === "dark";

  const [paymentMethod, setPaymentMethod] = useState<"vnpay" | "stripe">(
    "vnpay"
  );

  const [createVnpay, { isLoading: isLoadingVnpay }] =
    useCreateRenewVNPayUrlMutation();
  const [createStripe, { isLoading: isLoadingStripe }] =
    useCreateRenewStripeUrlMutation();

  const handleRenew = async () => {
    if (!plan) return;

    const dueDateMap: Record<3 | 6 | 12 | 24, string> = {
      3: dayjs().add(3, "month").format(FORMATE_DATE),
      6: dayjs().add(6, "month").format(FORMATE_DATE),
      12: dayjs().add(12, "month").format(FORMATE_DATE),
      24: dayjs().add(24, "month").format(FORMATE_DATE),
    };

    const dueDate = dueDateMap[plan!.months as 3 | 6 | 12 | 24];

    if (paymentMethod === "vnpay") {
      const res = await createVnpay({
        planId: plan.id,
        dueDate,
        variantIds: selectedIds,
      }).unwrap();
      if (res?.data) {
        window.location.href = res.data.paymentUrl;
        setSelectedIds([]);
        setPlan(undefined);
      } else {
        notificationApi.error({
          message: "Error occurred",
          description: res.message,
          duration: 5,
        });
      }
    }

    if (paymentMethod === "stripe") {
      const res = await createStripe({
        planId: plan.id,
        dueDate,
        variantIds: selectedIds,
      }).unwrap();
      if (res?.data) {
        window.location.href = res.data.paymentUrl;
        setSelectedIds([]);
        setPlan(undefined);
      } else {
        notificationApi.error({
          message: "Error occurred",
          description: res.message,
          duration: 5,
        });
      }
    }
  };

  return (
    <Card
      style={{
        marginTop: 24,
        borderRadius: 20,
        border: plan ? "2px solid #ff9f1c" : undefined,
        boxShadow: plan
          ? "0 12px 30px rgba(255,159,28,.12)"
          : "0 4px 12px rgba(0,0,0,.05)",
      }}
      styles={{
        body: {
          padding: 24,
        },
      }}
    >
      <Flex justify="space-between" align="center" wrap="wrap" gap={20}>
        <Space align="start" size={18}>
          <ShoppingCartOutlined
            style={{
              fontSize: 30,
              color: "#ff9f1c",
            }}
          />

          <Flex align="center" gap={22}>
            <Space direction="vertical" size={2}>
              <Text type="secondary">Renewal Summary</Text>

              <Title level={3} style={{ margin: 0 }}>
                {plan ? `${plan.months} Months` : "No plan selected"}
              </Title>

              <Text type="secondary">
                {selectedIds.length} variant
                {selectedIds.length !== 1 ? "s" : ""} selected
              </Text>
            </Space>
            <Badge
              color="#ff9f1c"
              text={
                <Text
                  strong
                  style={{
                    fontSize: 22,
                    color: isDark ? "#fff" : undefined,
                  }}
                >
                  {plan ? formatCurrency(plan.price) : "Choose a plan"}
                </Text>
              }
            />
          </Flex>
        </Space>
        <Space>
          <Flex style={{ marginRight: 5 }} gap={12} wrap="wrap">
            {[
              {
                key: "vnpay",
                title: "VNPay",
                icon: <BankOutlined />,
              },
              {
                key: "stripe",
                title: "Stripe",
                icon: <CreditCardOutlined />,
              },
            ].map((item) => {
              const active = paymentMethod === item.key;

              return (
                <Card
                  key={item.key}
                  onClick={() =>
                    setPaymentMethod(item.key as "vnpay" | "stripe")
                  }
                  style={{
                    width: 100,
                    cursor: "pointer",
                    borderRadius: 12,
                    border: active
                      ? "2px solid #ff9f1c"
                      : `1px solid ${
                          background === "light" ? " #d9d9d9" : DARKTHEME.border
                        }`,
                    boxShadow: active
                      ? "0 6px 16px rgba(255,159,28,.15)"
                      : undefined,
                  }}
                  styles={{ body: { padding: 12 } }}
                >
                  <div style={{ position: "relative" }}>
                    {active && (
                      <CheckCircleFilled
                        style={{
                          position: "absolute",
                          top: 0,
                          right: 0,
                          color: "#ff9f1c",
                          fontSize: 16,
                        }}
                      />
                    )}

                    <Flex vertical align="center" gap={4}>
                      <div style={{ fontSize: 24 }}>{item.icon}</div>
                      <Text strong style={{ fontSize: 13 }}>
                        {item.title}
                      </Text>
                    </Flex>
                  </div>
                </Card>
              );
            })}
          </Flex>
          <Button
            type={isDark ? "default" : "primary"}
            size="large"
            loading={isLoadingVnpay || isLoadingStripe}
            className={isDark ? styles.orangeButtonDark : styles.orangeButton}
            icon={<CheckCircleFilled />}
            disabled={!plan || selectedIds.length === 0}
            style={{
              height: 48,
              minWidth: screen.xs ? "100%" : 180,
              borderRadius: 12,
              fontWeight: 600,
            }}
            onClick={handleRenew}
          >
            Renew Now
          </Button>
        </Space>
      </Flex>
    </Card>
  );
};

export default PlanSummaryCard;
