import { advancementEvent } from "../advancements/events/advancementEvents.js";
import { getCommand } from "./commandRegistry.ts";

export function executeCommand(input) {
  const parts = input.trim().split(" ");
  const commandName = parts[0];
  const args = parts.slice(1);

  const command = getCommand(commandName);
  if (!command) {
    return;
  }

  // Execute command logic
  command.execute(args);

  // 🔹 ADVANCEMENT TRIGGER (THIS IS THE LINE)
  advancementEvent("elge:console_command", {
    command: commandName
  });
}
