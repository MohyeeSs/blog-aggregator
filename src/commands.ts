import { setUser, readConfig } from "./config.js";

import {
  createUser,
  getUserByName,
  deleteAllUsers,
  getUsers,
} from "./lib/db/queries/users.js";

import {
  createFeed,
  getFeeds,
  getFeedByUrl,
} from "./lib/db/queries/feeds.js";

import {
  createFeedFollow,
  getFeedFollowsForUser,
  deleteFeedFollow,
} from "./lib/db/queries/feed_follows.js";

import { fetchFeed } from "./rss.js";

import type {
  Feed,
  User,
} from "./lib/db/schema.js";

export type CommandHandler = (
  cmdName: string,
  ...args: string[]
) => Promise<void>;

export type UserCommandHandler = (
  cmdName: string,
  user: User,
  ...args: string[]
) => Promise<void>;

export type CommandsRegistry =
  Record<string, CommandHandler>;

export type middlewareLoggedIn = (
  handler: UserCommandHandler,
) => CommandHandler;

export const middlewareLoggedIn = (
  handler: UserCommandHandler,
): CommandHandler => {
  return async (
    cmdName: string,
    ...args: string[]
  ): Promise<void> => {
    const config = readConfig();

    if (!config.currentUserName) {
      throw new Error("No user is currently logged in");
    }

    const user = await getUserByName(
      config.currentUserName,
    );

    if (!user) {
      throw new Error(
        `User ${config.currentUserName} does not exist`,
      );
    }

    await handler(cmdName, user, ...args);
  };
};

async function handlerLogin(
  cmdName: string,
  ...args: string[]
): Promise<void> {
  if (args.length === 0) {
    throw new Error("username is required");
  }

  const name = args[0];

  const user = await getUserByName(name);

  if (!user) {
    throw new Error(`User ${name} does not exist`);
  }

  setUser(name);

  console.log(`User ${name} has been set`);
}

async function handlerRegister(
  cmdName: string,
  ...args: string[]
): Promise<void> {
  if (args.length === 0) {
    throw new Error("username is required");
  }

  const name = args[0];

  const existingUser = await getUserByName(name);

  if (existingUser) {
    throw new Error(`User ${name} already exists`);
  }

  const user = await createUser(name);

  setUser(name);

  console.log(`User ${name} has been created`);
  console.log(user);
}

async function handlerReset(
  cmdName: string,
  ...args: string[]
): Promise<void> {
  await deleteAllUsers();

  console.log("Database reset successfully");
}

async function handlerUsers(
  cmdName: string,
  ...args: string[]
): Promise<void> {
  const users = await getUsers();

  const config = readConfig();

  for (const user of users) {
    if (user.name === config.currentUserName) {
      console.log(`* ${user.name} (current)`);
    } else {
      console.log(`* ${user.name}`);
    }
  }
}

async function handlerAgg(
  cmdName: string,
  ...args: string[]
): Promise<void> {
  const feed = await fetchFeed(
    "https://www.wagslane.dev/index.xml",
  );

  console.log(JSON.stringify(feed, null, 2));
}

function printFeed(
  feed: Feed,
  user: User,
): void {
  console.log(`Feed: ${feed.name}`);
  console.log(`URL: ${feed.url}`);
  console.log(`User: ${user.name}`);
}

async function handlerAddFeed(
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {
  if (args.length < 2) {
    throw new Error("name and url are required");
  }

  const name = args[0];
  const url = args[1];

  const feed = await createFeed(
    name,
    url,
    user.id,
  );

  const feedFollow = await createFeedFollow(
    user.id,
    feed.id,
  );

  printFeed(feed, user);

  console.log(
    `${feedFollow.userName} is now following ${feedFollow.feedName}`,
  );
}

async function handlerFeeds(
  cmdName: string,
  ...args: string[]
): Promise<void> {
  const feeds = await getFeeds();

  for (const item of feeds) {
    console.log(`* ${item.feed.name}`);
    console.log(`  URL: ${item.feed.url}`);
    console.log(`  User: ${item.user.name}`);
  }
}

async function handlerFollow(
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {
  if (args.length === 0) {
    throw new Error("url is required");
  }

  const feed = await getFeedByUrl(args[0]);

  if (!feed) {
    throw new Error(
      `Feed ${args[0]} does not exist`,
    );
  }

  const feedFollow = await createFeedFollow(
    user.id,
    feed.id,
  );

  console.log(
    `${feedFollow.userName} is now following ${feedFollow.feedName}`,
  );
}

async function handlerFollowing(
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {
  const feedFollows =
    await getFeedFollowsForUser(user.id);

  for (const feedFollow of feedFollows) {
    console.log(feedFollow.feedName);
  }
}

async function handlerUnfollow(
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {
  if (args.length === 0) {
    throw new Error("url is required");
  }

  const feed = await getFeedByUrl(args[0]);

  if (!feed) {
    throw new Error(
      `Feed ${args[0]} does not exist`,
    );
  }

  await deleteFeedFollow(
    user.id,
    feed.id,
  );
}

export function registerCommand(
  registry: CommandsRegistry,
  cmdName: string,
  handler: CommandHandler,
): void {
  registry[cmdName] = handler;
}

export async function runCommand(
  registry: CommandsRegistry,
  cmdName: string,
  ...args: string[]
): Promise<void> {
  const handler = registry[cmdName];

  if (!handler) {
    throw new Error(`Unknown command: ${cmdName}`);
  }

  await handler(cmdName, ...args);
}

export {
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
};
