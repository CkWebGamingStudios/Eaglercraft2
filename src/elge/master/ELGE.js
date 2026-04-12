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
import { Engine } from "../runtime/engine.js";

// Link to the Victus Rendering System
import { RendererFactory } from "../../victus/core/RendererFactory";

export const ELGE = {
  engine: {
    renderer: null,

    /**
     * Starts the engine and initializes the renderer
     * @param {HTMLCanvasElement} canvas - Passed from Play.jsx
     */
    async start(canvas) {
      // 1. Show the global loader
      Loader.show("Starting engine");

      try {
        // 2. Initialize the Hardware Context using the Factory
        // This is what prevents the "b.show is not a function" error
        this.renderer = RendererFactory.createOptimal(canvas);

        if (!this.renderer) {
          throw new Error("Failed to initialize a compatible Victus renderer.");
        }

        // 3. Start the core engine and pass the renderer to it
        await Engine.start(this.renderer);
        
        console.log(`ELGE: Engine live [Mode: ${this.renderer.getType()}]`);
        
        // 4. Hide loader once ready
        Loader.hide();
      } catch (err) {
        Loader.hide();
        console.error("ELGE Fatal Boot Error:", err);
        throw err; // Re-throw to show error panel in Play.jsx
      }
    },

    /**
     * Shuts down the engine loop
     */
    stop() {
      Engine.stop();
      this.renderer = null;
    },

    /**
     * Full engine restart sequence
     * @param {HTMLCanvasElement} canvas
     */
    async restart(canvas) {
      this.stop();
      await this.start(canvas);
    }
  },

  redirect: {
    /**
     * Standard page navigation via the ELGE Router
     */
    page(name) {
      Router.go(name);
    }
  }
};
