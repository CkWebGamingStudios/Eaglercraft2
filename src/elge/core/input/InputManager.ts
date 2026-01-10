// src/elge/input/InputManager.ts

import { InputCollector } from "./InputCollector";
import { InputFrame } from "../core/InputFrame";
import { DefaultBindings, InputAction } from "./InputBindings";

export class InputManager {
    private collector: InputCollector;
    private bindings = DefaultBindings;

    constructor(collector: InputCollector) {
        this.collector = collector;
    }

    buildFrame(tick: number): InputFrame {
        const state = this.collector.state;
        const actions: Record<string, number | boolean> = {};

        for (const action in this.bindings) {
            const bind = this.bindings[action as InputAction];

            if (typeof bind === "string") {
                actions[action] = state.keys.has(bind);
            } else if (typeof bind === "number") {
                actions[action] = state.mouseButtons.has(bind);
            }
        }

        actions["look_x"] = state.mouseX;
        actions["look_y"] = state.mouseY;

        state.mouseX = 0;
        state.mouseY = 0;
        state.resetTransient();

        return { tick, actions };
    }
}
