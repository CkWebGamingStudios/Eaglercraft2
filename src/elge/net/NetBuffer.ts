// src/elge/net/NetBuffer.ts

export class NetBuffer {
    private view: DataView;
    private offset = 0;

    constructor(private buffer: ArrayBuffer) {
        this.view = new DataView(buffer);
    }

    static alloc(size: number): NetBuffer {
        return new NetBuffer(new ArrayBuffer(size));
    }

    writeU8(v: number) { this.view.setUint8(this.offset++, v); }
    writeU32(v: number) {
        this.view.setUint32(this.offset, v, true);
        this.offset += 4;
    }

    readU8(): number { return this.view.getUint8(this.offset++); }
    readU32(): number {
        const v = this.view.getUint32(this.offset, true);
        this.offset += 4;
        return v;
    }

    writeBytes(bytes: Uint8Array) {
        new Uint8Array(this.buffer, this.offset, bytes.length).set(bytes);
        this.offset += bytes.length;
    }

    readBytes(len: number): Uint8Array {
        const out = new Uint8Array(this.buffer.slice(this.offset, this.offset + len));
        this.offset += len;
        return out;
    }

    getBuffer(): ArrayBuffer {
        return this.buffer.slice(0, this.offset);
    }
}
