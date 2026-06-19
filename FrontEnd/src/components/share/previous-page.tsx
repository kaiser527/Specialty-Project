import { Breadcrumb } from "antd";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";

interface IProps {
  previousPages: {
    name: string | React.ReactNode;
    link: string;
  }[];
}

const PreviousPage = ({ previousPages }: IProps) => {
  const location = useLocation();
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  const ORANGE = "#fa8c16";
  const ORANGE_HOVER = "#ffa940";
  const ORANGE_ACTIVE = "#fa541c";

  const items = previousPages.map((item, index) => {
    const isLast = index === previousPages.length - 1;
    const isActive = location.pathname === item.link;
    const isHovered = hoveredIndex === index;

    const baseStyle: React.CSSProperties = {
      fontWeight: 600,
      color: "#666",
      textDecoration: "none",
      fontSize: 16,
      transition: "all 0.2s ease",
      cursor: "pointer",
    };

    const hoverStyle: React.CSSProperties = isHovered
      ? {
          color: ORANGE_HOVER,
        }
      : {};

    const activeStyle: React.CSSProperties = isActive
      ? {
          color: ORANGE_ACTIVE,
        }
      : {};

    return {
      title: isLast ? (
        <span
          style={{
            fontWeight: 600,
            color: ORANGE,
            cursor: "default",
          }}
        >
          {item.name}
        </span>
      ) : (
        <Link
          to={item.link}
          style={{
            ...baseStyle,
            ...(isHovered ? hoverStyle : {}),
            ...(isActive ? activeStyle : {}),
          }}
          onMouseEnter={() => setHoveredIndex(index)}
          onMouseLeave={() => setHoveredIndex(null)}
        >
          {item.name}
        </Link>
      ),
    };
  });

  return (
    <Breadcrumb
      separator=">"
      style={{ fontSize: 16, fontWeight: 600 }}
      items={items}
    />
  );
};

export default PreviousPage;
