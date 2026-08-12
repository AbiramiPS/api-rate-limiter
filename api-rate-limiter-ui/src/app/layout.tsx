import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'API Rate Limiter Admin Portal',
  description: 'Production-quality Admin Dashboard for API Rate Limiter System with Spring Boot & Redis integration.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full antialiased">{children}</body>
    </html>
  );
}
