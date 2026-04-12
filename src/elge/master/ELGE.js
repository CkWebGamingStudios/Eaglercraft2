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
     */
    async start(canvas) {
      if (!canvas) {
        throw new Error("ELGE: Canvas element is missing.");
      }

      Loader.show("Starting engine");

      try {
        // 1. Initialize the Hardware Context using the Factory
        this.renderer = RendererFactory.createOptimal(canvas);

        if (!this.renderer) {
          throw new Error("Failed to initialize a compatible Victus renderer.");
        }

        // 2. Start the core engine and pass the renderer to it
        await Engine.start(this.renderer);
        
        // 3. Safety Check: Only log type if the function exists
        // This prevents the "getType is not a function" crash
        const rendererType = (typeof this.renderer.getType === 'function') 
          ? this.renderer.getType() 
          : "Unknown Mode";
          
        console.log(`ELGE: Engine live [Mode: ${rendererType}]`);
        
        Loader.hide();
      } catch (err) {
        Loader.hide();
        console.error("ELGE Fatal Boot Error:", err);
        throw err; // This allows Play.jsx to show the error screen you're seeing
      }
    },

    stop() {
      if (Engine.stop) Engine.stop();
      this.renderer = null;
    },

    async restart(canvas) {
      this.stop();
      await this.start(canvas);
    }
  },

  redirect: {
    page(name) {
      Router.go(name);
    }
  }
};
