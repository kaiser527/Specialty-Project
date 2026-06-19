export const ALL_PERMISSIONS = {
  PERMISSIONS: {
    GET_PAGINATE: {
      method: "GET",
      apiPath: "/api/v1/permissions",
      module: "PERMISSIONS",
    },
    CREATE: {
      method: "POST",
      apiPath: "/api/v1/permissions",
      module: "PERMISSIONS",
    },
    UPDATE: {
      method: "PATCH",
      apiPath: "/api/v1/permissions/:id",
      module: "PERMISSIONS",
    },
    DELETE: {
      method: "DELETE",
      apiPath: "/api/v1/permissions/:id",
      module: "PERMISSIONS",
    },
  },
  ROLES: {
    GET_PAGINATE: { method: "GET", apiPath: "/api/v1/roles", module: "ROLES" },
    CREATE: { method: "POST", apiPath: "/api/v1/roles", module: "ROLES" },
    UPDATE: { method: "PATCH", apiPath: "/api/v1/roles/:id", module: "ROLES" },
    DELETE: { method: "DELETE", apiPath: "/api/v1/roles/:id", module: "ROLES" },
  },
  USERS: {
    GET_PAGINATE: { method: "GET", apiPath: "/api/v1/users", module: "USERS" },
    CREATE: { method: "POST", apiPath: "/api/v1/users", module: "USERS" },
    UPDATE: { method: "PATCH", apiPath: "/api/v1/users/:id", module: "USERS" },
    DELETE: { method: "DELETE", apiPath: "/api/v1/users/:id", module: "USERS" },
    CHART: {
      method: "GET",
      apiPath: "/api/v1/users/role-chart",
      module: "USERS",
    },
  },
  PRODUCTS: {
    GET_PAGINATE: {
      method: "GET",
      apiPath: "/api/v1/products",
      module: "PRODUCTS",
    },
    IMPORT: {
      method: "POST",
      apiPath: "/api/v1/products/import",
      module: "PRODUCTS",
    },
    CREATE: { method: "POST", apiPath: "/api/v1/products", module: "PRODUCTS" },
    UPDATE: {
      method: "PATCH",
      apiPath: "/api/v1/products/:id",
      module: "PRODUCTS",
    },
    DELETE: {
      method: "DELETE",
      apiPath: "/api/v1/products/:id",
      module: "PRODUCTS",
    },
    SWITCH: {
      method: "PATCH",
      apiPath: "/api/v1/products/switch/switch-author",
      module: "PRODUCTS",
    },
  },
  CATEGORIES: {
    GET_PAGINATE: {
      method: "GET",
      apiPath: "/api/v1/categories",
      module: "CATEGORIES",
    },
    CREATE: {
      method: "POST",
      apiPath: "/api/v1/categories",
      module: "CATEGORIES",
    },
    UPDATE: {
      method: "PATCH",
      apiPath: "/api/v1/categories/:id",
      module: "CATEGORIES",
    },
    DELETE: {
      method: "DELETE",
      apiPath: "/api/v1/categories/:id",
      module: "CATEGORIES",
    },
  },
  ORDERS: {
    GET_PAGINATE: {
      method: "GET",
      apiPath: "/api/v1/orders",
      module: "ORDERS",
    },
    GET_BY_ID: {
      method: "GET",
      apiPath: "/api/v1/orders/:id",
      module: "ORDERS",
    },
    DELETE: {
      method: "DELETE",
      apiPath: "/api/v1/orders/:id",
      module: "ORDERS",
    },
    UPDATE: {
      method: "PATCH",
      apiPath: "/api/v1/orders/:id",
      module: "ORDERS",
    },
  },
  PROVIDERS: {
    GET_FEE_PAGINATE: {
      method: "GET",
      apiPath: "/api/v1/providers/fee",
      module: "PROVIDERS",
    },
    UPDATE_FEE: {
      method: "PATCH",
      apiPath: "/api/v1/providers/fee/:id",
      module: "PROVIDERS",
    },
    UPDATE_FEE_BULK: {
      method: "PATCH",
      apiPath: "/api/v1/providers/fee-bulk/:id",
      module: "PROVIDERS",
    },
    GET_ORDER_PAGINATE: {
      method: "GET",
      apiPath: "/api/v1/providers/order",
      module: "PROVIDERS",
    },
    UPDATE_ORDER: {
      method: "PATCH",
      apiPath: "/api/v1/providers/order/:id",
      module: "PROVIDERS",
    },
    UPDATE_ORDER_BULK: {
      method: "PATCH",
      apiPath: "/api/v1/providers/order-bulk/:id",
      module: "PROVIDERS",
    },
    GET_FEE_DASHBOARD: {
      method: "GET",
      apiPath: "/api/v1/providers/dashboard",
      module: "PROVIDERS",
    },
    GET_FEE_DASHBOARD_DATERANGE: {
      method: "GET",
      apiPath: "/api/v1/providers/dashboard-daterange",
      module: "PROVIDERS",
    },
  },
  VOUCHERS: {
    GET_PAGINATE: {
      method: "GET",
      apiPath: "/api/v1/vouchers",
      module: "VOUCHERS",
    },
    FIND_BY_CODE_USER: {
      method: "POST",
      apiPath: "/api/v1/vouchers/code",
      module: "VOUCHERS",
    },
    CREATE: {
      method: "POST",
      apiPath: "/api/v1/vouchers",
      module: "VOUCHERS",
    },
    UPDATE: {
      method: "PATCH",
      apiPath: "/api/v1/vouchers",
      module: "VOUCHERS",
    },
    DELETE: {
      method: "DELETE",
      apiPath: "/api/v1/vouchers/:id",
      module: "VOUCHERS",
    },
    USAGE: {
      method: "GET",
      apiPath: "/api/v1/vouchers/usages",
      module: "VOUCHERS",
    },
  },
};

export const ALL_MODULES = {
  AUTH: "AUTH",
  ORDERS: "ORDERS",
  PERMISSIONS: "PERMISSIONS",
  ROLES: "ROLES",
  PROVIDERS: "PROVIDERS",
  USERS: "USERS",
  PRODUCTS: "PRODUCTS",
  CATEGORIES: "CATEGORIES",
  VOUCHERS: "VOUCHERS",
};
