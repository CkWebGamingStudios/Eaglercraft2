import { useEffect, useState } from "react";
import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Forums from "./pages/ForumsV2.jsx";
import UserSettings from "./pages/UserSettings.jsx";
import UserProfile from "./pages/UserProfile.jsx";
import UsersDirectory from "./pages/UsersDirectory.jsx";
import Docs from "./pages/Docs.jsx";
import Moddit from "./pages/Moddit.jsx";
import Navbar from "./Navbar.jsx";
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

  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    const error = currentUrl.searchParams.get("auth_error");
    if (!error) return;

    setAuthError(error);
    currentUrl.searchParams.delete("auth_error");
    window.history.replaceState({}, "", currentUrl.toString());
  }, []);

  useEffect(() => {
    const elgeHub = document.getElementById("elge-hub");
    if (elgeHub) {
      elgeHub.remove();
    }
  }, [isAuthChecked, profile]);

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
      setIsAuthChecked(true);
    }
  }

  function handleProfileUpdated(nextProfile) {
    setProfile(nextProfile);
    setIdentityState(`Signed in as ${nextProfile.username || nextProfile.email || nextProfile.uid}`);
  }

  let page;
  if (!isAuthChecked) {
    page = <Login authError={authError} onGoogle={() => redirectToProviderLogin("google")} onGithub={() => redirectToProviderLogin("github")} />;
  } else if (!profile) {
    page = <Login authError={authError} onGoogle={() => redirectToProviderLogin("google")} onGithub={() => redirectToProviderLogin("github")} />;
  } else {
    page = (
      <>
        <Navbar onSignOut={handleSignOut} />
        <main className="content-layout">
          <Routes>
            <Route path="/" element={<Home identityState={identityState} profile={profile} onSignOut={handleSignOut} />} />
            <Route path="/forums" element={<Forums profile={profile} />} />
            <Route path="/settings" element={<UserSettings profile={profile} onProfileUpdated={handleProfileUpdated} />} />
            <Route path="/users" element={<UsersDirectory />} />
            <Route path="/users/:uid" element={<UserProfile />} />
            <Route path="/docs" element={<Docs />} />
<<<<<<< codex/fix-logout-menu-issue-and-account-management-y03d06
            <Route path="/moddit" element={<Moddit profile={profile} />} />
=======
<<<<<<< codex/fix-logout-menu-issue-and-account-management-fv8xgl
            <Route path="/moddit" element={<Moddit profile={profile} />} />
=======
>>>>>>> main
>>>>>>> main
          </Routes>
        </main>
      </>
    );
  }

  return (
    <div id="app-root">
      {page}

    </div>
  );
}
