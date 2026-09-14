import {
  registerCommand,
  runCommand,
  handlerLogin,
  type CommandsRegistry,
} from "./commands.js";

function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("Not enough arguments");
    process.exit(1);
  }

  const cmdName = args[0];
  const cmdArgs = args.slice(1);

  const registry: CommandsRegistry = {};

  registerCommand(registry, "login", handlerLogin);

  try {
    runCommand(registry, cmdName, ...cmdArgs);
  } catch (error) {
    console.error(error);
    process.exit(1);
  }
}

main();
