import { getCommand, registerCommand } from "./CommandRegistry.ts";

export function registerConsoleCommand(name, command) {
  registerCommand(name, command);
}

export function executeConsoleCommand(input) {
  if (!input.trim()) return;

  const parts = input.trim().split(/\s+/);
  const name = parts[0];
  const args = parts.slice(1);

  const command = getCommand(name);

  if (!command) {
    console.warn(`[ELGE] Unknown command: ${name}`);
    return;
  }

  try {
    command.execute(args);
  } catch (err) {
    console.error(`[ELGE] Command error:`, err);
  }
}
