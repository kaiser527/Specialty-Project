import ExpiredVariantCard from "@/components/client/card/card.expired-variant";
import RenewPlanCard from "@/components/client/card/card.renew-plan";
import { useGetAccount } from "@/hooks/useGetAccount";
import { useFindAllVariantsByIdsQuery } from "@/redux/api/productApi";
import { RenewPlan } from "@/types/frontend";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Card, Space, Typography } from "antd";
import { ReloadOutlined } from "@ant-design/icons";
import PlanSummaryCard from "@/components/client/card/card.plan-summary";

const { Title, Text } = Typography;

const RenewProductPage = () => {
  const navigate = useNavigate();

  const location = useLocation();
  const variantIds: string[] = location?.state?.variantIds ?? [];

  const { data, isLoading } = useFindAllVariantsByIdsQuery({ variantIds });

  const { user } = useGetAccount();

  const [plan, setPlan] = useState<RenewPlan>();
  const [selectedIds, setSelectedIds] = useState<string[]>(variantIds);

  useEffect(() => {
    if (user.role.name !== "PROVIDER") {
      navigate("/");
    }
  }, []);

  return (
    <div>
      <Card
        style={{
          marginBottom: 20,
          borderRadius: 16,
        }}
      >
        <Space direction="vertical" size={4}>
          <Title level={2} style={{ margin: 0 }}>
            <ReloadOutlined style={{ marginRight: 10, color: "#ff9f1c" }} />
            Renew Product Variants
          </Title>

          <Text type="secondary">
            Select the expired variants you want to renew, then choose a
            subscription plan to extend their availability in your store.
          </Text>
        </Space>
      </Card>
      <ExpiredVariantCard
        selectedIds={selectedIds}
        setSelectedIds={setSelectedIds}
        isLoading={isLoading}
        data={data?.data?.result ?? []}
      />
      <div style={{ margin: "20px 0" }}>
        <RenewPlanCard value={plan} onChange={setPlan} />
      </div>
      <div style={{ margin: "20px 0" }}>
        <PlanSummaryCard
          setSelectedIds={setSelectedIds}
          selectedIds={selectedIds}
          plan={plan}
          setPlan={setPlan}
        />
      </div>
    </div>
  );
};

export default RenewProductPage;
