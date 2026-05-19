import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  Network,
  Clock,
  Eye,
  ThumbsUp,
  MessageCircle,
  AlertTriangle,
  Shield,
  Info,
} from 'lucide-react';
import { DEMO_RESULT } from '@/lib/demo';
import { analyzeUrl } from '@/lib/analyze';
import { saveAnalysis } from '@/lib/db';
import type { AnalysisResult } from '@/lib/types';
import CommentList from './CommentList';
import ClusterGraph from './ClusterGraph';

async function getAnalysis(
  url: string,
  isDemo: boolean
): Promise<AnalysisResult & { isDemo?: boolean }> {
  if (isDemo) return { ...DEMO_RESULT, isDemo: true };

  const result = await analyzeUrl(url);
  saveAnalysis(result);
  return result;
}

function formatNumber(n: number) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1) + 'K';
  return n.toString();
}

function BotGauge({ percentage }: { percentage: number }) {
  const color =
    percentage >= 60 ? '#ef4444' : percentage >= 30 ? '#f59e0b' : '#22c55e';
  const label =
    percentage >= 60
      ? 'High Bot Activity'
      : percentage >= 30
        ? 'Moderate Bot Activity'
        : 'Low Bot Activity';

  return (
    <div
      className="p-5 rounded-xl border col-span-4"
      style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
    >
      <div className="flex items-center justify-between mb-3">
        <span className="text-xs font-medium tracking-widest" style={{ color: 'var(--muted)' }}>
          OVERALL BOT ACTIVITY
        </span>
        <span className="text-sm font-bold" style={{ color }}>
          {label}
        </span>
      </div>
      <div
        className="w-full h-2 rounded-full overflow-hidden"
        style={{ background: 'var(--surface2)' }}
      >
        <div
          className="h-full rounded-full transition-all"
          style={{ width: `${percentage}%`, background: color }}
        />
      </div>
      <div className="flex justify-between text-xs mt-1" style={{ color: 'var(--muted)' }}>
        <span>0%</span>
        <span style={{ color }}>{percentage}% bot activity</span>
        <span>100%</span>
      </div>
    </div>
  );
}

export default async function AnalyzePage({
  searchParams,
}: {
  searchParams: { url?: string; demo?: string };
}) {
  const isDemo = searchParams.demo === '1';
  const url = searchParams.url;

  if (!url && !isDemo) notFound();

  let result: AnalysisResult & { isDemo?: boolean };
  let error: string | null = null;

  try {
    result = await getAnalysis(url || '', isDemo);
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : 'Unknown error';
    if (message === 'NO_API_KEY') {
      error =
        'No YouTube API key configured — showing demo data. Add YOUTUBE_API_KEY to analyze real videos.';
    } else {
      error = `Analysis error: ${message} — showing demo data instead.`;
    }
    result = { ...DEMO_RESULT, isDemo: true };
  }

  const { video, stats, clusters, isDemo: isD } = result;

  return (
    <div className="min-h-screen bg-grid">
      {/* Sticky header */}
      <header
        className="flex items-center justify-between px-8 py-5 border-b sticky top-0 z-10"
        style={{
          borderColor: 'var(--border)',
          background: 'rgba(6,6,16,0.9)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div className="flex items-center gap-4">
          <Link
            href="/"
            className="flex items-center gap-1.5 text-sm transition-colors hover:text-indigo-400"
            style={{ color: 'var(--muted)' }}
          >
            <ArrowLeft className="w-4 h-4" /> Back
          </Link>
          <div className="w-px h-4" style={{ background: 'var(--border)' }} />
          <div className="flex items-center gap-2">
            <Network className="w-4 h-4 text-indigo-400" />
            <span className="font-semibold text-sm">OmniSphere</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
          <Clock className="w-3.5 h-3.5" />
          Analyzed {new Date(result.analyzedAt).toLocaleTimeString()}
          {(isD || isDemo) && (
            <span
              className="ml-2 px-2 py-0.5 rounded-full text-xs"
              style={{
                background: 'rgba(99,102,241,0.15)',
                color: '#818cf8',
                border: '1px solid rgba(99,102,241,0.3)',
              }}
            >
              DEMO
            </span>
          )}
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Probabilistic disclaimer */}
        <div
          className="mb-6 p-3 rounded-xl text-xs flex items-start gap-2"
          style={{
            background: 'rgba(99,102,241,0.08)',
            border: '1px solid rgba(99,102,241,0.2)',
            color: 'var(--muted)',
          }}
        >
          <Info
            className="w-3.5 h-3.5 flex-shrink-0 mt-0.5"
            style={{ color: '#818cf8' }}
          />
          <span>
            Scores are probabilistic behavioral signals — leads to investigate, not
            definitive proof. A high score means &ldquo;worth a closer look,&rdquo; not a
            verdict.
          </span>
        </div>

        {/* Error / notice banner */}
        {error && (
          <div
            className="mb-6 p-4 rounded-xl border text-sm flex items-start gap-2"
            style={{
              borderColor: 'rgba(239,68,68,0.3)',
              background: 'rgba(239,68,68,0.05)',
              color: '#ef4444',
            }}
          >
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Video Info */}
        <div
          className="flex gap-4 mb-8 p-5 rounded-xl border"
          style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
        >
          {video.thumbnail ? (
            <img
              src={video.thumbnail}
              alt={video.title}
              className="w-40 h-24 object-cover rounded-lg flex-shrink-0"
            />
          ) : (
            <div
              className="w-40 h-24 rounded-lg flex-shrink-0 flex items-center justify-center"
              style={{ background: 'var(--surface2)' }}
            >
              <Network className="w-8 h-8" style={{ color: 'var(--muted)' }} />
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="font-semibold text-lg leading-snug mb-1">{video.title}</h1>
            <p className="text-sm mb-3" style={{ color: 'var(--muted)' }}>
              {video.channelName}
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs" style={{ color: 'var(--muted)' }}>
              <span className="flex items-center gap-1">
                <Eye className="w-3.5 h-3.5" /> {formatNumber(video.viewCount)} views
              </span>
              <span className="flex items-center gap-1">
                <ThumbsUp className="w-3.5 h-3.5" /> {formatNumber(video.likeCount)}
              </span>
              <span className="flex items-center gap-1">
                <MessageCircle className="w-3.5 h-3.5" /> {formatNumber(video.commentCount)} comments
              </span>
            </div>
          </div>
        </div>

        {/* Bot Activity Gauge */}
        <div className="mb-4">
          <BotGauge percentage={stats.botPercentage} />
        </div>

        {/* Stats Bar */}
        <div className="grid grid-cols-4 gap-4 mb-8">
          {[
            { label: 'ANALYZED', value: stats.total, color: '#e2e8f0', sub: '100%', icon: Shield },
            {
              label: 'BOTS',
              value: stats.bots,
              color: '#ef4444',
              sub: `${stats.botPercentage}%`,
              icon: AlertTriangle,
            },
            {
              label: 'SUSPICIOUS',
              value: stats.suspicious,
              color: '#f59e0b',
              sub: `${Math.round((stats.suspicious / Math.max(stats.total, 1)) * 100)}%`,
              icon: AlertTriangle,
            },
            {
              label: 'HUMAN',
              value: stats.humans,
              color: '#22c55e',
              sub: `${Math.round((stats.humans / Math.max(stats.total, 1)) * 100)}%`,
              icon: Shield,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="p-4 rounded-xl border text-center"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <div className="text-3xl font-bold mb-1" style={{ color: stat.color }}>
                {stat.value}
              </div>
              <div className="text-xs font-medium mb-0.5" style={{ color: 'var(--muted)' }}>
                {stat.label}
              </div>
              <div className="text-xs" style={{ color: stat.color }}>
                {stat.sub}
              </div>
            </div>
          ))}
        </div>

        {/* Cluster map (visual graph) */}
        <ClusterGraph clusters={clusters} comments={result.comments} />

        {/* Clusters */}
        {clusters.length > 0 && (
          <div className="mb-8">
            <h2
              className="text-sm font-medium mb-3 tracking-widest"
              style={{ color: 'var(--muted)' }}
            >
              DETECTED CLUSTERS ({clusters.length})
            </h2>
            <div className="space-y-2">
              {clusters.map((cluster) => (
                <div
                  key={cluster.id}
                  className="p-4 rounded-xl border"
                  style={{
                    background: 'var(--surface)',
                    borderColor: 'rgba(239,68,68,0.2)',
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                      <span className="text-red-400 font-bold">{cluster.commentCount}</span>
                      <span className="text-sm" style={{ color: 'var(--text)' }}>
                        near-identical comments detected
                      </span>
                    </div>
                    <span
                      className="text-xs px-2 py-0.5 rounded-full"
                      style={{
                        background: 'rgba(239,68,68,0.1)',
                        color: '#ef4444',
                        border: '1px solid rgba(239,68,68,0.2)',
                      }}
                    >
                      {Math.round(cluster.confidence * 100)}% confidence
                    </span>
                  </div>
                  <p className="text-xs italic mb-3" style={{ color: 'var(--muted)' }}>
                    &ldquo;{cluster.narrative}&rdquo;
                  </p>
                  <div className="space-y-1">
                    {cluster.sampleComments.slice(0, 2).map((sc, i) => (
                      <div
                        key={i}
                        className="text-xs px-3 py-1.5 rounded-lg"
                        style={{ background: 'var(--surface2)', color: 'var(--muted)' }}
                      >
                        &ldquo;{sc}&rdquo;
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Comments */}
        <div>
          <h2
            className="text-sm font-medium mb-3 tracking-widest"
            style={{ color: 'var(--muted)' }}
          >
            COMMENT ANALYSIS ({result.comments.length} analyzed)
          </h2>
          <Suspense fallback={<div style={{ color: 'var(--muted)' }}>Loading comments...</div>}>
            <CommentList comments={result.comments} />
          </Suspense>
        </div>
      </main>
    </div>
  );
}
