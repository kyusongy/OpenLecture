import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./index.css";
import "./i18n";
import { isTauri, getBackendPort, getConfig } from "./lib/tauri";
import { initApi } from "./lib/api";

async function boot() {
  if (isTauri) {
    const port = await getBackendPort();
    if (port > 0) {
      initApi(port);
    }

    const config = await getConfig();
    if (!config.dashscope_api_key && window.location.pathname !== "/setup") {
      window.location.replace("/setup");
      return;
    }
  }

  createRoot(document.getElementById("root")!).render(
    <BrowserRouter>
      <App />
    </BrowserRouter>,
  );
}

boot();
