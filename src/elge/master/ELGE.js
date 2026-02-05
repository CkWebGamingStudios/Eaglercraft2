/* =========================================================
   ELGE MASTER COMMAND FILE
   SINGLE ENTRY POINT FOR ALL ENGINE ACTIONS
   ========================================================= */

/* FORCE ALL CORE SYSTEMS */
import "./loader.js";
import "./router.js";

import { Loader } from "./loader.js";
import { Router } from "./router.js";

import "../boot/boot.js";
import "../boot/dispatcher.js";
import "../runtime/engine.js";

import { Engine } from "../runtime/engine.js";

export const ELGE = {
  engine: {
    start() {
      Loader.show("Starting engine");
      Engine.start();
      Loader.hide();
    },

    stop() {
      Engine.stop();
    },

    restart() {
      Engine.stop();
      Engine.start();
    }
  },

  redirect: {
    page(name) {
      Router.go(name);
    }
  }
};
