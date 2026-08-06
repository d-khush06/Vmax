import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/lib/convex-provider";
import { TeamProvider } from "@/lib/team-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "VMAX | Next-Gen Team OS",
  description: "Next-gen Team OS",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ConvexClientProvider>
          <TeamProvider>
            {children}
          </TeamProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
