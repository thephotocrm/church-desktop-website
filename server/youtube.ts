// YouTube Data API v3 client for fetching past live streams

interface YouTubeSearchItem {
  id: { videoId: string };
  snippet: {
    title: string;
    description: string;
    publishedAt: string;
    thumbnails: {
      high?: { url: string };
      medium?: { url: string };
      default?: { url: string };
    };
  };
}

interface YouTubeSearchResponse {
  items: YouTubeSearchItem[];
  nextPageToken?: string;
  pageInfo: { totalResults: number; resultsPerPage: number };
}

interface YouTubeVideoItem {
  id: string;
  contentDetails: { duration: string };
  statistics: {
    viewCount: string;
    likeCount: string;
  };
}

interface YouTubeVideoResponse {
  items: YouTubeVideoItem[];
}

export async function fetchPastLiveStreams(
  channelId: string,
  apiKey: string,
  maxResults = 12,
  pageToken?: string
): Promise<{ items: YouTubeSearchItem[]; nextPageToken?: string }> {
  const params = new URLSearchParams({
    part: "snippet",
    channelId,
    type: "video",
    eventType: "completed",
    order: "date",
    maxResults: maxResults.toString(),
    key: apiKey,
  });

  if (pageToken) {
    params.set("pageToken", pageToken);
  }

  const url = `https://www.googleapis.com/youtube/v3/search?${params}`;
  const response = await fetch(url);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`YouTube search API error (${response.status}): ${errorText}`);
  }

  const data: YouTubeSearchResponse = await response.json();
  return {
    items: data.items || [],
    nextPageToken: data.nextPageToken,
  };
}

export async function fetchVideoDetails(
  videoIds: string[],
  apiKey: string
): Promise<YouTubeVideoItem[]> {
  if (videoIds.length === 0) return [];

  const params = new URLSearchParams({
    part: "contentDetails,statistics",
    id: videoIds.join(","),
    key: apiKey,
  });

  const url = `https://www.googleapis.com/youtube/v3/videos?${params}`;
  const response = await fetch(url);

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`YouTube videos API error (${response.status}): ${errorText}`);
  }

  const data: YouTubeVideoResponse = await response.json();
  return data.items || [];
}
