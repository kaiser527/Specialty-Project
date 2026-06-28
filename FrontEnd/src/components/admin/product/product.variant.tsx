import UploadImage from "@/components/share/upload";
import { DARKTHEME } from "@/config/constants/utils";
import { formatterNumber, parserNumber } from "@/config/helpers/global";
import { useBackground } from "@/hooks/useBackground";
import { useGetAccount } from "@/hooks/useGetAccount";
import { IVariant } from "@/types/frontend";
import { MinusOutlined, PlusOutlined } from "@ant-design/icons";
import {
  ProFormDatePicker,
  ProFormDigit,
  ProFormText,
} from "@ant-design/pro-components";
import { Col, Grid, Pagination, Row } from "antd";
import dayjs from "dayjs";
import { useMemo, useState } from "react";
import { v4 as uuidv4 } from "uuid";

interface IProps {
  isShow: boolean;
  productVariants: IVariant[];
  filterSku: string;
  setFilterSku: React.Dispatch<React.SetStateAction<string>>;
  setProductVariants: React.Dispatch<React.SetStateAction<IVariant[]>>;
}

const pageSize = 3;

const { useBreakpoint } = Grid;

const ProductVariants = ({
  isShow,
  filterSku,
  setFilterSku,
  productVariants,
  setProductVariants,
}: IProps) => {
  const screen = useBreakpoint();
  const { user } = useGetAccount();
  const { background } = useBackground();

  const [currentPage, setCurrentPage] = useState(1);

  const filteredVariants = useMemo(() => {
    return productVariants.filter((v) => {
      if (!filterSku) return true;
      return v.sku?.toLowerCase().includes(filterSku.toLowerCase());
    });
  }, [productVariants, filterSku]);

  const handleAddVariant = () => {
    setProductVariants((prev) => {
      const newVariants = [
        ...prev,
        {
          id: uuidv4(),
          stock: 0,
          price: 0,
          discount: 0,
          dueDate: "",
          sku: "",
          images: [],
          attributes: [{ key: "", value: "" }],
        },
      ];
      if (!filterSku) {
        const maxPage = Math.ceil(newVariants.length / pageSize);
        setCurrentPage(maxPage);
      }
      return newVariants;
    });
  };

  const handleRemoveVariant = (id: string) => {
    setProductVariants((prev) => {
      const newVariants = prev.filter((v) => v.id !== id);

      const maxPage = Math.ceil(newVariants.length / pageSize);
      setCurrentPage((prevPage) =>
        prevPage > maxPage ? Math.max(1, maxPage) : prevPage
      );

      return newVariants;
    });
  };

  const handleChangeVariant = <K extends keyof IVariant>(
    id: string,
    field: K,
    value: IVariant[K]
  ) => {
    if (isShow) return;

    setProductVariants((prev) =>
      prev.map((variant) =>
        variant.id === id ? { ...variant, [field]: value } : variant
      )
    );
  };

  const handleAddAttribute = (id: string) => {
    setProductVariants((prev) =>
      prev.map((variant) =>
        variant.id === id
          ? {
              ...variant,
              attributes: [
                ...(variant.attributes || []),
                { key: "", value: "" },
              ],
            }
          : variant
      )
    );
  };

  const handleRemoveAttribute = (id: string, attrIndex: number) => {
    setProductVariants((prev) =>
      prev.map((variant) =>
        variant.id === id
          ? {
              ...variant,
              attributes: variant.attributes.filter((_, i) => i !== attrIndex),
            }
          : variant
      )
    );
  };

  const handleChangeAttribute = (
    id: string,
    attrIndex: number,
    field: "key" | "value",
    value: string
  ) => {
    if (isShow) return;

    setProductVariants((prev) =>
      prev.map((variant) =>
        variant.id === id
          ? {
              ...variant,
              attributes: variant.attributes.map((attr, i) =>
                i === attrIndex ? { ...attr, [field]: value } : attr
              ),
            }
          : variant
      )
    );
  };

  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const currentVariants = filteredVariants.slice(startIndex, endIndex);

  const blueTheme =
    background === "dark"
      ? {
          background: "transparent",
          color: "#1677ff",
          border: "1px solid #1677ff",
          padding: "6px 10px",
          borderRadius: 4,
          cursor: "pointer",
        }
      : {
          background: "#1677ff",
          color: "#fff",
          border: "none",
          padding: "6px 10px",
          borderRadius: 4,
          cursor: "pointer",
        };

  const redTheme =
    background === "dark"
      ? {
          background: "transparent",
          color: "#ff4d4f",
          border: "1px solid #ff4d4f",
          padding: "6px 10px",
          borderRadius: 4,
          cursor: "pointer",
        }
      : {
          background: "#ff4d4f",
          color: "#fff",
          border: "none",
          padding: "6px 10px",
          borderRadius: 4,
          cursor: "pointer",
        };

  return (
    <div>
      <h3>Variants</h3>
      <Row>
        <Col lg={18} sm={16} xs={24}>
          {filteredVariants.length > pageSize && (
            <Pagination
              current={currentPage}
              pageSize={pageSize}
              total={filteredVariants.length}
              onChange={(page) => setCurrentPage(page)}
              style={{ margin: "10px 0" }}
            />
          )}
        </Col>
        <Col lg={6} sm={8} xs={24}>
          <ProFormText
            placeholder="Filter by SKU..."
            fieldProps={{
              value: filterSku,
              onChange: (e) => {
                setFilterSku(e.target.value);
                setCurrentPage(1);
              },
            }}
          />
        </Col>
      </Row>
      {currentVariants.map((variant) => {
        return (
          <div
            key={variant.id}
            style={{
              border: `1px solid ${
                background === "dark" ? DARKTHEME.border : "#eee"
              }`,
              background: background === "dark" ? DARKTHEME.card : "#fff",
              padding: 16,
              marginBottom: 16,
              borderRadius: 8,
            }}
          >
            <Row gutter={[12, 12]} align="middle">
              {/* Price */}
              <Col sm={4} xs={8} lg={3}>
                <ProFormDigit
                  label="Price"
                  min={0}
                  fieldProps={{
                    value: variant.price,
                    formatter: (value) => (value ? formatterNumber(value) : ""),
                    parser: (value) => parserNumber(value),
                    onChange: (value) =>
                      handleChangeVariant(variant.id, "price", value ?? 0),
                  }}
                />
              </Col>

              {/* Stock */}
              <Col sm={3} xs={8} lg={2}>
                <ProFormDigit
                  label="Stock"
                  min={0}
                  fieldProps={{
                    value: variant.stock,
                    onChange: (value) =>
                      handleChangeVariant(variant.id, "stock", value ?? 0),
                  }}
                />
              </Col>

              <Col sm={3} xs={8} lg={2}>
                <ProFormDigit
                  label="Discount"
                  min={0}
                  max={100}
                  fieldProps={{
                    value: variant.discount,
                    formatter: (value) => (value ? `${value}%` : ""),
                    parser: (value) => +(value?.replace("%", "") ?? ""),
                    onChange: (value) =>
                      handleChangeVariant(variant.id, "discount", value ?? 0),
                  }}
                />
              </Col>

              {user.role.name !== "PROVIDER" && (
                <Col lg={3} sm={4} xs={24}>
                  <ProFormDatePicker
                    label="Due Date"
                    fieldProps={{
                      value: variant.dueDate
                        ? dayjs(variant.dueDate)
                        : undefined,
                      onChange: (date: Date) =>
                        handleChangeVariant(
                          variant.id,
                          "dueDate",
                          date ? date.toISOString() : ""
                        ),
                    }}
                  />
                </Col>
              )}

              <Col sm={7} xs={16} lg={9}>
                <ProFormText
                  label="SKU"
                  placeholder=""
                  fieldProps={{
                    value: variant.sku || "",
                    readOnly: true,
                  }}
                />
              </Col>

              {!isShow && (
                <Col sm={3} xs={8} lg={5}>
                  <div style={{ display: "flex", gap: 8, marginTop: 5 }}>
                    <div onClick={handleAddVariant} style={blueTheme}>
                      <PlusOutlined />
                    </div>

                    {productVariants.length > 1 && (
                      <div
                        onClick={() => handleRemoveVariant(variant.id)}
                        style={redTheme}
                      >
                        <MinusOutlined />
                      </div>
                    )}
                  </div>
                </Col>
              )}
            </Row>
            <Col span={24}>
              <p style={{ marginBottom: 8 }}>Images</p>
              <UploadImage
                folder="product"
                dataImage={variant.images as any}
                setDataImage={(updater) => {
                  if (isShow) return;
                  setProductVariants((prev) =>
                    prev.map((v) => {
                      if (v.id !== variant.id) return v;
                      const currentImages = v.images || [];
                      const newImages =
                        typeof updater === "function"
                          ? updater(currentImages)
                          : updater;
                      return { ...v, images: newImages };
                    })
                  );
                }}
                allowUpload={!isShow}
                renderChild="upload"
                showList={true}
                mode="multiple"
              />
            </Col>
            <div style={{ marginTop: 12 }}>
              <p style={{ marginBottom: 8 }}>Attributes</p>

              {(variant.attributes || []).map((attr, attrIndex) => (
                <Row
                  gutter={8}
                  key={attrIndex}
                  align="middle"
                  style={{ marginBottom: 8 }}
                >
                  {/* KEY */}
                  <Col xs={12} sm={8} lg={8}>
                    <ProFormText
                      placeholder="Attribute name"
                      fieldProps={{
                        value: attr.key,
                        onChange: (e) =>
                          handleChangeAttribute(
                            variant.id,
                            attrIndex,
                            "key",
                            e.target.value
                          ),
                      }}
                    />
                  </Col>

                  {/* VALUE */}
                  <Col xs={12} sm={8} lg={8}>
                    <ProFormText
                      placeholder="Value"
                      fieldProps={{
                        value: attr.value,
                        onChange: (e) =>
                          handleChangeAttribute(
                            variant.id,
                            attrIndex,
                            "value",
                            e.target.value
                          ),
                      }}
                    />
                  </Col>

                  {!isShow && (
                    <Col xs={24} sm={8} lg={8}>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          marginTop: screen.xs ? -16 : -26,
                          float: screen.xs ? "right" : "none",
                        }}
                      >
                        <div
                          onClick={() => handleAddAttribute(variant.id)}
                          style={blueTheme}
                        >
                          <PlusOutlined />
                        </div>

                        {variant.attributes.length > 1 && (
                          <div
                            onClick={() =>
                              handleRemoveAttribute(variant.id, attrIndex)
                            }
                            style={redTheme}
                          >
                            <MinusOutlined />
                          </div>
                        )}
                      </div>
                    </Col>
                  )}
                </Row>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ProductVariants;
