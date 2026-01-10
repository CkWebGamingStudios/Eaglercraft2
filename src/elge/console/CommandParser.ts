// src/elge/console/CommandParser.ts

import { Command } from "./Command";

export class CommandParser {
    parse(
        input: string,
        tick: number,
        source: Command["source"] = "local"
    ): Command | null {
        const trimmed = input.trim();
        if (!trimmed) return null;

        const parts = trimmed.split(/\s+/);
        const name = parts.shift()!;

        return {
            tick,
            name,
            args: parts,
            source
        };
    }
}
