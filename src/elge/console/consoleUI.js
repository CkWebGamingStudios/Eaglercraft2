import { executeConsoleCommand } from "./consoleCore.js";

let visible = false;
let inputEl, outputEl;

export function initConsole() {
  const root = document.createElement("div");
  root.id = "elge-console";
  root.style.cssText = `
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: #000;
    color: #0f0;
    font-family: monospace;
    display: none;
    padding: 8px;
  `;

  outputEl = document.createElement("div");
  inputEl = document.createElement("input");

  inputEl.style.cssText = `
    width: 100%;
    background: black;
    color: #0f0;
    border: none;
    outline: none;
  `;

  inputEl.addEventListener("keydown", e => {
    if (e.key === "Enter") {
      const result = executeConsoleCommand(inputEl.value);
      if (result) outputEl.innerText += `\n${result}`;
      inputEl.value = "";
    }
  });

  root.appendChild(outputEl);
  root.appendChild(inputEl);
  document.body.appendChild(root);

  window.addEventListener("keydown", e => {
    if (e.code === "Backquote") toggleConsole();
  });
}

export function toggleConsole() {
  visible = !visible;
  document.getElementById("elge-console").style.display =
    visible ? "block" : "none";
}
