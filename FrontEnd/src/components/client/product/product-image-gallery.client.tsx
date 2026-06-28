import { DARKTHEME } from "@/config/constants/utils";
import { useBackground } from "@/hooks/useBackground";
import { LeftOutlined, RightOutlined } from "@ant-design/icons";
import { Carousel } from "antd";
import { CarouselRef } from "antd/es/carousel";
import { useRef, useState } from "react";
import styles from "styles/product-detail.module.scss";

interface IProps {
  images: string[];
}

const ProductImageGallery = ({ images }: IProps) => {
  const mainRef = useRef<CarouselRef>(null);
  const thumbRef = useRef<CarouselRef>(null);

  const [current, setCurrent] = useState(0);

  const { background } = useBackground();

  if (!images || images.length === 0) return null;

  const baseUrl = `${import.meta.env.VITE_BACKEND_URL}/images/product`;

  const handleChange = (index: number) => {
    setCurrent(index);
    thumbRef.current?.goTo(index);
  };

  const borderStyle =
    background === "dark" ? { border: `1px solid ${DARKTHEME.border}` } : {};

  return (
    <div className={styles["gallery"]}>
      <div style={borderStyle} className={styles["main"]}>
        <Carousel
          ref={mainRef}
          afterChange={handleChange}
          dots={false}
          draggable
        >
          {images.map((img, index) => (
            <div key={index} className={styles["mainImageContainer"]}>
              <img
                src={`${baseUrl}/${img}`}
                className={styles["mainImage"]}
                alt={`product-${index}`}
              />
            </div>
          ))}
        </Carousel>

        <button
          className={`${styles["prev"]} ${
            background === "dark" ? styles["prevDark"] : ""
          }`}
          onClick={() => mainRef.current?.prev()}
        >
          <LeftOutlined />
        </button>

        <button
          className={`${styles["next"]} ${
            background === "dark" ? styles["nextDark"] : ""
          }`}
          onClick={() => mainRef.current?.next()}
        >
          <RightOutlined />
        </button>
      </div>

      <div style={borderStyle} className={styles["thumbCarousel"]}>
        {images.length > 4 ? (
          <Carousel
            ref={thumbRef}
            slidesToShow={4}
            swipeToSlide
            focusOnSelect
            dots={false}
          >
            {images.map((img, index) => (
              <div
                key={index}
                className={`${styles["thumb"]} ${
                  index === current ? styles["active"] : ""
                }`}
                onClick={() => {
                  mainRef.current?.goTo(index);
                  setCurrent(index);
                }}
              >
                <img src={`${baseUrl}/${img}`} />
              </div>
            ))}
          </Carousel>
        ) : (
          <div className={styles["thumbList"]}>
            {images.map((img, index) => (
              <div
                key={index}
                className={`${styles["thumb"]} ${
                  index === current ? styles["active"] : ""
                }`}
                onClick={() => {
                  mainRef.current?.goTo(index);
                  setCurrent(index);
                }}
              >
                <img src={`${baseUrl}/${img}`} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductImageGallery;
