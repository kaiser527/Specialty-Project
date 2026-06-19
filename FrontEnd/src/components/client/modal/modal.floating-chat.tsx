import { Flex, FloatButton, Layout, Modal, Button, Grid, Drawer } from "antd";
import {
  MessageOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  PlusOutlined,
} from "@ant-design/icons";
import { useState } from "react";
import styles from "styles/floating-chat.module.scss";
import ChatSidebar from "../chat/chat.sidebar";
import { useGetAccount } from "@/hooks/useGetAccount";
import ChatContent from "../chat/chat.content";
import { useConversation } from "@/hooks/useConversation";

const { useBreakpoint } = Grid;
const { Sider } = Layout;

const FloatingChat = () => {
  const screen = useBreakpoint();

  const [openConversationDrawer, setOpenConversationDrawer] = useState(false);
  const [openModal, setOpenModal] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const { isAuthenticated } = useGetAccount();
  const { setConversationId } = useConversation();

  return (
    <>
      <FloatButton
        icon={
          <Flex justify="center" align="center">
            <MessageOutlined style={{ fontSize: 25, color: "#f97316" }} />
          </Flex>
        }
        className={styles["orange-float-btn"]}
        style={{ right: 24 }}
        onClick={() => setOpenModal(true)}
      />
      <Modal
        title={null}
        open={openModal}
        footer={null}
        style={{ marginTop: -81 }}
        width="100vw"
        closable={false}
        onCancel={() => setOpenModal(false)}
        styles={{
          body: {
            height: "88vh",
          },
        }}
      >
        <Layout style={{ height: "100%" }}>
          {screen.lg && (
            <Sider
              collapsed={collapsed}
              collapsedWidth={0}
              width="18vw"
              theme="light"
              className={styles.sidebar}
            >
              <ChatSidebar collapsed={collapsed} openModal={openModal} />
            </Sider>
          )}
          {!screen.lg && (
            <Drawer
              title={
                <Flex justify="space-between" align="center">
                  <span>Conversations</span>
                  <Button
                    size="small"
                    shape="circle"
                    icon={<PlusOutlined />}
                    className={styles.orangeFloatBtn}
                    onClick={() => {
                      setConversationId(crypto.randomUUID());
                      setOpenConversationDrawer(false);
                    }}
                  />
                </Flex>
              }
              placement="left"
              open={openConversationDrawer}
              onClose={() => setOpenConversationDrawer(false)}
              width="40vw"
              forceRender
            >
              <ChatSidebar collapsed={false} openModal={openModal} />
            </Drawer>
          )}
          <Layout>
            <div className={styles.chatHeader}>
              {isAuthenticated && (
                <Button
                  type="text"
                  icon={
                    screen.lg ? (
                      collapsed ? (
                        <MenuUnfoldOutlined />
                      ) : (
                        <MenuFoldOutlined />
                      )
                    ) : (
                      <MenuUnfoldOutlined />
                    )
                  }
                  onClick={() => {
                    if (screen.lg) {
                      setCollapsed(!collapsed);
                    } else {
                      setOpenConversationDrawer(true);
                    }
                  }}
                />
              )}
            </div>
            <ChatContent />
          </Layout>
        </Layout>
      </Modal>
    </>
  );
};

export default FloatingChat;
