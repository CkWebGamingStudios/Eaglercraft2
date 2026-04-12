/* =========================================================
   ELGE MASTER COMMAND FILE
   SINGLE ENTRY POINT FOR ALL ENGINE ACTIONS
   ========================================================= */

/* FORCE ALL CORE SYSTEMS */
import "./loader.js";
import "./router.js";

import { Loader } from "./loader.js";
import { Router } from "./router.js";

// Import Boot & Runtime logic
import "../boot/boot.js";
import "../boot/dispatcher.js";
import { Engine } from "../runtime/engine.js";

// Import the Victus Rendering System
import { RendererFactory } from "../../victus/core/RendererFactory";

export const ELGE = {
  engine: {
    renderer: null,

    /**
     * Starts the engine. 
     * Now accepts a canvas element to initialize the Victus Renderer.
     */
    async start(canvas) {
      Loader.show("Starting engine...");
      
      try {
        // 1. Initialize the Hardware Context
        this.renderer = RendererFactory.createOptimal(canvas);
        
        if (!this.renderer) {
          throw new Error("ELGE: Hardware initialization failed. No compatible renderer found.");
        }

        // 2. Pass the renderer to the core Engine
        await Engine.start(this.renderer);
        
        console.log(`ELGE: Engine live [Mode: ${this.renderer.getType()}]`);
        Loader.hide();
      } catch (error) {
        Loader.hide();
        console.error("ELGE Boot Failure:", error);
        // Throwing allows Play.jsx to catch the error and show the UI
        throw error; 
      }
    },

    /**
     * Shuts down the engine and clears the renderer reference
     */
    stop() {
      Engine.stop();
      this.renderer = null;
    },

    /**
     * Restarts the engine (useful for GPU context recovery)
     */
    async restart(canvas) {
      this.stop();
      await this.start(canvas);
    }
  },

  redirect: {
    /**
     * Navigation helper linked to the internal Router
     */
    page(name) {
      Router.go(name);
    }
  }
};
