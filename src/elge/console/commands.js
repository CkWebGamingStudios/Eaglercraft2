import { registerConsoleCommand } from "./consoleCore.js";

export function registerDefaultCommands() {

  registerConsoleCommand("help", () => {
    return "Commands: help, version, clear";
  });

  registerConsoleCommand("version", () => {
    return "ELGE / Eaglercraft2 Engine";
  });

  registerConsoleCommand("clear", () => {
    console.clear();
    return "";
  });

}
