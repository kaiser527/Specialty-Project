import { IRole } from "@/types/backend";
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
import { useDeleteRoleMutation, useFetchRoleQuery } from "@/redux/api/RoleApi";
import { dateRangeValidate, FORMATE_DATE } from "@/config/helpers/global";
import { useMessage } from "@/hooks/useMessage";
import ModalRole from "@/components/admin/role/modal.role";

const RolePage = () => {
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [qs, setQs] = useState<string>("");
  const [roleId, setRoleId] = useState<string | null>(null);

  const [deleteRole] = useDeleteRoleMutation();

  const { isLoading, data } = useFetchRoleQuery(qs || skipToken);
  const Roles = data?.data?.result;
  const meta = data?.data?.meta;

  const { messageApi, notificationApi } = useMessage();

  const handleDeleteRole = async (_id: string | undefined) => {
    if (_id) {
      const res = await deleteRole({ _id }).unwrap();
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

  const columns: ProColumns<IRole>[] = [
    {
      title: "Name",
      dataIndex: "name",
      sorter: true,
    },
    {
      title: "Status",
      dataIndex: "isActive",
      valueType: "select",
      valueEnum: {
        true: { text: "Active" },
        false: { text: "InActive" },
      },
      sorter: true,
      render(dom, entity, index, action, schema) {
        return (
          <>
            <Tag color={entity.isActive ? "lime" : "red"}>
              {entity.isActive ? "ACTIVE" : "INACTIVE"}
            </Tag>
          </>
        );
      },
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
          <Access permission={ALL_PERMISSIONS.ROLES.UPDATE} hideChildren>
            <EditOutlined
              style={{
                fontSize: 20,
                color: "#ffa500",
              }}
              type=""
              onClick={() => {
                setRoleId(entity._id ?? "");
                setOpenModal(true);
              }}
            />
          </Access>
          <Access permission={ALL_PERMISSIONS.ROLES.DELETE} hideChildren>
            <Popconfirm
              placement="leftTop"
              title={"Delete confirmation"}
              description={"Are you sure to delete this Role ?"}
              onConfirm={() => handleDeleteRole(entity._id)}
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
    if (clone.isActive !== undefined) {
      clone.isActive = clone.isActive === "true";
    }

    const createdDateRange = dateRangeValidate(clone.createdAtRange);
    const updatedDateRange = dateRangeValidate(clone.updatedAtRange);

    delete clone.createdAtRange;
    delete clone.updatedAtRange;

    let temp = queryString.stringify(clone);

    let sortBy = "";

    if (sort?.name) {
      sortBy = sort.name === "ascend" ? "sort=name" : "sort=-name";
    }

    if (sort?.isActive) {
      sortBy = sort.isActive === "ascend" ? "sort=isActive" : "sort=-isActive";
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
      <Access permission={ALL_PERMISSIONS.ROLES.GET_PAGINATE}>
        <DataTable<IRole>
          headerTitle="Roles List"
          rowKey="_id"
          loading={isLoading}
          columns={columns}
          dataSource={Roles ?? []}
          request={async (params, sort, filter): Promise<any> => {
            const query = buildQuery(params, sort, filter);
            setQs(query);
            return {
              data: Roles ?? [],
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
              <Access permission={ALL_PERMISSIONS.ROLES.CREATE} hideChildren>
                <Button
                  icon={<PlusOutlined />}
                  type="primary"
                  onClick={() => {
                    setRoleId(null);
                    setOpenModal(true);
                  }}
                >
                  Add new
                </Button>
              </Access>
            );
          }}
        />
      </Access>
      <ModalRole
        openModal={openModal}
        setOpenModal={setOpenModal}
        roleId={roleId}
        setRoleId={setRoleId}
      />
    </div>
  );
};

export default RolePage;
