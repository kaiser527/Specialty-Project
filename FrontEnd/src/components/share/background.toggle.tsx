import { DARKTHEME } from "@/config/constants/utils";
import { useBackground } from "@/hooks/useBackground";
import { MoonOutlined, SunOutlined } from "@ant-design/icons";
import { ConfigProvider, Switch } from "antd";

const BackgroundToggle = () => {
  const { background, setBackground } = useBackground();

  return (
    <ConfigProvider
      theme={{
        components: {
          Switch:
            background === "dark"
              ? {
                  handleBg: DARKTHEME.bg,
                }
              : {},
        },
      }}
    >
      <Switch
        checked={background === "dark"}
        onChange={(checked) => setBackground(checked ? "dark" : "light")}
        checkedChildren={
          <MoonOutlined style={{ marginTop: 5, color: "#fff" }} />
        }
        unCheckedChildren={<SunOutlined style={{ color: "#fff" }} />}
      />
    </ConfigProvider>
  );
};

export default BackgroundToggle;
