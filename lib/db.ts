import fs from 'fs';
import path from 'path';
import type { AnalysisResult } from './types';

const DATA_PATH = path.join(process.cwd(), 'omnisphere-data.json');

interface DataStore {
  analyses: any[];
  clusters: any[];
}

function readData(): DataStore {
  try {
    return JSON.parse(fs.readFileSync(DATA_PATH, 'utf-8'));
  } catch {
    return { analyses: [], clusters: [] };
  }
}

function writeData(data: DataStore) {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
}

export function saveAnalysis(result: AnalysisResult) {
  const data = readData();

  const entry = {
    id: result.id,
    url: result.url,
    platform: result.platform,
    video_id: result.video.id,
    video_title: result.video.title,
    video_thumbnail: result.video.thumbnail,
    channel_name: result.video.channelName,
    analyzed_at: result.analyzedAt,
    total_comments: result.stats.total,
    bot_count: result.stats.bots,
    suspicious_count: result.stats.suspicious,
    human_count: result.stats.humans,
    is_public: 0,
  };

  const existing = data.analyses.findIndex((a: any) => a.id === result.id);
  if (existing >= 0) {
    data.analyses[existing] = entry;
  } else {
    data.analyses.unshift(entry);
  }

  const newClusters = result.clusters.map(cl => ({
    id: `${result.id}-${cl.id}`,
    analysis_id: result.id,
    narrative: cl.narrative,
    comment_count: cl.commentCount,
    confidence: cl.confidence,
    sample_comments: JSON.stringify(cl.sampleComments),
    video_title: result.video.title,
    channel_name: result.video.channelName,
    analyzed_at: result.analyzedAt,
  }));

  data.clusters = [
    ...newClusters,
    ...data.clusters.filter((c: any) => c.analysis_id !== result.id),
  ];

  writeData(data);
}

export function getRecentAnalyses(limit = 10) {
  return readData().analyses.slice(0, limit);
}

export function setAnalysisPublic(id: string, isPublic: boolean): void {
  const data = readData();
  const idx = data.analyses.findIndex((a: any) => a.id === id);
  if (idx < 0) throw new Error('Analysis not found');
  data.analyses[idx].is_public = isPublic ? 1 : 0;
  writeData(data);
}

export function getAllAnalysesForReview(): any[] {
  // Newest first as stored (saveAnalysis unshifts new entries)
  return readData().analyses;
}

export function getPublicClusters() {
  const data = readData();
  const publicIds = new Set(data.analyses.filter((a: any) => a.is_public).map((a: any) => a.id));
  return data.clusters
    .filter((c: any) => publicIds.has(c.analysis_id))
    .sort((a: any, b: any) => b.confidence - a.confidence)
    .slice(0, 20);
}

export function getDashboardStats() {
  const data = readData();
  return {
    totalAnalyses: data.analyses.length,
    totalComments: data.analyses.reduce((s: number, a: any) => s + (a.total_comments || 0), 0),
    totalBots: data.analyses.reduce((s: number, a: any) => s + (a.bot_count || 0), 0),
    totalClusters: data.clusters.length,
  };
}
