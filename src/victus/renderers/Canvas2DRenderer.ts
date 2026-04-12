import { BaseRenderer } from '../core/BaseRenderer.ts';

export class Canvas2DRenderer implements BaseRenderer {
    private ctx: CanvasRenderingContext2D;

    constructor(canvas: HTMLCanvasElement) {
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Canvas2D context failed");
        this.ctx = ctx;
    }

    getType(): string { return "Canvas2D"; }

    clear(): void {
        this.ctx.fillStyle = "#000000";
        this.ctx.fillRect(0, 0, this.ctx.canvas.width, this.ctx.canvas.height);
    }

    setViewport(x: number, y: number, w: number, h: number): void {
        // Canvas2D uses global transform rather than gl.viewport
        this.ctx.setTransform(1, 0, 0, 1, x, y);
    }

    // Direct draw method for 2D sprites
    drawImage(img: HTMLImageElement, x: number, y: number): void {
        this.ctx.drawImage(img, x, y);
    }
}
