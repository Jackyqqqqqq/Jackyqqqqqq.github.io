import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import { siteContent } from "./content";
import { assertValidContent } from "./content.validation";
import "./styles.css";

assertValidContent(siteContent);

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
