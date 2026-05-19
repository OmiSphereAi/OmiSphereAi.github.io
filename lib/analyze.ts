import { v4 as uuidv4 } from 'uuid';
import { fetchYouTubeData } from './youtube';
import { scoreComments, detectClusters } from './scorer';
import { aiScoreComments } from './ai';
import type { AnalysisResult, AnalyzedComment } from './types';

function classify(score: number): AnalyzedComment['classification'] {
  return score >= 60 ? 'bot' : score >= 30 ? 'suspicious' : 'human';
}

export async function analyzeUrl(url: string): Promise<AnalysisResult> {
  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) throw new Error('NO_API_KEY');

  const { videoInfo, rawComments } = await fetchYouTubeData(url, apiKey);
  const scored = scoreComments(rawComments);

  // Optional AI scoring layer — blends with rule-based scores when available
  const aiResults = await aiScoreComments(
    scored.map((c) => ({ id: c.id, author: c.author, text: c.text })),
    videoInfo.title
  );

  for (const comment of scored) {
    const ai = aiResults.get(comment.id);
    if (!ai) continue;
    const finalScore = Math.max(
      0,
      Math.min(100, Math.round(0.5 * comment.botScore + 0.5 * ai.likelihood))
    );
    comment.botScore = finalScore;
    comment.aiReasoning = ai.reasoning;
    if (ai.reasoning) comment.signals.push('AI: ' + ai.reasoning);
    comment.classification = classify(finalScore);
  }

  const clusters = detectClusters(scored);

  // Assign cluster IDs to matching comments
  clusters.forEach((cluster) => {
    cluster.sampleComments.forEach((sampleText) => {
      const comment = scored.find((c) => c.text === sampleText);
      if (comment) comment.clusterId = cluster.id;
    });
  });

  const bots = scored.filter((c) => c.classification === 'bot').length;
  const suspicious = scored.filter(
    (c) => c.classification === 'suspicious'
  ).length;
  const humans = scored.filter((c) => c.classification === 'human').length;

  const result: AnalysisResult = {
    id: uuidv4(),
    url,
    platform: 'youtube',
    analyzedAt: new Date().toISOString(),
    video: videoInfo,
    comments: scored,
    clusters,
    stats: {
      total: scored.length,
      bots,
      suspicious,
      humans,
      botPercentage: Math.round((bots / Math.max(scored.length, 1)) * 100),
    },
  };

  return result;
}
