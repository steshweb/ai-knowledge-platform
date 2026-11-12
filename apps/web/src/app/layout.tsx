import type { Metadata } from 'next';
import { AuthProvider } from '../components/auth-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'AI Knowledge Platform',
  description: 'A private knowledge base with a grounded AI assistant.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
