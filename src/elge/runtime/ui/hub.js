import { setupNavigation } from "./navigation.js";
export function mountHub() {
  const splash = document.getElementById("elge-splash");
  if (splash) splash.remove();

  const root = document.createElement("div");
  root.id = "elge-hub";
  document.body.appendChild(root);

  root.innerHTML = `
    <div id="elge-navbar">ELGE HUB</div>
    <div id="elge-layout">
      <div id="elge-sidebar">
        <button data-view="home">Home</button>
        <button data-view="achievements">Achievements</button>
        <button data-view="leaderboard">Leaderboard</button>
        <button data-view="settings">Settings</button>
      </div>
      <div id="elge-main">Welcome to ELGE</div>
    </div>
  `;

  setupNavigation();
}
