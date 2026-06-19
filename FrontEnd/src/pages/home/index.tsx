import styles from "styles/home.module.scss";
import banner3 from "assets/banner_3.jpg";
import banner1 from "assets/banner_1.png";
import banner2 from "assets/banner_2.jpg";
import banner4 from "assets/banner4.avif";
import { Carousel, Col, Row, Skeleton } from "antd";
import { useFetchVariantQuery } from "@/redux/api/productApi";
import { IVariant } from "@/types/backend";
import { DoubleRightOutlined } from "@ant-design/icons";
import ProductCard from "@/components/client/card/card.product";
import CardSkeleton from "@/components/client/card/card.product-skeleton";
import { useNavigate } from "react-router-dom";

const HomePage = () => {
  const { data, isLoading } = useFetchVariantQuery("current=1&pageSize=50");
  const variants = data?.data?.result || [];

  const navigate = useNavigate();

  const groupedByCategory = variants.reduce((acc: any, variant: IVariant) => {
    const categoryId = variant.product?.category?.id || "other";
    const categoryName = variant.product?.category?.name || "Other";
    if (!acc[categoryId]) {
      acc[categoryId] = {
        name: categoryName,
        items: [],
      };
    }
    acc[categoryId].items.push(variant);
    return acc;
  }, {});

  const filteredCategories = Object.entries(groupedByCategory)
    .filter(([_, value]: any) => value.items.length >= 4)
    .sort((a: any, b: any) => b[1].items.length - a[1].items.length)
    .slice(0, 6);

  return (
    <div className={styles["main-container"]}>
      <div className={styles["top-banner"]}>
        <img src={banner1} alt="Banner" className={styles["banner-image"]} />
      </div>
      <Row gutter={[10, 10]} className={styles["banner-row"]}>
        <Col span={8}>
          <img src={banner4} alt="Banner 1" className={styles["sub-banner"]} />
        </Col>
        <Col span={8}>
          <img src={banner3} alt="Banner 2" className={styles["sub-banner"]} />
        </Col>
        <Col span={8}>
          <img src={banner2} alt="Banner 3" className={styles["sub-banner"]} />
        </Col>
      </Row>
      {isLoading ? (
        <>
          {Array.from({ length: 4 }).map((_, sectionIndex) => (
            <div key={sectionIndex} className={styles["category-section"]}>
              <div className={styles["category-header"]}>
                <Skeleton.Input active />
              </div>
              <Carousel
                dots={false}
                arrows
                slidesToShow={4}
                responsive={[
                  { breakpoint: 1200, settings: { slidesToShow: 3 } },
                  { breakpoint: 768, settings: { slidesToShow: 2 } },
                  { breakpoint: 480, settings: { slidesToShow: 1 } },
                ]}
              >
                {Array.from({ length: 8 }).map((_, index) => (
                  <div key={index} className={styles["carousel-item"]}>
                    <CardSkeleton />
                  </div>
                ))}
              </Carousel>
            </div>
          ))}
        </>
      ) : (
        filteredCategories.map(([categoryId, value]: any) => (
          <div key={categoryId} className={styles["category-section"]}>
            <div className={styles["category-header"]}>
              <div className={styles["category-left"]}>
                <div className={styles["category-banner"]}>
                  <span className={styles["category-banner-text"]}>
                    {value.name}
                  </span>
                </div>
              </div>
              <span
                className={styles["view-all"]}
                onClick={() => navigate(`/filter?categoryId=${categoryId}`)}
              >
                View all
                <DoubleRightOutlined />
              </span>
            </div>
            <Carousel
              dots={false}
              arrows
              infinite
              slidesToShow={4}
              autoplay
              autoplaySpeed={3000}
              draggable
              swipeToSlide
              pauseOnHover
              responsive={[
                { breakpoint: 1200, settings: { slidesToShow: 3 } },
                { breakpoint: 768, settings: { slidesToShow: 2 } },
                { breakpoint: 480, settings: { slidesToShow: 1 } },
              ]}
            >
              {value.items.map((variant: IVariant) => (
                <div key={variant.id} className={styles["carousel-item"]}>
                  <ProductCard variant={variant} />
                </div>
              ))}
            </Carousel>
          </div>
        ))
      )}
    </div>
  );
};

export default HomePage;
