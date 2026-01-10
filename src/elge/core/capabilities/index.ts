import { GLDetector } from "./GLDetector";
import { HardwareInfo } from "./HardwareInfo";
import { SystemRequirements } from "./SystemRequirements";
import { CapabilityReport } from "./CapabilityReport";

export function detectCapabilities(): CapabilityReport {
    const glInfo = GLDetector.detect();

    let vendor = "None";
    let renderer = "None";

    if (glInfo.gl) {
        const info = GLDetector.getRendererInfo(glInfo.gl);
        vendor = info.vendor;
        renderer = info.renderer;
    }

    const report: CapabilityReport = {
        webgl: {
            supported: glInfo.supported,
            version: glInfo.version,
            vendor,
            renderer,
        },
        cpu: {
            threads: HardwareInfo.cpuThreads(),
        },
        memory: {
            estimatedMB: HardwareInfo.memoryMB(),
        },
        input: {
            keyboard: true,
            mouse: true,
            touch: "ontouchstart" in window,
            gamepad: "getGamepads" in navigator,
        },
        device: {
            mobile: HardwareInfo.isMobile(),
            lowEnd: false,
        },
        eligibleForELGE: false,
    };

    return SystemRequirements.evaluate(report);
}
