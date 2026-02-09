import { useEffect, useState } from "react";
import Home from "./pages/Home.jsx";
import Play from "./pages/Play.jsx";
import {
  fetchAccessJwtHeader,
  getStoredAccessJwt,
  storeAccessJwt
} from "./utils/authHeader.js";

/**
 * App is intentionally thin.
 * It mounts the splash screen and starts ELGE boot.
 */
export default function App() {
  const [authFailed, setAuthFailed] = useState(false);
  const isPlayRoute = window.location.pathname.startsWith("/play");

  useEffect(() => {
    // Load splash animation
    import("./elge/splash.js");

    // Start ELGE boot sequence
    import("./elge/boot/boot.js");
  }, []);

  useEffect(() => {
    let isMounted = true;

    async function checkAuthHeader() {
      try {
        const jwtHeader = await fetchAccessJwtHeader();
        if (!isMounted) return;

        if (!jwtHeader) {
          setAuthFailed(true);
          return;
        }

        const storedJwt = getStoredAccessJwt();
        if (storedJwt === jwtHeader) {
          return;
        }

        storeAccessJwt(jwtHeader);
      } catch (error) {
        if (isMounted) {
          setAuthFailed(true);
        }
        console.error("[ELGE AUTH]", error);
      }
    }

    checkAuthHeader();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <>
      {isPlayRoute ? <Play /> : <Home authFailed={authFailed} />}
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
