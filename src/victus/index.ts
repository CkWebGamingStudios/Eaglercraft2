import { VictusContext } from "./context/VictusContext";
import { RenderLoop } from "./loop/RenderLoop";

export class Victus {
    context: VictusContext;
    loop: RenderLoop;

    constructor(canvas: HTMLCanvasElement) {
        this.context = new VictusContext(canvas);
        this.loop = new RenderLoop(this.context);
    }

    start() {
        this.loop.start();
    }

    stop() {
        this.loop.stop();
    }
}
