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
import { IVariant } from "@/types/backend";
import { ShoppingCartOutlined } from "@ant-design/icons";
import { Carousel, Grid, Popover, Tag } from "antd";
import styles from "styles/card.module.scss";
import CardPopover from "./card.popover";
import { useNavigate } from "react-router-dom";
import { MouseEvent } from "react";

interface IProps {
  variant: IVariant;
}

const { useBreakpoint } = Grid;

const ProductCard = ({ variant }: IProps) => {
  const [upsert] = useUpsertUserCartMutation();

  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const screens = useBreakpoint();

  const { isAuthenticated } = useGetAccount();
  const { notificationApi } = useMessage();

  const handleAddToCart = async (
    variantId: string | undefined,
    e: MouseEvent<HTMLDivElement, any>
  ) => {
    e.stopPropagation();
    if (!variantId) return;
    if (!isAuthenticated) {
      dispatch(addToCart({ ...variant, quantity: 1 }));
    } else {
      const res = await upsert({ variantId, quantity: 1 }).unwrap();
      if (!res?.data) {
        notificationApi.error({
          message: "Error occured",
          description: res.message,
          duration: 3,
        });
      }
    }
  };

  return (
    <div
      className={styles["card"]}
      onClick={() => navigate(`/product/${variant.id}`)}
    >
      <Popover
        content={<CardPopover variant={variant} />}
        placement={screens.lg ? "right" : "top"}
        trigger={screens.xs ? "click" : "hover"}
        mouseEnterDelay={0.2}
        mouseLeaveDelay={0.1}
      >
        <div>
          <Carousel
            autoplay
            autoplaySpeed={3000}
            dots
            draggable={false}
            swipe={false}
            pauseOnHover
            className={styles["image-slider"]}
          >
            {variant.images.map((img, index) => (
              <img
                key={index}
                src={`${
                  import.meta.env.VITE_BACKEND_URL
                }/images/product/${img}`}
                alt=""
                className={styles["card-image"]}
              />
            ))}
          </Carousel>
        </div>
      </Popover>
      <div className={styles["card-name"]}>{buildVariantName(variant)}</div>
      <div className={styles["card-footer"]}>
        <div className={styles["price-row"]}>
          <div className={styles["price-wrapper"]}>
            <span className={styles["card-price"]}>
              {formatCurrency(getFinalPrice(variant))}
            </span>
            <span
              className={styles["old-price"]}
              style={{
                visibility: variant.discount > 0 ? "visible" : "hidden",
              }}
            >
              {formatCurrency(variant.price)}
            </span>
          </div>
          <div
            className={styles["discount-badge"]}
            style={{ visibility: variant.discount > 0 ? "visible" : "hidden" }}
          >
            -{variant.discount}%
          </div>
        </div>
        <div className={styles["action-row"]}>
          {variant.stock > 0 && (
            <div
              className={styles["add-to-cart"]}
              onClick={(e) => handleAddToCart(variant.id, e)}
            >
              <div className={styles["cart-icon"]}>
                <ShoppingCartOutlined />
              </div>
              <span className={styles["cart-text"]}>Add to cart</span>
            </div>
          )}
          <div className={styles["stock-tag"]}>
            {variant.stock > 10 && <Tag color="green">Available</Tag>}
            {variant.stock > 0 && variant.stock <= 10 && (
              <Tag color="orange">Low Stock</Tag>
            )}
            {variant.stock === 0 && <Tag color="red">Out of Stock</Tag>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
