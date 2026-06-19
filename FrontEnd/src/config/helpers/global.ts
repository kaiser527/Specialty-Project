import dayjs from "dayjs";
import { grey, green, blue, red, purple, gray } from "@ant-design/colors";
import { IAiQs, IVariant } from "@/types/backend";

export const FORMATE_DATE = "YYYY-MM-DD";

export const dateRangeValidate = (dateRange: any) => {
  if (!dateRange) return undefined;

  const startDate = dayjs(dateRange[0], FORMATE_DATE)
    .startOf("day")
    .format(FORMATE_DATE);

  const endDate = dayjs(dateRange[1], FORMATE_DATE)
    .endOf("day")
    .format(FORMATE_DATE);

  return [startDate, endDate];
};

export const colorMethod = (
  method: "POST" | "PUT" | "GET" | "DELETE" | string
) => {
  switch (method) {
    case "POST":
      return green[6];
    case "PATCH":
      return purple[6];
    case "GET":
      return blue[6];
    case "DELETE":
      return red[6];
    default:
      return grey[10];
  }
};

export const colorMethodGradient = (
  method: "POST" | "PUT" | "GET" | "DELETE" | string
) => {
  switch (method) {
    case "POST":
      return `linear-gradient(135deg, ${green[5]}, ${green[7]})`;
    case "PATCH":
      return `linear-gradient(135deg, ${purple[5]}, ${purple[7]})`;
    case "GET":
      return `linear-gradient(135deg, ${blue[5]}, ${blue[7]})`;
    case "DELETE":
      return `linear-gradient(135deg, ${red[5]}, ${red[7]})`;
    default:
      return `linear-gradient(135deg, ${gray[5]}, ${gray[7]})`;
  }
};

export const parserNumber = (val?: string) => {
  if (!val) return 0;
  return Number(val.replace(/,/g, ""));
};

export const formatterNumber = (val?: string | number) => {
  if (val === undefined || val === null) return "";

  const num = typeof val === "number" ? val : Number(val.replace(/,/g, ""));

  if (isNaN(num)) return "";

  return Number(num.toFixed(2)).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const buildVariantName = (variant: IVariant) => {
  const productName = variant?.product?.name || "";

  const attrs = Object.values(variant?.attributes || {}).join(" / ");

  return `${productName} - ${attrs}`;
};

export const getFinalPrice = (variant: IVariant) => {
  if (!variant?.discount) return variant?.price;

  return variant?.price * (1 - variant?.discount / 100);
};

export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(value);
};

export const parseQs = (qsString: string | null) => {
  const result: IAiQs = {
    brands: [],
    priceOperators: [],
    createdBy: [],
    updatedBy: [],
    createdAtOperators: [],
    updatedAtOperators: [],
    dueDateOperators: [],
    names: [],
    categories: [],
    nameRegex: "",
  };

  if (!qsString) return result;

  const decodedQs = decodeURIComponent(qsString);
  const pairs = decodedQs.split("&");

  pairs.forEach((pair) => {
    const priceMatch = pair.match(/^price(>=|<=|>|<|=)([\d.]+)$/);

    if (priceMatch) {
      result.priceOperators.push({
        operator: priceMatch[1],
        value: parseFloat(priceMatch[2]),
      });

      return;
    }

    const createdAtMatch = pair.match(/^createdAt(>=|<=|>|<|=)(.+)$/);

    if (createdAtMatch) {
      result.createdAtOperators.push({
        operator: createdAtMatch[1],
        value: createdAtMatch[2],
      });

      return;
    }

    const updatedAtMatch = pair.match(/^updatedAt(>=|<=|>|<|=)(.+)$/);

    if (updatedAtMatch) {
      result.updatedAtOperators.push({
        operator: updatedAtMatch[1],
        value: updatedAtMatch[2],
      });

      return;
    }

    const dueDateMatch = pair.match(/^dueDate(>=|<=|>|<|=)(.+)$/);

    if (dueDateMatch) {
      result.dueDateOperators.push({
        operator: dueDateMatch[1],
        value: dueDateMatch[2],
      });

      return;
    }

    const [key, val] = pair.split("=");

    if (!key || !val) return;

    const values = val.split(",");
    const isRegexVal = /^\/.*\/i$/.test(val);

    if (key === "product.brand") {
      result.brands = values;
    }

    if (key === "product.createdBy") {
      result.createdBy = values;
    }

    if (key === "product.updatedBy") {
      result.updatedBy = values;
    }

    if (key === "product.name") {
      if (isRegexVal) {
        result.nameRegex = val;
      } else {
        result.names = values;
      }
    }

    if (key === "category") {
      result.categories = values;
    }
  });

  return result;
};
