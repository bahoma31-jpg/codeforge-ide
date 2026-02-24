import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CodeForge IDE - Web-Based Code Editor',
  description:
    'A powerful web-based IDE inspired by VS Code, built with Next.js 14 and TypeScript',
  keywords: ['IDE', 'code editor', 'web IDE', 'VS Code', 'Monaco Editor'],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>{children}</body>
    </html>
  );
}
