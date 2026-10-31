import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./css/index.css";
import { bootstrapCSRFToken } from "./utils/csrf";

const root = createRoot(document.getElementById("root"));

export const appReady = bootstrapCSRFToken()
  .then(() => root.render(<App />))
  .catch((error) => root.render(<main role="alert">Unable to initialize CSRF protection: {String(error)}</main>));
