// src/elge/console/CommandRegistry.ts

export type CommandHandler = (args: string[]) => void;

export class CommandRegistry {
    private handlers = new Map<string, CommandHandler>();

    register(name: string, handler: CommandHandler) {
        this.handlers.set(name.toLowerCase(), handler);
    }

    execute(name: string, args: string[]) {
        const handler = this.handlers.get(name.toLowerCase());
        if (!handler) {
            throw new Error(`Unknown command: ${name}`);
        }
        handler(args);
    }

    has(name: string) {
        return this.handlers.has(name.toLowerCase());
    }
}
