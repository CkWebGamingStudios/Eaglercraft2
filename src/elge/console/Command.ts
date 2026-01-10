// src/elge/console/Command.ts

export interface Command {
  tick: number;
  name: string;
  args: string[];
  source: "local" | "network" | "script" | "replay";
}
