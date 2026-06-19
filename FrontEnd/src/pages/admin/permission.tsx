import { IPermission } from "@/types/backend";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { ProColumns } from "@ant-design/pro-components";
import { Button, Popconfirm, Space, Tag } from "antd";
import { useState } from "react";
import dayjs from "dayjs";
import queryString from "query-string";
import { skipToken } from "@reduxjs/toolkit/query";
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/constants/permissions";
import DataTable from "@/components/admin/extra/protable";
import {
  useDeletePermissionMutation,
  useFetchPermissionQuery,
} from "@/redux/api/PermissionApi";
import {
  colorMethod,
  dateRangeValidate,
  FORMATE_DATE,
} from "@/config/helpers/global";
import { useMessage } from "@/hooks/useMessage";
import ModalPermission from "@/components/admin/permission/permission.modal";
import ViewDetailPermission from "@/components/admin/permission/permission.view";

const PermissionPage = () => {
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [dataInit, setDataInit] = useState<IPermission | null>(null);
  const [openViewDetail, setOpenViewDetail] = useState<boolean>(false);
  const [qs, setQs] = useState<string>("");

  const [deletePermission] = useDeletePermissionMutation();

  const { isLoading, data } = useFetchPermissionQuery(qs || skipToken);
  const Permissions = data?.data?.result;
  const meta = data?.data?.meta;

  const { messageApi, notificationApi } = useMessage();

  const handleDeletePermission = async (_id: string | undefined) => {
    if (_id) {
      const res = await deletePermission({ _id }).unwrap();
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

  const columns: ProColumns<IPermission>[] = [
    {
      title: "Name",
      dataIndex: "name",
      sorter: true,
      render: (text, record, index, action) => {
        return (
          <a
            href="#"
            onClick={() => {
              setOpenViewDetail(true);
              setDataInit(record);
            }}
          >
            {record.name}
          </a>
        );
      },
    },
    {
      title: "API",
      dataIndex: "apiPath",
      sorter: true,
    },
    {
      title: "Method",
      dataIndex: "method",
      valueType: "select",
      valueEnum: {
        GET: { text: "GET" },
        POST: { text: "POST" },
        PATCH: { text: "PATCH" },
        DELETE: { text: "DELETE" },
      },
      sorter: true,
      render(dom, entity, index, action, schema) {
        return (
          <p
            style={{
              paddingLeft: 10,
              fontWeight: "bold",
              marginBottom: 0,
              color: colorMethod(entity?.method as string),
            }}
          >
            {entity?.method || ""}
          </p>
        );
      },
    },
    {
      title: "Module",
      dataIndex: "module",
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
          <Access permission={ALL_PERMISSIONS.PERMISSIONS.UPDATE} hideChildren>
            <EditOutlined
              style={{
                fontSize: 20,
                color: "#ffa500",
              }}
              type=""
              onClick={() => {
                setDataInit(entity);
                setOpenModal(true);
              }}
            />
          </Access>
          <Access permission={ALL_PERMISSIONS.PERMISSIONS.DELETE} hideChildren>
            <Popconfirm
              placement="leftTop"
              title={"Delete confirmation"}
              description={"Are you sure to delete this Permission ?"}
              onConfirm={() => handleDeletePermission(entity._id)}
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

  const buildQuery = (params: any, sort: any, filter: any) => {
    const clone = { ...params };

    if (clone.name) clone.name = `/${clone.name}/i`;
    if (clone.apiPath) clone.apiPath = `/${clone.apiPath}/i`;
    if (clone.method) clone.method = `/${clone.method}/i`;
    if (clone.module) clone.module = `/${clone.module}/i`;

    const createdDateRange = dateRangeValidate(clone.createdAtRange);
    const updatedDateRange = dateRangeValidate(clone.updatedAtRange);

    delete clone.createdAtRange;
    delete clone.updatedAtRange;

    let temp = queryString.stringify(clone);

    let sortBy = "";

    if (sort?.name) {
      sortBy = sort.name === "ascend" ? "sort=name" : "sort=-name";
    }

    if (sort?.apiPath) {
      sortBy = sort.apiPath === "ascend" ? "sort=apiPath" : "sort=-apiPath";
    }

    if (sort?.method) {
      sortBy = sort.method === "ascend" ? "sort=method" : "sort=-method";
    }

    if (sort?.module) {
      sortBy = sort.module === "ascend" ? "sort=module" : "sort=-module";
    }

    if (sort?.createdAt) {
      sortBy =
        sort.createdAt === "ascend" ? "sort=createdAt" : "sort=-createdAt";
    }

    if (sort?.updatedAt) {
      sortBy =
        sort.updatedAt === "ascend" ? "sort=updatedAt" : "sort=-updatedAt";
    }

    if (!sortBy) {
      temp += "&sort=-updatedAt";
    } else {
      temp += `&${sortBy}`;
    }

    if (createdDateRange) {
      temp += `&createdAt>=${createdDateRange[0]}&createdAt<=${createdDateRange[1]}`;
    }

    if (updatedDateRange) {
      temp += `&updatedAt>=${updatedDateRange[0]}&updatedAt<=${updatedDateRange[1]}`;
    }

    return temp;
  };

  return (
    <div>
      <Access permission={ALL_PERMISSIONS.PERMISSIONS.GET_PAGINATE}>
        <DataTable<IPermission>
          headerTitle="Permissions List"
          rowKey="_id"
          loading={isLoading}
          columns={columns}
          dataSource={Permissions ?? []}
          request={async (params, sort, filter): Promise<any> => {
            const query = buildQuery(params, sort, filter);
            setQs(query);
            return {
              data: Permissions ?? [],
              success: true,
              total: meta?.total ?? 0,
            };
          }}
          scroll={{ x: true }}
          pagination={{
            current: meta?.current ?? 1,
            pageSize: meta?.pageSize ?? 10,
            showSizeChanger: true,
            total: meta?.total ?? 10,
            showTotal: (total, range) => {
              return (
                <div>
                  {range[0]}-{range[1]} per {total} rows
                </div>
              );
            },
          }}
          rowSelection={false}
          toolBarRender={(_action, _rows): any => {
            return (
              <Access
                permission={ALL_PERMISSIONS.PERMISSIONS.CREATE}
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
        />
      </Access>
      <ModalPermission
        openModal={openModal}
        setOpenModal={setOpenModal}
        dataInit={dataInit}
        setDataInit={setDataInit}
      />
      <ViewDetailPermission
        onClose={setOpenViewDetail}
        open={openViewDetail}
        dataInit={dataInit}
        setDataInit={setDataInit}
      />
    </div>
  );
};

export default PermissionPage;
