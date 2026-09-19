import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';

export const metadata: Metadata = {
  title: 'Arihant BOS | Defence & Security GeM ERP',
  description:
    'Comprehensive Business Operating System for Arihant Trading Corporation - Security & Defence Equipment, GeM Tenders, and Field Operations.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${GeistSans.variable} ${GeistMono.variable} font-sans bg-[#F7FBFF] text-[#1A1A1A] text-[14px] antialiased selection:bg-[#EAF2FF] selection:text-[#223FA7]`}
        suppressHydrationWarning
      >
        <AuthProvider>{children}</AuthProvider>
      </body>
    </html>
  );
}
