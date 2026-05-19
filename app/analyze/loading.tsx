export default function Loading() {
  return (
    <div className="min-h-screen bg-grid flex items-center justify-center">
      <div className="text-center">
        <div className="relative mb-6">
          <div className="w-16 h-16 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto" />
          <div
            className="absolute inset-0 w-16 h-16 rounded-full mx-auto"
            style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.1) 0%, transparent 70%)' }}
          />
        </div>
        <h2 className="text-lg font-semibold mb-2" style={{ color: 'var(--text)' }}>
          Analyzing comments...
        </h2>
        <p className="text-sm" style={{ color: 'var(--muted)' }}>
          Fetching data and scoring each commenter for bot-like behavior
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
          This takes 5–15 seconds
        </p>
        <div className="flex items-center justify-center gap-1 mt-6">
          {['Fetching comments', 'Running bot detection', 'Clustering accounts'].map(
            (step, i) => (
              <div key={step} className="flex items-center gap-1">
                <div
                  className="w-1.5 h-1.5 rounded-full animate-pulse"
                  style={{
                    background: '#6366f1',
                    animationDelay: `${i * 0.3}s`,
                  }}
                />
                <span className="text-xs" style={{ color: 'var(--muted)' }}>
                  {step}
                </span>
                {i < 2 && (
                  <span className="text-xs mx-1" style={{ color: 'var(--border)' }}>
                    →
                  </span>
                )}
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
