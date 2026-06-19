import {
  buildVariantName,
  formatCurrency,
  getFinalPrice,
} from "@/config/helpers/global";
import { useGetAccount } from "@/hooks/useGetAccount";
import { useMessage } from "@/hooks/useMessage";
import { useUpsertUserCartMutation } from "@/redux/api/cartApi";
import { useAppDispatch } from "@/redux/hooks";
import { addToCart } from "@/redux/slice/cartSlice";
import { ICartItem, IVariant } from "@/types/backend";
import { Cart } from "@/types/frontend";
import { DeleteOutlined, MinusOutlined, PlusOutlined } from "@ant-design/icons";
import { Col, Grid, Image, Popover, Row, Typography } from "antd";
import { useState } from "react";
import styles from "styles/cart.module.scss";

const { Text } = Typography;

const { useBreakpoint } = Grid;

interface IProps {
  cartItem: ICartItem | Cart;
}

const CartItemCard = ({ cartItem }: IProps) => {
  const screens = useBreakpoint();
  const dispatch = useAppDispatch();

  const { notificationApi } = useMessage();
  const { isAuthenticated } = useGetAccount();

  const [upsert] = useUpsertUserCartMutation();

  const [tempQty, setTempQty] = useState<Record<string, number | "">>({});

  const handleChangeCartItemQuantity = async (
    variant: IVariant | undefined,
    newQuantity: number
  ) => {
    if (!variant?.id) return;
    if (isAuthenticated) {
      const res = await upsert({
        variantId: variant.id,
        quantity: newQuantity,
      }).unwrap();
      if (!res.data) {
        notificationApi.error({
          message: "Failed to update cart",
          description: res.message,
          duration: 3,
        });
      }
    } else {
      dispatch(addToCart({ ...variant, quantity: newQuantity }));
    }
  };

  return (
    <div className={styles["cart-item"]}>
      <Row align="middle" gutter={16}>
        <Col lg={2}>
          {screens.xs ? (
            <Popover
              placement="bottomRight"
              title={"Product name"}
              content={<Text>{buildVariantName(cartItem.variant)}</Text>}
              trigger={"click"}
              arrow={true}
            >
              <Image
                src={`${import.meta.env.VITE_BACKEND_URL}/images/product/${
                  cartItem?.variant.images[0]
                }`}
                width={50}
                height={50}
                style={{ objectFit: "cover", borderRadius: 8 }}
                preview={false}
              />
            </Popover>
          ) : (
            <Image
              src={`${import.meta.env.VITE_BACKEND_URL}/images/product/${
                cartItem?.variant.images[0]
              }`}
              width={screens.lg ? 75 : 65}
              height={screens.lg ? 75 : 65}
              style={{ objectFit: "cover", borderRadius: 8 }}
              preview={false}
            />
          )}
        </Col>
        <Col lg={10} sm={8} xs={0}>
          <div className={styles["variant-name"]}>
            {buildVariantName(cartItem.variant)}
          </div>
        </Col>
        <Col lg={4} sm={4} xs={5}>
          <div className={styles["variant-price"]}>
            {formatCurrency(getFinalPrice(cartItem.variant))}
          </div>
        </Col>
        <Col lg={4} sm={5} xs={7}>
          <div className={styles["qty-wrapper"]}>
            <button
              className={styles["qty-btn"]}
              onClick={() => handleChangeCartItemQuantity(cartItem.variant, 1)}
            >
              <PlusOutlined />
            </button>
            <input
              className={styles["qty-input"]}
              value={
                tempQty[cartItem.variant.id!] !== undefined
                  ? tempQty[cartItem.variant.id!]
                  : cartItem.quantity
              }
              onChange={(e) => {
                const value = e.target.value;
                if (value === "") {
                  setTempQty((prev) => ({
                    ...prev,
                    [cartItem.variant.id!]: "",
                  }));
                  return;
                }
                if (!/^\d+$/.test(value)) return;
                setTempQty((prev) => ({
                  ...prev,
                  [cartItem.variant.id!]: Number(value),
                }));
              }}
              onFocus={(e) => e.target.select()}
              onBlur={() => {
                const key = cartItem.variant.id!;
                const newVal = tempQty[key];
                if (newVal === "" || newVal === undefined) {
                  setTempQty((prev) => {
                    const newState = { ...prev };
                    delete newState[key];
                    return newState;
                  });
                  return;
                }
                const delta = newVal - cartItem.quantity;
                if (delta !== 0) {
                  handleChangeCartItemQuantity(cartItem.variant, delta);
                }
                setTempQty((prev) => {
                  const newState = { ...prev };
                  delete newState[key];
                  return newState;
                });
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.currentTarget.blur();
                }
              }}
            />
            <button
              className={styles["qty-btn"]}
              onClick={() => handleChangeCartItemQuantity(cartItem.variant, -1)}
            >
              <MinusOutlined />
            </button>
          </div>
        </Col>
        <Col lg={3} sm={3} xs={5}>
          <div style={{ color: "#ff4d2d" }} className={styles["variant-price"]}>
            {formatCurrency(
              getFinalPrice(cartItem.variant) * cartItem.quantity
            )}
          </div>
        </Col>
        <Col lg={1} sm={1} xs={2}>
          <DeleteOutlined
            className={styles["delete-icon"]}
            onClick={() =>
              handleChangeCartItemQuantity(cartItem.variant, -cartItem.quantity)
            }
          />
        </Col>
      </Row>
    </div>
  );
};

export default CartItemCard;
