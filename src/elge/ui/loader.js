export function setLoaderStatus(text) {
  const el = document.getElementById("elge-status");
  if (el) el.textContent = text;
}

export function removeSplash() {
  const splash = document.getElementById("elge-splash");
  if (splash) {
    splash.style.opacity = "0";
    splash.style.transition = "opacity 300ms ease";
    setTimeout(() => splash.remove(), 300);
  }
}
