export function scanContext() {
  return {
    referrer: document.referrer || "direct",
    path: location.pathname,
    query: Object.fromEntries(new URLSearchParams(location.search)),
    hash: location.hash,
    navigation: performance.getEntriesByType("navigation")[0]?.type || "unknown"
  };
}
