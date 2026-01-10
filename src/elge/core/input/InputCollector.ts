// src/elge/input/InputCollector.ts

import { InputState } from "./InputState";

export class InputCollector {
    state = new InputState();

    attach(element: HTMLElement | Window = window) {
        element.addEventListener("keydown", e => {
            this.state.keys.add(e.code);
        });

        element.addEventListener("keyup", e => {
            this.state.keys.delete(e.code);
        });

        element.addEventListener("mousedown", e => {
            this.state.mouseButtons.add(e.button);
        });

        element.addEventListener("mouseup", e => {
            this.state.mouseButtons.delete(e.button);
        });

        element.addEventListener("mousemove", e => {
            this.state.mouseX += e.movementX;
            this.state.mouseY += e.movementY;
        });

        element.addEventListener("wheel", e => {
            this.state.wheelDelta += e.deltaY;
        });

        element.addEventListener("touchstart", () => {
            this.state.touched = true;
        });

        element.addEventListener("touchend", () => {
            this.state.touched = false;
        });
    }
}
