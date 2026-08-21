import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

// /admin 只在 dev 下存在（写入端点是 vite serve 中间件）。import.meta.env.DEV 在生产构建里
// 折叠成 false，这个分支和 Admin 整个模块一起被摇掉，不进包也不上 GitHub Pages。
const root = createRoot(document.getElementById("root")!);

if (import.meta.env.DEV && /\/admin\/?$/.test(location.pathname)) {
  void import("./components/Admin").then(({ Admin }) =>
    root.render(<StrictMode><Admin /></StrictMode>),
  );
} else {
  root.render(<StrictMode><App /></StrictMode>);
}
