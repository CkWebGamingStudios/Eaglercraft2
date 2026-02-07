import { registerCommand } from "./CommandRegistry.ts";
import { ELGE } from "../master/ELGE.js";

export function registerDefaultCommands() {
  registerCommand("help", () => {
    console.log("Available commands: help, start, home, game");
  });

  registerCommand("start", () => {
    ELGE.engine.start();
  });

  registerCommand("home", () => {
    ELGE.redirect.page("home");
  });

  registerCommand("game", () => {
    ELGE.redirect.page("game");
  });
}
