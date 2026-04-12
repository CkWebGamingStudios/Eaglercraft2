import { BaseRenderer } from '../core/BaseRenderer.ts';

export class WebGL1Renderer implements BaseRenderer {
    private gl: WebGLRenderingContext;
    private program: WebGLProgram | null = null;

    constructor(canvas: HTMLCanvasElement) {
        // Try standard webgl first, then experimental for very old browsers
        const ctx = canvas.getContext('webgl', { 
            alpha: false, 
            depth: true, 
            stencil: false,
            antialias: false, // Turn off for Intel HD 3000 performance
            premultipliedAlpha: false
        }) || canvas.getContext('experimental-webgl');

        if (!ctx) throw new Error("WebGL1 context could not be initialized");
        this.gl = ctx as WebGLRenderingContext;
    }

    getType(): string { return "WebGL1"; }

    clear(): void {
        this.gl.clearColor(0.1, 0.1, 0.1, 1.0);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }

    setViewport(x: number, y: number, w: number, h: number): void {
        this.gl.viewport(x, y, w, h);
    }

    // Helper to check if context is lost (common on older Intel drivers)
    isLost(): boolean {
        return this.gl.isContextLost();
    }
}
