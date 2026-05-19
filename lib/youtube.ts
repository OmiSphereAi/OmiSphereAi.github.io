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

  // Fetch top-level comments (up to 100)
  const commentsRes = await fetch(
    `${YT_API_BASE}/commentThreads?part=snippet&videoId=${videoId}&maxResults=100&order=relevance&key=${apiKey}`
  );
  if (!commentsRes.ok) {
    // Comments might be disabled
    return {
      videoInfo: {
        id: videoId,
        title: snippet.title,
        channelName: snippet.channelTitle,
        viewCount: parseInt(stats.viewCount || '0'),
        likeCount: parseInt(stats.likeCount || '0'),
        commentCount: parseInt(stats.commentCount || '0'),
        thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
        publishedAt: snippet.publishedAt,
        url,
      },
      rawComments: [],
    };
  }

  const commentsData = await commentsRes.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rawComments = (commentsData.items || []).map((item: any) => {
    const c = item.snippet.topLevelComment.snippet;
    return {
      id: item.id,
      author: c.authorDisplayName,
      authorChannelId: c.authorChannelId,
      text: c.textOriginal || c.textDisplay,
      likeCount: c.likeCount || 0,
      publishedAt: c.publishedAt,
      isReply: false,
    };
  });

  return {
    videoInfo: {
      id: videoId,
      title: snippet.title,
      channelName: snippet.channelTitle,
      viewCount: parseInt(stats.viewCount || '0'),
      likeCount: parseInt(stats.likeCount || '0'),
      commentCount: parseInt(stats.commentCount || '0'),
      thumbnail: snippet.thumbnails?.high?.url || snippet.thumbnails?.default?.url || '',
      publishedAt: snippet.publishedAt,
      url,
    },
    rawComments,
  };
}
