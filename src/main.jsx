import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./ShopApp.jsx";
import "./styles.css";
import "./shop-extra.css";
import "./magic-item-editor.css";
import "./shop-editor.css";

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
