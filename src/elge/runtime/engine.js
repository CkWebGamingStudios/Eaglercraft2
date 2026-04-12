import { TickClock } from "../boot/boot.js";

export const Engine = {
  renderer: null,
  isRunning: false,

  /**
   * Accepts the renderer from ELGE.start
   */
  async start(renderer) {
    if (!renderer) throw new Error("Engine: No renderer provided");
    
    this.renderer = renderer;
    this.isRunning = true;

    // Standard engine initialization
    console.log("Engine: Runtime systems starting...");
    
    // Start the game loop
    this.loop();
  },

  loop() {
    if (!this.isRunning) return;

    // Use the renderer's clear method
    if (this.renderer && typeof this.renderer.clear === 'function') {
      this.renderer.clear();
    }

    // Request next frame
    requestAnimationFrame(() => this.loop());
  },

  stop() {
    this.isRunning = false;
    console.log("Engine: Runtime systems stopped.");
  }
};
