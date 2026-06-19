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
import {
  CheckCircleFilled,
  MinusOutlined,
  PlusOutlined,
  ShareAltOutlined,
} from "@ant-design/icons";
import { Tag } from "antd";
import { useState } from "react";
import styles from "styles/product-detail.module.scss";

interface IProps {
  variant: IVariant;
}

const ProductInfo = ({ variant }: IProps) => {
  const [quantity, setQuantity] = useState(1);

  const [upsert] = useUpsertUserCartMutation();

  const { notificationApi } = useMessage();
  const { isAuthenticated } = useGetAccount();

  const dispatch = useAppDispatch();

  const handleAddToCart = async () => {
    if (!variant.id) return;
    if (isAuthenticated) {
      const res = await upsert({
        variantId: variant.id,
        quantity,
      }).unwrap();
      if (!res.data) {
        notificationApi.error({
          message: "Failed to update cart",
          description: res.message,
          duration: 3,
        });
      }
    } else {
      dispatch(addToCart({ ...variant, quantity }));
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (val === "") {
      setQuantity(0);
      return;
    }
    const num = parseInt(val, 10);
    if (!isNaN(num)) {
      setQuantity(num < 1 ? 1 : num);
    }
  };

  return (
    <div className={styles["productInfo"]}>
      <h2 className={styles["variantName"]}>{buildVariantName(variant)}</h2>
      <div className={styles["priceWrapper"]}>
        <div className={styles["priceBanner"]}>
          <div className={styles["mainPriceGroup"]}>
            <span className={styles["currentPrice"]}>
              {formatCurrency(getFinalPrice(variant))}
            </span>
            {variant?.discount > 0 && (
              <span className={styles["oldPrice"]}>
                {formatCurrency(variant?.price)}
              </span>
            )}
          </div>
          {variant?.discount > 0 && (
            <div className={styles["savings"]}>
              Save: {formatCurrency(variant?.price - getFinalPrice(variant))}
            </div>
          )}
        </div>
        <div className={styles["actionRow"]}>
          <Tag color="gold" className={styles["warrantyTag"]}>
            Warranty: 36 Months
          </Tag>
          <button className={styles["upgradeBtn"]}>
            <ShareAltOutlined /> UPGRADE CONSULTATION
          </button>
        </div>
      </div>
      <div className={styles["description"]}>
        <h3 className={styles["sectionTitle"]}>Product Specifications</h3>
        <ul className={styles["attributeList"]}>
          {variant &&
            Object.entries(variant.attributes).map(([key, value], index) => (
              <li key={index} className={styles["attributeItem"]}>
                <CheckCircleFilled className={styles["checkIcon"]} />
                <span className={styles["attrKey"]}>{key}:</span>
                <span className={styles["attrValue"]}>{value}</span>
              </li>
            ))}
        </ul>
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
        <p style={{ fontSize: 17, fontWeight: 700 }}>Quantity: </p>
        <div className={styles["qty-wrapper"]}>
          <button
            className={styles["qty-btn"]}
            onClick={() => setQuantity((prev) => prev + 1)}
          >
            <PlusOutlined />
          </button>
          <input
            value={quantity === 0 ? "" : quantity}
            onChange={handleInputChange}
            onBlur={() => {
              if (quantity < 1) {
                setQuantity(1);
              }
            }}
            className={styles["qty-input"]}
          />
          <button
            className={styles["qty-btn"]}
            onClick={() => setQuantity((prev) => (prev > 1 ? prev - 1 : 1))}
          >
            <MinusOutlined />
          </button>
        </div>
      </div>
      <button onClick={handleAddToCart} className={styles["addToCartBtn"]}>
        ADD TO CART
      </button>
    </div>
  );
};

export default ProductInfo;
