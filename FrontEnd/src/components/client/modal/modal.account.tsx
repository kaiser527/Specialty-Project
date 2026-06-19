import { Grid, Modal, Tabs, TabsProps } from "antd";
import UserProfileForm from "../form/form.user.profile";
import UserOrderTable from "../table/table.user-order";
import VoucherUsageTable from "../table/table.voucher-usage";
import { useGetAccount } from "@/hooks/useGetAccount";
import { ALL_PERMISSIONS } from "@/config/constants/permissions";

interface IProps {
  isOpen: boolean;
  setIsOpen: (v: boolean) => void;
}

const { useBreakpoint } = Grid;

const ModelManageAccount = ({ isOpen, setIsOpen }: IProps) => {
  const screens = useBreakpoint();
  const modalWidth = screens.lg ? 700 : screens.sm ? 500 : "100%";

  const { user } = useGetAccount();

  const isShowVoucher = user.permissions.some(
    ({ apiPath, method }) =>
      apiPath === ALL_PERMISSIONS.VOUCHERS.USAGE.apiPath &&
      method === ALL_PERMISSIONS.VOUCHERS.USAGE.method
  );

  const items: TabsProps["items"] = [
    {
      key: "user-profile",
      label: `Update profile`,
      children: <UserProfileForm />,
    },
    {
      key: "user-order",
      label: `Order`,
      children: <UserOrderTable />,
    },
    ...(isShowVoucher
      ? [
          {
            key: "user-voucher-usage",
            label: "Voucher Usage",
            children: <VoucherUsageTable />,
          },
        ]
      : []),
  ];

  return (
    <Modal
      title="Manage Account"
      open={isOpen}
      onCancel={() => setIsOpen(false)}
      footer={null}
      destroyOnClose
      maskClosable={false}
      width={modalWidth}
      centered
    >
      <Tabs defaultActiveKey="user-profile" items={items} />
    </Modal>
  );
};

export default ModelManageAccount;
