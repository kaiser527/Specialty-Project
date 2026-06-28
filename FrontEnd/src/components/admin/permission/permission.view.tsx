import { colorMethodGradient, FORMATE_DATE } from "@/config/helpers/global";
import { IPermission } from "@/types/backend";
import { Drawer, Row, Col, Typography, Divider } from "antd";
import dayjs from "dayjs";
import {
  MailOutlined,
  CalendarOutlined,
  HomeOutlined,
  IdcardOutlined,
  ApiOutlined,
  JavaOutlined,
} from "@ant-design/icons";
import InfoItem from "@/components/admin/extra/extra.info-item";
import styles from "styles/admin.module.scss";
import { useBackground } from "@/hooks/useBackground";
import { DARKTHEME, hideScrollbar } from "@/config/constants/utils";

const { Text, Title } = Typography;

interface IProps {
  onClose: (v: boolean) => void;
  open: boolean;
  dataInit: IPermission | null;
  setDataInit: (v: any) => void;
}

const ViewDetailPermission = (props: IProps) => {
  const { onClose, open, dataInit, setDataInit } = props;

  const { background } = useBackground();
  const isDark = background === "dark";

  const handleClose = () => {
    onClose(false);
    setDataInit(null);
  };

  return (
    <Drawer
      placement="right"
      onClose={handleClose}
      open={open}
      width={555}
      styles={{
        body: {
          ...hideScrollbar,
          padding: 0,
          background: isDark ? DARKTHEME.bgSecondary : "#f6f8fb",
        },
      }}
      className={styles["hide-scrollbar"]}
      maskClosable={false}
    >
      {/* Header */}
      <div
        style={{
          padding: 24,
          background: isDark
            ? `
                linear-gradient(
                  rgba(20,20,20,.82),
                  rgba(20,20,20,.82)
                ),
                ${colorMethodGradient(dataInit?.method ?? "GET")}
              `
            : colorMethodGradient(dataInit?.method ?? "GET"),
          color: "#fff",
        }}
      >
        <Title
          level={4}
          style={{
            margin: 0,
            color: isDark ? "#f5f5f5" : "#fff",
          }}
        >
          Permission Detail
        </Title>
        <Text style={{ color: "#e0e7ff" }}>
          View detailed information about this permission
        </Text>
      </div>

      {/* Content */}
      <div style={{ padding: 24 }}>
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <InfoItem
              icon={<IdcardOutlined />}
              label="Permission ID"
              value={dataInit?._id}
            />
          </Col>

          <Col span={12}>
            <InfoItem
              icon={<MailOutlined />}
              label="Name"
              value={dataInit?.name}
            />
          </Col>

          <Col span={12}>
            <InfoItem
              icon={<JavaOutlined />}
              label="Method"
              value={dataInit?.method}
            />
          </Col>

          <Col span={12}>
            <InfoItem
              icon={<HomeOutlined />}
              label="Module"
              value={dataInit?.module}
            />
          </Col>

          <Col span={24}>
            <InfoItem
              icon={<ApiOutlined />}
              label="API Path"
              value={dataInit?.apiPath}
            />
          </Col>
        </Row>

        <Divider />

        <Row gutter={[16, 16]}>
          <Col span={12}>
            <InfoItem
              icon={<CalendarOutlined />}
              label="Created At"
              value={
                dataInit?.createdAt
                  ? dayjs(dataInit.createdAt).format(FORMATE_DATE)
                  : "-"
              }
            />
          </Col>

          <Col span={12}>
            <InfoItem
              icon={<CalendarOutlined />}
              label="Updated At"
              value={
                dataInit?.updatedAt
                  ? dayjs(dataInit.updatedAt).format(FORMATE_DATE)
                  : "-"
              }
            />
          </Col>
        </Row>
      </div>
    </Drawer>
  );
};

export default ViewDetailPermission;
