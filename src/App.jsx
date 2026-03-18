import { useEffect, useState } from "react";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import {
  clearCachedProfile,
  fetchAuthSessionUser,
  loadCachedProfile,
  logoutAuthSession,
  redirectToProviderLogin,
  saveCachedProfile
} from "./utils/authHeader.js";

const AUTH_PENDING_TEXT = "Checking account session...";

export default function App() {
  const initialProfile = loadCachedProfile();
  const [profile, setProfile] = useState(initialProfile);
  const [identityState, setIdentityState] = useState(AUTH_PENDING_TEXT);
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [authError, setAuthError] = useState("");

  // Animation & Engine Boot
  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    const error = currentUrl.searchParams.get("auth_error");
    if (!error) return;

    setAuthError(error);
    currentUrl.searchParams.delete("auth_error");
    window.history.replaceState({}, "", currentUrl.toString());
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

    async function bootstrapAuth() {
      try {
        const user = await fetchAuthSessionUser();
        if (cancelled) return;

        if (!user?.uid) {
          setProfile(null);
          setIdentityState("Not signed in.");
          clearCachedProfile();
          setIsAuthChecked(true);
          return;
        }

        saveCachedProfile(user);
        setProfile(user);
        setIdentityState(`Signed in as ${user.username || user.email || user.uid}`);
      } catch {
        if (cancelled) return;
        setProfile(null);
        setIdentityState("Not signed in.");
        clearCachedProfile();
      } finally {
        if (!cancelled) {
          setIsAuthChecked(true);
        }
      }
    }

    bootstrapAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSignOut() {
    try {
      await logoutAuthSession();
    } finally {
      clearCachedProfile();
      setProfile(null);
      setIdentityState("Not signed in.");
    }
  }

  return (
    <div id="app-root">
   {isAuthChecked && !profile ? (
  <Login
    onGoogle={() => redirectToProviderLogin("google")}
    onGithub={() => redirectToProviderLogin("github")}
    authError={authError}
  />
) : (
  <Home profile={profile} onSignOut={handleSignOut} /> 
)}

      <div id="elge-splash">
        <canvas
          id="elge-canvas"
          width="512"
          height="512"
        />
      </div>

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
    </div>
  );
}
