import Link from 'next/link';
import {
  Network,
  BarChart3,
  Users,
  AlertTriangle,
  Database,
  ArrowLeft,
  ExternalLink,
  TrendingUp,
} from 'lucide-react';
import { getDashboardStats, getRecentAnalyses, getPublicClusters } from '@/lib/db';

export default function DashboardPage() {
  let stats = { totalAnalyses: 0, totalComments: 0, totalBots: 0, totalClusters: 0 };
  let recent: Array<{
    id: string;
    url: string;
    video_title: string;
    channel_name: string;
    analyzed_at: string;
    bot_count: number;
    total_comments: number;
    bot_percentage?: number;
  }> = [];
  let clusters: Array<{
    id: string;
    narrative: string;
    comment_count: number;
    confidence: number;
    video_title: string;
    channel_name: string;
    analyzed_at: string;
  }> = [];

  try {
    stats = getDashboardStats();
    recent = getRecentAnalyses(10) as typeof recent;
    clusters = getPublicClusters() as typeof clusters;
  } catch {
    // DB might not be initialized yet — show empty state
  }

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
            <span className="font-semibold text-sm">Admin Dashboard</span>
          </div>
        </div>
        <span
          className="text-xs px-2 py-0.5 rounded-full"
          style={{
            background: 'rgba(99,102,241,0.1)',
            color: '#818cf8',
            border: '1px solid rgba(99,102,241,0.2)',
          }}
        >
          PRIVATE
        </span>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8">
        {/* Page heading */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Intelligence Hub</h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Private analytics across all analyzed content. Approve reports to make them public.
          </p>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {[
            {
              icon: Database,
              label: 'Analyses Run',
              value: stats.totalAnalyses,
              color: '#6366f1',
            },
            {
              icon: Users,
              label: 'Comments Analyzed',
              value: stats.totalComments.toLocaleString(),
              color: '#e2e8f0',
            },
            {
              icon: AlertTriangle,
              label: 'Bots Detected',
              value: stats.totalBots.toLocaleString(),
              color: '#ef4444',
            },
            {
              icon: BarChart3,
              label: 'Clusters Found',
              value: stats.totalClusters,
              color: '#f59e0b',
            },
          ].map(({ icon: Icon, label, value, color }) => (
            <div
              key={label}
              className="p-5 rounded-xl border"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <Icon className="w-4 h-4 mb-3" style={{ color }} />
              <div className="text-2xl font-bold mb-0.5" style={{ color }}>
                {value}
              </div>
              <div className="text-xs" style={{ color: 'var(--muted)' }}>
                {label}
              </div>
            </div>
          ))}
        </div>

        {/* Detection rate bar */}
        {stats.totalComments > 0 && (
          <div
            className="p-5 rounded-xl border mb-8"
            style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <span className="text-sm font-medium">Overall Bot Detection Rate</span>
              </div>
              <span className="text-sm font-bold text-red-400">
                {Math.round((stats.totalBots / stats.totalComments) * 100)}%
              </span>
            </div>
            <div
              className="w-full h-2 rounded-full overflow-hidden"
              style={{ background: 'var(--surface2)' }}
            >
              <div
                className="h-full rounded-full"
                style={{
                  width: `${Math.round((stats.totalBots / stats.totalComments) * 100)}%`,
                  background: 'linear-gradient(90deg, #6366f1, #ef4444)',
                }}
              />
            </div>
          </div>
        )}

        {/* Recent analyses */}
        <div className="mb-8">
          <h2
            className="text-sm font-medium mb-3 tracking-widest"
            style={{ color: 'var(--muted)' }}
          >
            RECENT ANALYSES
          </h2>
          {recent.length === 0 ? (
            <div
              className="p-8 rounded-xl border text-center text-sm"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--muted)',
              }}
            >
              No analyses yet.{' '}
              <Link href="/" className="text-indigo-400 hover:underline">
                Analyze your first link →
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {recent.map((a) => {
                const botPct = Math.round((a.bot_count / Math.max(a.total_comments, 1)) * 100);
                return (
                  <div
                    key={a.id}
                    className="flex items-center justify-between p-4 rounded-xl border"
                    style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                  >
                    <div className="min-w-0 flex-1">
                      <div
                        className="text-sm font-medium mb-0.5 truncate"
                        style={{ color: 'var(--text)' }}
                      >
                        {a.video_title || a.url}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--muted)' }}>
                        {a.channel_name} ·{' '}
                        {new Date(a.analyzed_at).toLocaleString()}
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm flex-shrink-0 ml-4">
                      <div className="text-right">
                        <div className="text-red-400 font-medium">{a.bot_count} bots</div>
                        <div className="text-xs" style={{ color: 'var(--muted)' }}>
                          {botPct}% of {a.total_comments}
                        </div>
                      </div>
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1.5 rounded hover:bg-white/5 transition-colors"
                        style={{ color: 'var(--muted)' }}
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Top clusters */}
        <div>
          <h2
            className="text-sm font-medium mb-3 tracking-widest"
            style={{ color: 'var(--muted)' }}
          >
            TOP CLUSTERS
          </h2>
          {clusters.length === 0 ? (
            <div
              className="p-8 rounded-xl border text-center text-sm"
              style={{
                background: 'var(--surface)',
                borderColor: 'var(--border)',
                color: 'var(--muted)',
              }}
            >
              No clusters detected yet. Run an analysis to see coordinated bot campaigns.
            </div>
          ) : (
            <div className="space-y-2">
              {clusters.map((cl) => (
                <div
                  key={cl.id}
                  className="p-4 rounded-xl border"
                  style={{
                    background: 'var(--surface)',
                    borderColor: 'rgba(239,68,68,0.2)',
                  }}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-red-400">
                      {cl.comment_count} coordinated comments
                    </span>
                    <span className="text-xs" style={{ color: 'var(--muted)' }}>
                      {Math.round(cl.confidence * 100)}% confidence
                    </span>
                  </div>
                  <p className="text-xs italic mb-1" style={{ color: 'var(--muted)' }}>
                    &ldquo;{cl.narrative}&rdquo;
                  </p>
                  {cl.video_title && (
                    <div className="text-xs" style={{ color: 'var(--muted)' }}>
                      From: {cl.video_title} · {cl.channel_name}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer note */}
        <div
          className="mt-12 p-4 rounded-xl border text-center text-xs"
          style={{
            borderColor: 'var(--border)',
            background: 'var(--surface)',
            color: 'var(--muted)',
          }}
        >
          This is your private intelligence hub. Only analyses marked as public appear in the
          homepage feed. Configure{' '}
          <code className="px-1 py-0.5 rounded" style={{ background: 'var(--surface2)' }}>
            ADMIN_PASSWORD
          </code>{' '}
          in .env.local to add authentication.
        </div>
      </main>
    </div>
  );
}
