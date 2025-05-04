import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import toast, { Toaster } from 'react-hot-toast';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { UserHistorySidebar } from "@/components/UserHistorySidebar"
import { cookies } from "next/headers";
import Navbar from "@/components/Navbar";
import { Analytics } from "@vercel/analytics/react"
const geistSans = localFont({
  src: "./fonts/GeistVF.woff",
  variable: "--font-geist-sans",
  weight: "100 900",
});
const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
  weight: "100 900",
});

export const metadata: Metadata = {
  title: {
    default: 'CodeMap - Your Personal Learning Roadmap',
    template: '%s | CodeMap'
  },
  description: "Create personalized learning roadmaps for programming topics. Get curated resources including GitHub repositories, blog articles, and YouTube videos to master any programming concept.",
  keywords: ['programming roadmap', 'learning path', 'coding tutorials', 'developer resources', 'programming education', 'learning platform', 'code learning'],
  authors: [{ name: 'Shekhar' }],
  creator: 'Shekhar',
  publisher: 'Shekhar',
  formatDetection: {
    email: false,
    telephone: false,
    address: false,
  },
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  viewport: {
    width: 'device-width',
    initialScale: 1,
    maximumScale: 1,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: 'https://codemap.shekharcodes.tech/', // Replace with your actual domain
    title: 'CodeMap - Your Personal Learning Roadmap',
    description: 'Create personalized learning roadmaps for programming topics with curated resources.',
    siteName: 'CodeMap',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'CodeMap Preview',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'CodeMap - Your Personal Learning Roadmap',
    description: 'Create personalized learning roadmaps for programming topics with curated resources.',
    images: [{
      url: '/og-image.png',
      width: 1200,
      height: 630,
      alt: 'CodeMap Preview',
    }],
    creator: '@shekhar9837', // Replace with your Twitter handle
  },
  verification: {
    google: 'your-google-site-verification',
    yandex: 'your-yandex-verification',
    other: {
      'msvalidate.01': 'your-bing-verification',
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" suppressHydrationWarning>
      <body>

      <SidebarProvider defaultOpen={false}>
        <UserHistorySidebar />
        <main className="w-full">
          <Navbar />
          <Toaster />
          {children}
         < Analytics/>
        </main>
      </SidebarProvider>
      </body>
    </html>
  );
}
