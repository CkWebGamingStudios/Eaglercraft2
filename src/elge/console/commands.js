import { registerConsoleCommand } from "./consoleCore.js";

export function registerDefaultCommands() {
  registerConsoleCommand("help", {
    description: "List available commands",
    execute() {
      console.log("Available commands: help");
    }
  });

  registerConsoleCommand("version", {
    execute() {
      console.log("ELGE Engine v0.1");
    }
  });
}
