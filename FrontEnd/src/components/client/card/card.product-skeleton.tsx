import { Skeleton } from "antd";
import styles from "styles/card.module.scss";

const CardSkeleton = () => {
  return (
    <div className={styles["card"]}>
      <div className={styles["fake-image"]}>
        <Skeleton.Node active className={styles["skeleton-node"]} />
      </div>
      <div style={{ marginTop: 10 }}>
        <Skeleton active paragraph={{ rows: 2 }} title={false} />
      </div>
      <div style={{ marginTop: 10 }}>
        <Skeleton active paragraph={{ rows: 1 }} title={false} />
      </div>
      <div style={{ marginTop: 10 }}>
        <Skeleton.Button active size="small" shape="round" />
      </div>
    </div>
  );
};

export default CardSkeleton;
