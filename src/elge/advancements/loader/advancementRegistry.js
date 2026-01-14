const advancements = new Map();
const progress = new Map();

export function registerAdvancement(def) {
  advancements.set(def.id, def);
  progress.set(def.id, {});
}

export function getAdvancements() {
  return advancements;
}

export function getProgress(id) {
  return progress.get(id);
}

export function markCriterionComplete(id, criterion) {
  const p = progress.get(id);
  if (!p) return;

  p[criterion] = true;
}

export function isComplete(id) {
  const adv = advancements.get(id);
  const p = progress.get(id);
  if (!adv || !p) return false;

  return Object.keys(adv.criteria).every(c => p[c]);
}
