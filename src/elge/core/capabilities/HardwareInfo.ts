export class HardwareInfo {
    static cpuThreads(): number {
        return navigator.hardwareConcurrency || 1;
    }

    static memoryMB(): number {
        // Very rough but acceptable
        const nav: any = navigator;
        return nav.deviceMemory ? nav.deviceMemory * 1024 : 1024;
    }

    static isMobile(): boolean {
        return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    }
}
