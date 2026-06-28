import { ReviewNode } from "@/types/backend";
import { Typography, Empty } from "antd";
import { MessageOutlined } from "@ant-design/icons";
import styles from "styles/product-detail.module.scss";
import ReviewItem from "./product-review-item.client";
import ProductReviewForm from "../form/form.product-review";
import { useGetAccount } from "@/hooks/useGetAccount";
import { useBackground } from "@/hooks/useBackground";

const { Text } = Typography;

interface IProps {
  reviews: ReviewNode[];
}

const ProductReviews = ({ reviews }: IProps) => {
  const { isAuthenticated } = useGetAccount();
  const { background } = useBackground();

  if (isAuthenticated && (!reviews || reviews.length === 0)) {
    return (
      <div
        className={`${styles.emptyContainer} ${
          background === "dark" ? styles.emptyContainerDark : ""
        }`}
      >
        <div className={styles.emptyContent}>
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            styles={{
              image: {
                height: 60,
                opacity: 0.5,
                filter: "sepia(1) saturate(5) hue-rotate(-10deg)",
              },
            }}
            description={
              <div className={styles.emptyText}>
                <h3>No Reviews Yet</h3>
                <Text type="secondary">
                  Be the first to share your experience!
                </Text>
              </div>
            }
          />
        </div>
        <ProductReviewForm />
      </div>
    );
  }

  return (
    <div className={styles.reviewsContainer}>
      <h3
        className={`${styles.title} ${
          background === "dark" ? styles.titleDark : ""
        }`}
      >
        <span className={styles.iconWrapper}>
          <MessageOutlined />
        </span>
        <span>User Reviews</span>
        <span className={styles.count}>{reviews?.length ?? 0} reviews</span>
      </h3>
      {isAuthenticated && (
        <div style={{ marginBottom: "40px" }}>
          <ProductReviewForm />
        </div>
      )}
      <div className={styles.listWrapper}>
        {reviews?.map((rootReview) => (
          <ReviewItem key={rootReview.id} node={rootReview} />
        ))}
      </div>
    </div>
  );
};

export default ProductReviews;
