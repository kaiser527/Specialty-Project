import styles from "styles/app.module.scss";
import { useEffect, useRef } from "react";
import {
  RouterProvider,
  createBrowserRouter,
  Outlet,
  useLocation,
} from "react-router-dom";
import Loading from "./components/share/loading";
import { useFetchAccountQuery } from "./redux/api/accountApi";
import { skipToken } from "@reduxjs/toolkit/query";
import LayoutApp from "./components/share/layout.app";
import NotFound from "./components/routes/not.found";
import HomePage from "./pages/home";
import RedirectUser from "./components/routes/user-redirect";
import LoginPage from "./pages/auth/login";
import RegisterPage from "./pages/auth/register";
import Footer from "./components/client/footer.client";
import VerifyPage from "./pages/auth/verify";
import Header from "./components/client/header.client";
import LayoutAdmin from "./components/admin/layout.admin";
import ProtectedRoute from "./components/routes/protected-route";
import DashboardPage from "./pages/admin/dashboard";
import UserPage from "./pages/admin/user";
import RolePage from "./pages/admin/role";
import PermissionPage from "./pages/admin/permission";
import ProductPage from "./pages/admin/product";
import ViewUpsertProduct from "./components/admin/product/upsert.product";
import CategoryPage from "./pages/admin/category";
import { useMergeCartMutation } from "./redux/api/cartApi";
import { useGetUnAuthenticateCart } from "./hooks/useGetUnAuthenticateCart";
import { useAppDispatch } from "./redux/hooks";
import { clearCart } from "./redux/slice/cartSlice";
import { useGetAccount } from "./hooks/useGetAccount";
import CartPage from "./pages/cart/cart";
import FilterPage from "./pages/home/filter";
import OrderPage from "./pages/admin/order";
import ProviderFeePage from "./pages/admin/provider-fee";
import ProviderOrderPage from "./pages/admin/provider-order";
import ProductDetail from "./pages/product/product.detail";
import PrintPage from "./pages/cart/print";
import VoucherPage from "./pages/admin/voucher";
import { useBackground } from "./hooks/useBackground";
import { DARKTHEME } from "./config/constants/utils";

const LayoutClient = () => {
  const location = useLocation();
  const rootRef = useRef<HTMLDivElement>(null);

  const { background } = useBackground();

  useEffect(() => {
    if (rootRef && rootRef.current) {
      rootRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [location]);

  return (
    <div ref={rootRef}>
      <Header />
      <main
        style={background === "dark" ? { background: DARKTHEME.bg } : {}}
        className={styles["main"]}
      >
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

const AuthLoader = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  const dispatch = useAppDispatch();

  const shouldSkip = ["/login", "/register", "/verify/:email"].includes(
    location.pathname
  );

  const { isLoading } = useFetchAccountQuery(
    shouldSkip ? skipToken : undefined
  );
  const { isAuthenticated } = useGetAccount();

  const [merge] = useMergeCartMutation();
  const unAuthenticateCart = useGetUnAuthenticateCart();

  const hasMergedRef = useRef(false);
  const prevAuthRef = useRef(false);

  useEffect(() => {
    const handleMerge = async () => {
      if (!isAuthenticated || prevAuthRef.current || hasMergedRef.current)
        return;

      const payload = unAuthenticateCart
        .filter((c) => c.variant?.id)
        .map((c) => ({
          variantId: c.variant.id as string,
          quantity: c.quantity,
        }));

      if (!payload.length) return;

      await merge({ items: payload }).unwrap();

      dispatch(clearCart());
      hasMergedRef.current = true;
    };

    handleMerge();

    prevAuthRef.current = isAuthenticated;
  }, [isAuthenticated]);

  if (isLoading) return <Loading />;

  return <>{children}</>;
};

const App = () => {
  const router = createBrowserRouter([
    {
      path: "/",
      element: (
        <LayoutApp>
          <AuthLoader>
            <LayoutClient />
          </AuthLoader>
        </LayoutApp>
      ),
      errorElement: <NotFound />,
      children: [
        { index: true, element: <HomePage /> },
        { path: "cart", element: <CartPage /> },
        { path: "filter", element: <FilterPage /> },
        { path: "product/:id", element: <ProductDetail /> },
      ],
    },
    {
      path: "/admin",
      element: (
        <LayoutApp>
          <AuthLoader>
            <LayoutAdmin />
          </AuthLoader>
        </LayoutApp>
      ),
      errorElement: <NotFound />,
      children: [
        {
          index: true,
          element: (
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "user",
          element: (
            <ProtectedRoute>
              <UserPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "role",
          element: (
            <ProtectedRoute>
              <RolePage />
            </ProtectedRoute>
          ),
        },
        {
          path: "permission",
          element: (
            <ProtectedRoute>
              <PermissionPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "product",
          children: [
            {
              index: true,
              element: (
                <ProtectedRoute>
                  <ProductPage />
                </ProtectedRoute>
              ),
            },
            {
              path: "upsert",
              element: (
                <ProtectedRoute>
                  <ViewUpsertProduct />
                </ProtectedRoute>
              ),
            },
          ],
        },
        {
          path: "category",
          element: (
            <ProtectedRoute>
              <CategoryPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "order",
          element: (
            <ProtectedRoute>
              <OrderPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "provider-fee",
          element: (
            <ProtectedRoute>
              <ProviderFeePage />
            </ProtectedRoute>
          ),
        },
        {
          path: "provider-order",
          element: (
            <ProtectedRoute>
              <ProviderOrderPage />
            </ProtectedRoute>
          ),
        },
        {
          path: "voucher",
          element: (
            <ProtectedRoute>
              <VoucherPage />
            </ProtectedRoute>
          ),
        },
      ],
    },
    {
      path: "/print",
      element: <PrintPage />,
    },
    {
      path: "/redirect",
      element: <RedirectUser />,
    },
    {
      path: "/login",
      element: <LoginPage />,
    },
    {
      path: "/verify/:email",
      element: <VerifyPage />,
    },
    {
      path: "/register",
      element: <RegisterPage />,
    },
  ]);

  return <RouterProvider router={router} />;
};

export default App;
