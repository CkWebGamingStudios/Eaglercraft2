let running = false;

export const Engine = {
  start() {
    if (running) return;
    running = true;

    console.log("[ELGE] Engine started");

    // Victus renderer init (next step)
    // Input system
    // Tick loop
  },

  stop() {
    if (!running) return;
    running = false;

    console.log("[ELGE] Engine stopped");
  }
};
