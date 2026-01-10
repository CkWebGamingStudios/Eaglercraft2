// src/elge/net/NetPacket.ts

import { ELGE_PROTOCOL_VERSION } from "./NetConstants";
import { NetBuffer } from "./NetBuffer";

export class NetPacket {
    constructor(
        public type: number,
        public flags: number,
        public channel: number,
        public payload: Uint8Array
    ) { }

    encode(): ArrayBuffer {
        const buf = NetBuffer.alloc(8 + this.payload.length);

        buf.writeU8(ELGE_PROTOCOL_VERSION);
        buf.writeU8(this.type);
        buf.writeU8(this.flags);
        buf.writeU8(this.channel);
        buf.writeU32(this.payload.length);
        buf.writeBytes(this.payload);

        return buf.getBuffer();
    }

    static decode(buffer: ArrayBuffer): NetPacket {
        const buf = new NetBuffer(buffer);

        const version = buf.readU8();
        if (version !== ELGE_PROTOCOL_VERSION) {
            throw new Error("Protocol version mismatch");
        }

        const type = buf.readU8();
        const flags = buf.readU8();
        const channel = buf.readU8();
        const len = buf.readU32();
        const payload = buf.readBytes(len);

        return new NetPacket(type, flags, channel, payload);
    }
}
