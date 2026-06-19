import { FORMATE_DATE } from "@/config/helpers/global";
import { IUser } from "@/types/backend";
import { Avatar, Drawer, Tag, Row, Col, Divider } from "antd";
import dayjs from "dayjs";
import {
  MailOutlined,
  UserOutlined,
  CalendarOutlined,
  HomeOutlined,
  IdcardOutlined,
} from "@ant-design/icons";
import { roleColors, roleGradients } from "@/config/constants/utils";
import InfoItem from "@/components/admin/extra/extra.info-item";

interface IProps {
  onClose: (v: boolean) => void;
  open: boolean;
  dataInit: IUser | null;
  setDataInit: (v: any) => void;
}

const ViewDetailUser = (props: IProps) => {
  const { onClose, open, dataInit, setDataInit } = props;

  const urlAvatar = `${import.meta.env.VITE_BACKEND_URL}/images/user/${
    dataInit?.image
  }`;

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
      styles={{ body: { padding: 0, background: "#f6f8fb" } }}
      maskClosable={false}
    >
      {/* Profile Header */}
      <div
        style={{
          padding: 32,
          textAlign: "center",
          background:
            roleGradients[dataInit?.role?.name ?? "USER"] ||
            "linear-gradient(135deg, #1677ff 0%, #69b1ff 100%)",
          color: "#fff",
        }}
      >
        <Avatar
          size={110}
          src={urlAvatar}
          icon={<UserOutlined />}
          style={{
            border: "4px solid #fff",
            boxShadow: "0 6px 20px rgba(0,0,0,0.2)",
          }}
        />

        <h2 style={{ marginTop: 16, marginBottom: 4 }}>{dataInit?.name}</h2>

        <Tag
          color={roleColors[dataInit?.role?.name as string] || "default"}
          style={{ fontSize: 13 }}
        >
          {dataInit?.role?.name}
        </Tag>
      </div>

      {/* Info Section */}
      <div style={{ padding: 24 }}>
        <Row gutter={[16, 16]}>
          <Col lg={12} md={12} sm={12} xs={24}>
            <InfoItem
              icon={<IdcardOutlined />}
              label="User ID"
              value={dataInit?._id}
            />
          </Col>

          <Col lg={12} md={12} sm={12} xs={24}>
            <InfoItem
              icon={<MailOutlined />}
              label="Email"
              value={dataInit?.email}
            />
          </Col>

          <Col span={12}>
            <InfoItem
              icon={<UserOutlined />}
              label="Gender"
              value={dataInit?.gender}
            />
          </Col>

          <Col span={12}>
            <InfoItem
              label="Age"
              value={dataInit?.age}
              icon={<UserOutlined />}
            />
          </Col>

          <Col span={24}>
            <InfoItem
              icon={<HomeOutlined />}
              label="Address"
              value={dataInit?.address}
            />
          </Col>

          <Divider />

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

export default ViewDetailUser;
