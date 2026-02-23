export function scanCapabilities() {
  const canvas = document.createElement("canvas");
  let gl = null;

  try {
    gl = canvas.getContext("webgl") || canvas.getContext("experimental-webgl");
  } catch {
    gl = null;
  }

  return {
    webgl: !!gl,
    webglVersion:
      gl && window.WebGL2RenderingContext && gl instanceof WebGL2RenderingContext
        ? 2
        : gl
          ? 1
          : 0,
    wasm: typeof WebAssembly === "object",
    memoryGB: navigator.deviceMemory || 2,
    threads: navigator.hardwareConcurrency || 2,
    mobile: /Android|iPhone|iPad/i.test(navigator.userAgent)
  };
}
