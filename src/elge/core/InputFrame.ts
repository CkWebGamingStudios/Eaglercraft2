// src/elge/core/InputFrame.ts

export interface InputFrame {
    tick: number;
    actions: Record<string, number | boolean>;
}
