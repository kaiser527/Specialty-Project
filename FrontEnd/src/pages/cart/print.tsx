import { useGetAccount } from "@/hooks/useGetAccount";
import { useGetUnAuthenticateCart } from "@/hooks/useGetUnAuthenticateCart";
import { ICart } from "@/types/backend";
import dayjs from "dayjs";
import { ReactNode, useEffect, useRef, useState } from "react";
import styles from "styles/print-cart.module.scss";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { formatCurrency, getFinalPrice } from "@/config/helpers/global";
import { useMessage } from "@/hooks/useMessage";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import logo from "assets/logo2.svg";
import {
  Button,
  Col,
  Divider,
  Flex,
  Grid,
  Popover,
  Row,
  Typography,
} from "antd";
import { FilePdfOutlined, PrinterOutlined } from "@ant-design/icons";
import { useBackground } from "@/hooks/useBackground";
import { DARKTHEME } from "@/config/constants/utils";

const { useBreakpoint } = Grid;
const { Text } = Typography;

const PrintPage = () => {
  const location = useLocation();
  const screen = useBreakpoint();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const hasRun = useRef(false);
  const printRef = useRef<HTMLDivElement | null>(null);

  const guessCart = useGetUnAuthenticateCart();
  const { isAuthenticated } = useGetAccount();
  const { messageApi } = useMessage();
  const { background } = useBackground();

  const [isExporting, setIsExporting] = useState(false);
  const isLightDocument = background !== "dark" || isExporting;

  const user = location.state?.user;
  const name = searchParams.get("name");

  const cart: ICart = location.state?.cart;
  const cartItems = isAuthenticated ? cart?.items || [] : guessCart || [];

  const whiteText = !isLightDocument ? { color: "#eee" } : { color: "#000" };
  const tableHead = !isLightDocument
    ? {
        background: DARKTHEME.card,
        color: "#eee",
      }
    : {
        background: "#f5f5f5",
        color: "#000",
      };
  const borderStyle = {
    border: `1px solid ${isLightDocument ? "#d9d9d9" : DARKTHEME.border}`,
  };

  useEffect(() => {
    if (hasRun.current) return;
    hasRun.current = true;

    if (!cartItems.length) {
      messageApi.warning("Cart is empty");
      navigate("/cart");
    }
  }, []);

  const total = cartItems.reduce(
    (sum, item) => sum + getFinalPrice(item.variant) * item.quantity,
    0
  );

  const renderPopoverContent = (variant: any) => (
    <div style={{ maxWidth: 220 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>
        {variant.product?.name}
      </div>
      <div style={{ marginBottom: 6 }}>
        <Text
          copyable
          ellipsis={{ tooltip: true }}
          style={{ display: "block", maxWidth: 200 }}
        >
          {variant.sku}
        </Text>
      </div>
      {Object.entries(variant.attributes || {}).map(([k, v]) => (
        <div key={k}>
          <span style={{ color: "red" }}>{k}:</span> {v as ReactNode}
        </div>
      ))}
      <div>Warranty: 36 Months</div>
    </div>
  );

  const handleExportPDF = async () => {
    if (!printRef.current) return;

    setIsExporting(true);

    await new Promise((r) => setTimeout(r, 100));

    const canvas = await html2canvas(printRef.current, {
      scale: 2,
      useCORS: true,
    });

    setIsExporting(false);

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");

    const pageWidth = 210;
    const pageHeight = 297;

    const padding = 10;

    const imgWidth = pageWidth - padding * 2;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    let heightLeft = imgHeight;
    let position = padding;

    pdf.addImage(imgData, "PNG", padding, position, imgWidth, imgHeight);

    heightLeft -= pageHeight - padding * 2;

    while (heightLeft > 0) {
      position = heightLeft - imgHeight + padding;

      pdf.addPage();

      pdf.addImage(imgData, "PNG", padding, position, imgWidth, imgHeight);

      heightLeft -= pageHeight - padding * 2;
    }

    pdf.save(`${name}.pdf`);
  };

  const handlePrint = async () => {
    setIsExporting(true);
    await new Promise((r) => setTimeout(r, 100));
    window.print();
    setIsExporting(false);
  };

  return (
    <div
      style={background === "dark" ? { background: DARKTHEME.bg } : {}}
      className={styles["print-container"]}
    >
      <div ref={printRef}>
        <Flex justify="space-between" align="center">
          <div className={styles["logo-wrapper"]}>
            <img
              className={styles["logo"]}
              onClick={() => navigate("/")}
              style={{ cursor: "pointer" }}
              src={logo}
            />
          </div>
          <div className={styles["info-wrapper"]}>
            <Text className={styles["web-title"]}>Bazaar</Text>
            <Text style={whiteText}>
              HANOI: No. 83-85 Thai Ha, Trung Liet Ward, Dong Da District, Hanoi
            </Text>
            <Text style={whiteText}>
              HCM.CITY: No. 83A Cuu Long Street, Ward 15, District 10, Ho Chi
              Minh City
            </Text>
            <Text style={whiteText}>Hotline: 098.668.0497</Text>
            <Text style={whiteText}>Email: minh.hacker89@gmail.com</Text>
          </div>
        </Flex>

        <Divider
          style={{
            borderWidth: 2,
            borderColor: background === "dark" ? DARKTHEME.border : "#ccc",
            marginTop: 5,
          }}
        />
        <Divider
          style={{
            borderWidth: 2,
            marginTop: -23,
            borderColor: background === "dark" ? DARKTHEME.border : "#ccc",
            marginBottom: 0,
          }}
        />

        <h1 style={whiteText} className={styles["title"]}>
          PRODUCT QUOTATION
        </h1>
        <p style={whiteText} className={styles["date"]}>
          {dayjs().format("DD.MM.YYYY")}
        </p>

        <Row>
          <Col style={{ fontSize: 16 }} span={12}>
            <Text style={whiteText}>Customer: {user?.name}</Text>
            <br />
            <Text style={whiteText}>Email: {user?.email}</Text>
          </Col>
          <Col style={{ fontSize: 16 }} span={12}>
            <Text style={whiteText}>Address: {user?.address}</Text>
            <br />
            <Text style={whiteText}>Phone: {user?.phone}</Text>
          </Col>
        </Row>

        <p style={whiteText} className={styles["intro"]}>
          We are pleased to provide you with the following quotation:
        </p>

        <table className={styles["table"]}>
          <colgroup>
            <col style={{ width: screen.xs ? "64%" : "18%" }} />
            {!screen.xs && <col style={{ width: "34%" }} />}
            <col style={{ width: "12%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "12%" }} />
            {!screen.xs && <col style={{ width: "12%" }} />}
          </colgroup>
          <thead>
            <tr>
              <th style={{ ...tableHead, ...borderStyle }}>Image</th>
              {!screen.xs && (
                <th style={{ ...tableHead, ...borderStyle }}>Product Name</th>
              )}
              <th style={{ ...tableHead, ...borderStyle }}>Quantity</th>
              <th style={{ ...tableHead, ...borderStyle }}>Unit Price</th>
              <th style={{ ...tableHead, ...borderStyle }}>Discount</th>
              {!screen.xs && (
                <th style={{ ...tableHead, ...borderStyle }}>Warranty</th>
              )}
            </tr>
          </thead>

          <tbody>
            {cartItems.map((item) => {
              const variant = item.variant;
              const product = variant.product;
              const price = getFinalPrice(item.variant);

              return (
                <tr key={item.id}>
                  <td style={borderStyle} className={styles["imageCell"]}>
                    <div className={styles["cellCenter"]}>
                      <Popover
                        content={
                          screen.xs
                            ? renderPopoverContent(variant) // FULL info on mobile
                            : renderPopoverContent({ sku: variant.sku }) // minimal on desktop
                        }
                        trigger={screen.xs ? "click" : "hover"}
                      >
                        <img
                          src={`${
                            import.meta.env.VITE_BACKEND_URL
                          }/images/product/${variant.images?.[0]}`}
                          alt=""
                          className={styles["img"]}
                        />
                      </Popover>
                    </div>
                  </td>
                  {!screen.xs && (
                    <td style={borderStyle} className={styles["productName"]}>
                      <div className={styles["cellStart"]}>
                        <b style={whiteText}>{product?.name}</b>
                        <div className={styles["attrs"]}>
                          {Object.entries(variant.attributes || {}).map(
                            ([k, v]) => (
                              <p key={k}>
                                <span>{k}:</span>{" "}
                                <span style={whiteText}>{v}</span>
                              </p>
                            )
                          )}
                        </div>
                      </div>
                    </td>
                  )}
                  <td style={borderStyle}>
                    <div style={whiteText} className={styles["cellCenter"]}>
                      {item.quantity}
                    </div>
                  </td>
                  <td style={borderStyle}>
                    <div style={whiteText} className={styles["cellCenter"]}>
                      {formatCurrency(price)}
                    </div>
                  </td>
                  <td style={borderStyle}>
                    <div style={whiteText} className={styles["cellCenter"]}>
                      {variant.discount ? `${variant.discount}%` : "-"}
                    </div>
                  </td>
                  {!screen.xs && (
                    <td style={borderStyle}>
                      <div style={whiteText} className={styles["cellCenter"]}>
                        36 Months
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
        <div style={whiteText} className={styles["total"]}>
          Total: <span>{formatCurrency(total)}</span>
        </div>
      </div>
      {screen.lg && (
        <div className={styles["actions"]}>
          <Button
            icon={<PrinterOutlined />}
            type={background === "dark" ? "default" : "primary"}
            onClick={handlePrint}
            style={{
              width: 120,
              background: background === "dark" ? "transparent" : undefined,
              border: background === "dark" ? "1px solid #1677ff" : undefined,
              color: background === "dark" ? "#1677ff" : undefined,
            }}
          >
            Print
          </Button>
          <Button
            icon={<FilePdfOutlined />}
            style={{
              width: 120,
              background: background === "dark" ? "transparent" : "#d32f2f",
              border:
                background === "dark"
                  ? "1px solid #d32f2f"
                  : "1px solid #d32f2f",
              color: background === "dark" ? "#d32f2f" : "#fff",
            }}
            onMouseEnter={(e) => {
              if (background === "dark") {
                e.currentTarget.style.background = "rgba(211, 47, 47, 0.08)";
              } else {
                e.currentTarget.style.background = "#b71c1c";
              }
            }}
            onMouseLeave={(e) => {
              if (background === "dark") {
                e.currentTarget.style.background = "transparent";
              } else {
                e.currentTarget.style.background = "#d32f2f";
              }
            }}
            onClick={handleExportPDF}
          >
            Export PDF
          </Button>
        </div>
      )}
    </div>
  );
};

export default PrintPage;
