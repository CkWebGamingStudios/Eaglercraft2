let running = false;

// We export the entire object as "Loader"
export const Loader = {
  Engine: {
    start() {
      if (running) return;
      running = true;
      console.log("[ELGE] Engine started");
    },
    stop() {
      if (!running) return;
      running = false;
      console.log("[ELGE] Engine stopped");
    }
  },
  // You can add other loader-specific functions here
  status: () => running
};
