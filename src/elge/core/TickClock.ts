// src/elge/core/TickClock.ts

export class TickClock {
    readonly tickRate: number;
    readonly tickInterval: number;

    private accumulator = 0;
    private lastTime = performance.now();
    private tick = 0;

    constructor(tickRate = 20) {
        this.tickRate = tickRate;
        this.tickInterval = 1000 / tickRate;
    }

    update(): number {
        const now = performance.now();
        const delta = now - this.lastTime;
        this.lastTime = now;

        this.accumulator += delta;

        let ticksProcessed = 0;
        while (this.accumulator >= this.tickInterval) {
            this.accumulator -= this.tickInterval;
            this.tick++;
            ticksProcessed++;
        }

        return ticksProcessed;
    }

    getTick(): number {
        return this.tick;
    }

    getAlpha(): number {
        return this.accumulator / this.tickInterval;
    }
}
