import { createRoot } from "react-dom/client";
import { App } from "./App";
import { CabinetPreview } from "./CabinetPreview";
import { isLaptopPreview } from "./display";
import "./global.css";
import { LayoutChecks } from "./LayoutChecks";

const root = document.getElementById("app");
if (!root) throw new Error("Missing app root");
createRoot(root).render(
  import.meta.env.DEV && new URLSearchParams(window.location.search).has("layout-check")
    ? <LayoutChecks />
    : window.parent === window && !isLaptopPreview ? <CabinetPreview /> : <App />,
);
