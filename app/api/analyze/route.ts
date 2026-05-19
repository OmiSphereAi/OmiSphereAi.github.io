import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { fetchYouTubeData } from '@/lib/youtube';
import { scoreComments, detectClusters } from '@/lib/scorer';
import { saveAnalysis } from '@/lib/db';
import { DEMO_RESULT } from '@/lib/demo';
import type { AnalysisResult } from '@/lib/types';

export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get('url');
  if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

  const apiKey = process.env.YOUTUBE_API_KEY;
  if (!apiKey) {
    // Return demo data when no API key is configured
    return NextResponse.json({ ...DEMO_RESULT, isDemo: true });
  }

  try {
    const { videoInfo, rawComments } = await fetchYouTubeData(url, apiKey);
    const scoredComments = scoreComments(rawComments);
    const clusters = detectClusters(scoredComments);

    // Assign cluster IDs to matching comments
    clusters.forEach((cluster) => {
      cluster.sampleComments.forEach((sampleText) => {
        const comment = scoredComments.find((c) => c.text === sampleText);
        if (comment) comment.clusterId = cluster.id;
      });
    });

    const bots = scoredComments.filter((c) => c.classification === 'bot').length;
    const suspicious = scoredComments.filter((c) => c.classification === 'suspicious').length;
    const humans = scoredComments.filter((c) => c.classification === 'human').length;

    const result: AnalysisResult = {
      id: uuidv4(),
      url,
      platform: 'youtube',
      analyzedAt: new Date().toISOString(),
      video: videoInfo,
      comments: scoredComments,
      clusters,
      stats: {
        total: scoredComments.length,
        bots,
        suspicious,
        humans,
        botPercentage: Math.round((bots / Math.max(scoredComments.length, 1)) * 100),
      },
    };

    saveAnalysis(result);
    return NextResponse.json(result);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Analysis failed';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
