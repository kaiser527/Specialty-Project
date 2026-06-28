import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { setTheme } from "@/redux/slice/backgroundSlice";

export const useBackground = () => {
  const dispatch = useAppDispatch();

  const background: "dark" | "light" = useAppSelector(
    (state) => state.background.theme
  );

  const setBackground = (theme: "dark" | "light") => {
    dispatch(setTheme(theme));
  };

  return { background, setBackground };
};
