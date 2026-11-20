import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./stile/demo.css";
import App from "./App";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
