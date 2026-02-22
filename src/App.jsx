import { useEffect, useState } from "react";
import Home from "./pages/Home.jsx";
import { fetchAccessUserUid, fetchLastSeenIdentity } from "./utils/authHeader.js";

/**
 * App is intentionally thin.
 * It mounts the splash screen and starts ELGE boot.
 */
export default function App() {
  const [userUid, setUserUid] = useState("");
  const [identityResult, setIdentityResult] = useState(null);
  const [identityError, setIdentityError] = useState("");
  const [isLoadingIdentity, setIsLoadingIdentity] = useState(false);
  const [isDetectingUid, setIsDetectingUid] = useState(false);

  useEffect(() => {
    import("./elge/splash.js");
    import("./elge/boot/boot.js");
  }, []);

  async function handleDetectUid() {
    setIsDetectingUid(true);
    setIdentityError("");

    try {
      const result = await fetchAccessUserUid();
      if (result?.uid) {
        setUserUid(result.uid);
      } else {
        setIdentityError("Cloudflare session found, but user UID was not present in identity payload.");
      }
    } catch (error) {
      setIdentityError(error instanceof Error ? error.message : "Unable to detect UID from Access session.");
    } finally {
      setIsDetectingUid(false);
    }
  }

  async function handleLookupIdentity() {
    setIsLoadingIdentity(true);
    setIdentityError("");
    setIdentityResult(null);

    try {
      const result = await fetchLastSeenIdentity(userUid);
      setIdentityResult(result);
    } catch (error) {
      setIdentityError(error instanceof Error ? error.message : "Unable to fetch identity.");
    } finally {
      setIsLoadingIdentity(false);
    }
  }

  return (
    <>
      <Home
        userUid={userUid}
        onUserUidChange={setUserUid}
        onLookupIdentity={handleLookupIdentity}
        onDetectUid={handleDetectUid}
        identityResult={identityResult}
        identityError={identityError}
        isLoadingIdentity={isLoadingIdentity}
        isDetectingUid={isDetectingUid}
      />
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
