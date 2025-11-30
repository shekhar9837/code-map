import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Toaster } from 'react-hot-toast';
import { SidebarProvider } from "@/components/ui/sidebar";
import { UserHistorySidebar } from "@/components/UserHistorySidebar"
import Navbar from "@/components/Navbar";
import { Analytics } from "@vercel/analytics/react"
import { Poppins, Instrument_Serif} from "next/font/google"

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
})

const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-instrument-serif',
})

export { instrumentSerif }

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://codemap.shekharcodes.tech'),
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
    url: 'https://codemap.shekharcodes.tech/',
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
    creator: '@shekhar_tw',
  },
  verification: {
    google: 'your-google-site-verification',
    yandex: 'your-yandex-verification',
    other: {
      'msvalidate.01': 'your-bing-verification',
    },
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" suppressHydrationWarning className={poppins.className}>
      <body className={`${instrumentSerif.className} ${instrumentSerif.variable}`}>

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
