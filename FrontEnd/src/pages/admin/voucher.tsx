import DataTable from "@/components/admin/extra/protable";
import VoucherModal from "@/components/admin/voucher/voucher.modal";
import Access from "@/components/share/access";
import { ALL_PERMISSIONS } from "@/config/constants/permissions";
import {
  dateRangeValidate,
  formatCurrency,
  FORMATE_DATE,
} from "@/config/helpers/global";
import { useMessage } from "@/hooks/useMessage";
import {
  useDeleteVoucherMutation,
  useFetchVoucherQuery,
} from "@/redux/api/voucherApi";
import { IVoucher } from "@/types/backend";
import { DeleteOutlined, EditOutlined, PlusOutlined } from "@ant-design/icons";
import { ProColumns } from "@ant-design/pro-components";
import { skipToken } from "@reduxjs/toolkit/query";
import { Button, Popconfirm, Space, Tag, Typography } from "antd";
import dayjs from "dayjs";
import { useState } from "react";

interface ISearch {
  code: string;
  expirationDateRange: Date;
  createdAtRange: Date;
  updatedAtRange: Date;
}

const { Text } = Typography;

const PAGE_SIZE = 10;

const VoucherPage = () => {
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [dataInit, setDataInit] = useState<IVoucher | null>(null);
  const [qs, setQs] = useState<string>("");

  const [deleteVoucher] = useDeleteVoucherMutation();

  const { isLoading, data } = useFetchVoucherQuery(qs || skipToken);
  const vouchers = data?.data?.result;
  const meta = data?.data?.meta;

  const { messageApi, notificationApi } = useMessage();

  const handleDeleteVoucher = async (id: string | undefined) => {
    if (id) {
      const res = await deleteVoucher({ id }).unwrap();
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

  const columns: ProColumns<IVoucher>[] = [
    {
      title: "Code",
      dataIndex: "code",
      sorter: true,
      width: 300,
      render: (text, record, index, action) => {
        return (
          <Text
            copyable
            onClick={() => {
              setDataInit(record);
            }}
          >
            {record.code}
          </Text>
        );
      },
    },
    {
      title: "Discount",
      dataIndex: "discountAmount",
      sorter: true,
      hideInSearch: true,
      render: (_value, entity, _index, _action) => (
        <>{formatCurrency(entity.discountAmount)}</>
      ),
    },
    {
      title: "Status",
      dataIndex: "active",
      sorter: true,
      hideInSearch: true,
      render: (text, record, index, action) => (
        <Tag color={record.active ? "success" : "error"}>
          {record.active ? "Active" : "Inactive"}
        </Tag>
      ),
    },
    {
      title: "Expiry Date",
      dataIndex: "expirationDate",
      width: 200,
      sorter: true,
      render: (text, record, index, action) => {
        return <>{dayjs(record.expirationDate).format(FORMATE_DATE)}</>;
      },
      hideInSearch: true,
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
      title: "Expiry Date range",
      dataIndex: "expirationDateRange",
      key: "expirationDateRange",
      valueType: "dateRange",
      hideInTable: true,
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
          <Access permission={ALL_PERMISSIONS.VOUCHERS.UPDATE} hideChildren>
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
          <Access permission={ALL_PERMISSIONS.VOUCHERS.DELETE} hideChildren>
            <Popconfirm
              placement="leftTop"
              title={"Delete confirmation"}
              description={"Are you sure to delete this voucher ?"}
              onConfirm={() => handleDeleteVoucher(entity.id)}
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
      <Access permission={ALL_PERMISSIONS.VOUCHERS.GET_PAGINATE}>
        <DataTable<any, ISearch>
          defaultData={vouchers}
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
          headerTitle="List Vouchers"
          rowKey="id"
          loading={isLoading}
          bordered
          dataSource={vouchers}
          rowSelection={false}
          request={async (params, sort): Promise<any> => {
            let query = "";
            if (params) {
              const queryParams = [
                { key: "current", value: params.current },
                { key: "pageSize", value: params.pageSize },
                { key: "code", value: params.code },
              ];
              queryParams.forEach((param) => {
                if (param.value) {
                  query += `&${param.key}=${param.value}`;
                }
              });
              const sortFields = [
                "createdAt",
                "updatedAt",
                "code",
                "discountAmount",
                "expirationDate",
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
                query += `&createdAt=${createdDateRange[0]}&createdAt=${createdDateRange[1]}`;
              }
              const updatedDateRange = dateRangeValidate(params.updatedAtRange);
              if (updatedDateRange) {
                query += `&updatedAt=${updatedDateRange[0]}&updatedAt=${updatedDateRange[1]}`;
              }
              const expirationDateRange = dateRangeValidate(
                params.expirationDateRange
              );
              if (expirationDateRange) {
                query += `&expirationDate=${expirationDateRange[0]}&expirationDate=${expirationDateRange[1]}`;
              }
            }
            setQs(query);
          }}
          toolBarRender={(_action, _rows): any => {
            return (
              <Access permission={ALL_PERMISSIONS.VOUCHERS.CREATE} hideChildren>
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
      <VoucherModal
        dataInit={dataInit}
        setDataInit={setDataInit}
        openModal={openModal}
        setOpenModal={setOpenModal}
      />
    </div>
  );
};

export default VoucherPage;
