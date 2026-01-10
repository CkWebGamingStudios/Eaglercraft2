// src/elge/net/transports/WebSocketTransport.ts

import { ELGETransport, PacketHandler } from "../Transport";

export class WebSocketTransport implements ELGETransport {
    private ws!: WebSocket;
    private handler!: PacketHandler;

    async connect(endpoint: string): Promise<void> {
        this.ws = new WebSocket(endpoint);
        this.ws.binaryType = "arraybuffer";

        await new Promise<void>((res, rej) => {
            this.ws.onopen = () => res();
            this.ws.onerror = () => rej();
        });

        this.ws.onmessage = e => {
            if (this.handler) this.handler(e.data);
        };
    }

    send(packet: ArrayBuffer): void {
        this.ws.send(packet);
    }

    onReceive(handler: PacketHandler): void {
        this.handler = handler;
    }

    close(): void {
        this.ws.close();
    }
}
