export interface CapabilityReport {
    webgl: {
        supported: boolean;
        version: 0 | 1 | 2;
        vendor: string;
        renderer: string;
    };

    cpu: {
        threads: number;
    };

    memory: {
        estimatedMB: number;
    };

    input: {
        keyboard: boolean;
        mouse: boolean;
        touch: boolean;
        gamepad: boolean;
    };

    device: {
        mobile: boolean;
        lowEnd: boolean;
    };

    eligibleForELGE: boolean;
}
