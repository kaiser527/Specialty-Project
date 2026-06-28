import { Row, Col, Typography, Space, Divider, Grid, Button } from "antd";
import {
  FacebookOutlined,
  InstagramOutlined,
  TwitterOutlined,
} from "@ant-design/icons";
import logo from "assets/logo2.svg";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useBackground } from "@/hooks/useBackground";
import { DARKTHEME } from "@/config/constants/utils";

const { Title, Text, Link } = Typography;
const { useBreakpoint } = Grid;

const Footer = () => {
  const screens = useBreakpoint();
  const navigate = useNavigate();
  const { background } = useBackground();

  const [hover, setHover] = useState(false);

  const whiteText = background === "dark" ? "#fff" : "#000";

  return (
    <footer
      style={{
        background: background === "dark" ? DARKTHEME.bgSecondary : "#fafafa",
        padding: `${screens.lg ? 60 : screens.xs ? 6 : 8}px ${
          screens.lg ? 120 : 6
        }px 30px`,
        borderTop: `1px solid ${
          background === "dark" ? DARKTHEME.border : "#f0f0f0"
        }`,
        boxSizing: "border-box",
        width: "100%",
        overflowX: "hidden",
      }}
    >
      {/* TOP */}
      <Row gutter={[40, 40]} justify="start" wrap>
        {/* Brand */}
        <Col sm={24} lg={8}>
          <div>
            <img
              onClick={() => navigate("/")}
              style={{ cursor: "pointer", maxWidth: "100%", height: "auto" }}
              src={logo}
            />
          </div>
          <Text style={{ color: "#ff9f1a" }} type="secondary">
            Build your dream setup with the best PCs, laptops, and accessories.
          </Text>

          {/* Social */}
          <div style={{ marginTop: 20 }}>
            <Space size="middle">
              <FacebookOutlined
                style={{
                  fontSize: 18,
                  cursor: "pointer",
                  color: whiteText,
                }}
              />
              <InstagramOutlined
                style={{ fontSize: 18, cursor: "pointer", color: whiteText }}
              />
              <TwitterOutlined
                style={{ fontSize: 18, cursor: "pointer", color: whiteText }}
              />
            </Space>
          </div>
        </Col>

        {/* Links */}
        <Col sm={6} xs={8} lg={4}>
          <Title style={{ color: whiteText }} level={5}>
            Shop
          </Title>
          <Space direction="vertical">
            <Link style={{ color: "#ff9f1a" }}>Gaming PCs</Link>
            <Link style={{ color: "#ff9f1a" }}>Laptops</Link>
            <Link style={{ color: "#ff9f1a" }}>Components</Link>
            <Link style={{ color: "#ff9f1a" }}>Accessories</Link>
          </Space>
        </Col>

        <Col sm={6} xs={8} lg={4}>
          <Title style={{ color: whiteText }} level={5}>
            Support
          </Title>
          <Space direction="vertical">
            <Link style={{ color: "#ff9f1a" }}>Contact Us</Link>
            <Link style={{ color: "#ff9f1a" }}>Warranty</Link>
            <Link style={{ color: "#ff9f1a" }}>Tracking</Link>
            <Link style={{ color: "#ff9f1a" }}>FAQs</Link>
          </Space>
        </Col>

        <Col sm={6} xs={8} lg={4}>
          <Title style={{ color: whiteText }} level={5}>
            Company
          </Title>
          <Space direction="vertical">
            <Link style={{ color: "#ff9f1a" }}>About</Link>
            <Link style={{ color: "#ff9f1a" }}>Careers</Link>
            <Link style={{ color: "#ff9f1a" }}>Privacy</Link>
            <Link style={{ color: "#ff9f1a" }}>Terms</Link>
          </Space>
        </Col>

        <Col style={{ color: whiteText }} sm={6} xs={24} lg={4}>
          <Title style={{ color: whiteText }} level={5}>
            Special Offer
          </Title>
          <Text style={{ color: "#ff9f1a" }} type="secondary">
            Get 10% off your first order
          </Text>
          <Button
            type="primary"
            block
            onMouseEnter={() => setHover(true)}
            onMouseLeave={() => setHover(false)}
            onClick={() => navigate("/filter")}
            style={{
              marginTop: 10,
              borderRadius: 6,
              background: hover
                ? "linear-gradient(135deg, #ff9f1a, #ff7a00)"
                : "linear-gradient(135deg, #ff7a00, #ff9f1a)",
              border: "none",
              transition: "all 0.3s ease",
            }}
          >
            Shop Now
          </Button>
        </Col>
      </Row>

      <Divider style={{ margin: "40px 0 20px" }} />

      {/* BOTTOM */}
      <Row justify="space-between" align="middle" wrap>
        <Col>
          <Text style={{ color: whiteText }} type="secondary">
            © {new Date().getFullYear()} PC Store. All rights reserved.
          </Text>
        </Col>

        <Col>
          <Space size="large" wrap>
            <Link
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ff9f1a")}
              onMouseLeave={(e) => (e.currentTarget.style.color = whiteText)}
              style={{ color: whiteText }}
              type="secondary"
            >
              Privacy Policy
            </Link>
            <Link
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ff9f1a")}
              onMouseLeave={(e) => (e.currentTarget.style.color = whiteText)}
              style={{ color: whiteText }}
              type="secondary"
            >
              Terms
            </Link>
            <Link
              onMouseEnter={(e) => (e.currentTarget.style.color = "#ff9f1a")}
              onMouseLeave={(e) => (e.currentTarget.style.color = whiteText)}
              style={{ color: whiteText }}
              type="secondary"
            >
              Sitemap
            </Link>
          </Space>
        </Col>
      </Row>
    </footer>
  );
};

export default Footer;
