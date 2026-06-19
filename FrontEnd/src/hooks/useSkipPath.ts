import { useLocation } from "react-router-dom";

export const useSkipPath = () => {
  const location = useLocation();

  const shouldSkipPaths = ["/", "/cart", "/filter"];

  const shouldSkip =
    shouldSkipPaths.includes(location.pathname) ||
    location.pathname.startsWith("/product/");

  return shouldSkip;
};
