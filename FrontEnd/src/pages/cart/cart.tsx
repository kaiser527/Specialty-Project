import PreviousPage from "@/components/share/previous-page";
import { formatCurrency, getFinalPrice } from "@/config/helpers/global";
import { useGetAccount } from "@/hooks/useGetAccount";
import { useGetUnAuthenticateCart } from "@/hooks/useGetUnAuthenticateCart";
import { useClearCartMutation, useFetchCartQuery } from "@/redux/api/cartApi";
import { skipToken } from "@reduxjs/toolkit/query";
import { Button, Col, Divider, Grid, Pagination, Row, Typography } from "antd";
import styles from "styles/cart.module.scss";
import { useAppDispatch } from "@/redux/hooks";
import { clearCart } from "@/redux/slice/cartSlice";
import { useMessage } from "@/hooks/useMessage";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import CartItemCard from "@/components/admin/order/order.cart-item";
import OrderInfoForm from "@/components/client/form/form.order-info";
import { ICart } from "@/types/backend";

const { Text } = Typography;

const breadcrumbItems = [
  {
    name: "Home page",
    link: "/",
  },
  {
    name: "Cart",
    link: "/cart",
  },
];

const pageSize = 5;

const { useBreakpoint } = Grid;

const CartPage = () => {
  const { isAuthenticated } = useGetAccount();
  const { notificationApi } = useMessage();

  const screens = useBreakpoint();
  const dispatch = useAppDispatch();

  const [clear] = useClearCartMutation();

  const [currentPage, setCurrentPage] = useState(1);

  const unAuthenticateCart = useGetUnAuthenticateCart();
  const { data: cart, refetch } = useFetchCartQuery(
    !isAuthenticated ? skipToken : undefined
  );
  const cartItems = isAuthenticated
    ? cart?.data?.items ?? []
    : unAuthenticateCart ?? [];
  const isEmptyCart = cartItems.length === 0;

  useEffect(() => {
    const maxPage = Math.ceil(cartItems.length / pageSize) || 1;
    if (currentPage > maxPage) {
      setCurrentPage(maxPage);
    }
  }, [cartItems.length, currentPage]);

  const paginatedItems = cartItems.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const totalPrice = cartItems.reduce((sum, item) => {
    return sum + getFinalPrice(item.variant) * item.quantity;
  }, 0);

  const handleClearCart = async () => {
    if (isAuthenticated) {
      const res = await clear().unwrap();
      if (!res.data) {
        notificationApi.error({
          message: "Failed to clear cart",
          description: res.message,
          duration: 3,
        });
      }
    } else {
      dispatch(clearCart());
    }
  };

  return (
    <div>
      <div style={{ marginBottom: 16 }}>
        <PreviousPage previousPages={breadcrumbItems} />
      </div>
      <Text style={{ fontSize: 16, color: "#007782", fontWeight: 700 }}>
        Cart
      </Text>
      <Text
        style={{
          float: "right",
          color: "#ff5636",
          fontWeight: 700,
          fontSize: 16,
          cursor: "pointer",
        }}
        onClick={handleClearCart}
      >
        Delete entire cart
      </Text>
      <Pagination
        current={currentPage}
        pageSize={pageSize}
        total={cartItems.length}
        onChange={setCurrentPage}
        style={{ textAlign: "right", marginBottom: 10 }}
      />
      {isEmptyCart && (
        <div className={styles["empty-cart"]}>
          <div className={styles["icon"]}>🛒</div>
          <div className={styles["title"]}>Your cart is empty</div>
          <div className={styles["desc"]}>Start adding some products</div>
          <Button className={styles["btn"]}>
            <Link to="/filter">Go shopping</Link>
          </Button>
        </div>
      )}
      {paginatedItems.map((c) => (
        <CartItemCard key={c.id} cartItem={c} />
      ))}
      <Divider />
      <Row justify="end" style={{ marginTop: -12 }}>
        <Col>
          <div style={{ textAlign: "right" }}>
            <Text
              style={{
                fontSize: screens.xs ? 16 : 18,
                fontWeight: 600,
                marginRight: 6,
              }}
            >
              Total price:
            </Text>
            <Text
              style={{
                fontSize: screens.xs ? 18 : 20,
                fontWeight: 700,
                color: "#e20505",
              }}
            >
              {formatCurrency(totalPrice)}
            </Text>
          </div>
        </Col>
      </Row>
      <div className={styles["order-info"]}>
        <OrderInfoForm
          cart={cart?.data as ICart}
          refetch={refetch}
          totalPrice={totalPrice}
        />
      </div>
    </div>
  );
};

export default CartPage;
