import {
  registerCommand,
  runCommand,
  middlewareLoggedIn,
  handlerLogin,
  handlerRegister,
  handlerReset,
  handlerUsers,
  handlerAgg,
  handlerAddFeed,
  handlerFeeds,
  handlerFollow,
  handlerFollowing,
  handlerUnfollow,
  handlerBrowse,
  type CommandsRegistry,
} from "./commands.js";

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.error("Not enough arguments");
    process.exit(1);
  }

  const cmdName = args[0];
  const cmdArgs = args.slice(1);

  const registry: CommandsRegistry = {};

  registerCommand(
    registry,
    "login",
    handlerLogin,
  );

  registerCommand(
    registry,
    "register",
    handlerRegister,
  );

  registerCommand(
    registry,
    "reset",
    handlerReset,
  );

  registerCommand(
    registry,
    "users",
    handlerUsers,
  );

  registerCommand(
    registry,
    "agg",
    handlerAgg,
  );

  registerCommand(
    registry,
    "addfeed",
    middlewareLoggedIn(handlerAddFeed),
  );

  registerCommand(
    registry,
    "feeds",
    handlerFeeds,
  );

  registerCommand(
    registry,
    "follow",
    middlewareLoggedIn(handlerFollow),
  );

  registerCommand(
    registry,
    "following",
    middlewareLoggedIn(handlerFollowing),
  );

  registerCommand(
    registry,
    "unfollow",
    middlewareLoggedIn(handlerUnfollow),
  );

  registerCommand(
    registry,
    "browse",
    middlewareLoggedIn(handlerBrowse),
  );

  try {
    await runCommand(
      registry,
      cmdName,
      ...cmdArgs,
    );
  } catch (error) {
    console.error(error);
    process.exit(1);
  }

  process.exit(0);
}

main();
