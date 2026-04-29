const { XMLParser } = require("fast-xml-parser");

const CACHE_TTL_MS = Number(process.env.RSS_CACHE_TTL_MS || 10 * 60 * 1000);
const ERROR_CACHE_TTL_MS = Number(process.env.RSS_ERROR_CACHE_TTL_MS || 60 * 1000);
const FETCH_TIMEOUT_MS = Number(process.env.RSS_FETCH_TIMEOUT_MS || 8000);
const MAX_FEED_BYTES = Number(process.env.RSS_MAX_FEED_BYTES || 2 * 1024 * 1024);
const MAX_CONCURRENT_FETCHES = Number(process.env.RSS_MAX_CONCURRENT_FETCHES || 6);

const parser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: "",
  cdataPropName: "__cdata",
  textNodeName: "#text",
  trimValues: true,
  parseTagValue: false,
  parseAttributeValue: false,
  removeNSPrefix: true,
});

const cache = new Map();
const pendingFetches = new Map();

const toArray = (value) => {
  if (!value) return [];
  return Array.isArray(value) ? value : [value];
};

const getText = (value) => {
  if (value === null || value === undefined) return "";
  if (typeof value === "string" || typeof value === "number") {
    return String(value).trim();
  }
  if (Array.isArray(value)) {
    return value.map(getText).find(Boolean) || "";
  }
  if (typeof value === "object") {
    return (
      getText(value.__cdata) ||
      getText(value["#text"]) ||
      getText(value.text) ||
      getText(value.name) ||
      ""
    );
  }
  return "";
};

const stripHtml = (value = "") =>
  getText(value)
    .replace(/<script[\s\S]*?<\/script>/gi, "")
    .replace(/<style[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();

const truncate = (value = "", max = 140) => {
  const text = stripHtml(value);
  return text.length > max ? `${text.slice(0, max).trim()}...` : text;
};

const parseDate = (value) => {
  const text = getText(value);
  if (!text) return null;
  const timestamp = new Date(text).getTime();
  return Number.isFinite(timestamp) ? new Date(timestamp).toISOString() : null;
};

const normalizeUrl = (value, baseUrl) => {
  const text = getText(value);
  if (!text) return "";
  try {
    return new URL(text, baseUrl).toString();
  } catch (_error) {
    return "";
  }
};

const getAtomLink = (entry, feedUrl) => {
  const links = toArray(entry.link);
  const preferred =
    links.find((link) => !link.rel || link.rel === "alternate") || links[0];
  if (!preferred) return "";
  return normalizeUrl(preferred.href || preferred, feedUrl);
};

const getItemUrl = (item, feedUrl) => {
  const directLink = normalizeUrl(item.link, feedUrl);
  if (directLink) return directLink;

  const guid = item.guid;
  if (guid && (guid.isPermaLink === true || guid.isPermaLink === "true")) {
    return normalizeUrl(guid, feedUrl);
  }

  return getAtomLink(item, feedUrl);
};

const getItemsFromParsedFeed = (parsed) => {
  const rssChannel = parsed?.rss?.channel;
  const atomFeed = parsed?.feed;
  const rdfFeed = parsed?.RDF || parsed?.rdf;

  if (rssChannel?.item) {
    return {
      feedTitle: getText(rssChannel.title),
      items: toArray(rssChannel.item),
    };
  }

  if (atomFeed?.entry) {
    return {
      feedTitle: getText(atomFeed.title),
      items: toArray(atomFeed.entry),
    };
  }

  if (rdfFeed?.item) {
    return {
      feedTitle: getText(rdfFeed.channel?.title),
      items: toArray(rdfFeed.item),
    };
  }

  return { feedTitle: "", items: [] };
};

const normalizePost = (item, feedUrl, feedTitle) => {
  const title = getText(item.title);
  const url = getItemUrl(item, feedUrl);
  const publishedAt =
    parseDate(item.pubDate) ||
    parseDate(item.published) ||
    parseDate(item.updated) ||
    parseDate(item.date);

  if (!title || !url) return null;

  return {
    title,
    url,
    publishedAt,
    summary: truncate(
      item.description || item.summary || item.encoded || item.content,
    ),
    author: getText(item.creator || item.author),
    feedTitle,
    fetchedAt: new Date().toISOString(),
  };
};

const pickLatestPost = (posts) =>
  posts
    .filter(Boolean)
    .sort((left, right) => {
      const leftTime = left.publishedAt
        ? new Date(left.publishedAt).getTime()
        : 0;
      const rightTime = right.publishedAt
        ? new Date(right.publishedAt).getTime()
        : 0;
      return rightTime - leftTime;
    })[0] || null;

const isHttpUrl = (value) => {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch (_error) {
    return false;
  }
};

class RssService {
  async fetchLatestPost(feedUrl) {
    if (!isHttpUrl(feedUrl)) return null;

    const cached = cache.get(feedUrl);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.value;
    }

    const pending = pendingFetches.get(feedUrl);
    if (pending) return pending;

    const fetchPromise = (async () => {
      try {
        const response = await fetch(feedUrl, {
          headers: {
            Accept:
              "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
            "User-Agent": "GiovanHomePageRSSBot/1.0 (+https://giovan.cn)",
          },
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        });

        if (!response.ok) {
          throw new Error(`RSS fetch failed: ${response.status}`);
        }

        const contentLength = Number(response.headers.get("content-length") || 0);
        if (contentLength > MAX_FEED_BYTES) {
          throw new Error("RSS feed is too large");
        }

        const xml = await response.text();
        if (Buffer.byteLength(xml, "utf8") > MAX_FEED_BYTES) {
          throw new Error("RSS feed is too large");
        }

        const parsed = parser.parse(xml);
        const { feedTitle, items } = getItemsFromParsedFeed(parsed);
        const posts = items.map((item) =>
          normalizePost(item, feedUrl, feedTitle),
        );
        const latestPost = pickLatestPost(posts);

        cache.set(feedUrl, {
          value: latestPost,
          expiresAt: Date.now() + CACHE_TTL_MS,
        });

        return latestPost;
      } catch (error) {
        cache.set(feedUrl, {
          value: null,
          expiresAt: Date.now() + ERROR_CACHE_TTL_MS,
        });
        return null;
      }
    })().finally(() => {
      pendingFetches.delete(feedUrl);
    });

    pendingFetches.set(feedUrl, fetchPromise);
    return fetchPromise;
  }

  getCachedLatestPost(feedUrl, { allowStale = true } = {}) {
    if (!isHttpUrl(feedUrl)) return null;

    const cached = cache.get(feedUrl);
    if (!cached) return null;
    if (!allowStale && cached.expiresAt <= Date.now()) return null;

    return cached.value;
  }

  async refreshLatestPosts(links = []) {
    const rssLinks = links.filter((link) => link.rss);
    let cursor = 0;

    const worker = async () => {
      while (cursor < rssLinks.length) {
        const index = cursor;
        cursor += 1;
        await this.fetchLatestPost(rssLinks[index].rss);
      }
    };

    const workerCount = Math.min(MAX_CONCURRENT_FETCHES, rssLinks.length);

    if (workerCount > 0) {
      await Promise.all(Array.from({ length: workerCount }, worker));
    }
  }

  attachCachedLatestPosts(links = []) {
    const result = links.map((link) => ({
      ...link,
      latestPost: link.rss
        ? this.getCachedLatestPost(link.rss, { allowStale: true })
        : null,
    }));

    this.refreshLatestPosts(result).catch(() => undefined);

    return result;
  }

  async attachLatestPosts(links = []) {
    const result = links.map((link) => ({ ...link, latestPost: null }));
    let cursor = 0;

    const worker = async () => {
      while (cursor < result.length) {
        const index = cursor;
        cursor += 1;
        const link = result[index];
        if (!link.rss) continue;
        link.latestPost = await this.fetchLatestPost(link.rss);
      }
    };

    const workerCount = Math.min(
      MAX_CONCURRENT_FETCHES,
      result.filter((link) => link.rss).length,
    );

    if (workerCount > 0) {
      await Promise.all(Array.from({ length: workerCount }, worker));
    }

    return result;
  }
}

module.exports = new RssService();
