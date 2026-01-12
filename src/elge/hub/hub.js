export function mountHub() {
  const root = document.createElement("div");
  root.id = "elge-hub";

  root.innerHTML = `
    <div class="elge-navbar">ELGE HUB</div>
    <div class="elge-body">
      <div class="elge-sidebar">Sidebar</div>
      <div class="elge-content">Welcome to ELGE</div>
    </div>
  `;

  document.body.appendChild(root);
}
