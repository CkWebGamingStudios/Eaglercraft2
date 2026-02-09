const bots = new Map();
let botCounter = 0;
let selectedBotId = null;
let cachedInstructions = null;

const STORAGE_PREFIX = "elge:bot";

async function loadInstructions() {
  if (cachedInstructions !== null) {
    return cachedInstructions;
  }

  try {
    const response = await fetch("/bot.md", { cache: "no-store" });
    cachedInstructions = await response.text();
  } catch (error) {
    console.warn("[ELGE BOT] Failed to load bot.md", error);
    cachedInstructions = "Follow developer commands and keep actions safe.";
  }

  return cachedInstructions;
}

function serializePosition(position) {
  return { x: position.x, y: position.y, z: position.z };
}

function getStorageKey(botId, key) {
  return `${STORAGE_PREFIX}:${botId}:${key}`;
}

function persistBot(bot) {
  localStorage.setItem(getStorageKey(bot.id, "state"), JSON.stringify({
    id: bot.id,
    name: bot.name,
    mode: bot.mode,
    frozen: bot.frozen,
    skinUrl: bot.skinUrl,
    position: serializePosition(bot.position)
  }));
  localStorage.setItem(getStorageKey(bot.id, "instructions"), bot.instructions);
}

function restoreBotState(bot) {
  const rawState = localStorage.getItem(getStorageKey(bot.id, "state"));
  if (!rawState) return bot;

  try {
    const parsed = JSON.parse(rawState);
    return {
      ...bot,
      name: parsed.name ?? bot.name,
      mode: parsed.mode ?? bot.mode,
      frozen: parsed.frozen ?? bot.frozen,
      skinUrl: parsed.skinUrl ?? bot.skinUrl,
      position: parsed.position ?? bot.position
    };
  } catch (error) {
    console.warn("[ELGE BOT] Failed to restore bot state", error);
    return bot;
  }
}

export async function spawnBot(position) {
  botCounter += 1;
  const id = `ai-${String(botCounter).padStart(4, "0")}`;
  const instructions = await loadInstructions();
  const newBot = restoreBotState({
    id,
    name: `ELGE Bot ${botCounter}`,
    mode: "friendly",
    frozen: false,
    skinUrl: null,
    position: serializePosition(position),
    instructions
  });

  bots.set(id, newBot);
  selectedBotId = id;
  persistBot(newBot);
  return newBot;
}

export function getBot(botId) {
  return bots.get(botId) ?? null;
}

export function listBots() {
  return Array.from(bots.values());
}

export function selectBot(botId) {
  if (!bots.has(botId)) return null;
  selectedBotId = botId;
  return bots.get(botId);
}

export function getSelectedBot() {
  return selectedBotId ? bots.get(selectedBotId) : null;
}

export function updateBot(botId, updates) {
  const bot = bots.get(botId);
  if (!bot) return null;

  Object.assign(bot, updates);
  persistBot(bot);
  return bot;
}

export function resetBot(botId) {
  const bot = bots.get(botId);
  if (!bot) return null;

  const reset = {
    ...bot,
    mode: "friendly",
    frozen: false,
    skinUrl: null,
    position: { x: 0, y: 0, z: 0 }
  };
  bots.set(botId, reset);
  persistBot(reset);
  return reset;
}

export function deleteBot(botId) {
  if (!bots.has(botId)) return false;
  bots.delete(botId);
  if (selectedBotId === botId) {
    selectedBotId = null;
  }
  return true;
}

export function openBotEditor(botId) {
  const bot = bots.get(botId);
  if (!bot) return;

  const existing = document.getElementById("elge-bot-editor");
  if (existing) existing.remove();

  const overlay = document.createElement("div");
  overlay.id = "elge-bot-editor";
  overlay.className = "elge-bot-editor";
  overlay.innerHTML = `
    <div class="elge-bot-editor-card">
      <h3>Edit ${bot.name}</h3>
      <label>
        Name
        <input type="text" id="elge-bot-name" value="${bot.name}">
      </label>
      <label>
        Instructions
        <textarea id="elge-bot-instructions" rows="6">${bot.instructions}</textarea>
      </label>
      <div class="elge-bot-editor-actions">
        <button id="elge-bot-save">Save</button>
        <button id="elge-bot-close">Close</button>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  overlay.querySelector("#elge-bot-close").addEventListener("click", () => {
    overlay.remove();
  });

  overlay.querySelector("#elge-bot-save").addEventListener("click", () => {
    const newName = overlay.querySelector("#elge-bot-name").value.trim();
    const newInstructions = overlay.querySelector("#elge-bot-instructions").value.trim();
    updateBot(botId, {
      name: newName || bot.name,
      instructions: newInstructions || bot.instructions
    });
    overlay.remove();
  });
}
