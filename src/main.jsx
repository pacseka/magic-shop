import React from "react";
import { createRoot } from "react-dom/client";
import { App } from "./ShopApp.jsx";
import "./styles.css";
import "./shop-extra.css";
import "./magic-item-editor.css";
import "./shop-editor.css";
import "./management-drawer.css";
import "./user-guide.css";

async function start() {
  const seedItems = import.meta.env.DEV
    ? (await import('./devSampleData.js')).initialItems
    : [];
  createRoot(document.getElementById("root")).render(
    <React.StrictMode>
      <App seedItems={seedItems} />
    </React.StrictMode>,
  );
}

start();

if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register(`${import.meta.env.BASE_URL}sw.js`).catch(() => {
      // The app remains usable when service workers are unavailable.
    });
  });
}
