import DataTable from "@/components/admin/extra/protable";
import ImportProductModal from "@/components/admin/product/import-product.modal";
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/constants/permissions";
import { statusColors } from "@/config/constants/utils";
import { dateRangeValidate, FORMATE_DATE } from "@/config/helpers/global";
import { useGetAccount } from "@/hooks/useGetAccount";
import { useMessage } from "@/hooks/useMessage";
import {
  useDeleteProductMutation,
  useFetchProductQuery,
} from "@/redux/api/productApi";
import { IProduct } from "@/types/backend";
import {
  DeleteOutlined,
  EditOutlined,
  ImportOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { ProColumns } from "@ant-design/pro-components";
import { skipToken } from "@reduxjs/toolkit/query";
import { Button, Popconfirm, Space, Tag } from "antd";
import dayjs from "dayjs";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

interface ISearch {
  name: string;
  brand: string;
  status: string;
  createdBy: string;
  sku: string;
  category: string;
  createdAtRange: Date;
  updatedAtRange: Date;
}

const ProductPage = () => {
  const PAGE_SIZE = 10;

  const [qs, setQs] = useState<string>("");
  const [openModal, setOpenModal] = useState(false);

  const [deleteProduct] = useDeleteProductMutation();

  const { user } = useGetAccount();

  const { isLoading, data } = useFetchProductQuery(qs || skipToken);
  const products = data?.data?.result;
  const meta = data?.data?.meta;

  const navigate = useNavigate();

  const dataSource = products?.map((item) => {
    return {
      ...item,
      category: item?.category?.name,
      categoryId: item?.category?.id,
    };
  });

  const { messageApi, notificationApi } = useMessage();

  const handleDeleteProduct = async (id: string | undefined) => {
    if (id) {
      const res = await deleteProduct({ id }).unwrap();
      if (res?.data) {
        messageApi.success(res.message);
      } else {
        notificationApi.error({
          message: "Error occured",
          description: res.message,
        });
      }
    }
  };

  const columns: ProColumns<IProduct>[] = [
    {
      title: "Name",
      dataIndex: "name",
      sorter: true,
      width: 300,
    },
    {
      title: "Category",
      dataIndex: "category",
      sorter: true,
    },
    {
      title: "Brand",
      dataIndex: "brand",
      sorter: true,
    },
    {
      title: "Status",
      dataIndex: "status",
      valueType: "select",
      valueEnum: {
        APPROVED: { text: "Approved" },
        PENDING: { text: "Pending" },
        REJECTED: { text: "Rejected" },
      },
      sorter: true,
      render: (_value, record) => {
        const status = record?.status;
        return <Tag color={statusColors[status] || "default"}>{status}</Tag>;
      },
    },
    {
      title: "Created by",
      dataIndex: "createdBy",
      hideInTable: true,
    },
    {
      title: "CreatedAt",
      dataIndex: "createdAt",
      width: 200,
      sorter: true,
      render: (text, record, index, action) => {
        return <>{dayjs(record.createdAt).format(FORMATE_DATE)}</>;
      },
      hideInSearch: true,
    },
    {
      title: "UpdatedAt",
      dataIndex: "updatedAt",
      width: 200,
      sorter: true,
      render: (text, record, index, action) => {
        return <>{dayjs(record.updatedAt).format(FORMATE_DATE)}</>;
      },
      hideInSearch: true,
    },
    {
      title: "Created at range",
      dataIndex: "createdAtRange",
      key: "createdAtRange",
      valueType: "dateRange",
      hideInTable: true,
    },
    {
      title: "Updated at range",
      dataIndex: "updatedAtRange",
      key: "updatedAtRange",
      valueType: "dateRange",
      hideInTable: true,
    },
    {
      title: "SKU",
      dataIndex: "sku",
      key: "sku",
      hideInTable: true,
    },
    {
      title: "Actions",
      hideInSearch: true,
      width: 50,
      render: (_value, entity, _index, _action) => {
        const isShow =
          user.role.name === "PROVIDER" &&
          entity.createdBy === user.email &&
          (entity.status === "APPROVED" || entity.status === "REJECTED");
        return (
          <Space>
            <Access permission={ALL_PERMISSIONS.PRODUCTS.UPDATE} hideChildren>
              <EditOutlined
                style={{
                  fontSize: 20,
                  color: "#ffa500",
                }}
                type=""
                onClick={() => {
                  navigate(`/admin/product/upsert?id=${entity.id}`);
                }}
              />
            </Access>
            {!isShow && (
              <Access permission={ALL_PERMISSIONS.PRODUCTS.DELETE} hideChildren>
                <Popconfirm
                  placement="leftTop"
                  title={"Delete confirmation"}
                  description={"Are you sure to delete this Product ?"}
                  onConfirm={() => handleDeleteProduct(entity.id)}
                  okText="Confirm"
                  cancelText="Cancel"
                >
                  <span style={{ cursor: "pointer", margin: "0 10px" }}>
                    <DeleteOutlined
                      style={{
                        fontSize: 20,
                        color: "#ff4d4f",
                      }}
                    />
                  </span>
                </Popconfirm>
              </Access>
            )}
          </Space>
        );
      },
    },
  ];

  return (
    <div>
      <Access permission={ALL_PERMISSIONS.PRODUCTS.GET_PAGINATE}>
        <DataTable<any, ISearch>
          defaultData={dataSource}
          pagination={{
            defaultPageSize: PAGE_SIZE,
            current: meta?.current ?? 1,
            total: meta?.total ?? 10,
            showSizeChanger: true,
            showTotal: (total, range) => {
              return (
                <div>
                  {range[0]}-{range[1]} per {total} rows
                </div>
              );
            },
          }}
          scroll={{ x: true }}
          headerTitle="List Products"
          rowKey="id"
          loading={isLoading}
          bordered
          dataSource={dataSource}
          rowSelection={false}
          request={async (params, sort): Promise<any> => {
            let query = "";
            if (params) {
              const queryParams = [
                { key: "current", value: params.current },
                { key: "status", value: params.status },
                { key: "pageSize", value: params.pageSize },
                { key: "createdBy", value: params.createdBy },
                { key: "name", value: params.name },
                { key: "category", value: params.category },
                { key: "brand", value: params.brand },
                { key: "sku", value: params.sku },
              ];
              queryParams.forEach((param) => {
                if (param.value) {
                  query += `&${param.key}=${param.value}`;
                }
              });
              const sortFields = [
                "createdAt",
                "updatedAt",
                "name",
                "brand",
                "category",
                "status",
              ];
              for (const field of sortFields) {
                if (sort[field]) {
                  query += `&sort=${
                    sort[field] === "ascend" ? field : "-" + field
                  }`;
                }
              }
              const createdDateRange = dateRangeValidate(params.createdAtRange);
              if (createdDateRange) {
                query += `&createdAt>=${createdDateRange[0]}&createdAt<=${createdDateRange[1]}`;
              }
              const updatedDateRange = dateRangeValidate(params.updatedAtRange);
              if (updatedDateRange) {
                query += `&updatedAt>=${updatedDateRange[0]}&updatedAt<=${updatedDateRange[1]}`;
              }
            }
            if (user.role.name === "PROVIDER") {
              query += `&createdBy=${user.email}`;
            }
            setQs(query);
          }}
          toolBarRender={(_action, _rows): any => {
            return (
              <>
                <Access
                  permission={ALL_PERMISSIONS.PRODUCTS.CREATE}
                  hideChildren
                >
                  <Button
                    icon={<PlusOutlined />}
                    type="primary"
                    onClick={() => navigate("upsert")}
                  >
                    Add new
                  </Button>
                </Access>
                <Access
                  permission={ALL_PERMISSIONS.PRODUCTS.IMPORT}
                  hideChildren
                >
                  <Button
                    style={{ backgroundColor: "#52c41a" }}
                    icon={<ImportOutlined />}
                    type="primary"
                    onClick={() => setOpenModal(true)}
                  >
                    Import CSV
                  </Button>
                </Access>
              </>
            );
          }}
          columns={columns}
        />
      </Access>
      <ImportProductModal setOpen={setOpenModal} open={openModal} />
    </div>
  );
};

export default ProductPage;
