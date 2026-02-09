import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import "./elge/runtime/ui/hub.css";
import "./elge/splash.css";
import "./elge/ai/botUI.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
