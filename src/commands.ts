import { setUser } from "./config.js";

export type CommandHandler = (
  cmdName: string,
  ...args: string[]
) => void;

export type CommandsRegistry = Record<string, CommandHandler>;

function handlerLogin(cmdName: string, ...args: string[]): void {
  if (args.length === 0) {
    throw new Error("username is required");
  }

  setUser(args[0]);

  console.log(`User ${args[0]} has been set`);
}

export function registerCommand(
  registry: CommandsRegistry,
  cmdName: string,
  handler: CommandHandler,
): void {
  registry[cmdName] = handler;
}

export function runCommand(
  registry: CommandsRegistry,
  cmdName: string,
  ...args: string[]
): void {
  const handler = registry[cmdName];

  if (!handler) {
    throw new Error(`Unknown command: ${cmdName}`);
  }

  handler(cmdName, ...args);
}

export { handlerLogin };
