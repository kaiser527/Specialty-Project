import {
  ModalForm,
  ProCard,
  ProFormSwitch,
  ProFormText,
  ProFormTextArea,
} from "@ant-design/pro-components";
import { Col, Form, Grid, Row } from "antd";
import { IPermission, IRole } from "@/types/backend";
import { CheckSquareOutlined } from "@ant-design/icons";
import ModuleApi from "./module.api";
import { useEffect, useMemo, useState } from "react";
import _ from "lodash";
import { useFetchPermissionQuery } from "@/redux/api/permissionApi";
import {
  useCreateRoleMutation,
  useFetchRoleByIdQuery,
  useUpdateRoleMutation,
} from "@/redux/api/roleApi";
import { skipToken } from "@reduxjs/toolkit/query";
import { useMessage } from "@/hooks/useMessage";

interface IProps {
  openModal: boolean;
  setOpenModal: (v: boolean) => void;
  roleId: string | null;
  setRoleId: (v: string | null) => void;
}

const { useBreakpoint } = Grid;

const ModalRole = (props: IProps) => {
  const screens = useBreakpoint();

  const [create, { isLoading: isLoadingCreate }] = useCreateRoleMutation();
  const [update, { isLoading: isLoadingUpdate }] = useUpdateRoleMutation();
  const isSubmitting = isLoadingCreate || isLoadingUpdate;

  const { openModal, setOpenModal, roleId, setRoleId } = props;

  const [form] = Form.useForm();

  const { messageApi, notificationApi } = useMessage();

  const [singleRole, setSingleRole] = useState<IRole | null>(null);

  const { data: role, refetch } = useFetchRoleByIdQuery(
    openModal && roleId ? roleId : skipToken
  );

  const groupByPermission = (data: any) => {
    return _(data)
      .groupBy((x) => x.module)
      .map((value, key) => {
        return { module: key, permissions: value as IPermission[] };
      })
      .value();
  };

  const { data } = useFetchPermissionQuery("pageSize=100&current=1");
  const listPermissions = useMemo(
    () => groupByPermission(data?.data?.result ?? []),
    [data]
  );

  useEffect(() => {
    if (role?.data && openModal) {
      setSingleRole(role.data);
    }
  }, [role, openModal]);

  useEffect(() => {
    if (!roleId) {
      setSingleRole(null);
    }
  }, [openModal]);

  useEffect(() => {
    if (!listPermissions?.length || !singleRole?._id) return;
    const permissionsObj: Record<string, boolean> = {};
    listPermissions.forEach((module) => {
      let allChecked = true;
      module.permissions.forEach((perm) => {
        //@ts-ignore
        const exists = singleRole.permissions.some((sp) => sp._id === perm._id);
        permissionsObj[perm._id ?? ""] = exists;
        if (!exists) allChecked = false;
      });

      permissionsObj[module.module] = allChecked;
    });
    form.setFieldsValue({
      name: singleRole.name,
      isActive: singleRole.isActive,
      description: singleRole.description,
      permissions: permissionsObj,
    });
  }, [openModal, singleRole]);

  const submitRole = async (valuesForm: any) => {
    const { permissions, name, ...rest } = valuesForm;
    const checkedPermissions = [];
    if (permissions) {
      for (const key in permissions) {
        if (key.match(/^[0-9a-fA-F]{24}$/) && permissions[key] === true) {
          checkedPermissions.push(key);
        }
      }
    }
    const res =
      singleRole && singleRole._id
        ? await update({
            _id: singleRole._id,
            role: { ...rest, permissions: checkedPermissions },
          }).unwrap()
        : await create({
            ...rest,
            name,
            permissions: checkedPermissions,
          }).unwrap();
    if (res?.data) {
      messageApi.success(res.message);
      handleReset();
      refetch();
    } else {
      notificationApi.error({
        message: "Error occured!",
        description: res.message,
        duration: 3,
      });
    }
  };

  const handleReset = async () => {
    form.resetFields();
    setSingleRole(null);
    setOpenModal(false);
    setRoleId(null);
  };

  return (
    <>
      <ModalForm
        title={<>{singleRole?._id ? "Update Role" : "Create Role"}</>}
        open={openModal}
        modalProps={{
          onCancel: () => {
            handleReset();
          },
          confirmLoading: isSubmitting,
          afterClose: () => handleReset(),
          width: screens.xs ? "100%" : 720,
          keyboard: false,
          maskClosable: false,
        }}
        scrollToFirstError={true}
        preserve={false}
        form={form}
        onFinish={submitRole}
        submitter={{
          submitButtonProps: {
            loading: isSubmitting,
            icon: <CheckSquareOutlined />,
          },
          searchConfig: {
            resetText: "Cancel",
            submitText: singleRole?._id ? "Update" : "Create",
          },
        }}
      >
        <Row gutter={16}>
          <Col lg={12} md={12} sm={24} xs={24}>
            <ProFormText
              disabled={singleRole?._id ? true : false}
              label="Role Name"
              name="name"
              rules={[{ required: true }]}
              placeholder="Enter name"
            />
          </Col>
          <Col lg={12} md={12} sm={24} xs={24}>
            <ProFormSwitch
              label="Status"
              name="isActive"
              checkedChildren="ACTIVE"
              unCheckedChildren="INACTIVE"
            />
          </Col>

          <Col span={24}>
            <ProFormTextArea
              label="Description"
              name="description"
              rules={[{ required: true }]}
              placeholder="Enter role description"
              fieldProps={{
                autoSize: { minRows: 2 },
              }}
            />
          </Col>
          <Col span={24}>
            <ProCard
              title="Permissions"
              subTitle="All permissions available for this role"
              headStyle={{ color: "#d81921" }}
              style={{ marginBottom: 20 }}
              headerBordered
              size="small"
              bordered
            >
              <ModuleApi form={form} listPermissions={listPermissions} />
            </ProCard>
          </Col>
        </Row>
      </ModalForm>
    </>
  );
};

export default ModalRole;
