// src/elge/net/Transport.ts

export type PacketHandler = (data: ArrayBuffer) => void;

export interface ELGETransport {
    connect(endpoint?: string): Promise<void>;
    send(packet: ArrayBuffer): void;
    onReceive(handler: PacketHandler): void;
    close(): void;
}
