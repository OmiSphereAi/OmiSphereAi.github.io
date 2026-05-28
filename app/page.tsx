'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, Shield, Network, BarChart3, ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';

export default function HomePage() {
  const [url, setUrl] = useState('');
  const router = useRouter();

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!url.trim()) return;
    router.push(`/analyze?url=${encodeURIComponent(url.trim())}`);
  }

  function handleDemo() {
    router.push('/analyze?demo=1');
  }

  return (
    <div className="min-h-screen bg-grid flex flex-col">
      {/* Header */}
      <header
        className="flex items-center justify-between px-8 py-5 border-b"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center">
            <Network className="w-4 h-4 text-white" />
          </div>
          <span
            className="font-bold text-lg tracking-tight"
            style={{ color: 'var(--text)' }}
          >
            OmniSphere
          </span>
        </div>
        <nav className="flex items-center gap-6">
          <Link
            href="/dashboard"
            className="text-sm hover:text-indigo-400 transition-colors"
            style={{ color: 'var(--muted)' }}
          >
            Admin Dashboard
          </Link>
        </nav>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-20">
        <div
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium mb-8"
          style={{
            background: 'rgba(99,102,241,0.1)',
            color: '#818cf8',
            border: '1px solid rgba(99,102,241,0.2)',
          }}
        >
          <Zap className="w-3 h-3" />
          Powered by behavioral AI analysis
        </div>

        <h1
          className="text-5xl md:text-6xl font-bold text-center mb-5 leading-tight"
          style={{ color: 'var(--text)' }}
        >
          Detect Bots.
          <br />
          <span className="text-indigo-400">Track Narratives.</span>
        </h1>

        <p className="text-center text-lg mb-12 max-w-xl" style={{ color: 'var(--muted)' }}>
          Paste any YouTube link. OmniSphere analyzes every commenter for bot-like behavior,
          detects coordinated clusters, and exposes manipulation campaigns in real time.
        </p>

        {/* URL Input */}
        <form onSubmit={handleSubmit} className="w-full max-w-2xl mb-4">
          <div
            className="flex gap-2 p-2 rounded-xl border glow-indigo"
            style={{
              background: 'var(--surface)',
              borderColor: 'rgba(99,102,241,0.4)',
            }}
          >
            <Search
              className="w-5 h-5 ml-2 my-auto flex-shrink-0"
              style={{ color: 'var(--muted)' }}
            />
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="Paste a YouTube link..."
              className="flex-1 bg-transparent outline-none text-sm py-2 px-1"
              style={{ color: 'var(--text)' }}
            />
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all bg-indigo-600 hover:bg-indigo-500 text-white"
            >
              Analyze <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>

        <button
          onClick={handleDemo}
          className="text-sm mb-16 transition-colors hover:text-indigo-400"
          style={{ color: 'var(--muted)' }}
        >
          No link? Try the demo →
        </button>

        {/* Feature pills */}
        <div className="flex flex-wrap justify-center gap-3 mb-20">
          {[
            {
              icon: Shield,
              label: 'Bot Detection',
              desc: 'Score every commenter 0–100',
            },
            {
              icon: Network,
              label: 'Cluster Analysis',
              desc: 'Find coordinated account groups',
            },
            {
              icon: BarChart3,
              label: 'Narrative Tracking',
              desc: 'Monitor emerging campaigns',
            },
          ].map(({ icon: Icon, label, desc }) => (
            <div
              key={label}
              className="flex items-center gap-3 px-4 py-3 rounded-xl border"
              style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
            >
              <Icon className="w-4 h-4 text-indigo-400" />
              <div>
                <div className="text-sm font-medium" style={{ color: 'var(--text)' }}>
                  {label}
                </div>
                <div className="text-xs" style={{ color: 'var(--muted)' }}>
                  {desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Sample narrative reports */}
        <div className="w-full max-w-2xl">
          <div className="flex items-center justify-center gap-3 mb-4">
            <Link
              href="/reports"
              className="text-sm font-medium tracking-widest transition-colors hover:text-indigo-400"
              style={{ color: 'var(--muted)' }}
            >
              RECENT PUBLIC INTELLIGENCE REPORTS
            </Link>
            <Link
              href="/reports"
              className="text-xs transition-colors hover:text-indigo-400"
              style={{ color: '#818cf8' }}
            >
              View all →
            </Link>
          </div>
          <div className="space-y-3">
            {[
              {
                count: 62,
                label: 'coordinated bot accounts',
                narrative: 'amplifying anti-policy narrative',
                confidence: 0.94,
                timeAgo: '2h ago',
              },
              {
                count: 38,
                label: 'suspicious accounts',
                narrative: 'pushing identical promotional links across 14 videos',
                confidence: 0.87,
                timeAgo: '5h ago',
              },
              {
                count: 91,
                label: 'high-confidence bot accounts',
                narrative: 'coordinated engagement farming on trending content',
                confidence: 0.96,
                timeAgo: '1d ago',
              },
            ].map((report, i) => (
              <div
                key={i}
                className="flex items-center justify-between p-4 rounded-xl border"
                style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl font-bold text-red-400">{report.count}</div>
                  <div>
                    <div className="text-sm" style={{ color: 'var(--text)' }}>
                      <span className="text-red-400">{report.label}</span> {report.narrative}
                    </div>
                    <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                      {Math.round(report.confidence * 100)}% confidence · {report.timeAgo}
                    </div>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--muted)' }} />
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer
        className="text-center text-xs py-6 border-t space-y-1"
        style={{ borderColor: 'var(--border)', color: 'var(--muted)' }}
      >
        <div>
          OmniSphere surfaces probabilistic signals, not verdicts. Always verify before
          acting.
        </div>
        <div>OmniSphere · Social Media Intelligence · Demo Mode Active</div>
      </footer>
    </div>
  );
}
