import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import '@/styles/globals.css';
import { Providers } from '@/components/providers';

const inter = Inter({ 
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    default: 'NeuraMaint',
    template: '%s | NeuraMaint',
  },
  description: 'Industrial Equipment Predictive Maintenance System - Prevent failures before they happen',
  keywords: [
    'predictive maintenance',
    'industrial equipment',
    'pump monitoring',
    'IoT sensors',
    'machine learning',
    'preventive maintenance',
  ],
  authors: [{ name: 'NeuraMaint Team' }],
  creator: 'NeuraMaint Team',
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
    title: 'NeuraMaint',
    description: 'Industrial Equipment Predictive Maintenance System',
    siteName: 'NeuraMaint',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NeuraMaint',
    description: 'Industrial Equipment Predictive Maintenance System',
  },
  robots: {
    index: false, // Private industrial application
    follow: false,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
        <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
        <meta name="theme-color" content="#1E40AF" />
      </head>
      <body className={`${inter.className} font-inter antialiased`}>
        <Providers>
          {children}
        </Providers>
      </body>
    </html>
  );
}