import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Knowledge Platform',
  description: 'A private knowledge base with a grounded AI assistant.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
