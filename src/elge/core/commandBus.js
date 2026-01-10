const handlers = new Map();

export function registerCommand(name, fn) {
    handlers.set(name, fn);
}

export function executeCommand(name, payload = {}) {
    const fn = handlers.get(name);
    if (!fn) {
        console.warn(`[ELGE] Unknown command: ${name}`);
        return;
    }
    fn(payload);
}
