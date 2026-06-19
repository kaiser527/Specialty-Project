import ProductCard from "@/components/client/card/card.product";
import CardSkeleton from "@/components/client/card/card.product-skeleton";
import PreviousPage from "@/components/share/previous-page";
import {
  formatterNumber,
  parseQs,
  parserNumber,
} from "@/config/helpers/global";
import { useFetchCategoryQuery } from "@/redux/api/categoryApi";
import {
  useFetchVariantQuery,
  useGetMinMaxPriceQuery,
} from "@/redux/api/productApi";
import { DeleteOutlined, FilterOutlined } from "@ant-design/icons";
import {
  Button,
  Checkbox,
  Col,
  Divider,
  Drawer,
  Empty,
  Flex,
  Grid,
  InputNumber,
  Pagination,
  Row,
  Select,
  Slider,
  Typography,
} from "antd";
import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import styles from "styles/filter.module.scss";

const { Option } = Select;
const { Text } = Typography;
const { useBreakpoint } = Grid;

const FilterPage = () => {
  const screen = useBreakpoint();
  const pageSize = screen.lg ? 12 : screen.xs ? 6 : 9;

  const [searchParams] = useSearchParams();
  const qs = searchParams.get("qs");
  const categoryId = searchParams.get("categoryId");
  const search = searchParams.get("search");

  const parsed = parseQs(qs?.trim() ? qs : "");

  const querySearch = search ? `&search=${search}` : ``;

  const initialCategoryIds = categoryId ? categoryId.split(",") : [];
  const [selectedCategories, setSelectedCategories] =
    useState<string[]>(initialCategoryIds);
  const queryCategory =
    selectedCategories.length > 0
      ? `&product.categoryId=${selectedCategories.join(",")}`
      : "";

  const [nameRegex, setNameRegex] = useState("");
  const queryNameRegex = nameRegex ? `&product.name=${nameRegex}` : "";

  const [parsedCategories, setParsedCategories] = useState<string[]>([]);
  const queryParsedCategories =
    parsed.categories.length > 0
      ? `&category=${parsed.categories.join(",")}`
      : "";

  const [selectedName, setSelectedName] = useState<string[]>([]);
  const queryName =
    selectedName.length > 0 ? `&product.name=${selectedName.join(",")}` : "";

  const [selectedUpdatedBy, setSelectedUpdatedBy] = useState<string[]>([]);
  const queryUpdatedBy =
    selectedUpdatedBy.length > 0
      ? `&product.updatedBy=${selectedUpdatedBy.join(",")}`
      : "";

  const [selectedCreatedBy, setSelectedCreatedBy] = useState<string[]>([]);
  const queryCreatedBy =
    selectedCreatedBy.length > 0
      ? `&product.createdBy=${selectedCreatedBy.join(",")}`
      : "";

  const queryCreatedAt =
    parsed.createdAtOperators.length > 0
      ? parsed.createdAtOperators
          .map((p) => `&createdAt${p.operator}${p.value}`)
          .join("")
      : "";

  console.log(parsed);

  const queryUpdatedAt =
    parsed.updatedAtOperators.length > 0
      ? parsed.updatedAtOperators
          .map((p) => `&updatedAt${p.operator}${p.value}`)
          .join("")
      : "";

  const queryDueDate =
    parsed.dueDateOperators.length > 0
      ? parsed.dueDateOperators
          .map((p) => `&dueDate${p.operator}${p.value}`)
          .join("")
      : "";

  const [openDrawer, setOpenDrawer] = useState(false);
  const [current, setCurrent] = useState(1);

  const [sortOption, setSortOption] = useState<string>("default");
  const querySort = sortOption !== "default" ? `&sort=${sortOption}` : "";

  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const queryBrand =
    selectedBrands.length > 0
      ? `&product.brand=${selectedBrands.join(",")}`
      : "";

  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [appliedPrice, setAppliedPrice] = useState<[number, number] | null>(
    null
  );
  const queryPrice =
    parsed.priceOperators.length > 0
      ? parsed.priceOperators
          .map((p) => `&price${p.operator}${p.value}`)
          .join("")
      : !qs?.trim() && appliedPrice
      ? `&price>=${appliedPrice[0]}&price<=${appliedPrice[1]}`
      : "";

  const queryString = `current=${current}&pageSize=${pageSize}${queryCategory}${querySearch}${queryPrice}${queryBrand}${querySort}${queryCreatedBy}${queryUpdatedBy}${queryCreatedAt}${queryUpdatedAt}${queryUpdatedAt}${queryDueDate}${queryName}${queryNameRegex}${queryParsedCategories}`;
  const { data: categoryData } = useFetchCategoryQuery(
    `current=1&pageSize=100`
  );
  const { data, isLoading } = useFetchVariantQuery(queryString);

  const { data: priceData } = useGetMinMaxPriceQuery({
    categoryIds: selectedCategories,
    search,
    brands: selectedBrands,
    createdBy: selectedCreatedBy,
    updatedBy: selectedUpdatedBy,
    names: selectedName,
    categories: parsedCategories,
    nameRegex,
    priceOperators: parsed.priceOperators,
    createdAtOperators: parsed.createdAtOperators,
    updatedAtOperators: parsed.updatedAtOperators,
    dueDateOperators: parsed.dueDateOperators,
  });

  const rawMin =
    (priceData?.data?.result?.[0] as number) - (qs?.trim() ? 0 : 1);
  const rawMax =
    (priceData?.data?.result?.[1] as number) + (qs?.trim() ? 0 : 1);

  const parsedHasPrice = parsed.priceOperators.length > 0;

  const equalCandidates = parsed.priceOperators
    .filter((p) => p.operator === "=")
    .map((p) => p.value);

  const minCandidates = parsed.priceOperators
    .filter((p) => p.operator.includes(">"))
    .map((p) => (p.operator.includes("=") ? p.value : p.value + 1));

  const maxCandidates = parsed.priceOperators
    .filter((p) => p.operator.includes("<"))
    .map((p) => (p.operator.includes("=") ? p.value : p.value - 1));

  const minPrice = parsedHasPrice
    ? Math.min(...minCandidates, ...equalCandidates, rawMin ?? 0)
    : rawMin ?? 0;

  const maxPrice = parsedHasPrice
    ? Math.max(...maxCandidates, ...equalCandidates, rawMax ?? 0)
    : rawMax ?? 0;

  const brands = priceData?.data?.brands || [];

  useEffect(() => {
    const newIds = categoryId ? categoryId.split(",") : [];
    setSelectedCategories(newIds);
    setCurrent(1);
  }, [categoryId]);

  useEffect(() => {
    if (priceData?.data?.result && !appliedPrice) {
      setPriceRange([
        priceData.data.result[0] - 1,
        priceData.data.result[1] + 1,
      ]);
    }
  }, [priceData, appliedPrice]);

  useEffect(() => {
    setSelectedBrands(parsed.brands || []);
    setSelectedCreatedBy(parsed.createdBy || []);
    setSelectedUpdatedBy(parsed.updatedBy || []);
    setSelectedName(parsed.names || []);
    setParsedCategories(parsed.categories || []);
    setNameRegex(parsed.nameRegex || "");
  }, [qs]);

  useEffect(() => {
    if (!priceData?.data?.result) return;

    if (parsed.priceOperators.length > 0) {
      let min = minPrice;
      let max = maxPrice;

      parsed.priceOperators.forEach((p) => {
        const isMin = p.operator.includes(">");
        const isMax = p.operator.includes("<");
        const isEqual = p.operator === "=";

        if (isEqual) {
          min = p.value;
          max = p.value;
        }

        if (isMin) {
          min = p.operator.includes("=") ? p.value : p.value + 1;
        }

        if (isMax) {
          max = p.operator.includes("=") ? p.value : p.value - 1;
        }
      });

      setPriceRange([min, max]);
      setAppliedPrice([min, max]);
    } else if (!qs?.trim()) {
      setPriceRange([
        priceData.data.result[0] - 1,
        priceData.data.result[1] + 1,
      ]);
      setAppliedPrice([
        priceData.data.result[0] - 1,
        priceData.data.result[1] + 1,
      ]);
    } else {
      setPriceRange([priceData.data.result[0], priceData.data.result[1]]);
      setAppliedPrice([priceData.data.result[0], priceData.data.result[1]]);
    }
  }, [priceData, qs]);

  const categories = !qs?.trim()
    ? categoryData?.data?.result || []
    : priceData?.data?.categories || [];

  const filterTitle = search
    ? `Search "${search}"`
    : categoryId
    ? categories?.find((cat) => cat.id === categoryId)?.name ?? ""
    : qs?.trim()
    ? `AI filter: ${qs}`
    : "Filter";

  const breadcrumbItems = [
    {
      name: "Home page",
      link: "/",
    },
    {
      name: (
        <Text
          ellipsis={{ tooltip: filterTitle }}
          style={{
            fontSize: 16,
            maxWidth: "50vw",
            display: "inline-block",
            color: "#fa8c16",
          }}
        >
          {filterTitle}
        </Text>
      ),
      link: "/filter",
    },
  ];

  const filter = (
    <>
      <div className={styles["header"]}>
        <Text className={styles["header-text"]}>FILTER PRODUCT</Text>
      </div>
      <Text className={styles["category-text"]}>CATEGORY</Text>
      <Divider style={{ marginTop: 10, marginBottom: 15 }} />
      <Checkbox.Group
        value={selectedCategories}
        onChange={(list) => {
          if (qs?.trim()) return;
          setSelectedCategories(list as string[]);
          setAppliedPrice(null);
          setCurrent(1);
        }}
        className={styles["category-group"]}
      >
        {categories.map((cat) => {
          const isFixed = initialCategoryIds.includes(cat.id as string);
          return (
            <Checkbox
              key={cat?.id}
              value={cat?.id}
              disabled={isFixed}
              className={styles["category-checkbox"]}
            >
              <span className={styles["label"]}>{cat?.name}</span>
            </Checkbox>
          );
        })}
      </Checkbox.Group>
      <Text className={styles["price-text"]}>PRICE RANGE</Text>
      <Divider style={{ marginTop: 10, marginBottom: 15 }} />
      <div className={styles["price-filter"]}>
        <div className={styles["price-values"]}>
          <Text className={styles["price-label"]}>Min</Text>
          <Text className={styles["price-label"]}>Max</Text>
        </div>
        <Slider
          range
          min={minPrice}
          max={maxPrice}
          step={0.01}
          value={priceRange}
          onChange={(value) => {
            if (qs?.trim()) return;
            setPriceRange(value as [number, number]);
          }}
          tooltip={{
            formatter: (value) => `$${formatterNumber(value)}`,
          }}
          className={styles["custom-slider"]}
        />
        <div className={styles["price-inputs"]}>
          <InputNumber
            min={minPrice}
            max={maxPrice}
            className={styles["price-input"]}
            readOnly
            value={priceRange[0]}
            formatter={formatterNumber}
            parser={parserNumber}
          />
          <span className={styles["dash"]}>—</span>
          <InputNumber
            min={minPrice}
            max={maxPrice}
            readOnly
            value={priceRange[1]}
            formatter={formatterNumber}
            className={styles["price-input"]}
            parser={parserNumber}
          />
        </div>
        <div className={styles["price-actions"]}>
          <Button
            type="primary"
            block
            onClick={() => {
              if (qs?.trim()) return;
              setAppliedPrice(priceRange);
              setCurrent(1);
            }}
          >
            Apply
          </Button>
          <Button
            block
            onClick={() => {
              if (qs?.trim()) return;
              if (priceData?.data?.result) {
                setPriceRange([
                  priceData.data.result[0] - 1,
                  priceData.data.result[1] + 1,
                ]);
              }
              setAppliedPrice(null);
              setCurrent(1);
            }}
          >
            Reset
          </Button>
        </div>
      </div>
      <Text className={styles["category-text"]}>BRAND</Text>
      <Divider style={{ marginTop: 10, marginBottom: 15 }} />
      <Checkbox.Group
        value={selectedBrands}
        onChange={(list) => {
          if (qs?.trim()) return;
          setSelectedBrands(list as string[]);
          setAppliedPrice(null);
          setCurrent(1);
        }}
        className={styles["category-group"]}
      >
        {brands.map((brand) => (
          <Checkbox
            key={brand}
            value={brand}
            className={styles["category-checkbox"]}
          >
            <span className={styles["label"]}>{brand}</span>
          </Checkbox>
        ))}
      </Checkbox.Group>
    </>
  );

  const clearAllFilters = () => {
    if (qs?.trim()) return;
    setSelectedCategories(initialCategoryIds);
    setSelectedBrands([]);
    setSortOption("default");
    setAppliedPrice(null);
    setCurrent(1);
  };

  return (
    <div>
      <Flex justify="space-between" align="center">
        <PreviousPage previousPages={breadcrumbItems} />
        {!screen.lg && (
          <div
            className={styles["filter-btn"]}
            onClick={() => setOpenDrawer(true)}
          >
            <FilterOutlined className={styles["filter-icon"]} />
          </div>
        )}
      </Flex>
      <Row gutter={screen.xs ? [0, 0] : [10, 10]}>
        <Col lg={6} sm={0} xs={0}>
          <div className={styles["wrapper"]}>{filter}</div>
        </Col>
        <Col lg={18} sm={24} xs={24}>
          <div className={styles["wrapper"]}>
            <Row justify="space-between" align="middle">
              <Col>
                <Row align="middle">
                  <Col>
                    <Text className={styles["found-text"]}>
                      Found{" "}
                      <span style={{ color: "#0090d0" }}>
                        {data?.data?.meta?.total ?? 0}
                      </span>{" "}
                      Product(s)
                    </Text>
                  </Col>
                  <Col>
                    <Button
                      type="text"
                      icon={<DeleteOutlined />}
                      onClick={clearAllFilters}
                      style={{ color: "#ff4d4f", fontSize: 18 }}
                      title="Clear all filters"
                    />
                  </Col>
                </Row>
              </Col>
              <Col>
                <Select
                  value={sortOption}
                  onChange={(value) => {
                    setSortOption(value);
                    setCurrent(1);
                  }}
                  style={{ width: 145 }}
                >
                  <Option value="default">Sort product by</Option>
                  <Option value="createdAt">Newest</Option>
                  <Option value="-price">Price: Low → High</Option>
                  <Option value="price">Price: High → Low</Option>
                  <Option value="rating">Most rated products</Option>
                  <Option value="-product.name">Name: A → Z</Option>
                </Select>
              </Col>
            </Row>
            {isLoading ? (
              <div className={styles["product-list"]}>
                {Array.from({ length: pageSize }).map((_, index) => (
                  <div key={index} className={styles["product-item"]}>
                    <CardSkeleton />
                  </div>
                ))}
              </div>
            ) : !data?.data?.result ? (
              <div className={styles["empty-wrapper"]}>
                <Empty description="No products found" />
              </div>
            ) : (
              <div className={styles["product-list"]}>
                {data?.data?.result?.map((item) => (
                  <div key={item.id} className={styles["product-item"]}>
                    <ProductCard variant={item} />
                  </div>
                ))}
              </div>
            )}
            {data?.data?.result && (
              <div className={styles["pagination-wrapper"]}>
                <Pagination
                  current={current}
                  pageSize={pageSize}
                  total={data?.data?.meta?.total ?? 0}
                  onChange={(page) => setCurrent(page)}
                  showSizeChanger={false}
                />
              </div>
            )}
          </div>
        </Col>
      </Row>
      <Drawer
        {...(screen.xs ? { width: "95%" } : {})}
        placement="right"
        onClose={() => setOpenDrawer(false)}
        open={openDrawer}
      >
        {filter}
      </Drawer>
    </div>
  );
};

export default FilterPage;
