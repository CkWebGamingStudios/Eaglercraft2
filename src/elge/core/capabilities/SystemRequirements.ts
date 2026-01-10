import { CapabilityReport } from "./CapabilityReport";

export class SystemRequirements {
    static evaluate(report: CapabilityReport): CapabilityReport {
        let eligible = true;

        if (!report.webgl.supported) eligible = false;
        if (report.cpu.threads < 2) eligible = false;
        if (report.memory.estimatedMB < 512) eligible = false;

        report.device.lowEnd =
            report.webgl.version === 1 ||
            report.cpu.threads <= 2 ||
            report.memory.estimatedMB <= 1024;

        report.eligibleForELGE = eligible;
        return report;
    }
}
