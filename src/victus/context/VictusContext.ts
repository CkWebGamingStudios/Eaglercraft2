import { GLDevice } from "../gl/GLDevice";

export class VictusContext {
    canvas: HTMLCanvasElement;
    gl: WebGLRenderingContext | WebGL2RenderingContext;
    device: GLDevice;

    constructor(canvas: HTMLCanvasElement) {
        this.canvas = canvas;

        const gl2 = canvas.getContext("webgl2");
        const gl1 = canvas.getContext("webgl");

        if (gl1) {
            this.gl = gl1;
        } else if (gl2) {
            this.gl = gl2;
        } else {
            throw new Error("Victus: WebGL not supported on this device");
        }

        this.device = new GLDevice(this.gl);
        this.resize();
        window.addEventListener("resize", () => this.resize());
    }

    resize() {
        const dpr = window.devicePixelRatio || 1;
        const width = this.canvas.clientWidth * dpr;
        const height = this.canvas.clientHeight * dpr;

        this.canvas.width = width;
        this.canvas.height = height;
        this.gl.viewport(0, 0, width, height);
    }
}
