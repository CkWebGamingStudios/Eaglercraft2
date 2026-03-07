import { executeCommand, registerCommand } from "../../core/commandBus.js";

let pointerCommandsRegistered = false;

function ensurePointerCommands() {
  if (pointerCommandsRegistered) {
    return;
  }

  registerCommand("LOOK", () => {});
  registerCommand("ACTION", () => {});
  pointerCommandsRegistered = true;
}

export function initPointer() {
  ensurePointerCommands();

  window.addEventListener("mousemove", (e) => {
    executeCommand("LOOK", {
      dx: e.movementX,
      dy: e.movementY
    });
  });

  window.addEventListener("mousedown", (e) => {
    executeCommand("ACTION", { button: e.button, state: "down" });
  });

  window.addEventListener("mouseup", (e) => {
    executeCommand("ACTION", { button: e.button, state: "up" });
  });
}
