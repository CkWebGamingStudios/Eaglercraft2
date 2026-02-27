function homeView() {
  return `
    <div class="elge-home">
      <h2>Welcome to ELGE</h2>
      <p>Low-End Game Engine hub is ready.</p>
      <ul>
        <li>Use Sidebar to move between hub modules</li>
        <li>Run commands from the ELGE console</li>
        <li>Start session when systems are ready</li>
      </ul>
    </div>
  `;
}

export function setupNavigation() {
  document.querySelectorAll("#elge-sidebar button").forEach((btn) => {
    btn.addEventListener("click", () => {
      loadView(btn.dataset.view);
    });
  });
}

function loadView(view) {
  const main = document.getElementById("elge-main");
  if (!main) return;

  if (view === "home") {
    main.innerHTML = homeView();
    return;
  }

  if (view === "achievements") {
    main.textContent = "Achievements coming soon";
    return;
  }

  if (view === "leaderboard") {
    main.textContent = "Leaderboard locked (requires achievements)";
    return;
  }

  if (view === "settings") {
    main.textContent = "Settings panel coming soon";
    return;
  }

  main.textContent = `Unknown view: ${view}`;
}
