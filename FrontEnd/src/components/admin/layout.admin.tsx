import React, { useState, useEffect } from "react";
import {
  AppstoreOutlined,
  ExceptionOutlined,
  ApiOutlined,
  UserOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BugOutlined,
  ContactsOutlined,
  HomeOutlined,
  LogoutOutlined,
  ProductOutlined,
  TagOutlined,
  FileOutlined,
  OrderedListOutlined,
  CustomerServiceOutlined,
  CreditCardOutlined,
} from "@ant-design/icons";
import { Layout, Menu, Dropdown, Space, Avatar, Button, Grid } from "antd";
import { Outlet, useLocation, useNavigate } from "react-router-dom";
import { Link } from "react-router-dom";
import { useAppDispatch } from "@/redux/hooks";
import type { MenuProps } from "antd";
import { IPermission } from "@/types/backend";
import { useGetAccount } from "@/hooks/useGetAccount";
import { ALL_PERMISSIONS } from "@/config/constants/permissions";
import { useLogoutMutation } from "@/redux/api/accountApi";
import { useMessage } from "@/hooks/useMessage";
import { setLogoutAction } from "@/redux/slice/accountSlice";
import ModelManageAccount from "../client/modal/modal.account";
import { clearCart } from "@/redux/slice/cartSlice";
import { socket } from "@/config/constants/utils";
import { useConversation } from "@/hooks/useConversation";

const { Content, Sider } = Layout;
const { useBreakpoint } = Grid;

const LayoutAdmin = () => {
  const screens = useBreakpoint();

  const [logout] = useLogoutMutation();

  const location = useLocation();

  const [openMangeAccount, setOpenManageAccount] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [menuItems, setMenuItems] = useState<MenuProps["items"]>([]);
  const [activeMenu, setActiveMenu] = useState(location.pathname);

  const { messageApi, notificationApi } = useMessage();
  const { setConversationId } = useConversation();
  const { user } = useGetAccount();

  const permissions: IPermission[] = user.permissions;

  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  useEffect(() => {
    if (permissions?.length) {
      const viewUser = permissions.find(
        (item) =>
          item.apiPath === ALL_PERMISSIONS.USERS.GET_PAGINATE.apiPath &&
          item.method === ALL_PERMISSIONS.USERS.GET_PAGINATE.method
      );

      const viewRole = permissions.find(
        (item) =>
          item.apiPath === ALL_PERMISSIONS.ROLES.GET_PAGINATE.apiPath &&
          item.method === ALL_PERMISSIONS.ROLES.GET_PAGINATE.method
      );

      const viewPermission = permissions.find(
        (item) =>
          item.apiPath === ALL_PERMISSIONS.PERMISSIONS.GET_PAGINATE.apiPath &&
          item.method === ALL_PERMISSIONS.PERMISSIONS.GET_PAGINATE.method
      );

      const viewProduct = permissions.find(
        (item) =>
          item.apiPath === ALL_PERMISSIONS.PRODUCTS.GET_PAGINATE.apiPath &&
          item.method === ALL_PERMISSIONS.PRODUCTS.GET_PAGINATE.method
      );

      const viewCategory = permissions.find(
        (item) =>
          item.apiPath === ALL_PERMISSIONS.CATEGORIES.GET_PAGINATE.apiPath &&
          item.method === ALL_PERMISSIONS.CATEGORIES.GET_PAGINATE.method
      );

      const viewOrder = permissions.find(
        (item) =>
          item.apiPath === ALL_PERMISSIONS.ORDERS.GET_PAGINATE.apiPath &&
          item.method === ALL_PERMISSIONS.ORDERS.GET_PAGINATE.method
      );

      const viewProviderFee = permissions.find(
        (item) =>
          item.apiPath === ALL_PERMISSIONS.PROVIDERS.GET_FEE_PAGINATE.apiPath &&
          item.method === ALL_PERMISSIONS.PROVIDERS.GET_FEE_PAGINATE.method
      );

      const viewProviderOrder = permissions.find(
        (item) =>
          item.apiPath ===
            ALL_PERMISSIONS.PROVIDERS.GET_ORDER_PAGINATE.apiPath &&
          item.method === ALL_PERMISSIONS.PROVIDERS.GET_ORDER_PAGINATE.method
      );

      const viewVoucher = permissions.find(
        (item) =>
          item.apiPath === ALL_PERMISSIONS.VOUCHERS.GET_PAGINATE.apiPath &&
          item.method === ALL_PERMISSIONS.VOUCHERS.GET_PAGINATE.method
      );

      const full = [
        {
          label: <Link to="/admin">Dashboard</Link>,
          key: "/admin",
          icon: <AppstoreOutlined />,
        },

        ...(viewUser
          ? [
              {
                label: <Link to="/admin/user">User</Link>,
                key: "/admin/user",
                icon: <UserOutlined />,
              },
            ]
          : []),

        ...(viewPermission
          ? [
              {
                label: <Link to="/admin/permission">Permission</Link>,
                key: "/admin/permission",
                icon: <ApiOutlined />,
              },
            ]
          : []),

        ...(viewRole
          ? [
              {
                label: <Link to="/admin/role">Role</Link>,
                key: "/admin/role",
                icon: <ExceptionOutlined />,
              },
            ]
          : []),

        ...(viewProduct
          ? [
              {
                label: <Link to="/admin/product">Product</Link>,
                key: "/admin/product",
                icon: <ProductOutlined />,
              },
            ]
          : []),

        ...(viewCategory
          ? [
              {
                label: <Link to="/admin/category">Category</Link>,
                key: "/admin/category",
                icon: <TagOutlined />,
              },
            ]
          : []),

        ...(viewOrder
          ? [
              {
                label: <Link to="/admin/order">Order</Link>,
                key: "/admin/order",
                icon: <FileOutlined />,
              },
            ]
          : []),

        ...(viewProviderFee
          ? [
              {
                label: "Provider",
                key: "provider",
                icon: <CustomerServiceOutlined />,
                children: [
                  {
                    label: <Link to={"/admin/provider-fee"}>Provider Fee</Link>,
                    key: "/admin/provider-fee",
                    icon: <CustomerServiceOutlined />,
                  },
                  ...(viewProviderOrder
                    ? [
                        {
                          label: (
                            <Link to={"/admin/provider-order"}>
                              Provider Order
                            </Link>
                          ),
                          key: "/admin/provider-order",
                          icon: <OrderedListOutlined />,
                        },
                      ]
                    : []),
                ],
              },
            ]
          : []),

        ...(viewVoucher
          ? [
              {
                label: <Link to="/admin/voucher">Voucher</Link>,
                key: "/admin/voucher",
                icon: <CreditCardOutlined />,
              },
            ]
          : []),
      ];

      setMenuItems(full);
    }
  }, [permissions]);

  useEffect(() => {
    setActiveMenu(location.pathname);
  }, [location]);

  const handleLogout = async () => {
    const res = await logout().unwrap();
    if (res?.data) {
      socket.disconnect();
      dispatch(setLogoutAction());
      dispatch(clearCart());
      setConversationId(null);
      socket.connect();
      messageApi.success("Logout successfully!");
      navigate("/");
    } else {
      notificationApi.error({
        message: "Error occurred",
        description: res.message,
        duration: 5,
      });
    }
  };

  const itemsDropdown = [
    {
      label: <Link to={"/"}>Home</Link>,
      key: "home",
      icon: <HomeOutlined />,
    },
    {
      label: (
        <label
          style={{ cursor: "pointer" }}
          onClick={() => setOpenManageAccount(true)}
        >
          Manage account
        </label>
      ),
      key: "manage-account",
      icon: <ContactsOutlined />,
    },
    {
      label: (
        <label style={{ cursor: "pointer" }} onClick={() => handleLogout()}>
          Logout
        </label>
      ),
      key: "logout",
      icon: <LogoutOutlined />,
    },
  ];

  const urlAvatar = `${import.meta.env.VITE_BACKEND_URL}/images/user/${
    user?.image
  }`;

  const AvatarDropdown = (
    <Dropdown menu={{ items: itemsDropdown }} trigger={["click"]}>
      <Space style={{ cursor: "pointer" }}>
        {screens.lg && `Welcome" ${user?.name}`}
        <Avatar size={45} src={urlAvatar} />
      </Space>
    </Dropdown>
  );

  return (
    <>
      <Layout style={{ minHeight: "100vh" }} className="layout-admin">
        {screens.lg ? (
          <Sider
            theme="light"
            collapsible
            collapsed={collapsed}
            onCollapse={(value) => setCollapsed(value)}
            style={
              screens.lg
                ? {
                    position: "fixed",
                    height: "100vh",
                    left: 0,
                    top: 0,
                  }
                : {}
            }
          >
            <div style={{ height: 32, margin: 16, textAlign: "center" }}>
              <BugOutlined /> ADMIN
            </div>
            <Menu
              selectedKeys={[activeMenu]}
              mode="inline"
              items={menuItems}
              onClick={(e) => setActiveMenu(e.key)}
            />
          </Sider>
        ) : (
          <>
            <Menu
              selectedKeys={[activeMenu]}
              items={menuItems}
              onClick={(e) => setActiveMenu(e.key)}
              mode="horizontal"
            />
            <div
              style={{
                position: "fixed",
                right: 12,
                bottom: 12,
                zIndex: 999,
              }}
            >
              {AvatarDropdown}
            </div>
          </>
        )}
        <Layout style={screens.lg ? { marginLeft: collapsed ? 80 : 200 } : {}}>
          {screens.lg && (
            <div
              className="admin-header"
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginRight: 20,
              }}
            >
              <Button
                type="text"
                icon={
                  collapsed
                    ? React.createElement(MenuUnfoldOutlined)
                    : React.createElement(MenuFoldOutlined)
                }
                onClick={() => setCollapsed(!collapsed)}
                style={{
                  fontSize: "16px",
                  width: 64,
                  height: 64,
                }}
              />
              {AvatarDropdown}
            </div>
          )}
          <Content style={{ padding: "15px" }}>
            <Outlet />
          </Content>
        </Layout>
      </Layout>
      <ModelManageAccount
        setIsOpen={setOpenManageAccount}
        isOpen={openMangeAccount}
      />
    </>
  );
};

export default LayoutAdmin;
