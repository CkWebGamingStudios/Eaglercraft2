import { fireAdvancementTrigger } from "../loader/triggerEvaluator.js";

export function advancementEvent(name, payload) {
  fireAdvancementTrigger(name, payload);
}
