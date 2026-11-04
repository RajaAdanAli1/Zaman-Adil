import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { loadReadingFonts, loadScriptFont } from "./fonts";
import "./styles.css";

loadScriptFont(document.documentElement.lang);
const startReadingFonts = () => loadReadingFonts();
if ("requestIdleCallback" in window) window.requestIdleCallback(startReadingFonts);
else window.setTimeout(startReadingFonts, 200);

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
