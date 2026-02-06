import { useEffect, useMemo, useState } from "react";
import Home from "./pages/Home.jsx";

/**
 * App is intentionally thin.
 * It mounts the splash screen and starts ELGE boot.
 */
export default function App() {
  const [path, setPath] = useState(() => window.location.pathname);

  useEffect(() => {
    const handlePopState = () => setPath(window.location.pathname);
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);

  const isHome = useMemo(() => path === "/" || path === "/home", [path]);

  useEffect(() => {
    if (isHome) {
      return;
    }

    // Load splash animation
    import("./elge/splash.js");

    // Start ELGE boot sequence
    import("./elge/boot/boot.js");
  }, [isHome]);

  if (isHome) {
    return <Home />;
  }

  return (
    <div id="elge-splash">
      <canvas
        id="elge-canvas"
        width="512"
        height="512"
      />

      <div className="elge-text">
        <div className="elge-title">ELGE</div>
        <div className="elge-sub">Low-End Game Engine</div>
        <div
          id="elge-status"
          className="elge-status"
        >
          Initializing…
        </div>
      </div>
    </div>
  );
}
