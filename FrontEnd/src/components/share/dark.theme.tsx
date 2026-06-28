import { useBackground } from "@/hooks/useBackground";
import { ConfigProvider, theme } from "antd";
import enUS from "antd/locale/en_US";
import dayjs from "dayjs";

dayjs.locale("en");

const ApplyDarkTheme = ({ children }: { children: React.ReactNode }) => {
  const { background } = useBackground();

  return (
    <ConfigProvider
      locale={enUS}
      theme={{
        algorithm:
          background === "dark" ? theme.darkAlgorithm : theme.defaultAlgorithm,
      }}
    >
      {children}
    </ConfigProvider>
  );
};

export default ApplyDarkTheme;
