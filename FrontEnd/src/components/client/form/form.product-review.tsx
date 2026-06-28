import { useBackground } from "@/hooks/useBackground";
import { useGetAccount } from "@/hooks/useGetAccount";
import { useMessage } from "@/hooks/useMessage";
import { useCreateReviewMutation } from "@/redux/api/reviewApi";
import { SendOutlined } from "@ant-design/icons";
import { Avatar, Button, Form, Input, Rate } from "antd";
import { useParams } from "react-router-dom";
import styles from "styles/product-detail.module.scss";

const { TextArea } = Input;

const ProductReviewForm = () => {
  const { id } = useParams();
  const { user } = useGetAccount();
  const { notificationApi } = useMessage();
  const { background } = useBackground();

  const [form] = Form.useForm();
  const [create] = useCreateReviewMutation();

  const urlAvatar = `${import.meta.env.VITE_BACKEND_URL}/images/user/${
    user?.image
  }`;

  const onFinish = async (values: any) => {
    if (!id) return;
    if (values.rating === 0) {
      notificationApi.error({
        message: "Error occurred",
        description: "Rating must > 0",
        duration: 5,
      });
      return;
    }
    const res = await create({ ...values, variantId: id }).unwrap();
    if (res?.data) {
      form.resetFields();
    } else {
      notificationApi.error({
        message: "Error occurred",
        description: res.message,
        duration: 5,
      });
    }
  };

  return (
    <Form
      form={form}
      onFinish={onFinish}
      initialValues={{ rating: 0 }}
      className={`${styles.writeReviewWrapper} ${
        background === "dark" ? styles.writeReviewWrapperDark : ""
      }`}
    >
      <div className={styles.inputHeader}>
        <Avatar src={urlAvatar} className={styles.userAvatar} size="large" />
        <Form.Item
          name="comment"
          className={styles.formItemNoMargin}
          style={{ flex: 1 }}
          rules={[{ required: true, message: "Please enter your review" }]}
        >
          <TextArea
            placeholder="Share your thoughts about this product..."
            autoSize={{ minRows: 2, maxRows: 6 }}
            className={styles.customTextArea}
          />
        </Form.Item>
      </div>

      <div className={styles.inputActions}>
        <div className={styles.ratingSection}>
          <span className={styles.ratingLabel}>Your Rating:</span>
          <Form.Item
            rules={[{ required: true, message: "Please enter your review" }]}
            name="rating"
            className={styles.formItemNoMargin}
          >
            <Rate className={styles.customRate} />
          </Form.Item>
        </div>
        <Button
          type="primary"
          htmlType="submit"
          icon={<SendOutlined />}
          className={styles.submitBtn}
        >
          Post Review
        </Button>
      </div>
    </Form>
  );
};

export default ProductReviewForm;
