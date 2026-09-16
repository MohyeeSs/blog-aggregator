import { desc, eq } from "drizzle-orm";

import { db } from "..";

import {
  posts,
  feeds,
  feedFollows,
} from "../schema";

export async function createPost(
  title: string,
  url: string,
  description: string | null,
  publishedAt: Date | null,
  feedId: string,
) {
  const [post] = await db
    .insert(posts)
    .values({
      title: title,
      url: url,
      description: description,
      publishedAt: publishedAt,
      feedId: feedId,
    })
    .onConflictDoNothing()
    .returning();

  return post;
}

export async function getPostsForUser(
  userId: string,
  limit: number,
) {
  return await db
    .select({
      post: posts,
      feed: feeds,
    })
    .from(posts)
    .innerJoin(
      feeds,
      eq(posts.feedId, feeds.id),
    )
    .innerJoin(
      feedFollows,
      eq(feedFollows.feedId, feeds.id),
    )
    .where(eq(feedFollows.userId, userId))
    .orderBy(desc(posts.publishedAt))
    .limit(limit);
}
