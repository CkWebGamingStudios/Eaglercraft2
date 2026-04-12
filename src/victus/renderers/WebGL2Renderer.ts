import { BaseRenderer } from '../core/BaseRenderer';
import { Vec3, Color } from '../math/Vec3';

export class WebGL2Renderer implements BaseRenderer {
    private gl: WebGL2RenderingContext;

    constructor(canvas: HTMLCanvasElement) {
        const ctx = canvas.getContext('webgl2', { antialias: true });
        if (!ctx) throw new Error("WebGL2 not supported");
        this.gl = ctx;
    }

    clear(): void {
        this.gl.clearColor(0, 0, 0, 1);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    drawTriangle(v1: Vec3, v2: Vec3, v3: Vec3, color: Color): void {
        // High-performance VAO-based drawing logic would go here
    }

    setViewport(x: number, y: number, w: number, h: number): void {
        this.gl.viewport(x, y, w, h);
    }
}
