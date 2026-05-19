import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'OmniSphere — Bot Detection & Narrative Intelligence',
  description:
    'Detect bot clusters, track coordinated narratives, and see the truth behind social media.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-grid antialiased">{children}</body>
    </html>
  );
}
