type CommandHandler = (args: string[]) => void;

const commands = new Map<string, CommandHandler>();

export function registerCommand(name: string, handler: CommandHandler) {
  commands.set(name, handler);
}

export function getCommand(name: string) {
  return commands.get(name);
}

export function getAllCommands() {
  return Array.from(commands.keys());
}
