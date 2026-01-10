// src/elge/net/NetConstants.ts

export const ELGE_PROTOCOL_VERSION = 1;

export enum PacketFlags {
    RELIABLE = 1 << 0,
    ORDERED = 1 << 1,
    DROP_OK = 1 << 2
}

export enum PacketChannel {
    CONTROL = 0,
    INPUT = 1,
    WORLD = 2,
    ENTITY = 3,
    CHAT = 4,
    MOD = 5
}
