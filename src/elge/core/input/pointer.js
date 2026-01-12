import { executeCommand } from "../../core/commandBus.js";

export function initPointer() {
  window.addEventListener("mousemove", e => {
    executeCommand("LOOK", {
      dx: e.movementX,
      dy: e.movementY
    });
  });

  window.addEventListener("mousedown", e => {
    executeCommand("ACTION", { button: e.button, state: "down" });
  });

  window.addEventListener("mouseup", e => {
    executeCommand("ACTION", { button: e.button, state: "up" });
  });
}
