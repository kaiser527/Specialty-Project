import { colorMethodGradient, FORMATE_DATE } from "@/config/helpers/global";
import { ICategory } from "@/types/backend";
import { Col, Divider, Drawer, Row, Typography } from "antd";
import InfoItem from "../extra/extra.info-item";
import {
  BookOutlined,
  CalendarOutlined,
  IdcardOutlined,
  MailOutlined,
} from "@ant-design/icons";
import dayjs from "dayjs";

interface IProps {
  onClose: (v: boolean) => void;
  open: boolean;
  dataInit: ICategory | null;
  setDataInit: (v: any) => void;
}

const { Text, Title } = Typography;

const ViewDetailCategory = (props: IProps) => {
  const { onClose, open, dataInit, setDataInit } = props;

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
      styles={{ body: { padding: 0, background: "#f5f7fb" } }}
      maskClosable={false}
    >
      {/* Header */}
      <div
        style={{
          padding: 24,
          background: colorMethodGradient("GET"),
          color: "#fff",
        }}
      >
        <Title level={4} style={{ color: "#fff", margin: 0 }}>
          Category Detail
        </Title>
        <Text style={{ color: "#e0e7ff" }}>
          View detailed information about this category
        </Text>
      </div>
      <div style={{ padding: 24 }}>
        <Row gutter={[16, 16]}>
          <Col lg={12} md={12} sm={12} xs={24}>
            <InfoItem
              icon={<IdcardOutlined />}
              label="Category ID"
              value={dataInit?.id}
            />
          </Col>

          <Col lg={12} md={12} sm={12} xs={24}>
            <InfoItem
              icon={<MailOutlined />}
              label="Name"
              value={dataInit?.name}
            />
          </Col>

          <Col span={24}>
            <InfoItem
              icon={<BookOutlined />}
              label="Description"
              value={dataInit?.description}
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

export default ViewDetailCategory;
