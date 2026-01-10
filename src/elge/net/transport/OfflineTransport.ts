// src/elge/net/transports/OfflineTransport.ts

import { ELGETransport, PacketHandler } from "../Transport";

export class OfflineTransport implements ELGETransport {
    private handler!: PacketHandler;

    async connect(): Promise<void> { }

    send(packet: ArrayBuffer): void {
        queueMicrotask(() => {
            if (this.handler) this.handler(packet);
        });
    }

    onReceive(handler: PacketHandler): void {
        this.handler = handler;
    }

    close(): void { }
}
