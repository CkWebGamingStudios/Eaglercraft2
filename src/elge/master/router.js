/* =========================================================
   ELGE Router (FORCED-IMPORT VERSION)
   Purpose:
   - Central navigation command system
   - Splash-aware routing
   - Force boot + dispatcher presence
   ========================================================= */

/* FORCE BOOT + DISPATCH */
import "../boot/boot.js";
import "../boot/dispatcher.js";

/* FORCE LOADER */
import { Loader } from '/src/elge/master/loader.js';

/* FORCE RUNTIME (SAFE SIDE EFFECT) */
import "../runtime/engine.js";

const routes = {
  home: "/home",
  game: "/game"
};

export const Router = {
  go(pageName) {
    const path = routes[pageName];

    if (!path) {
      console.error("[ELGE ROUTER] Unknown route:", pageName);
      return;
    }

    Loader.show(`Loading ${pageName}`);

    history.pushState({}, "", path);
    window.dispatchEvent(new PopStateEvent("popstate"));
  }
};
