const canvas = document.getElementById("elge-canvas");
const ctx = canvas.getContext("2d");

let t = 0;
let currentStatus = "Initializing…";

export function setSplashStatus(text) {
  currentStatus = text;
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const cx = 256;
  const cy = 256;

  // Outer rotating ring
  ctx.strokeStyle = "#2979ff";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.arc(cx, cy, 90, t, t + Math.PI * 1.5);
  ctx.stroke();

  // Inner ring
  ctx.strokeStyle = "#00e5ff";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(cx, cy, 65, -t * 1.5, -t * 1.5 + Math.PI);
  ctx.stroke();

  // V core
  ctx.strokeStyle = "#eaf6ff";
  ctx.lineWidth = 10;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(200, 180);
  ctx.lineTo(256, 320);
  ctx.lineTo(312, 180);
  ctx.stroke();

  t += 0.02;
  requestAnimationFrame(draw);
}

draw();

// Status rendering (NO interval anymore)
const statusEl = document.getElementById("elge-status");

function updateStatus() {
  statusEl.textContent = currentStatus;
  requestAnimationFrame(updateStatus);
}

updateStatus();
