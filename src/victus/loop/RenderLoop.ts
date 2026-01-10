import { VictusContext } from "../context/VictusContext";

export class RenderLoop {
    private ctx: VictusContext;
    private running = false;
    private lastTime = 0;

    constructor(ctx: VictusContext) {
        this.ctx = ctx;
    }

    start() {
        if (this.running) return;
        this.running = true;
        this.lastTime = performance.now();
        requestAnimationFrame(this.frame);
    }

    stop() {
        this.running = false;
    }

    private frame = (time: number) => {
        if (!this.running) return;

        const delta = time - this.lastTime;
        this.lastTime = time;

        this.tick(delta);
        this.render();

        requestAnimationFrame(this.frame);
    };

    private tick(delta: number) {
        // Logic updates (ELGE will hook here)
    }

    private render() {
        this.ctx.device.clear();
        // Rendering commands will go here
    }
}
