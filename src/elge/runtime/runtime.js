import { initInputSystem } from "../core/input/inputManager.js";
import { initPointer } from "../core/input/pointer.js";
import { initConsole } from "../console/consoleUI.js";
import { registerDefaultCommands } from "../console/commands.js";
import { mountHub, unmountHub } from "../ui/hub/hub.js";
import { startTickLoop, stopTickLoop } from "../core/loop/tick.js";

export function startRuntime() {
    let running = false;
    let mounted = false;
    let root = null;

    function mount(selector = "body") {
        if (mounted) return;
        root = document.querySelector(selector) || document.body;
        mounted = true;
    } // Fixed missing brace

    function start() { // Removed 'export' and renamed to match return object
        if (running) return;

        initInputSystem();
        initPointer();
        initConsole();
        registerDefaultCommands();

        mountHub(root);

        startTickLoop(() => {
            // future update/render
        });

        running = true;
    }

    function show() {
        if (!mounted) mount();
        if (!running) start();
        if (root) root.style.display = "block";
    }

    function hide() {
        if (root) root.style.display = "none";
    }

    function destroy() {
        if (!running) return;

        stopTickLoop();
        unmountHub();

        running = false;
        mounted = false;
    }

    return { mount, start, show, hide, destroy };
}
