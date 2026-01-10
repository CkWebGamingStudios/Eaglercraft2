// src/elge/input/InputState.ts

export class InputState {
    keys = new Set<string>();
    mouseButtons = new Set<number>();
    mouseX = 0;
    mouseY = 0;
    wheelDelta = 0;
    touched = false;

    resetTransient() {
        this.wheelDelta = 0;
    }
}
