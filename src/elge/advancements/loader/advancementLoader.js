import { registerAdvancement } from "./advancementRegistry.js";

export async function loadAdvancements(manifest) {
  for (const url of manifest) {
    const res = await fetch(url);
    const json = await res.json();

    validateAdvancement(json);
    registerAdvancement(json);
  }

  console.log("[ELGE] Advancements loaded:", manifest.length);
}

function validateAdvancement(json) {
  if (!json.id || !json.criteria) {
    throw new Error("Invalid advancement format");
  }

  for (const key in json.criteria) {
    if (!json.criteria[key].trigger) {
      throw new Error(`Criterion ${key} missing trigger`);
    }
  }
}
