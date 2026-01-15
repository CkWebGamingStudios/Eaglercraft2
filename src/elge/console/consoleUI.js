import { executeConsoleCommand } from "./consoleCore.js";

export function initConsole() {
  const input = document.getElementById("elge-console-input");
  if (!input) return;

  input.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      executeConsoleCommand(input.value);
      input.value = "";
    }
  });
}
