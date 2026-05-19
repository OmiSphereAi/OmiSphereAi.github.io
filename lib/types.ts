export interface VideoInfo {
  id: string;
  title: string;
  channelName: string;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  thumbnail: string;
  publishedAt: string;
  url: string;
}

export interface AnalyzedComment {
  id: string;
  author: string;
  authorChannelId?: string;
  text: string;
  likeCount: number;
  publishedAt: string;
  isReply: boolean;
  botScore: number; // 0-100
  classification: 'bot' | 'suspicious' | 'human';
  signals: string[]; // detected bot signals
  clusterId?: string;
}

export interface Cluster {
  id: string;
  narrative: string;
  commentCount: number;
  confidence: number;
  sampleComments: string[];
}

export interface AnalysisResult {
  id: string;
  url: string;
  platform: 'youtube' | 'twitter';
  analyzedAt: string;
  video: VideoInfo;
  comments: AnalyzedComment[];
  clusters: Cluster[];
  stats: {
    total: number;
    bots: number;
    suspicious: number;
    humans: number;
    botPercentage: number;
  };
}
