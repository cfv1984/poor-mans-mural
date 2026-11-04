import { createRoot } from "react-dom/client";
import Application from "./components/Application";

addEventListener("DOMContentLoaded", () => {
  const rootEl = document.getElementById("test-root");
  if (!rootEl) {
    alert("Misconfigured test application: no root element");
    return;
  }
  rootEl.style.display = "content";
  const root = createRoot(rootEl);
  root.render(<Application />);
});
