import { registerCommand } from "../core/commandBus.js";

const registry = {};

export function registerConsoleCommand(name, fn) {
  registry[name] = fn;
}

export function executeConsoleCommand(input) {
  const [cmd, ...args] = input.trim().split(" ");
  const fn = registry[cmd];

  if (!fn) return `Unknown command: ${cmd}`;
  return fn(args);
}
