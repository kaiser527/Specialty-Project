import { useGetAccount } from "@/hooks/useGetAccount";
import { useMessage } from "@/hooks/useMessage";
import { useLogoutMutation } from "@/redux/api/accountApi";
import { useAppDispatch } from "@/redux/hooks";
import { setLogoutAction } from "@/redux/slice/accountSlice";
import {
  BarChartOutlined,
  BarsOutlined,
  ContactsOutlined,
  LoginOutlined,
  LogoutOutlined,
  MenuFoldOutlined,
  SearchOutlined,
  ShoppingCartOutlined,
} from "@ant-design/icons";
import {
  Avatar,
  Drawer,
  Dropdown,
  Empty,
  Flex,
  Grid,
  Menu,
  Popover,
  Skeleton,
  Space,
} from "antd";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import styles from "@/styles/header.module.scss";
import logo from "assets/logo2.svg";
import { useNavigate } from "react-router-dom";
import ModelManageAccount from "./modal/modal.account";
import { useFetchCategoryQuery } from "@/redux/api/categoryApi";
import { skipToken } from "@reduxjs/toolkit/query";
import { useFetchCartQuery } from "@/redux/api/cartApi";
import {
  buildVariantName,
  formatCurrency,
  getFinalPrice,
} from "@/config/helpers/global";
import { useGetUnAuthenticateCart } from "@/hooks/useGetUnAuthenticateCart";
import { clearCart } from "@/redux/slice/cartSlice";
import { IVariant } from "@/types/backend";
import { useFetchVariantQuery } from "@/redux/api/productApi";
import { socket } from "@/config/constants/utils";
import FloatingChat from "./modal/modal.floating-chat";
import { useConversation } from "@/hooks/useConversation";

const { useBreakpoint } = Grid;

const Header = () => {
  const screens = useBreakpoint();

  const unAuthenticateCart = useGetUnAuthenticateCart();
  const { setConversationId } = useConversation();
  const { messageApi, notificationApi } = useMessage();

  const [categoryFilter, setCategoryFilter] = useState("");
  const [debouncedCategory, setDebouncedCategory] = useState(categoryFilter);
  const [searchValue, setSearchValue] = useState("");
  const [openMobileMenu, setOpenMobileMenu] = useState(false);
  const [openMangeAccount, setOpenManageAccount] = useState(false);
  const [suggestions, setSuggestions] = useState<IVariant[]>([]);
  const [openSuggest, setOpenSuggest] = useState(false);
  const [debouncedValue, setDebouncedValue] = useState(searchValue);

  const [logout] = useLogoutMutation();

  const { user, isAuthenticated } = useGetAccount();
  const { data: cart, isLoading: isLoadingCart } = useFetchCartQuery(
    !isAuthenticated ? skipToken : undefined,
    {
      refetchOnMountOrArgChange: true,
    }
  );
  const { data: searchData, isLoading: isSearching } = useFetchVariantQuery(
    `current=1&pageSize=50&search=${debouncedValue}`,
    {
      skip: !debouncedValue.trim(),
    }
  );
  const { data: category, isLoading: isLoadingCategory } =
    useFetchCategoryQuery(
      `current=1&pageSize=100${
        debouncedCategory ? `&name=${debouncedCategory}` : ""
      }`
    );

  const skeletonItems = Array.from({ length: 6 }).flatMap((_, index, arr) => {
    const item = {
      key: `skeleton-${index}`,
      label: (
        <Skeleton active title={false} paragraph={{ rows: 1, width: "100%" }} />
      ),
    };

    if (index < arr.length - 1) {
      return [item, { type: "divider" as const }];
    }

    return [item];
  });

  const categoryItems = isLoadingCategory
    ? skeletonItems
    : category?.data?.result?.flatMap((c: any, index: number, arr: any[]) => {
        const item = {
          key: c.id,
          label: (
            <div
              onClick={() => navigate(`/filter?categoryId=${c.id}`)}
              style={{ cursor: "pointer" }}
            >
              {c.name}
            </div>
          ),
        };

        if (index < arr.length - 1) {
          return [item, { type: "divider" as const }];
        }

        return [item];
      }) || [];

  useEffect(() => {
    if (!debouncedValue.trim()) {
      setSuggestions([]);
      setOpenSuggest(false);
      return;
    }
    if (searchData?.data?.result?.length) {
      setSuggestions(searchData.data.result);
    } else {
      setSuggestions([]);
    }
    setOpenSuggest(true);
  }, [searchData, debouncedValue]);

  useEffect(() => {
    if (!searchValue.trim()) {
      setDebouncedValue("");
      return;
    }
    const timer = setTimeout(() => {
      setDebouncedValue(searchValue);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchValue]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedCategory(categoryFilter);
    }, 400);
    return () => clearTimeout(timer);
  }, [categoryFilter]);

  useEffect(() => {
    const handleClickOutside = (e: any) => {
      if (
        !e.target.closest(`.${styles["search-box"]}`) &&
        !e.target.closest(`.${styles["mobile-search-bar"]}`)
      ) {
        setOpenSuggest(false);
      }
    };
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  const navigate = useNavigate();
  const dispatch = useAppDispatch();

  const handleLogout = async () => {
    const res = await logout().unwrap();
    if (res?.data) {
      socket.disconnect();
      messageApi.success("Logout successfully!");
      dispatch(setLogoutAction());
      dispatch(clearCart());
      setConversationId(null);
      socket.connect();
      navigate("/");
    } else {
      notificationApi.error({
        message: "Error occurred",
        description: res.message,
        duration: 5,
      });
    }
  };

  const cartItems = isAuthenticated
    ? cart?.data?.items ?? []
    : unAuthenticateCart ?? [];

  const cartSkeleton = (
    <div className={styles["pop-cart-body"]}>
      <div className={styles["pop-cart-content"]}>
        {Array.from({ length: 3 }).map((_, index) => (
          <div className={styles["book"]} key={`skeleton-cart-${index}`}>
            <Skeleton.Image style={{ width: 50, height: 50 }} active />
            <div style={{ width: screens.xs ? 150 : 300 }}>
              <Skeleton
                active
                title={false}
                paragraph={{ rows: 1, width: "100%" }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className={styles["pop-cart-footer"]}>
        <div></div>
        <Skeleton.Button active style={{ width: 120, height: 36 }} />
      </div>
    </div>
  );

  const contentPopover =
    isAuthenticated && isLoadingCart ? (
      cartSkeleton
    ) : (
      <div className={styles["pop-cart-body"]}>
        <div className={styles["pop-cart-content"]}>
          {cartItems.map((c, index) => {
            return (
              <div className={styles["book"]} key={`book-${index}`}>
                <div className={styles["img-wrapper"]}>
                  <img
                    src={`${import.meta.env.VITE_BACKEND_URL}/images/product/${
                      c?.variant.images[0]
                    }`}
                  />
                  <span className={styles["quantity-badge"]}>{c.quantity}</span>
                </div>
                <div
                  style={{
                    whiteSpace: "nowrap",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    width: screens.xs ? 150 : 300,
                  }}
                >
                  {buildVariantName(c.variant)}
                </div>
                <div className={styles["price"]}>
                  {formatCurrency(getFinalPrice(c.variant))}
                </div>
              </div>
            );
          })}
        </div>
        {cartItems.length > 0 ? (
          <div className={styles["pop-cart-footer"]}>
            <div></div>
            <button onClick={() => navigate("/cart")}>View cart</button>
          </div>
        ) : (
          <Empty description="Cart is empty" />
        )}
      </div>
    );

  const itemsDropdown = [
    isAuthenticated &&
      ({
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
      } as any),
    {
      label: isAuthenticated ? (
        <span style={{ cursor: "pointer" }} onClick={handleLogout}>
          Logout
        </span>
      ) : (
        <span style={{ cursor: "pointer" }} onClick={() => navigate("/login")}>
          Login
        </span>
      ),
      key: "logout",
      icon: isAuthenticated ? <LogoutOutlined /> : <LoginOutlined />,
    },
  ];

  if (isAuthenticated && user?.role?.name !== "USER") {
    itemsDropdown.unshift({
      label: (
        <Link to={"/admin"}>
          {user?.role?.name
            ?.toLowerCase()
            ?.replace(/^\w/, (c) => c.toUpperCase())}{" "}
          dashboard
        </Link>
      ),
      key: "admin",
      icon: <BarChartOutlined />,
    });
  }

  const itemsMobiles = [...itemsDropdown];

  const urlAvatar = `${import.meta.env.VITE_BACKEND_URL}/images/user/${
    user?.image ?? "user.png"
  }`;

  const categoryRender = () => (
    <div
      style={{
        background: "#fff",
        borderRadius: 8,
        padding: 8,
        boxSizing: "border-box",
        boxShadow: "0 6px 16px rgba(0,0,0,0.12)",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          border: "1px solid #f0f0f0",
          borderRadius: 6,
          padding: "0 8px",
          marginBottom: 8,
          transition: "all 0.2s ease",
        }}
      >
        <SearchOutlined style={{ color: "#999", fontSize: 14 }} />
        <input
          placeholder="Search category..."
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            padding: "6px 8px",
          }}
        />
      </div>
      {categoryItems.length > 0 ? (
        <Menu items={categoryItems} style={{ border: "none" }} />
      ) : (
        <Empty
          description="No category found"
          image={Empty.PRESENTED_IMAGE_SIMPLE}
          style={{ margin: "12px 0" }}
        />
      )}
    </div>
  );

  const suggestSearch = (
    <>
      <div className={styles["suggest-list"]}>
        {suggestions.map((variant, index) => (
          <div
            key={variant.id || index}
            className={styles["suggest-item"]}
            onClick={() => {
              navigate(`/product/${variant.id}`);
              setSearchValue("");
              setDebouncedValue("");
              setSuggestions([]);
              setOpenSuggest(false);
            }}
          >
            <img
              src={`${import.meta.env.VITE_BACKEND_URL}/images/product/${
                variant.images[0]
              }`}
              className={styles["suggest-img"]}
            />
            <div className={styles["suggest-info"]}>
              <div className={styles["suggest-name"]}>
                {buildVariantName(variant)}
              </div>
              <div className={styles["suggest-price"]}>
                {formatCurrency(getFinalPrice(variant))}
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className={styles["suggest-count"]}>
        {suggestions.length} product
        {suggestions.length > 1 ? "s" : ""} found
      </div>
    </>
  );

  return (
    <>
      <div className={styles["header-section"]}>
        <div className={styles["header-mobile"]}>
          <Dropdown
            trigger={["click"]}
            placement="bottomLeft"
            dropdownRender={categoryRender}
          >
            <BarsOutlined className={styles["menu-icon"]} />
          </Dropdown>
          <div className={styles["mobile-search-bar"]}>
            <SearchOutlined
              className={styles["search-icon"]}
              onClick={() => {
                if (debouncedValue.trim())
                  navigate(`/filter?search=${debouncedValue}`);
              }}
            />
            <input
              placeholder="Search products..."
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onFocus={() => {
                if (debouncedValue.trim()) setOpenSuggest(true);
              }}
            />
            {openSuggest && screens.xs && (
              <div className={styles["search-suggest"]}>
                {isSearching ? (
                  <Skeleton active paragraph={{ rows: 2 }} />
                ) : suggestions.length > 0 ? (
                  suggestSearch
                ) : (
                  <Empty description="No products found" />
                )}
              </div>
            )}
          </div>
          <div className={styles["header-group"]}>
            <Popover
              className={styles["popover-carts"]}
              placement="bottomLeft"
              rootClassName={styles["popover-carts"]}
              title={"Your cart"}
              content={contentPopover}
              trigger={"click"}
              arrow={true}
            >
              <div className={styles["cart-icon"]}>
                <ShoppingCartOutlined />
                <span className={styles["cart-badge"]}>
                  {cartItems.length ?? 0}
                </span>
              </div>
            </Popover>
            {isAuthenticated ? (
              <Avatar
                size={"large"}
                style={{ cursor: "pointer" }}
                src={urlAvatar}
                onClick={() => setOpenMobileMenu(true)}
              />
            ) : (
              <MenuFoldOutlined
                style={{ color: "#ff9f1a" }}
                onClick={() => setOpenMobileMenu(true)}
              />
            )}
          </div>
        </div>
        <div className={styles["header-window"]} style={{ display: "flex" }}>
          <div className={styles["brand"]}>
            <img
              onClick={() => navigate("/")}
              style={{ cursor: "pointer" }}
              src={logo}
            />
          </div>
          <div className={styles["top-menu"]}>
            <div className={styles["middle"]}>
              <div className={styles["category"]}>
                <Dropdown
                  trigger={["hover"]}
                  placement="bottomLeft"
                  dropdownRender={categoryRender}
                >
                  <span className={styles["category-btn"]}>
                    <BarsOutlined style={{ fontSize: 18 }} />
                    {screens.lg && "PRODUCT "} CATEGORY
                  </span>
                </Dropdown>
              </div>
              <div
                className={styles["search-box"]}
                onClick={(e) => e.stopPropagation()}
              >
                <input
                  type="text"
                  placeholder="Search anything..."
                  className={styles["search-input"]}
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onFocus={() => {
                    if (debouncedValue.trim()) setOpenSuggest(true);
                  }}
                />
                <button
                  className={styles["search-btn"]}
                  onClick={() => {
                    if (debouncedValue.trim())
                      navigate(`/filter?search=${debouncedValue}`);
                  }}
                >
                  <SearchOutlined />
                </button>
                {openSuggest && !screens.xs && (
                  <div className={styles["search-suggest"]}>
                    {isSearching ? (
                      <div className={styles["suggest-loading"]}>
                        <Skeleton active paragraph={{ rows: 2 }} />
                      </div>
                    ) : suggestions.length > 0 ? (
                      suggestSearch
                    ) : (
                      <div className={styles["suggest-empty"]}>
                        <Empty description="No products found" />
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
            <div className={styles["extra"]}>
              <Popover
                className={styles["popover-carts"]}
                placement="topRight"
                rootClassName={styles["popover-carts"]}
                title={"Your cart"}
                trigger="hover"
                content={contentPopover}
                arrow={true}
              >
                <div className={styles["cart-icon"]}>
                  <ShoppingCartOutlined className={styles["cart-icon-inner"]} />
                  <span className={styles["cart-badge"]}>
                    {cartItems.length ?? 0}
                  </span>
                </div>
              </Popover>
              {isAuthenticated === false ? (
                <Link to={"/login"} style={{ color: "#ff9f1a" }}>
                  <Flex align={"center"} gap={4}>
                    <LoginOutlined style={{ color: "#ff9f1a" }} /> Login
                  </Flex>
                </Link>
              ) : (
                <Dropdown menu={{ items: itemsDropdown }} trigger={["click"]}>
                  <Space style={{ cursor: "pointer" }}>
                    <span style={{ color: "#000" }}>{user?.name}</span>
                    <Avatar size={"large"} src={urlAvatar} />
                  </Space>
                </Dropdown>
              )}
            </div>
          </div>
        </div>
      </div>
      <Drawer
        width={"60vw"}
        title={"Function"}
        placement="right"
        onClose={() => setOpenMobileMenu(false)}
        open={openMobileMenu}
      >
        <Menu mode="vertical" items={itemsMobiles} />
      </Drawer>
      <ModelManageAccount
        setIsOpen={setOpenManageAccount}
        isOpen={openMangeAccount}
      />
      <FloatingChat />
    </>
  );
};

export default Header;
