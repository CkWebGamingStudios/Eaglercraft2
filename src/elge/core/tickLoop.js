let last = performance.now();

export function startTickLoop(update) {
  function loop(now) {
    const delta = (now - last) / 1000;
    last = now;

    update(delta);
    requestAnimationFrame(loop);
  }

  requestAnimationFrame(loop);
}
