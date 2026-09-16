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
  markFeedFetched,
  getNextFeedToFetch,
} from "./lib/db/queries/feeds.js";

import {
  createFeedFollow,
  getFeedFollowsForUser,
  deleteFeedFollow,
} from "./lib/db/queries/feed_follows.js";

import {
  createPost,
  getPostsForUser,
} from "./lib/db/queries/posts.js";

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

function parseDuration(
  durationStr: string,
): number {
  const regex = /^(\d+)(ms|s|m|h)$/;
  const match = durationStr.match(regex);

  if (!match) {
    throw new Error(
      "Invalid duration. Use formats like 500ms, 10s, 1m, or 1h",
    );
  }

  const amount = Number(match[1]);
  const unit = match[2];

  switch (unit) {
    case "ms":
      return amount;

    case "s":
      return amount * 1000;

    case "m":
      return amount * 60 * 1000;

    case "h":
      return amount * 60 * 60 * 1000;

    default:
      throw new Error("Invalid duration");
  }
}

function formatDuration(
  milliseconds: number,
): string {
  let remaining = milliseconds;

  const hours = Math.floor(
    remaining / (60 * 60 * 1000),
  );

  remaining %= 60 * 60 * 1000;

  const minutes = Math.floor(
    remaining / (60 * 1000),
  );

  remaining %= 60 * 1000;

  const seconds = Math.floor(
    remaining / 1000,
  );

  const ms = remaining % 1000;

  let result = "";

  if (hours > 0) {
    result += `${hours}h`;
  }

  if (minutes > 0 || hours > 0) {
    result += `${minutes}m`;
  }

  if (
    seconds > 0 ||
    minutes > 0 ||
    hours > 0
  ) {
    result += `${seconds}s`;
  }

  if (ms > 0) {
    result += `${ms}ms`;
  }

  if (result === "") {
    result = "0ms";
  }

  return result;
}

async function scrapeFeeds(): Promise<void> {
  const feed = await getNextFeedToFetch();

  if (!feed) {
    throw new Error("No feeds found");
  }

  console.log(`Fetching feed: ${feed.name}`);
  console.log(`URL: ${feed.url}`);

  const rssFeed = await fetchFeed(feed.url);

  await markFeedFetched(feed.id);

  for (const item of rssFeed.channel.item) {
    const publishedAt = new Date(item.pubDate);

    const validPublishedAt =
      Number.isNaN(publishedAt.getTime())
        ? null
        : publishedAt;

    await createPost(
      item.title,
      item.link,
      item.description || null,
      validPublishedAt,
      feed.id,
    );
  }
}

async function handlerAgg(
  cmdName: string,
  ...args: string[]
): Promise<void> {
  if (args.length !== 1) {
    throw new Error(
      "usage: agg <time_between_reqs>",
    );
  }

  const timeBetweenRequests =
    parseDuration(args[0]);

  console.log(
    `Collecting feeds every ${formatDuration(
      timeBetweenRequests,
    )}`,
  );

  scrapeFeeds().catch(handleError);

  const interval = setInterval(() => {
    scrapeFeeds().catch(handleError);
  }, timeBetweenRequests);

  await new Promise<void>((resolve) => {
    process.on("SIGINT", () => {
      console.log(
        "Shutting down feed aggregator...",
      );

      clearInterval(interval);

      resolve();
    });
  });
}

function handleError(error: unknown): void {
  console.error(error);
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

async function handlerBrowse(
  cmdName: string,
  user: User,
  ...args: string[]
): Promise<void> {
  if (args.length > 1) {
    throw new Error(
      "usage: browse [limit]",
    );
  }

  let limit = 2;

  if (args.length === 1) {
    limit = Number(args[0]);

    if (
      !Number.isInteger(limit) ||
      limit <= 0
    ) {
      throw new Error(
        "limit must be a positive integer",
      );
    }
  }

  const posts = await getPostsForUser(
    user.id,
    limit,
  );

  for (const item of posts) {
    console.log(`* ${item.post.title}`);
    console.log(`  URL: ${item.post.url}`);
    console.log(`  Feed: ${item.feed.name}`);

    if (item.post.description) {
      console.log(
        `  Description: ${item.post.description}`,
      );
    }

    if (item.post.publishedAt) {
      console.log(
        `  Published: ${item.post.publishedAt.toISOString()}`,
      );
    }

    console.log();
  }
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
  handlerBrowse,
};
