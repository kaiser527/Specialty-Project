import { useGetAccount } from "@/hooks/useGetAccount";
import { useGetUnAuthenticateCart } from "@/hooks/useGetUnAuthenticateCart";
import { ICart } from "@/types/backend";
import dayjs from "dayjs";
import { ReactNode, useEffect, useRef } from "react";
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

const { useBreakpoint } = Grid;
const { Text } = Typography;

const PrintCartPage = () => {
  const location = useLocation();
  const screen = useBreakpoint();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const hasRun = useRef(false);
  const printRef = useRef<HTMLDivElement | null>(null);

  const guessCart = useGetUnAuthenticateCart();
  const { isAuthenticated } = useGetAccount();
  const { messageApi } = useMessage();

  const user = location.state?.user;
  const name = searchParams.get("name");

  const cart: ICart = location.state?.cart;
  const cartItems = isAuthenticated ? cart?.items || [] : guessCart || [];

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
      <div style={{ fontSize: 12, marginBottom: 6 }}>
        <Text
          copyable
          ellipsis={{ tooltip: true }}
          style={{ display: "block", maxWidth: 200 }}
        >
          {variant.sku}
        </Text>
      </div>
      {Object.entries(variant.attributes || {}).map(([k, v]) => (
        <div key={k} style={{ fontSize: 12 }}>
          <span style={{ color: "red" }}>{k}:</span> {v as ReactNode}
        </div>
      ))}
    </div>
  );

  const handleExportPDF = async () => {
    if (!printRef.current) return;

    const canvas = await html2canvas(printRef.current, {
      scale: 2,
      useCORS: true,
    });

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

  return (
    <div className={styles["print-container"]}>
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
            <Text>
              HANOI: No. 83-85 Thai Ha, Trung Liet Ward, Dong Da District, Hanoi
            </Text>
            <Text>
              HCM.CITY: No. 83A Cuu Long Street, Ward 15, District 10, Ho Chi
              Minh City
            </Text>
            <Text>Hotline: 098.668.0497</Text>
            <Text>Email: minh.hacker89@gmail.com</Text>
          </div>
        </Flex>

        <Divider
          style={{ borderWidth: 2, borderColor: "#ccc", marginTop: 5 }}
        />
        <Divider
          style={{
            borderWidth: 2,
            marginTop: -23,
            borderColor: "#ccc",
            marginBottom: 0,
          }}
        />

        <h1 className={styles["title"]}>PRODUCT QUOTATION</h1>
        <p className={styles["date"]}>{dayjs().format("DD.MM.YYYY")}</p>

        <Row>
          <Col style={{ fontSize: 16 }} span={12}>
            <p>Customer: {user?.name}</p>
            <p>Email: {user?.email}</p>
          </Col>
          <Col style={{ fontSize: 16 }} span={12}>
            <p>Address: {user?.address}</p>
            <p>Phone: {user?.phone}</p>
          </Col>
        </Row>

        <p className={styles["intro"]}>
          We are pleased to provide you with the following quotation:
        </p>

        <table className={styles["table"]}>
          <colgroup>
            <col style={{ width: "18%" }} />
            {!screen.xs && <col style={{ width: "34%" }} />}
            <col style={{ width: "12%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "12%" }} />
            <col style={{ width: "12%" }} />
          </colgroup>

          <thead>
            <tr>
              <th>Image</th>
              {!screen.xs && <th>Product Name</th>}
              <th>Quantity</th>
              <th>Unit Price</th>
              <th>Discount</th>
              <th>Warranty</th>
            </tr>
          </thead>

          <tbody>
            {cartItems.map((item) => {
              const variant = item.variant;
              const product = variant.product;
              const price = getFinalPrice(item.variant);

              return (
                <tr key={item.id}>
                  <td className={styles["imageCell"]}>
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
                    <td className={styles["productName"]}>
                      <div className={styles["cellStart"]}>
                        <b>{product?.name}</b>
                        <div className={styles["attrs"]}>
                          {Object.entries(variant.attributes || {}).map(
                            ([k, v]) => (
                              <p key={k}>
                                <span>{k}:</span> {v}
                              </p>
                            )
                          )}
                        </div>
                      </div>
                    </td>
                  )}
                  <td>
                    <div className={styles["cellCenter"]}>{item.quantity}</div>
                  </td>
                  <td>
                    <div className={styles["cellCenter"]}>
                      {formatCurrency(price)}
                    </div>
                  </td>
                  <td>
                    <div className={styles["cellCenter"]}>
                      {variant.discount ? `${variant.discount}%` : "-"}
                    </div>
                  </td>
                  <td>
                    <div className={styles["cellCenter"]}>36 Months</div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <div className={styles["total"]}>
          Total: <span>{formatCurrency(total)}</span>
        </div>
      </div>
      <div className={styles["actions"]}>
        <Button
          icon={<PrinterOutlined />}
          type="primary"
          onClick={() => window.print()}
          style={{ width: 120 }}
        >
          Print
        </Button>
        <Button
          icon={<FilePdfOutlined />}
          style={{
            backgroundColor: "#d32f2f",
            borderColor: "#d32f2f",
            color: "#fff",
            width: 120,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = "#b71c1c";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = "#d32f2f";
          }}
          onClick={handleExportPDF}
        >
          Export PDF
        </Button>
      </div>
    </div>
  );
};

export default PrintCartPage;
