import { DARKTHEME } from "@/config/constants/utils";
import { useBackground } from "@/hooks/useBackground";
import HashLoader from "react-spinners/HashLoader";

const Loading = () => {
  const { background } = useBackground();

  const style: React.CSSProperties = {
    position: "fixed",
    inset: 0,
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: background === "dark" ? DARKTHEME.bg : "#fff",
  };

  return (
    <div style={style}>
      <HashLoader color="#36d7b7" />
    </div>
  );
};

export default Loading;
