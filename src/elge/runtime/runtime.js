import { removeSplash } from "../ui/loader.js";
import { initInputSystem } from "../core/input/InputManager.js";
import { initPointer } from "../core/input/pointer.js";
import { startTickLoop } from "../core/tickLoop.js";
import { initConsole } from "../console/consoleUI.js";
import { registerDefaultCommands } from "../console/commands.js";
import { mountHub } from "../hub/hub.js";

export function startRuntime({ context, capabilities }) {
    console.log("[ELGE] Runtime starting", { context, capabilities });

    // Remove splash screen cleanly
    removeSplash();

    // Initialize engine subsystems
    initInputSystem();
    initPointer();

    // Console & commands
    initConsole();
    registerDefaultCommands();

    // Mount UI shell (navbar + sidebar)
    mountHub();

    // Main engine loop
    startTickLoop((dt) => {
        // Engine update tick
        // Renderer, world, net sync will hook here
    });

    console.log("[ELGE] Runtime ready");
}
