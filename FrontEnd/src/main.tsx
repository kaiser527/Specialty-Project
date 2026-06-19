import React from "react";
import ReactDOM from "react-dom/client";
import App from "./app";
import { Provider } from "react-redux";
import { persistor, store } from "@/redux/store";
import { PersistGate } from "redux-persist/integration/react";
import AntdProvider from "./context/antd.context";
import "@ant-design/v5-patch-for-react-19";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <Provider store={store}>
      <PersistGate persistor={persistor} loading={null}>
        <AntdProvider>
          <App />
        </AntdProvider>
      </PersistGate>
    </Provider>
  </React.StrictMode>
);
