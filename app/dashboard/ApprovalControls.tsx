'use client';
import { useState } from 'react';
import { Check, EyeOff } from 'lucide-react';

export default function ApprovalControls({
  id,
  isPublic,
}: {
  id: string;
  isPublic: boolean;
}) {
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    try {
      await fetch('/api/admin/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        // TODO: when ADMIN_PASSWORD is enforced, collect and send `password` here.
        body: JSON.stringify({ id, isPublic: !isPublic }),
      });
      location.reload();
    } catch {
      setLoading(false);
    }
  }

  if (isPublic) {
    return (
      <button
        onClick={toggle}
        disabled={loading}
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
        style={{
          background: 'rgba(245,158,11,0.1)',
          color: '#f59e0b',
          border: '1px solid rgba(245,158,11,0.3)',
        }}
      >
        <EyeOff className="w-3.5 h-3.5" />
        {loading ? 'Working…' : 'Unpublish'}
      </button>
    );
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors disabled:opacity-50"
      style={{
        background: 'rgba(34,197,94,0.1)',
        color: '#22c55e',
        border: '1px solid rgba(34,197,94,0.3)',
      }}
    >
      <Check className="w-3.5 h-3.5" />
      {loading ? 'Working…' : 'Approve for public'}
    </button>
  );
}
