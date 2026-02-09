import { getCommand } from "./CommandRegistry.ts";
import { advancementEvent } from "../advancements/events/advancementEvents.js";

export function executeConsoleCommand(input) {
  const parts = input.trim().split(" ");
  const name = parts[0];
  const args = parts.slice(1);

  const cmd = getCommand(name);
  if (!cmd) {
    console.warn("[ELGE CONSOLE] Unknown command:", name);
    return;
  }

  cmd(args);

  advancementEvent("elge:console_command", {
    command: name
  });
}
