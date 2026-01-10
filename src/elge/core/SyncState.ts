// src/elge/core/SyncState.ts

export interface SyncState {
    tick: number;
    checksum: number;
    payload: ArrayBuffer;
}
