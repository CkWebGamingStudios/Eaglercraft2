// src/elge/input/InputBindings.ts

export type InputAction =
    | "move_forward"
    | "move_backward"
    | "move_left"
    | "move_right"
    | "jump"
    | "attack"
    | "use"
    | "look_x"
    | "look_y";

export const DefaultBindings: Record<InputAction, string | number> = {
    move_forward: "KeyW",
    move_backward: "KeyS",
    move_left: "KeyA",
    move_right: "KeyD",
    jump: "Space",
    attack: 0,
    use: 2,
    look_x: -1,
    look_y: -2
};
