// src/elge/net/NetCore.ts

import { ELGETransport } from "./Transport";
import { NetPacket } from "./NetPacket";

type PacketListener = (pkt: NetPacket) => void;

export class NetCore {
    private listeners = new Map<number, PacketListener[]>();

    constructor(private transport: ELGETransport) {
        this.transport.onReceive(this.handleRaw.bind(this));
    }

    async connect(endpoint?: string) {
        await this.transport.connect(endpoint);
    }

    send(packet: NetPacket) {
        this.transport.send(packet.encode());
    }

    on(packetType: number, handler: PacketListener) {
        if (!this.listeners.has(packetType)) {
            this.listeners.set(packetType, []);
        }
        this.listeners.get(packetType)!.push(handler);
    }

    private handleRaw(data: ArrayBuffer) {
        const pkt = NetPacket.decode(data);
        const handlers = this.listeners.get(pkt.type);
        if (!handlers) return;

        for (const h of handlers) h(pkt);
    }

    close() {
        this.transport.close();
    }
}
