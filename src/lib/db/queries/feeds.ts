import {
  eq,
  sql,
} from "drizzle-orm";

import { db } from "..";
import {
  feeds,
  users,
} from "../schema";

export async function createFeed(
  name: string,
  url: string,
  userId: string,
) {
  const [result] = await db
    .insert(feeds)
    .values({
      name: name,
      url: url,
      userId: userId,
    })
    .returning();

  return result;
}

export async function getFeeds() {
  return await db
    .select({
      feed: feeds,
      user: users,
    })
    .from(feeds)
    .innerJoin(
      users,
      eq(users.id, feeds.userId),
    );
}

export async function getFeedByUrl(
  url: string,
) {
  const [result] = await db
    .select()
    .from(feeds)
    .where(eq(feeds.url, url));

  return result;
}

export async function markFeedFetched(
  feedId: string,
): Promise<void> {
  const now = new Date();

  await db
    .update(feeds)
    .set({
      lastFetchedAt: now,
      updatedAt: now,
    })
    .where(eq(feeds.id, feedId));
}

export async function getNextFeedToFetch() {
  const [feed] = await db
    .select()
    .from(feeds)
    .orderBy(
      sql`${feeds.lastFetchedAt} asc nulls first`,
    )
    .limit(1);

  return feed;
}
