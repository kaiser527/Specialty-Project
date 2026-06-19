import { Navigate, useLocation } from "react-router-dom";
import NotPermitted from "./not-permitted";
import { useGetAccount } from "@/hooks/useGetAccount";

const RoleBaseRoute = ({ children }: any) => {
  const { user } = useGetAccount();

  if (user?.role?.name !== "USER") {
    return <>{children}</>;
  }

  return <NotPermitted />;
};

const ProtectedRoute = ({ children }: any) => {
  const location = useLocation();
  const { isAuthenticated } = useGetAccount();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (location.pathname.startsWith("/admin")) {
    return <RoleBaseRoute>{children}</RoleBaseRoute>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
