// src/elge/master/loader.js

let running = false;

export const Loader = {
  show(message = "Loading...") {
    const loaderEl = document.getElementById("elge-loader") || 
                     document.getElementById("elge-status");
    if (loaderEl) {
      loaderEl.textContent = message;
      loaderEl.style.display = "block";
    } else {
      console.log(`[ELGE Loader] ${message}`);
    }
  },

  hide() {
    const loaderEl = document.getElementById("elge-loader") || 
                     document.getElementById("elge-status");
    if (loaderEl) {
      loaderEl.style.display = "none";
    }
  },

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
  
  status: () => running
};
