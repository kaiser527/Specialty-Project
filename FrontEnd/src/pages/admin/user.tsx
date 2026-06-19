import { IUser } from "@/types/backend";
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
import { useDeleteUserMutation, useFetchUserQuery } from "@/redux/api/userApi";
import { roleColors } from "@/config/constants/utils";
import { dateRangeValidate, FORMATE_DATE } from "@/config/helpers/global";
import { useMessage } from "@/hooks/useMessage";
import ViewDetailUser from "@/components/admin/user/user.view";
import ModalUser from "@/components/admin/user/user.modal";

const UserPage = () => {
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [dataInit, setDataInit] = useState<IUser | null>(null);
  const [openViewDetail, setOpenViewDetail] = useState<boolean>(false);
  const [qs, setQs] = useState<string>("");

  const [deleteUser] = useDeleteUserMutation();

  const { isLoading, data } = useFetchUserQuery(qs || skipToken);
  const users = data?.data?.result;
  const meta = data?.data?.meta;

  const { messageApi, notificationApi } = useMessage();

  const handleDeleteUser = async (_id: string | undefined) => {
    if (_id) {
      const res = await deleteUser({ _id }).unwrap();
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

  const columns: ProColumns<IUser>[] = [
    {
      title: "Email",
      dataIndex: "email",
      sorter: true,
      width: 250,
      render: (text, record, index, action) => {
        return (
          <a
            href="#"
            onClick={() => {
              setOpenViewDetail(true);
              setDataInit(record);
            }}
          >
            {record.email}
          </a>
        );
      },
    },
    {
      title: "Name",
      dataIndex: "name",
      sorter: true,
    },
    {
      title: "Role",
      dataIndex: "role",
      valueType: "select",
      valueEnum: {
        ADMIN: { text: "ADMIN" },
        USER: { text: "USER" },
        STAFF: { text: "STAFF" },
        PROVIDER: { text: "PROVIDER" },
      },
      sorter: true,
      render: (_value, record) => {
        const role = record?.role?.name;

        return <Tag color={roleColors[role] || "default"}>{role}</Tag>;
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
          <Access permission={ALL_PERMISSIONS.USERS.UPDATE} hideChildren>
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
          <Access permission={ALL_PERMISSIONS.USERS.DELETE} hideChildren>
            <Popconfirm
              placement="leftTop"
              title={"Delete confirmation"}
              description={"Are you sure to delete this user ?"}
              onConfirm={() => handleDeleteUser(entity._id)}
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
    if (clone.email) clone.email = `/${clone.email}/i`;

    if (clone.role && typeof clone.role === "object") {
      clone["role.name"] = `/${clone.role.name}/i`;
      delete clone.role;
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

    if (sort?.email) {
      sortBy = sort.email === "ascend" ? "sort=email" : "sort=-email";
    }

    if (sort?.role) {
      sortBy = sort.role === "ascend" ? "sort=role" : "sort=-role";
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

    temp += "&populate=role&fields=role._id,role.name";

    return temp;
  };

  return (
    <div>
      <Access permission={ALL_PERMISSIONS.USERS.GET_PAGINATE}>
        <DataTable<IUser>
          headerTitle="Users List"
          rowKey="_id"
          loading={isLoading}
          columns={columns}
          dataSource={users ?? []}
          request={async (params, sort, filter): Promise<any> => {
            const query = buildQuery(params, sort, filter);
            setQs(query);
            return {
              data: users ?? [],
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
              <Access permission={ALL_PERMISSIONS.USERS.CREATE} hideChildren>
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
      <ModalUser
        openModal={openModal}
        setOpenModal={setOpenModal}
        dataInit={dataInit}
        setDataInit={setDataInit}
      />
      <ViewDetailUser
        onClose={setOpenViewDetail}
        open={openViewDetail}
        dataInit={dataInit}
        setDataInit={setDataInit}
      />
    </div>
  );
};

export default UserPage;
