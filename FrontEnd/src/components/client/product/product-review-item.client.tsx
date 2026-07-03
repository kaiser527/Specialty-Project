import RoleTag from "@/components/share/role.tag";
import { FORMATE_DATE } from "@/config/helpers/global";
import { useBackground } from "@/hooks/useBackground";
import { useGetAccount } from "@/hooks/useGetAccount";
import { useMessage } from "@/hooks/useMessage";
import {
  useCreateReviewMutation,
  useDeleteReviewMutation,
  useEditReviewMutation,
} from "@/redux/api/reviewApi";
import { IUser, ReviewNode } from "@/types/backend";
import {
  CaretDownOutlined,
  CaretUpOutlined,
  CloseOutlined,
  DeleteOutlined,
  EditOutlined,
  EnterOutlined,
  SendOutlined,
  UserOutlined,
} from "@ant-design/icons";
import { Avatar, Button, Form, Grid, Popconfirm, Rate, Space } from "antd";
import TextArea from "antd/es/input/TextArea";
import dayjs from "dayjs";
import { useState } from "react";
import { useParams } from "react-router-dom";
import styles from "styles/product-detail.module.scss";

const { useBreakpoint } = Grid;

const ReviewItem = ({ node }: { node: ReviewNode }) => {
  const screen = useBreakpoint();

  const [isExpanded, setIsExpanded] = useState(false);
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  const [form] = Form.useForm();
  const [editForm] = Form.useForm();

  const [create] = useCreateReviewMutation();
  const [edit] = useEditReviewMutation();
  const [remove] = useDeleteReviewMutation();

  const { user, isAuthenticated } = useGetAccount();
  const { id } = useParams();
  const { notificationApi } = useMessage();
  const { background } = useBackground();

  const hasChildren = node.children && node.children.length > 0;

  const urlAvatar = `${import.meta.env.VITE_BACKEND_URL}/images/user/${
    node.user?.image
  }`;
  const currentAccountAvatarUrl = `${
    import.meta.env.VITE_BACKEND_URL
  }/images/user/${user?.image}`;

  const isOwner = user?._id?.toString() === node.user?._id?.toString();
  const isPrivileged = ["ADMIN", "STAFF"].includes(user?.role?.name);

  const handleReplySubmit = async (values: any) => {
    if (!id || !node.id) return;
    const res = await create({
      ...values,
      variantId: id,
      parentId: node.id,
    }).unwrap();
    if (res?.data) {
      setShowReplyForm(false);
      form.resetFields();
    } else {
      notificationApi.error({
        message: "Error occurred",
        description: res.message,
        duration: 5,
      });
    }
  };

  const handleEditSubmit = async (values: any) => {
    if (!id || !node.id) return;
    const res = await edit({ id: node.id, dto: values }).unwrap();
    if (res?.data) {
      setIsEditing(false);
      editForm.resetFields();
    } else {
      notificationApi.error({
        message: "Error occurred",
        description: res.message,
        duration: 5,
      });
    }
  };

  const handleDelete = async () => {
    if (!id || !node.id) return;
    const res = await remove({ id: node.id }).unwrap();
    if (!res?.data) {
      notificationApi.error({
        message: "Delete failed",
        description: res.message,
        duration: 5,
      });
    }
  };

  return (
    <div
      className={`${styles.reviewItem} ${
        background === "dark" ? styles.reviewItemDark : ""
      }`}
    >
      <div className={styles.header}>
        <div className={styles.userInfo}>
          <Avatar src={urlAvatar} icon={<UserOutlined />} size="large" />
          <div>
            <Space>
              <span className={styles.name}>{node.user?.name}</span>
              <RoleTag
                user={node.user as IUser}
                customStyle={{ borderRadius: 5, padding: "0px 8px" }}
              />
            </Space>
            <div className={styles.meta}>
              {dayjs(node.createdAt).format(FORMATE_DATE)}
            </div>
          </div>
        </div>
        {node.depth === 0 && (
          <Rate disabled value={node.rating} style={{ fontSize: 16 }} />
        )}
      </div>

      {isEditing ? (
        <div className={styles.inlineEditForm}>
          <Form
            form={editForm}
            onFinish={handleEditSubmit}
            className={styles.editForm}
          >
            {node.depth === 0 && (
              <Form.Item name="rating" className={styles.editRate}>
                <Rate />
              </Form.Item>
            )}

            <Form.Item
              name="comment"
              rules={[{ required: true, message: "Please enter comment" }]}
              className={styles.editFormItem}
            >
              <TextArea
                autoSize={{ minRows: 2, maxRows: 4 }}
                className={styles.editTextArea}
                autoFocus
              />
            </Form.Item>

            <div className={styles.editActions}>
              <Button
                className={styles.editSubmitBtn}
                size="small"
                onClick={() => setIsEditing(false)}
                icon={<CloseOutlined />}
              >
                Cancel
              </Button>
              <Button
                size="small"
                type="primary"
                htmlType="submit"
                icon={<SendOutlined />}
                className={styles.editSubmitBtn}
              >
                Save
              </Button>
            </div>
          </Form>
        </div>
      ) : (
        <div className={styles.commentBody}>{node.comment}</div>
      )}

      <div className={styles.actions}>
        {isAuthenticated && (
          <Button
            type="text"
            size="small"
            onClick={() => setShowReplyForm(!showReplyForm)}
            className={showReplyForm ? styles.activeReplyBtn : styles.replyBtn}
            icon={<EnterOutlined style={{ transform: "scaleX(-1)" }} />}
          >
            {showReplyForm ? !screen.xs && "Cancel" : !screen.xs && "Reply"}
          </Button>
        )}

        {isOwner && (
          <Button
            type="text"
            size="small"
            className={isEditing ? styles.activeReplyBtn : styles.replyBtn}
            icon={<EditOutlined />}
            onClick={() => {
              setIsEditing(!isEditing);
              editForm.setFieldsValue({
                comment: node.comment,
                rating: node.rating,
              });
            }}
          >
            {!screen.xs && "Edit"}
          </Button>
        )}

        {(isOwner || isPrivileged) && (
          <Popconfirm
            title="Delete this review?"
            description="This action cannot be undone."
            okText="Delete"
            cancelText="Cancel"
            okButtonProps={{ danger: true }}
            onConfirm={handleDelete}
          >
            <Button
              type="text"
              size="small"
              className={styles.deleteBtn}
              icon={<DeleteOutlined />}
            >
              {!screen.xs && "Delete"}
            </Button>
          </Popconfirm>
        )}

        {hasChildren && (
          <Button
            type="text"
            size="small"
            className={styles.toggleBtn}
            onClick={() => setIsExpanded(!isExpanded)}
            icon={isExpanded ? <CaretUpOutlined /> : <CaretDownOutlined />}
          >
            {isExpanded
              ? !screen.xs && "Hide Replies"
              : screen.xs
              ? `(${node.children?.length})`
              : `Show Replies (${node.children?.length})`}
          </Button>
        )}
      </div>

      {showReplyForm && (
        <div className={styles.inlineReplyForm}>
          <div className={styles.replyFormWrapper}>
            <Avatar
              src={currentAccountAvatarUrl}
              icon={<UserOutlined />}
              size="large"
              className={styles.replyAvatar}
            />

            <Form
              form={form}
              onFinish={handleReplySubmit}
              className={styles.flexForm}
            >
              <Form.Item
                name="comment"
                className={styles.replyFormItem}
                rules={[{ required: true, message: "Please enter a reply" }]}
              >
                <TextArea
                  placeholder={`Reply to ${node.user?.name}...`}
                  autoSize={{ minRows: 1, maxRows: 4 }}
                  className={styles.replyTextArea}
                  autoFocus
                />
              </Form.Item>

              <div className={styles.replyFormActions}>
                <Button
                  size="small"
                  type="text"
                  className={styles.miniSubmitBtn}
                  icon={<CloseOutlined />}
                  onClick={() => setShowReplyForm(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="small"
                  type="primary"
                  htmlType="submit"
                  icon={<SendOutlined />}
                  className={styles.miniSubmitBtn}
                >
                  Post
                </Button>
              </div>
            </Form>
          </div>
        </div>
      )}

      {hasChildren && isExpanded && (
        <div className={styles.nestedReplies}>
          {node.children!.map((child) => (
            <ReviewItem key={child.id} node={child} />
          ))}
        </div>
      )}
    </div>
  );
};

export default ReviewItem;
