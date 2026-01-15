export type ConsoleCommand = {
  description?: string;
  execute: (args: string[]) => void;
};

const registry = new Map<string, ConsoleCommand>();

export function registerCommand(name: string, command: ConsoleCommand) {
  registry.set(name.toLowerCase(), command);
}

export function getCommand(name: string): ConsoleCommand | undefined {
  return registry.get(name.toLowerCase());
}
