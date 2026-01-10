// src/elge/console/ConsoleInput.ts

import { CommandParser } from "./CommandParser";
import { CommandQueue } from "./CommandQueue";

export class ConsoleInput {
    private parser = new CommandParser();
    private queue: CommandQueue;

    constructor(queue: CommandQueue) {
        this.queue = queue;
    }

    submit(
        text: string,
        tick: number,
        source: "local" | "network" | "script" | "replay" = "local"
    ) {
        const cmd = this.parser.parse(text, tick, source);
        if (cmd) this.queue.enqueue(cmd);
    }
}
