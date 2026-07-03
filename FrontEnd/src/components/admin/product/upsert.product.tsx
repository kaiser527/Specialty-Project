import { useFetchCategoryQuery } from "@/redux/api/categoryApi";
import {
  useCreateProductMutation,
  useFetchSingleProductQuery,
  useSwitchProductAuthorMutation,
  useUpdateProductMutation,
} from "@/redux/api/productApi";
import { skipToken } from "@reduxjs/toolkit/query";
import { Breadcrumb, Button, Col, Form, Input, Row, Select } from "antd";
import styles from "styles/admin.module.scss";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import {
  FooterToolbar,
  ProForm,
  ProFormSelect,
  ProFormText,
} from "@ant-design/pro-components";
import { CheckSquareOutlined } from "@ant-design/icons";
import { useEffect, useRef, useState } from "react";
import { IImage, IVariant } from "@/types/frontend";
import UploadImage from "@/components/share/upload";
import { useMessage } from "@/hooks/useMessage";
import ProductVariants from "./product.variant";
import { DARKTHEME } from "@/config/constants/utils";
import { useGetAccount } from "@/hooks/useGetAccount";
import { useFetchUserQuery } from "@/redux/api/userApi";
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/constants/permissions";
import { useBackground } from "@/hooks/useBackground";
import RoleTag from "@/components/share/role.tag";
import { IUser } from "@/types/backend";

const variants: IVariant[] = [
  {
    id: uuidv4(),
    stock: 0,
    price: 0,
    discount: 0,
    sku: "",
    images: [],
    dueDate: "",
    attributes: [{ key: "", value: "" }],
  },
];

const ViewUpsertProduct = () => {
  const navigate = useNavigate();

  const [searchParams] = useSearchParams();
  const id = searchParams.get("id");

  const [form] = Form.useForm();

  const { user } = useGetAccount();
  const { background } = useBackground();

  const [filterSku, setFilterSku] = useState("");
  const [dataThumbnail, setDataThumbnail] = useState<IImage[]>([]);
  const [productVariants, setProductVariants] = useState(variants);
  const [isFetchUser, setIsFetchUser] = useState(false);
  const [searchUser, setSearchUser] = useState("");

  const { data: category } = useFetchCategoryQuery("current=1&pageSize=100");
  const { data: product, refetch } = useFetchSingleProductQuery(
    id ?? skipToken,
    {
      refetchOnMountOrArgChange: true,
    }
  );
  const { data: dataUser, isLoading } = useFetchUserQuery(
    `current=1&pageSize=100&populate=role&fields=role._id,role.name&role=ADMIN,PROVIDER,STAFF${
      searchUser ? `&search=${searchUser}` : ""
    }`,
    {
      skip: !isFetchUser,
    }
  );

  const [switchAuthor, { isLoading: isLoadingSwitch }] =
    useSwitchProductAuthorMutation();
  const [update, { isLoading: isLoadingUpdate }] = useUpdateProductMutation();
  const [create, { isLoading: isLoadingCreate }] = useCreateProductMutation();

  const isSubmitting = isLoadingCreate || isLoadingUpdate;

  const { messageApi, notificationApi } = useMessage();

  const authorRef = useRef("");

  useEffect(() => {
    if (product?.data?.id) {
      const p = product.data;
      setDataThumbnail([
        {
          name: p.thumbnail,
          uid: uuidv4(),
        },
      ]);
      setProductVariants(
        p.variants?.map((v: any) => ({
          ...v,
          images: v.images?.map((img: string) => ({
            name: img,
            uid: uuidv4(),
          })),
          attributes: Object.entries(v.attributes || {}).map(
            ([key, value]) => ({
              key,
              value,
            })
          ),
        })) || variants
      );
      form.setFieldsValue({
        ...p,
        categoryId: p.category?.id,
      });
    }
  }, [product]);

  const onFinish = async (values: any) => {
    let hasError = false;

    const isVariantEmpty = (variant: IVariant) => {
      return (
        !variant.price &&
        !variant.stock &&
        (!variant.images || variant.images.length === 0) &&
        variant.attributes.every((attr) => !attr.key && !attr.value)
      );
    };

    const payload = productVariants
      .filter((variant) => !isVariantEmpty(variant))
      .map((variant, variantIndex) => {
        const attributesObject: Record<string, string> = {};
        if (
          !variant.price ||
          !variant.stock ||
          (!variant.dueDate && user.role.name !== "PROVIDER")
        ) {
          hasError = true;
        }
        variant.attributes.forEach((attr, attrIndex) => {
          if (!attr.key || !attr.value) {
            hasError = true;
          }
          if (attributesObject[attr.key]) {
            hasError = true;
          }
          if (attr.key && attr.value) {
            attributesObject[attr.key] = attr.value;
          }
        });

        const { sku, ...rest } = variant;

        return {
          ...rest,
          attributes: attributesObject,
          images: variant.images?.map((img: any) => img.name),
        };
      });

    if (hasError) {
      notificationApi.error({
        message: "Error occurred!",
        description: "Please fix variants error",
        duration: 3,
      });
      return;
    }

    const res = product?.data?.id
      ? await update({
          id: product.data.id,
          product: {
            ...values,
            thumbnail: dataThumbnail[0]?.name ?? "empty.jpg",
            variants: payload,
          },
        }).unwrap()
      : await create({
          ...values,
          thumbnail: dataThumbnail[0]?.name ?? "empty.jpg",
          variants: payload.map((item) => {
            const { id, ...rest } = item;
            return rest;
          }),
        }).unwrap();

    if (res?.data) {
      messageApi.success(res.message);
      setFilterSku("");
      id ? refetch() : navigate("/admin/product", { replace: true });
    } else {
      notificationApi.error({
        message: "Error occurred!",
        description: res.message,
        duration: 5,
      });
    }
  };

  const onSwitchAuthor = async () => {
    if (!authorRef.current.trim()) {
      messageApi.error("Please select an author to switch");
      return;
    }

    const res = await switchAuthor({
      productId: product?.data?.id ?? "",
      newAuthorEmail: authorRef.current,
    }).unwrap();

    if (res?.data) {
      messageApi.success(res.message);
      setFilterSku("");
      refetch();
    } else {
      notificationApi.error({
        message: "Error occurred!",
        description: res.message,
        duration: 5,
      });
    }
  };

  const isShow =
    user.role.name === "PROVIDER" &&
    product?.data?.user?._id === user._id &&
    (product?.data?.status === "APPROVED" ||
      product?.data?.status === "REJECTED");

  return (
    <div
      style={background === "dark" ? { background: DARKTHEME.bgSecondary } : {}}
      className={styles["upsert-product-container"]}
    >
      <div className={styles["title"]}>
        <Breadcrumb
          separator=">"
          items={[
            {
              title: <Link to="/admin/product">Manage Product</Link>,
            },
            {
              title: "Upsert Product",
            },
          ]}
        />
        {product?.data?.user && (
          <Row justify="center" style={{ marginTop: 24 }}>
            <Col>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: 12,
                }}
              >
                <img
                  src={`${import.meta.env.VITE_BACKEND_URL}/images/user/${
                    product.data.user.image
                  }`}
                  alt={product.data.user.name}
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: "50%",
                    objectFit: "cover",
                  }}
                />
                <div style={{ textAlign: "center" }}>
                  <div style={{ fontWeight: 600 }}>
                    {product.data.user.name}
                  </div>
                  <RoleTag
                    user={product.data.user as IUser}
                    customStyle={{
                      fontSize: 12,
                      fontWeight: 500,
                      padding: "2px 8px",
                      borderRadius: 4,
                      marginTop: 5,
                      display: "inline-block",
                    }}
                  />
                </div>
              </div>
            </Col>
          </Row>
        )}
      </div>
      <Access permission={ALL_PERMISSIONS.PRODUCTS.SWITCH} hideChildren>
        {product?.data?.id && (
          <div style={{ display: "flex", gap: 12, marginBottom: 15 }}>
            <span style={{ alignSelf: "center" }}>Switch author:</span>
            <Select
              showSearch
              style={{ width: 200 }}
              placeholder="Search Author..."
              loading={isLoading}
              filterOption={false}
              onFocus={() => setIsFetchUser(true)}
              onSearch={setSearchUser}
              onSelect={(value) => (authorRef.current = value)}
              options={
                dataUser?.data?.result?.map((u) => ({
                  label: (
                    <div key={u._id}>
                      {u.name}
                      <RoleTag
                        user={u}
                        customStyle={{
                          fontSize: 11,
                          fontWeight: 500,
                          padding: "1px 4px",
                          borderRadius: 4,
                          marginLeft: 8,
                          display: "inline-block",
                        }}
                      />
                    </div>
                  ),
                  value: u.email,
                })) || []
              }
            />
            <Button
              type="primary"
              loading={isLoadingSwitch}
              onClick={onSwitchAuthor}
            >
              Switch
            </Button>
          </div>
        )}
      </Access>
      <div>
        <ProForm
          form={form}
          onFinish={onFinish}
          submitter={{
            searchConfig: {
              resetText: "Cancel",
              submitText: (
                <>{product?.data?.id ? "Update product" : "Create product"}</>
              ),
            },
            onReset: () => navigate("/admin/product"),
            render: (_: any, dom: any) =>
              !isShow && (
                <FooterToolbar
                  style={
                    background === "dark"
                      ? { background: DARKTHEME.bgSecondary }
                      : {}
                  }
                >
                  {dom}
                </FooterToolbar>
              ),
            submitButtonProps: {
              loading: isSubmitting,
              icon: <CheckSquareOutlined />,
            },
          }}
        >
          <Row gutter={[20, 20]}>
            <Col lg={4} sm={6} md={6} xs={12}>
              <ProFormText
                label="Product name"
                name="name"
                rules={[{ required: true }]}
                placeholder="Enter product name"
              />
            </Col>
            <Col lg={4} sm={6} md={6} xs={12}>
              <ProFormSelect
                label="Category"
                name="categoryId"
                rules={[{ required: true }]}
                options={
                  category?.data?.result.map((c: any) => ({
                    label: c.name,
                    value: c.id,
                  })) || []
                }
              />
            </Col>
            <Col lg={4} sm={6} md={6} xs={12}>
              <ProFormText
                label="brand"
                name="brand"
                rules={[{ required: true }]}
                placeholder="Enter product brand"
              />
            </Col>
            <Col lg={4} sm={6} md={6} xs={12}>
              <ProFormSelect
                label="Status"
                name="status"
                disabled={user.role.name === "PROVIDER"}
                rules={[{ required: true }]}
                options={[
                  { label: "Approved", value: "APPROVED" },
                  { label: "Pending", value: "PENDING" },
                  { label: "Rejected", value: "REJECTED" },
                ]}
                initialValue="PENDING"
              />
            </Col>
            <Col lg={8} sm={24} md={24} xs={24}>
              <p style={{ marginBottom: 8 }}>Thumbnail</p>
              <UploadImage
                renderChild="upload"
                folder="product"
                dataImage={dataThumbnail}
                showList={true}
                allowUpload={!isShow}
                setDataImage={setDataThumbnail}
              />
            </Col>
            <Col span={24}>
              <Form.Item
                label="Description"
                name="description"
                rules={[{ required: true }]}
              >
                <Input.TextArea
                  autoSize={{ minRows: 4, maxRows: 4 }}
                  placeholder="Your description"
                />
              </Form.Item>
            </Col>
          </Row>
          <ProductVariants
            filterSku={filterSku}
            setFilterSku={setFilterSku}
            isShow={isShow}
            setProductVariants={setProductVariants}
            productVariants={productVariants}
          />
        </ProForm>
      </div>
    </div>
  );
};

export default ViewUpsertProduct;
