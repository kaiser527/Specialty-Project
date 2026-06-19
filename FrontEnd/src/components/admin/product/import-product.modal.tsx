import { useBulkCreateProductMutation } from "@/redux/api/productApi";
import { IBulkCreateProduct } from "@/types/backend";
import {
  Button,
  Card,
  Modal,
  Space,
  Table,
  Tag,
  Typography,
  Upload,
} from "antd";
import { ReactNode, useState } from "react";
import Papa from "papaparse";
import { useMessage } from "@/hooks/useMessage";
import { UploadOutlined } from "@ant-design/icons";

interface IProps {
  open: boolean;
  setOpen: (v: boolean) => void;
}

const { Text } = Typography;

const ImportProductModal = ({ open, setOpen }: IProps) => {
  const [create, { isLoading }] = useBulkCreateProductMutation();

  const [data, setData] = useState<IBulkCreateProduct[]>([]);

  const { messageApi, notificationApi } = useMessage();

  const transformCsvToProducts = (rows: any[]): IBulkCreateProduct[] => {
    const map = new Map<string, IBulkCreateProduct>();

    rows.forEach((row) => {
      try {
        const attributes = JSON.parse(row.attributes || "{}");

        const variant = {
          price: Number(row.price),
          stock: Number(row.stock),
          attributes,
        };

        if (!map.has(row.name)) {
          map.set(row.name, {
            name: row.name,
            description: row.description,
            brand: row.brand,
            category: row.category,
            variants: [variant],
          });
        } else {
          map.get(row.name)!.variants.push(variant);
        }
      } catch (err) {
        messageApi.error("Parse error: " + err);
      }
    });

    return Array.from(map.values());
  };

  const uploadProps = {
    accept: ".csv",
    showUploadList: false,
    beforeUpload: (file: File) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          const grouped = transformCsvToProducts(results.data);
          setData(grouped);
          messageApi.success("CSV parsed successfully");
        },
      });

      return false;
    },
  };

  const productColumns = [
    {
      title: "Product",
      dataIndex: "name",
    },
    {
      title: "Category",
      dataIndex: "category",
      render: (v: string) => <Tag color="blue">{v}</Tag>,
    },
    {
      title: "Brand",
      dataIndex: "brand",
      render: (v: string) => <Tag color="purple">{v}</Tag>,
    },
    {
      title: "Variants",
      render: (_: any, record: IBulkCreateProduct) => (
        <Tag color="green">{record.variants.length} variants</Tag>
      ),
    },
  ];

  const variantColumns = [
    {
      title: "Price",
      dataIndex: "price",
      width: 120,
      render: (v: number) => (
        <Text strong style={{ color: "#1677ff" }}>
          ${v}
        </Text>
      ),
    },
    {
      title: "Stock",
      dataIndex: "stock",
      render: (v: number) => (
        <Tag color={v > 10 ? "green" : v > 0 ? "orange" : "red"}>
          {v} in stock
        </Tag>
      ),
    },
    {
      title: "Attributes",
      render: (_: any, record: any) => (
        <Space wrap>
          {Object.entries(record.attributes || {}).map(([k, v]) => (
            <Tag key={k}>
              {k}: {v as ReactNode}
            </Tag>
          ))}
        </Space>
      ),
    },
  ];

  const expandedRowRender = (product: IBulkCreateProduct) => {
    return (
      <Card
        size="small"
        style={{ margin: 0, borderRadius: 12 }}
        styles={{ body: { padding: 12 } }}
      >
        <Table
          columns={variantColumns}
          dataSource={product.variants}
          pagination={false}
          rowKey={(_, index) => index!}
        />
      </Card>
    );
  };

  const handleImport = async () => {
    const res = await create(data).unwrap();
    if (res?.data) {
      messageApi.success(res.message);
      setData([]);
      setOpen(false);
    } else {
      notificationApi.error({
        message: "Error occurred",
        description: res.message,
        duration: 5,
      });
    }
  };

  return (
    <Modal
      open={open}
      onCancel={() => setOpen(false)}
      onOk={handleImport}
      confirmLoading={isLoading}
      title="Import Products"
      width={800}
    >
      <Upload {...uploadProps}>
        <Button icon={<UploadOutlined />}>Upload CSV</Button>
      </Upload>
      <Table
        style={{ marginTop: 16 }}
        columns={productColumns}
        dataSource={data}
        rowKey="name"
        expandable={{
          expandedRowRender,
        }}
        scroll={{ x: true }}
        pagination={false}
        bordered
      />
    </Modal>
  );
};

export default ImportProductModal;
