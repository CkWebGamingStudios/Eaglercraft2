let loopId = null;

export function startTickLoop(callback) {
    function loop() {
        callback();
        loopId = requestAnimationFrame(loop);
    }
    loop();
}

export function stopTickLoop() {
    if (loopId !== null) {
        cancelAnimationFrame(loopId);
        loopId = null;
    }
}
