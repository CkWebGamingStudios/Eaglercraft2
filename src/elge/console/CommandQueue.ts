// src/elge/console/CommandQueue.ts

import { Command } from "./Command";
import { CommandRegistry } from "./CommandRegistry";

export class CommandQueue {
    private queue: Command[] = [];

    enqueue(cmd: Command) {
        this.queue.push(cmd);
    }

    flush(tick: number, registry: CommandRegistry) {
        const executable = this.queue.filter(c => c.tick === tick);
        this.queue = this.queue.filter(c => c.tick !== tick);

        for (const cmd of executable) {
            registry.execute(cmd.name, cmd.args);
        }
    }
}
