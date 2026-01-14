import {
  getAdvancements,
  markCriterionComplete,
  isComplete
} from "./advancementRegistry.js";

export function fireAdvancementTrigger(trigger, payload = {}) {
  for (const [id, adv] of getAdvancements()) {
    for (const key in adv.criteria) {
      const criterion = adv.criteria[key];

      if (criterion.trigger !== trigger) continue;

      if (matchesConditions(criterion.conditions, payload)) {
        markCriterionComplete(id, key);

        if (isComplete(id)) {
          console.log("[ADVANCEMENT COMPLETE]", id);
        }
      }
    }
  }
}

function matchesConditions(conditions = {}, payload) {
  for (const key in conditions) {
    if (payload[key] !== conditions[key] && conditions[key] !== "any") {
      return false;
    }
  }
  return true;
}
