import { useEffect } from "react";
import Home from "./pages/Home.jsx";

/**
 * App is intentionally thin.
 * It mounts the splash screen and starts ELGE boot.
 */
export default function App() {
  useEffect(() => {
    // Load splash animation
    import("./elge/splash.js");

    // Start ELGE boot sequence
    import("./elge/boot/boot.js");
  }, []);

  return (
    <>
      <Home />
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
    </>
  );
}
