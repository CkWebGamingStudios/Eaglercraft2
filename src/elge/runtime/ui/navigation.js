export function setupNavigation() {
    document.querySelectorAll("#elge-sidebar button").forEach(btn => {
        btn.addEventListener("click", () => {
            loadView(btn.dataset.view);
        });
    });
}

function loadView(view) {
    const main = document.getElementById("elge-main");
    main.textContent = `Loading ${view}...`;

    if (view === "achievements") {
        main.textContent = "Achievements coming soon";
    }

    if (view === "leaderboard") {
        main.textContent = "Leaderboard locked (requires achievements)";
    }
}
