// src/elge/core/TickScheduler.ts

import { TickClock } from "./TickClock";
import { InputFrame } from "./InputFrame";

type TickHandler = (tick: number, input: InputFrame[]) => void;
type RenderHandler = (alpha: number) => void;

export class TickScheduler {
    private clock: TickClock;
    private tickHandler!: TickHandler;
    private renderHandler!: RenderHandler;

    private inputQueue: InputFrame[] = [];

    constructor(tickRate = 20) {
        this.clock = new TickClock(tickRate);
    }

    onTick(handler: TickHandler) {
        this.tickHandler = handler;
    }

    onRender(handler: RenderHandler) {
        this.renderHandler = handler;
    }

    pushInput(input: InputFrame) {
        this.inputQueue.push(input);
    }

    start() {
        const loop = () => {
            const ticks = this.clock.update();

            for (let i = 0; i < ticks; i++) {
                const currentTick = this.clock.getTick();

                const inputs = this.inputQueue.filter(i => i.tick === currentTick);
                this.inputQueue = this.inputQueue.filter(i => i.tick > currentTick);
                await ModLoader.executeHook('beforeTick', currentTick, inputs);
                
                if (this.tickHandler) {
                    this.tickHandler(currentTick, inputs);
                }
            }

            await ModLoader.executeHook('afterTick', currentTick);
            }
             if (this.renderHandler) {
                this.renderHandler(this.clock.getAlpha());
            }

            requestAnimationFrame(loop);
        };

        loop();
    }
}
