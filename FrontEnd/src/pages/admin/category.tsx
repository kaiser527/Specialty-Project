import CategoryModal from "@/components/admin/category/category.modal";
import ViewDetailCategory from "@/components/admin/category/category.view";
import DataTable from "@/components/admin/extra/protable";
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/constants/permissions";
import { dateRangeValidate, FORMATE_DATE } from "@/config/helpers/global";
import { useMessage } from "@/hooks/useMessage";
import {
  useDeleteCategoryMutation,
  useFetchCategoryQuery,
} from "@/redux/api/CategoryApi";
import { ICategory } from "@/types/backend";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { ProColumns } from "@ant-design/pro-components";
import { skipToken } from "@reduxjs/toolkit/query";
import { Button, Popconfirm, Space } from "antd";
import dayjs from "dayjs";
import { useState } from "react";

interface ISearch {
  name: string;
  createdAtRange: Date;
  updatedAtRange: Date;
}

const CategoryPage = () => {
  const PAGE_SIZE = 10;

  const [openModal, setOpenModal] = useState<boolean>(false);
  const [dataInit, setDataInit] = useState<ICategory | null>(null);
  const [openViewDetail, setOpenViewDetail] = useState<boolean>(false);
  const [qs, setQs] = useState<string>("");

  const [deleteCategory] = useDeleteCategoryMutation();

  const { isLoading, data } = useFetchCategoryQuery(qs || skipToken);
  const categories = data?.data?.result;
  const meta = data?.data?.meta;

  const { messageApi, notificationApi } = useMessage();

  const handleDeleteCategory = async (id: string | undefined) => {
    if (id) {
      const res = await deleteCategory({ id }).unwrap();
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

  const columns: ProColumns<ICategory>[] = [
    {
      title: "Id",
      dataIndex: "id",
      sorter: true,
      width: 200,
      render: (text, record, index, action) => {
        return (
          <a
            href="#"
            onClick={() => {
              setOpenViewDetail(true);
              setDataInit(record);
            }}
          >
            {record.id}
          </a>
        );
      },
      hideInSearch: true,
    },
    {
      title: "Name",
      dataIndex: "name",
      width: 100,
      sorter: true,
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
      title: "Actions",
      hideInSearch: true,
      width: 50,
      render: (_value, entity, _index, _action) => (
        <Space>
          <Access permission={ALL_PERMISSIONS.CATEGORIES.UPDATE} hideChildren>
            <EditOutlined
              style={{
                fontSize: 20,
                color: "#ffa500",
              }}
              type=""
              onClick={() => {
                setOpenModal(true);
                setDataInit(entity);
              }}
            />
          </Access>
          <Access permission={ALL_PERMISSIONS.CATEGORIES.DELETE} hideChildren>
            <Popconfirm
              placement="leftTop"
              title={"Delete confirmation"}
              description={"Are you sure to delete this Category ?"}
              onConfirm={() => handleDeleteCategory(entity.id)}
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
        </Space>
      ),
    },
  ];

  return (
    <div>
      <Access permission={ALL_PERMISSIONS.CATEGORIES.GET_PAGINATE}>
        <DataTable<any, ISearch>
          defaultData={categories}
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
          headerTitle="List Categories"
          rowKey="id"
          loading={isLoading}
          bordered
          dataSource={categories}
          rowSelection={false}
          request={async (params, sort): Promise<any> => {
            let query = "";
            if (params) {
              const queryParams = [
                { key: "current", value: params.current },
                { key: "pageSize", value: params.pageSize },
                { key: "name", value: params.name },
              ];
              queryParams.forEach((param) => {
                if (param.value) {
                  query += `&${param.key}=${param.value}`;
                }
              });
              const sortFields = ["createdAt", "updatedAt", "name"];
              for (const field of sortFields) {
                if (sort[field]) {
                  query += `&sort=${
                    sort[field] === "ascend" ? field : "-" + field
                  }`;
                }
              }
              const createdDateRange = dateRangeValidate(params.createdAtRange);
              if (createdDateRange) {
                query += `&createdAt=${createdDateRange[0]}&createdAt=${createdDateRange[1]}`;
              }
              const updatedDateRange = dateRangeValidate(params.updatedAtRange);
              if (updatedDateRange) {
                query += `&updatedAt=${updatedDateRange[0]}&updatedAt=${updatedDateRange[1]}`;
              }
            }
            setQs(query);
          }}
          toolBarRender={(_action, _rows): any => {
            return (
              <Access
                permission={ALL_PERMISSIONS.CATEGORIES.CREATE}
                hideChildren
              >
                <Button
                  icon={<PlusOutlined />}
                  type="primary"
                  onClick={() => setOpenModal(true)}
                >
                  Add new
                </Button>
              </Access>
            );
          }}
          columns={columns}
        />
      </Access>
      <CategoryModal
        openModal={openModal}
        setOpenModal={setOpenModal}
        dataInit={dataInit}
        setDataInit={setDataInit}
      />
      <ViewDetailCategory
        onClose={setOpenViewDetail}
        open={openViewDetail}
        dataInit={dataInit}
        setDataInit={setDataInit}
      />
    </div>
  );
};

export default CategoryPage;
