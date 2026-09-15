import { XMLParser } from "fast-xml-parser";

export type RSSFeed = {
  channel: {
    title: string;
    link: string;
    description: string;
    item: RSSItem[];
  };
};

export type RSSItem = {
  title: string;
  link: string;
  description: string;
  pubDate: string;
};

export async function fetchFeed(feedURL: string): Promise<RSSFeed> {
  const response = await fetch(feedURL, {
    headers: {
      "User-Agent": "gator",
    },
  });

  const xml = await response.text();

  const parser = new XMLParser({
    processEntities: false,
  });

  const parsed = parser.parse(xml);

  if (!parsed.rss) {
    throw new Error("Invalid RSS feed: missing rss");
  }

  const channel = parsed.rss.channel;

  if (!channel) {
    throw new Error("Invalid RSS feed: missing channel");
  }

  if (
    typeof channel.title !== "string" ||
    typeof channel.link !== "string" ||
    typeof channel.description !== "string"
  ) {
    throw new Error("Invalid RSS feed: invalid channel metadata");
  }

  let items: RSSItem[] = [];

  if (channel.item) {
    const rawItems = Array.isArray(channel.item)
      ? channel.item
      : [channel.item];

    items = rawItems
      .filter(
        (item: any) =>
          typeof item.title === "string" &&
          typeof item.link === "string" &&
          typeof item.description === "string" &&
          typeof item.pubDate === "string",
      )
      .map((item: any): RSSItem => ({
        title: item.title,
        link: item.link,
        description: item.description,
        pubDate: item.pubDate,
      }));
  }

  return {
    channel: {
      title: channel.title,
      link: channel.link,
      description: channel.description,
      item: items,
    },
  };
}
