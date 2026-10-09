import { createRoot } from "react-dom/client";
import { App } from "./App";
import { CabinetPreview } from "./CabinetPreview";
import { isLaptopPreview } from "./display";
import "./global.css";

const root = document.getElementById("app");
if (!root) throw new Error("Missing app root");
createRoot(root).render(
  window.parent === window && !isLaptopPreview ? <CabinetPreview /> : <App />,
);
