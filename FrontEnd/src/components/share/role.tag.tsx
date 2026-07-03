import { roleColorsDark, roleGradients } from "@/config/constants/utils";
import { useBackground } from "@/hooks/useBackground";
import { IUser } from "@/types/backend";
import { Tag } from "antd";
import { CSSProperties } from "react";

interface IProps {
  customStyle: CSSProperties;
  user: IUser;
}

const RoleTag = ({ customStyle, user }: IProps) => {
  const { background } = useBackground();

  const isLight = background === "light";

  return (
    <Tag
      style={{
        ...customStyle,
        background: isLight ? roleGradients[user.role.name] : "transparent",
        color: isLight ? "#fff" : roleColorsDark[user.role.name],
        border: isLight
          ? "none"
          : `1px solid ${roleColorsDark[user.role.name]}`,
      }}
    >
      {user.role.name}
    </Tag>
  );
};

export default RoleTag;
