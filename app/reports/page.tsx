import Link from 'next/link';
import { ArrowLeft, Network, AlertTriangle } from 'lucide-react';
import { getPublicClusters } from '@/lib/db';

export default function ReportsPage() {
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
            <span className="font-semibold text-sm">Public Intelligence Reports</span>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-1">Coordinated Activity Reports</h1>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>
            Approved intelligence on coordinated comment campaigns detected across analyzed
            content. Scores are probabilistic behavioral signals, not verdicts.
          </p>
        </div>

        {clusters.length === 0 ? (
          <div
            className="p-12 rounded-xl border text-center text-sm"
            style={{
              background: 'var(--surface)',
              borderColor: 'var(--border)',
              color: 'var(--muted)',
            }}
          >
            No public reports approved yet.
          </div>
        ) : (
          <div className="space-y-3">
            {clusters.map((cl) => (
              <div
                key={cl.id}
                className="p-5 rounded-xl border"
                style={{
                  background: 'var(--surface)',
                  borderColor: 'rgba(239,68,68,0.2)',
                }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 text-red-400" />
                    <span className="text-red-400 font-bold text-lg">
                      {cl.comment_count}
                    </span>
                    <span className="text-sm" style={{ color: 'var(--text)' }}>
                      coordinated comments
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
                    {Math.round(cl.confidence * 100)}% confidence
                  </span>
                </div>
                <p
                  className="text-sm italic mb-3"
                  style={{ color: 'var(--muted)' }}
                >
                  &ldquo;{cl.narrative}&rdquo;
                </p>
                <div
                  className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs pt-3"
                  style={{ borderTop: '1px solid var(--border)', color: 'var(--muted)' }}
                >
                  {cl.video_title && (
                    <span>
                      Source:{' '}
                      <span style={{ color: 'var(--text)' }}>{cl.video_title}</span>
                      {cl.channel_name ? ` · ${cl.channel_name}` : ''}
                    </span>
                  )}
                  {cl.analyzed_at && (
                    <span>· Analyzed {new Date(cl.analyzed_at).toLocaleDateString()}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        <div
          className="mt-12 text-center text-xs"
          style={{ color: 'var(--muted)' }}
        >
          OmniSphere surfaces probabilistic signals, not verdicts. Always verify before
          acting.
        </div>
      </main>
    </div>
  );
}
