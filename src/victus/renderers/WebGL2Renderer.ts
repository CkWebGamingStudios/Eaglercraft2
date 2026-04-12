import { BaseRenderer } from '../core/BaseRenderer.ts';

export class WebGL2Renderer implements BaseRenderer {
    private gl: WebGL2RenderingContext;

    constructor(canvas: HTMLCanvasElement) {
        const ctx = canvas.getContext('webgl2', { antialias: true });
        if (!ctx) throw new Error("WebGL2 not supported on this device");
        this.gl = ctx;
    }

    getType(): string { return "WebGL2"; }

    clear(): void {
        this.gl.clearBufferfv(this.gl.COLOR, 0, [0, 0, 0, 1]);
        this.gl.clearBufferfi(this.gl.DEPTH_STENCIL, 0, 1.0, 0);
    }

    setViewport(x: number, y: number, w: number, h: number): void {
        this.gl.viewport(x, y, w, h);
    }
}
