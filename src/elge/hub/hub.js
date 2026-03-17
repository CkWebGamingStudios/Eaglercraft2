import { setupNavigation } from "../runtime/ui/navigation.js";

function buildHomeView() {
  return `
    <div class="elge-home">
      <h2>Welcome to ELGE</h2>
      <p>Low-End Game Engine hub is ready.</p>
      <ul>
        <li>Open Achievements to review progress</li>
        <li>Open Leaderboard for rankings</li>
        <li>Open Settings to tune your runtime</li>
      </ul>
    </div>
  `;
}

export function mountHub() {
  const existing = document.getElementById("elge-hub");
  if (existing) {
    existing.remove();
  }

  const root = document.createElement("div");
  root.id = "elge-hub";

  root.innerHTML = `
    <div id="elge-navbar">ELGE HUB</div>
    <div id="elge-layout">
      <div id="elge-sidebar">
        <button data-view="home">Home</button>
        <button data-view="achievements">Achievements</button>
        <button data-view="leaderboard">Leaderboard</button>
        <button data-view="settings">Settings</button>
      </div>
      <div id="elge-main">${buildHomeView()}</div>
    </div>
  `;

  document.body.appendChild(root);
  setupNavigation();
}
