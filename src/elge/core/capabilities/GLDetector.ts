export class GLDetector {
    static detect() {
        const canvas = document.createElement("canvas");

        let gl1 = canvas.getContext("webgl")
            || canvas.getContext("experimental-webgl");

        let gl2 = canvas.getContext("webgl2");

        if (gl2) {
            return { supported: true, version: 2, gl: gl2 };
        }

        if (gl1) {
            return { supported: true, version: 1, gl: gl1 };
        }

        return { supported: false, version: 0, gl: null };
    }

    static getRendererInfo(gl: WebGLRenderingContext | WebGL2RenderingContext) {
        const dbg = gl.getExtension("WEBGL_debug_renderer_info");
        if (!dbg) {
            return { vendor: "Unknown", renderer: "Unknown" };
        }

        return {
            vendor: gl.getParameter(dbg.UNMASKED_VENDOR_WEBGL),
            renderer: gl.getParameter(dbg.UNMASKED_RENDERER_WEBGL),
        };
    }
}
