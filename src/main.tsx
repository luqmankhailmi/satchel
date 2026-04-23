import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.css";

// Set theme ASAP to avoid a dark->light flash on startup.
try {
  const raw = localStorage.getItem("satchel-storage");
  if (raw) {
    const parsed = JSON.parse(raw);
    const theme = parsed?.state?.theme;
    if (theme === "light" || theme === "dark") {
      document.documentElement.dataset.theme = theme;
    }
  }
} catch {
  // ignore
}

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
