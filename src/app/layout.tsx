import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Gifted',
  description: 'Store gift ideas and get birthday reminders',
  manifest: '/manifest.json',
  themeColor: '#c4b5fd',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased bg-purple-50 min-h-screen font-sans">
        {children}
      </body>
    </html>
  );
}
