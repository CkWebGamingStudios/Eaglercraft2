import { registerCommand } from "./CommandRegistry.ts";
import { ELGE } from "../master/ELGE.js";
import {
  deleteBot,
  getBot,
  getSelectedBot,
  openBotEditor,
  resetBot,
  selectBot,
  spawnBot,
  updateBot
} from "../ai/botManager.js";

export function registerDefaultCommands() {
  registerCommand("help", () => {
    console.log("Available commands: help, start, home, game, ai.spawn, ai.select, ai.details, ai.name, ai.skin, ai.mode, ai.freeze, ai.tp, ai.edit, ai.reset, ai.delete");
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

  registerCommand("ai.spawn", async args => {
    const position = parseCoords(args);
    const bot = await spawnBot(position);
    console.log(`[ELGE BOT] Spawned ${bot.id} at`, bot.position);
  });

  registerCommand("ai.select", args => {
    const botId = args[0];
    const bot = selectBot(botId);
    if (!bot) {
      console.warn("[ELGE BOT] Unknown bot id", botId);
      return;
    }
    console.log(`[ELGE BOT] Selected ${bot.id}`);
  });

  registerCommand("ai.details", args => {
    const bot = resolveBot(args);
    if (!bot) return;
    console.table({
      id: bot.id,
      name: bot.name,
      mode: bot.mode,
      frozen: bot.frozen,
      skinUrl: bot.skinUrl ?? "none",
      position: JSON.stringify(bot.position)
    });
  });

  registerCommand("ai.name", args => {
    const { bot, remaining } = resolveBotWithArgs(args);
    if (!bot) return;
    const newName = remaining.join(" ").trim();
    if (!newName) {
      console.warn("[ELGE BOT] Provide a name");
      return;
    }
    updateBot(bot.id, { name: newName });
    console.log(`[ELGE BOT] Renamed ${bot.id} to ${newName}`);
  });

  registerCommand("ai.skin", args => {
    const { bot, remaining } = resolveBotWithArgs(args);
    if (!bot) return;
    const url = remaining[0];
    if (!url) {
      console.warn("[ELGE BOT] Provide a skin URL");
      return;
    }
    updateBot(bot.id, { skinUrl: url });
    console.log(`[ELGE BOT] Updated skin for ${bot.id}`);
  });

  registerCommand("ai.mode", args => {
    const { bot, remaining } = resolveBotWithArgs(args);
    if (!bot) return;
    const mode = remaining[0];
    if (!mode || !["destructive", "friendly"].includes(mode)) {
      console.warn("[ELGE BOT] Mode must be destructive or friendly");
      return;
    }
    updateBot(bot.id, { mode });
    console.log(`[ELGE BOT] Mode set to ${mode} for ${bot.id}`);
  });

  registerCommand("ai.freeze", args => {
    const { bot, remaining } = resolveBotWithArgs(args);
    if (!bot) return;
    const toggle = remaining[0];
    const frozen = toggle ? toggle === "on" : !bot.frozen;
    updateBot(bot.id, { frozen });
    console.log(`[ELGE BOT] Freeze ${frozen ? "enabled" : "disabled"} for ${bot.id}`);
  });

  registerCommand("ai.tp", args => {
    const { bot, remaining } = resolveBotWithArgs(args);
    if (!bot) return;
    const position = parseCoords(remaining);
    updateBot(bot.id, { position });
    console.log(`[ELGE BOT] Teleported ${bot.id} to`, position);
  });

  registerCommand("ai.edit", args => {
    const bot = resolveBot(args);
    if (!bot) return;
    openBotEditor(bot.id);
  });

  registerCommand("ai.reset", args => {
    const bot = resolveBot(args);
    if (!bot) return;
    resetBot(bot.id);
    console.log(`[ELGE BOT] Reset ${bot.id}`);
  });

  registerCommand("ai.delete", args => {
    const bot = resolveBot(args);
    if (!bot) return;
    deleteBot(bot.id);
    console.log(`[ELGE BOT] Deleted ${bot.id}`);
  });
}

function parseCoords(args) {
  if (!args || args.length === 0) {
    return { x: 0, y: 0, z: 0 };
  }

  const joined = args.join(" ").replace(/[()]/g, "");
  const parts = joined.split(/[\s,]+/).filter(Boolean);
  const [x, y, z] = parts.map(value => Number(value));
  return {
    x: Number.isFinite(x) ? x : 0,
    y: Number.isFinite(y) ? y : 0,
    z: Number.isFinite(z) ? z : 0
  };
}

function resolveBot(args) {
  const botId = args[0];
  if (botId && getBot(botId)) {
    return getBot(botId);
  }
  const selected = getSelectedBot();
  if (!selected) {
    console.warn("[ELGE BOT] No bot selected");
  }
  return selected;
}

function resolveBotWithArgs(args) {
  const botId = args[0];
  if (botId && getBot(botId)) {
    return { bot: getBot(botId), remaining: args.slice(1) };
  }

  const selected = getSelectedBot();
  if (!selected) {
    console.warn("[ELGE BOT] No bot selected");
    return { bot: null, remaining: [] };
  }

  return { bot: selected, remaining: args };
}
