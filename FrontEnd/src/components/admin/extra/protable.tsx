import {
  ParamsType,
  ProTable,
  ProTableProps,
} from "@ant-design/pro-components";

const DataTable = <
  T extends Record<string, any>,
  U extends ParamsType = ParamsType,
  ValueType = "text"
>({
  columns,
  defaultData = [],
  dataSource,
  rowClassName,
  postData,
  pagination,
  // sticky = { offsetHeader: 50 },
  loading,
  rowKey = (record) => record.id,
  scroll,
  params,
  request,
  search,
  polling,
  toolBarRender,
  expandable,
  headerTitle,
  actionRef,
  dateFormatter = "string",
  rowSelection,
}: ProTableProps<T, U, ValueType>) => {
  return (
    <ProTable<T, U, ValueType>
      rowClassName={rowClassName}
      columns={columns}
      defaultData={defaultData}
      dataSource={dataSource}
      postData={postData}
      pagination={pagination}
      bordered
      // sticky={sticky}
      loading={loading}
      rowKey={rowKey}
      scroll={scroll}
      params={params}
      request={request}
      search={search}
      polling={polling}
      toolBarRender={toolBarRender}
      headerTitle={headerTitle}
      actionRef={actionRef}
      dateFormatter={dateFormatter}
      rowSelection={rowSelection}
      expandable={expandable}
    />
  );
};

export default DataTable;
