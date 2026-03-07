import { useEffect, useState } from "react";
import Home from "./pages/Home.jsx";
import {
  buildUserProfile,
  fetchAccessUserUid,
  fetchUserProfile,
  loadCachedIdentity,
  loadCachedProfile,
  saveCachedProfile,
  saveIdentitySnapshot,
  upsertUserProfile
} from "./utils/authHeader.js";

const IDENTITY_PENDING_TEXT = "Detecting Cloudflare Access UID...";

/**
 * App is intentionally thin.
 * It mounts the splash screen and starts ELGE boot.
 */
export default function App() {
  const initialProfile = loadCachedProfile();
  const [profile, setProfile] = useState(initialProfile);
  const [identityState, setIdentityState] = useState(IDENTITY_PENDING_TEXT);

  // Animation & Engine Boot
  useEffect(() => {
    const cachedIdentity = loadCachedIdentity();
    if (cachedIdentity && cachedIdentity.uid) {
      setIdentityState(`Cached UID detected: ${cachedIdentity.uid}`);
    }
  }, []);

  useEffect(() => {
    import("./elge/splash.js");
    import("./elge/boot/boot.js");

    const fallbackTimer = setTimeout(() => {
      const splash = document.getElementById("elge-splash");
      if (splash) {
        splash.style.opacity = "0";
        splash.style.transition = "opacity 300ms ease";
        setTimeout(() => splash.remove(), 300);
      }
    }, 8000);

    return () => {
      clearTimeout(fallbackTimer);
    };
  }, []);

  // Identity Bootstrapping
  useEffect(() => {
    let cancelled = false;

    async function bootstrapIdentity() {
      try {
        const identityResult = await fetchAccessUserUid();
        if (cancelled) return;

        saveIdentitySnapshot(identityResult);

        const uid = identityResult?.uid;
        if (!uid) {
          setIdentityState("Cloudflare Access session detected but UID was missing.");
          return;
        }

        setIdentityState(`Detected UID: ${uid}`);

        const builtProfile = buildUserProfile(identityResult);
        saveCachedProfile(builtProfile);
        setProfile(builtProfile);

        try {
          const storedProfile = await upsertUserProfile(uid, builtProfile);
          saveCachedProfile(storedProfile);
          setProfile(storedProfile);

          const kvProfile = await fetchUserProfile(uid);
          saveCachedProfile(kvProfile);
          setProfile(kvProfile);
        } catch (kvError) {
          const message = kvError instanceof Error ? kvError.message : "KV sync failed";
          setIdentityState(`Detected UID: ${uid} (KV sync unavailable: ${message})`);
        }
      } catch (error) {
        if (cancelled) return;
        setIdentityState(error instanceof Error ? error.message : "Unable to detect Cloudflare identity.");
      }
    }

    bootstrapIdentity();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <>
      <Home
        identityState={identityState}
        profile={profile}
      />
      <div id="elge-splash">
        <canvas id="elge-canvas" width="512" height="512" />
        <div className="elge-text">
          <div className="elge-title">ELGE</div>
          <div className="elge-sub">Low-End Game Engine</div>
          <div
            id="elge-status"
            className="elge-status"
          >
            Initializing...
          </div>
        </div>
      </div>
    </>
  );
}
