import ProductImageGallery from "@/components/client/product/product-image-gallery.client";
import ProductInfo from "@/components/client/product/product-info.client";
import ProductReviews from "@/components/client/product/product-reviews.client";
import PreviousPage from "@/components/share/previous-page";
import { socket } from "@/config/constants/utils";
import { buildVariantName } from "@/config/helpers/global";
import { useMessage } from "@/hooks/useMessage";
import { useFetchSingleVariantQuery } from "@/redux/api/productApi";
import { IMeta, IVariant, ReviewNode } from "@/types/backend";
import { skipToken } from "@reduxjs/toolkit/query";
import { Col, Flex, Grid, Pagination, Row, Skeleton } from "antd";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import styles from "styles/product-detail.module.scss";

const { useBreakpoint } = Grid;

const ProductDetail = () => {
  const screen = useBreakpoint();

  const { id } = useParams();
  const { messageApi } = useMessage();

  const [currentPage, setCurrentPage] = useState(1);
  const [meta, setMeta] = useState<IMeta | null>(null);
  const [reviews, setReviews] = useState<ReviewNode[]>([]);
  const [loadingReviews, setLoadingReviews] = useState(true);

  const { data, isLoading } = useFetchSingleVariantQuery(id ?? skipToken);
  const variant = data?.data;

  useEffect(() => {
    if (!id) return;

    setLoadingReviews(true);

    if (socket.connected) {
      socket.disconnect();
      socket.connect();
    }

    socket.emit("findAllReviewsByVariantId:subscribe", {
      currentPage,
      limit: 5,
      variantId: id,
    });
  }, [id, currentPage]);

  useEffect(() => {
    const handleUpdate = (data: any) => {
      setReviews(data.reviews);
      setMeta(data.meta);
      setLoadingReviews(false);
    };

    const handleError = (err: any) => {
      setLoadingReviews(false);
      messageApi.error(err.message);
    };

    socket.on("findAllReviewsByVariantId:update", handleUpdate);
    socket.on("findAllReviewsByVariantId:error", handleError);

    return () => {
      socket.off("findAllReviewsByVariantId:update", handleUpdate);
      socket.off("findAllReviewsByVariantId:error", handleError);
    };
  }, []);

  const breadcrumbItems = [
    {
      name: "Home page",
      link: "/",
    },
    {
      name: variant?.product?.category?.name ?? "Product",
      link: `/filter?categoryId=${variant?.product?.category?.id}`,
    },
    {
      name: (
        <span className={styles["ellipsis"]}>
          {buildVariantName(variant as IVariant)}
        </span>
      ),
      link: `/product/${variant?.id}`,
    },
  ];

  const ReviewSkeleton = () => {
    return (
      <div className={styles.reviewItem}>
        <div className={styles.header}>
          <Skeleton.Avatar active size="large" />
          <div style={{ flex: 1, marginLeft: 12, display: "flex", gap: 10 }}>
            <Skeleton.Input style={{ width: 120 }} active size="small" />
            <div>
              <Skeleton.Input style={{ width: 80 }} active size="small" />
            </div>
          </div>
        </div>
        <div style={{ marginLeft: 44, marginTop: 10 }}>
          <Skeleton active paragraph={{ rows: 2 }} />
        </div>
      </div>
    );
  };

  const GallerySkeleton = () => {
    return (
      <div className={styles["gallery"]}>
        <div className={styles["main"]}>
          <div className={styles["mainImageContainer"]}>
            <Skeleton.Image active />
          </div>
        </div>
        <div className={styles["thumbCarousel"]}>
          <Flex justify="center">
            <div className={styles["thumbList"]}>
              {Array.from({ length: screen.lg ? 5 : screen.xs ? 3 : 6 }).map(
                (_, i) => (
                  <div key={i} className={styles["thumb"]}>
                    <Skeleton.Image active />
                  </div>
                )
              )}
            </div>
          </Flex>
        </div>
      </div>
    );
  };

  const ProductInfoSkeleton = () => {
    return (
      <div className={styles["productInfo"]}>
        <Skeleton.Input active style={{ width: "80%", height: 28 }} />

        <Skeleton active paragraph={{ rows: 2 }} />

        <Skeleton.Input active style={{ width: "60%", height: 40 }} />

        <Skeleton active paragraph={{ rows: 4 }} />

        <div style={{ display: "flex", gap: 10 }}>
          <Skeleton.Button active style={{ width: 120 }} />
          <Skeleton.Button active style={{ width: 120 }} />
        </div>

        <Skeleton.Button active style={{ width: "100%", height: 48 }} />
      </div>
    );
  };

  return (
    <div>
      <div style={{ marginBottom: 10 }}>
        <PreviousPage previousPages={breadcrumbItems} />
      </div>
      <div className={styles["product-detail-container"]}>
        <Row gutter={[10, 10]}>
          <Col lg={12} sm={24} xs={24}>
            {isLoading ? (
              <GallerySkeleton />
            ) : (
              <ProductImageGallery images={variant?.images ?? []} />
            )}
          </Col>
          <Col lg={12} sm={24} xs={24}>
            {isLoading ? (
              <ProductInfoSkeleton />
            ) : (
              <ProductInfo variant={variant as IVariant} />
            )}
          </Col>
        </Row>
      </div>
      <div
        style={{ marginTop: 15 }}
        className={styles["product-detail-container"]}
      >
        {loadingReviews ? (
          <>
            {Array.from({ length: 5 }).map((_, i) => (
              <ReviewSkeleton key={i} />
            ))}
          </>
        ) : (
          <ProductReviews reviews={reviews} />
        )}
        <Flex justify="center">
          <Pagination
            current={currentPage}
            pageSize={meta?.pageSize}
            total={meta?.total}
            onChange={setCurrentPage}
            style={{ textAlign: "right", marginBottom: 10 }}
          />
        </Flex>
      </div>
    </div>
  );
};

export default ProductDetail;
