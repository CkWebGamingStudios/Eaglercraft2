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

export default function App() {
  const [profile, setProfile] = useState(() => loadCachedProfile());
  const [identityState, setIdentityState] = useState(() => {
    const cached = loadCachedIdentity();
    return cached?.uid ? `Cached UID detected: ${cached.uid}` : "Detecting Cloudflare Access UID…";
  });

  // Animation & Engine Boot
  useEffect(() => {
    import("./elge/splash.js");
    import("./elge/boot/boot.js");
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
        const storedProfile = await upsertUserProfile(uid, builtProfile);

        if (!cancelled) {
          saveCachedProfile(storedProfile);
          setProfile(storedProfile);
        }

        const kvProfile = await fetchUserProfile(uid);
        if (!cancelled) {
          saveCachedProfile(kvProfile);
          setProfile(kvProfile);
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
      
      <div id="elge-splash">
        <canvas id="elge-canvas" width="512" height="512" />
        <div className="elge-text">
          <div className="elge-title">ELGE</div>
          <div className="elge-sub">Low-End Game Engine</div>
          <div id="elge-status" className="elge-status">
            Initializing…
          </div>
        </div>
      </div>
    </>
  );
}
