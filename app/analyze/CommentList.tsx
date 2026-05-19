'use client';
import { useState } from 'react';
import { AlertTriangle, Bot, User, ChevronDown, ChevronUp, ThumbsUp } from 'lucide-react';
import type { AnalyzedComment } from '@/lib/types';

function ScoreBadge({
  score,
  classification,
}: {
  score: number;
  classification: string;
}) {
  const colorClass =
    classification === 'bot'
      ? 'badge-bot'
      : classification === 'suspicious'
        ? 'badge-suspicious'
        : 'badge-human';
  const label =
    classification === 'bot'
      ? 'BOT'
      : classification === 'suspicious'
        ? 'SUSPICIOUS'
        : 'HUMAN';
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-bold ${colorClass}`}
    >
      {classification === 'bot' ? (
        <Bot className="w-3 h-3" />
      ) : classification === 'suspicious' ? (
        <AlertTriangle className="w-3 h-3" />
      ) : (
        <User className="w-3 h-3" />
      )}
      {label} {score}
    </span>
  );
}

function ScoreBar({ score, classification }: { score: number; classification: string }) {
  const color =
    classification === 'bot'
      ? '#ef4444'
      : classification === 'suspicious'
        ? '#f59e0b'
        : '#22c55e';
  return (
    <div
      className="w-full h-1 rounded-full mt-2 overflow-hidden"
      style={{ background: 'var(--surface2)' }}
    >
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${score}%`, background: color }}
      />
    </div>
  );
}

function CommentCard({ comment }: { comment: AnalyzedComment }) {
  const [expanded, setExpanded] = useState(false);
  const hasSignals = comment.signals.length > 0;

  const borderColor =
    comment.classification === 'bot'
      ? 'rgba(239,68,68,0.2)'
      : comment.classification === 'suspicious'
        ? 'rgba(245,158,11,0.15)'
        : 'var(--border)';

  return (
    <div
      className="p-4 rounded-xl border transition-all"
      style={{ background: 'var(--surface)', borderColor }}
    >
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold"
            style={{ background: 'var(--surface2)', color: 'var(--muted)' }}
          >
            {comment.author[0]?.toUpperCase()}
          </div>
          <span className="font-medium text-sm truncate">{comment.author}</span>
          {comment.clusterId && (
            <span
              className="text-xs px-1.5 py-0.5 rounded flex-shrink-0"
              style={{
                background: 'rgba(239,68,68,0.1)',
                color: '#ef4444',
                border: '1px solid rgba(239,68,68,0.2)',
              }}
            >
              clustered
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <ScoreBadge score={comment.botScore} classification={comment.classification} />
          {hasSignals && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1 rounded hover:bg-white/5 transition-colors"
              style={{ color: 'var(--muted)' }}
              aria-label={expanded ? 'Collapse signals' : 'Expand signals'}
            >
              {expanded ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          )}
        </div>
      </div>

      <p className="text-sm leading-relaxed" style={{ color: 'var(--text)' }}>
        {comment.text}
      </p>

      <ScoreBar score={comment.botScore} classification={comment.classification} />

      <div className="flex items-center justify-between mt-2">
        <div className="flex items-center gap-1 text-xs" style={{ color: 'var(--muted)' }}>
          {comment.likeCount > 0 && (
            <>
              <ThumbsUp className="w-3 h-3" />
              <span>{comment.likeCount}</span>
            </>
          )}
        </div>
        {hasSignals && !expanded && (
          <button
            onClick={() => setExpanded(true)}
            className="text-xs transition-colors hover:text-amber-400"
            style={{ color: 'var(--muted)' }}
          >
            {comment.signals.length} signal{comment.signals.length > 1 ? 's' : ''} detected →
          </button>
        )}
      </div>

      {expanded && hasSignals && (
        <div className="mt-3 pt-3 space-y-1.5" style={{ borderTop: '1px solid var(--border)' }}>
          <div className="text-xs font-medium mb-2" style={{ color: 'var(--muted)' }}>
            BOT SIGNALS DETECTED
          </div>
          {comment.signals.map((signal, i) => (
            <div key={i} className="flex items-start gap-2 text-xs">
              <AlertTriangle
                className="w-3 h-3 flex-shrink-0 mt-0.5"
                style={{ color: '#f59e0b' }}
              />
              <span style={{ color: '#f59e0b' }}>{signal}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

type Filter = 'all' | 'bot' | 'suspicious' | 'human';

export default function CommentList({ comments }: { comments: AnalyzedComment[] }) {
  const [filter, setFilter] = useState<Filter>('all');
  const [sortByScore, setSortByScore] = useState(true);

  const filtered = comments
    .filter((c) => filter === 'all' || c.classification === filter)
    .sort((a, b) =>
      sortByScore
        ? b.botScore - a.botScore
        : new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
    );

  const counts = {
    all: comments.length,
    bot: comments.filter((c) => c.classification === 'bot').length,
    suspicious: comments.filter((c) => c.classification === 'suspicious').length,
    human: comments.filter((c) => c.classification === 'human').length,
  };

  const tabs: { id: Filter; label: string; color?: string }[] = [
    { id: 'all', label: `All (${counts.all})` },
    { id: 'bot', label: `Bots (${counts.bot})`, color: '#ef4444' },
    { id: 'suspicious', label: `Suspicious (${counts.suspicious})`, color: '#f59e0b' },
    { id: 'human', label: `Human (${counts.human})`, color: '#22c55e' },
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-1 p-1 rounded-lg" style={{ background: 'var(--surface)' }}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className="px-3 py-1.5 rounded-md text-xs font-medium transition-colors"
              style={
                filter === tab.id
                  ? {
                      background: 'var(--surface2)',
                      color: tab.color || 'var(--text)',
                    }
                  : { color: 'var(--muted)' }
              }
            >
              {tab.label}
            </button>
          ))}
        </div>
        <button
          onClick={() => setSortByScore(!sortByScore)}
          className="text-xs transition-colors hover:text-indigo-400"
          style={{ color: 'var(--muted)' }}
        >
          Sort: {sortByScore ? 'Bot Score ↓' : 'Newest first'}
        </button>
      </div>

      <div className="space-y-2">
        {filtered.map((comment) => (
          <CommentCard key={comment.id} comment={comment} />
        ))}
        {filtered.length === 0 && (
          <div
            className="text-center py-12 text-sm"
            style={{ color: 'var(--muted)' }}
          >
            No comments in this category
          </div>
        )}
      </div>
    </div>
  );
}
