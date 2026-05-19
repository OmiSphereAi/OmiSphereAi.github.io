import type { AccountInfo, RawComment } from './types';

const YT_API_BASE = 'https://www.googleapis.com/youtube/v3';

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }
  return null;
}

interface ChannelMeta {
  createdAt: string;
  subscriberCount: number;
  videoCount: number;
  channelViewCount: number;
  hidesSubscribers: boolean;
}

async function fetchChannelMeta(
  channelIds: string[],
  apiKey: string
): Promise<Map<string, ChannelMeta>> {
  const map = new Map<string, ChannelMeta>();
  if (channelIds.length === 0) return map;

  try {
    // Batch in groups of 50 (YouTube API limit for id-based lookups)
    for (let i = 0; i < channelIds.length; i += 50) {
      const batch = channelIds.slice(i, i + 50);
      const res = await fetch(
        `${YT_API_BASE}/channels?part=snippet,statistics&id=${batch.join(
          ','
        )}&key=${apiKey}`
      );
      if (!res.ok) continue;
      const data = await res.json();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      for (const item of data.items || ([] as any[])) {
        const snippet = item.snippet || {};
        const statistics = item.statistics || {};
        map.set(item.id, {
          createdAt: snippet.publishedAt,
          subscriberCount: Number(statistics.subscriberCount || 0),
          videoCount: Number(statistics.videoCount || 0),
          channelViewCount: Number(statistics.viewCount || 0),
          hidesSubscribers: statistics.hiddenSubscriberCount === true,
        });
      }
    }
  } catch {
    // Quota / network failure — continue without account data
    return map;
  }

  return map;
}

export async function fetchYouTubeData(url: string, apiKey: string) {
  const videoId = extractVideoId(url);
  if (!videoId) throw new Error('Invalid YouTube URL');

  // Fetch video metadata
  const videoRes = await fetch(
    `${YT_API_BASE}/videos?part=snippet,statistics&id=${videoId}&key=${apiKey}`
  );
  if (!videoRes.ok) throw new Error('YouTube API error fetching video');
  const videoData = await videoRes.json();
  if (!videoData.items?.length) throw new Error('Video not found');

  const video = videoData.items[0];
  const snippet = video.snippet;
  const stats = video.statistics;

  const videoInfo = {
    id: videoId,
    title: snippet.title,
    channelName: snippet.channelTitle,
    viewCount: parseInt(stats.viewCount || '0'),
    likeCount: parseInt(stats.likeCount || '0'),
    commentCount: parseInt(stats.commentCount || '0'),
    thumbnail:
      snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
    publishedAt: snippet.publishedAt,
    url,
  };

  // Fetch top-level comments (up to 100)
  const commentsRes = await fetch(
    `${YT_API_BASE}/commentThreads?part=snippet&videoId=${videoId}&maxResults=100&order=relevance&key=${apiKey}`
  );
  if (!commentsRes.ok) {
    // Comments might be disabled
    return {
      videoInfo,
      rawComments: [] as RawComment[],
    };
  }

  const commentsData = await commentsRes.json();
  const rawComments: RawComment[] = (commentsData.items || []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (item: any): RawComment => {
      const c = item.snippet.topLevelComment.snippet;
      return {
        id: item.id,
        author: c.authorDisplayName,
        authorChannelId: c.authorChannelId?.value,
        text: c.textOriginal || c.textDisplay,
        likeCount: c.likeCount || 0,
        publishedAt: c.publishedAt,
        isReply: false,
      };
    }
  );

  // Collect unique author channel IDs and fetch account-level metadata
  const uniqueChannelIds = Array.from(
    new Set(
      rawComments
        .map((c) => c.authorChannelId)
        .filter((id): id is string => !!id)
    )
  );

  const channelMeta = await fetchChannelMeta(uniqueChannelIds, apiKey);

  for (const comment of rawComments) {
    if (!comment.authorChannelId) continue;
    const meta = channelMeta.get(comment.authorChannelId);
    if (!meta || !meta.createdAt) continue;
    const ageDays = Math.floor(
      (Date.now() - new Date(meta.createdAt).getTime()) / 86400000
    );
    const account: AccountInfo = {
      ageDays,
      subscriberCount: meta.subscriberCount,
      videoCount: meta.videoCount,
      channelViewCount: meta.channelViewCount,
      hidesSubscribers: meta.hidesSubscribers,
    };
    comment.account = account;
  }

  return {
    videoInfo,
    rawComments,
  };
}
