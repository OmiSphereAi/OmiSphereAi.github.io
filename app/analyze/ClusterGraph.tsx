'use client';
import type { Cluster, AnalyzedComment } from '@/lib/types';

const BAND_HEIGHT = 220;
const VIEW_WIDTH = 800;
const RADIUS = 70;
const MAX_MEMBERS = 12;

function truncate(s: string, n: number) {
  return s.length > n ? s.slice(0, n) + '…' : s;
}

export default function ClusterGraph({
  clusters,
}: {
  clusters: Cluster[];
  comments: AnalyzedComment[];
}) {
  if (clusters.length === 0) return null;

  return (
    <div className="mb-8">
      <h2
        className="text-sm font-medium mb-3 tracking-widest"
        style={{ color: 'var(--muted)' }}
      >
        CLUSTER MAP
      </h2>
      <div
        className="rounded-xl border p-4"
        style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
      >
        {clusters.map((cluster) => {
          const cx = VIEW_WIDTH / 2;
          const cy = BAND_HEIGHT / 2;
          const n = Math.min(cluster.commentCount, MAX_MEMBERS);
          const members = Array.from({ length: n }, (_, i) => {
            const angle = (2 * Math.PI / Math.max(n, 1)) * i - Math.PI / 2;
            return {
              x: cx + RADIUS * Math.cos(angle),
              y: cy + RADIUS * Math.sin(angle),
            };
          });

          return (
            <svg
              key={cluster.id}
              width="100%"
              viewBox={`0 0 ${VIEW_WIDTH} ${BAND_HEIGHT}`}
              role="img"
              aria-label={`Cluster ${cluster.id} network graph`}
              style={{ display: 'block' }}
            >
              {/* Edges hub -> members */}
              {members.map((m, i) => (
                <line
                  key={`e-${i}`}
                  x1={cx}
                  y1={cy}
                  x2={m.x}
                  y2={m.y}
                  stroke="rgba(239,68,68,0.25)"
                  strokeWidth={1}
                />
              ))}

              {/* Member nodes (coordinated comments) */}
              {members.map((m, i) => (
                <circle
                  key={`m-${i}`}
                  cx={m.x}
                  cy={m.y}
                  r={6}
                  fill="#ef4444"
                  fillOpacity={0.85}
                />
              ))}

              {/* Central hub */}
              <circle
                cx={cx}
                cy={cy}
                r={10}
                fill="#6366f1"
                stroke="rgba(99,102,241,0.5)"
                strokeWidth={3}
              />

              {/* Hub label (truncated narrative) */}
              <text
                x={cx}
                y={cy - 22}
                textAnchor="middle"
                fontSize={13}
                fill="#e2e8f0"
              >
                {truncate(cluster.narrative.replace(/^"|"$/g, ''), 60)}
              </text>

              {/* Confidence + count */}
              <text
                x={cx}
                y={cy + 30}
                textAnchor="middle"
                fontSize={12}
                fill="#64748b"
              >
                {cluster.commentCount} comments ·{' '}
                {Math.round(cluster.confidence * 100)}% confidence
              </text>
            </svg>
          );
        })}
      </div>
    </div>
  );
}
