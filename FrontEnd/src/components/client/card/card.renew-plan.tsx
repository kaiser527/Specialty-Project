import { PLANS } from "@/config/constants/utils";
import { formatCurrency } from "@/config/helpers/global";
import { useBackground } from "@/hooks/useBackground";
import { RenewPlan } from "@/types/frontend";
import { CheckCircleFilled, FireFilled } from "@ant-design/icons";
import { Badge, Button, Card, Col, Flex, Row, Tag, Typography } from "antd";
import styles from "styles/home.module.scss";

const { Title, Text } = Typography;

interface IProps {
  value?: RenewPlan;
  onChange?: (plan: RenewPlan) => void;
}

const RenewPlanCard = ({ value, onChange }: IProps) => {
  const { background } = useBackground();

  const isDark = background === "dark";

  return (
    <Row gutter={[20, 20]}>
      {PLANS.map((plan) => {
        const active = value?.id === plan.id;

        const monthly = plan.price / plan.months;

        const card = (
          <Card
            hoverable
            onClick={() => onChange?.(plan)}
            style={{
              height: "100%",
              borderRadius: 20,
              cursor: "pointer",
              border: active
                ? "2px solid #ff9f1c"
                : isDark
                ? "1px solid #3d3d3d"
                : "1px solid #f0f0f0",
              boxShadow: active
                ? "0 14px 32px rgba(255,159,28,.18)"
                : "0 4px 14px rgba(0,0,0,.05)",
              transform: active ? "translateY(-4px)" : undefined,
              transition: "all .25s ease",
              background: isDark ? "#1f1f1f" : "#fff",
            }}
            styles={{
              body: {
                height: "100%",
                padding: 24,
              },
            }}
          >
            <Flex
              vertical
              justify="space-between"
              style={{ height: "100%" }}
              gap={20}
            >
              <Flex vertical gap={14}>
                <Flex justify="space-between" align="center">
                  <Title
                    level={4}
                    style={{
                      margin: 0,
                    }}
                  >
                    {plan.months} Months
                  </Title>

                  {active && (
                    <Tag
                      color="orange"
                      icon={<CheckCircleFilled />}
                      style={{
                        borderRadius: 999,
                        fontWeight: 600,
                      }}
                    >
                      Selected
                    </Tag>
                  )}
                </Flex>

                <Flex align="end" gap={6}>
                  <Title
                    level={1}
                    style={{
                      margin: 0,
                      lineHeight: 1,
                    }}
                  >
                    {formatCurrency(plan.price)}
                  </Title>

                  <Text
                    type="secondary"
                    style={{
                      marginBottom: 6,
                    }}
                  >
                    / {plan.months} mo
                  </Text>
                </Flex>

                <Text
                  style={{
                    color: "#ff9f1c",
                    fontWeight: 600,
                    fontSize: 16,
                  }}
                >
                  {formatCurrency(monthly)} / month
                </Text>

                <Text type="secondary">{plan.description}</Text>

                <Flex vertical gap={8}>
                  {plan.features.map((feature) => (
                    <Text key={feature}>
                      <CheckCircleFilled
                        style={{
                          color: "#52c41a",
                          marginRight: 8,
                        }}
                      />
                      {feature}
                    </Text>
                  ))}
                </Flex>
              </Flex>

              <Button
                size="large"
                block
                type={isDark ? "default" : "primary"}
                className={
                  isDark ? styles.orangeButtonDark : styles.orangeButton
                }
                icon={active ? <CheckCircleFilled /> : undefined}
                style={{
                  height: 48,
                  borderRadius: 12,
                  fontWeight: 600,
                }}
              >
                {active ? "Current Plan" : "Choose Plan"}
              </Button>
            </Flex>
          </Card>
        );

        return (
          <Col xs={24} sm={12} lg={6} key={plan.id}>
            {plan.badge ? (
              <Badge.Ribbon
                text={
                  <Flex align="center" gap={4}>
                    <FireFilled />
                    {plan.badge}
                  </Flex>
                }
                color="#ff9f1c"
              >
                {card}
              </Badge.Ribbon>
            ) : (
              card
            )}
          </Col>
        );
      })}
    </Row>
  );
};

export default RenewPlanCard;
