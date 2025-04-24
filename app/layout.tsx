import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import toast, { Toaster } from 'react-hot-toast';
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { UserHistorySidebar } from "@/components/UserHistorySidebar"
import { cookies } from "next/headers";
import Navbar from "@/components/Navbar";

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
  title: "CodeMap - Your Personal Learning Roadmap",
  description: "Create personalized learning roadmaps for programming topics. Get curated resources including GitHub repositories, blog articles, and YouTube videos to master any programming concept.",
  keywords: "programming roadmap, learning path, coding tutorials, developer resources, programming education",
  authors: [{ name: "Shekhar" }],
  openGraph: {
    title: "CodeMap - Your Personal Learning Roadmap",
    description: "Create personalized learning roadmaps for programming topics with curated resources.",
    type: "website",
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
        </main>
      </SidebarProvider>
      </body>
    </html>
  );
}
