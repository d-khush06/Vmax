import type { Metadata } from "next";
import { Inter, Archivo_Black, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { ConvexClientProvider } from "@/lib/convex-provider";
import { TeamProvider } from "@/lib/team-context";

const inter = Inter({
  variable: "--font-body",
  subsets: ["latin"],
});

const archivoBlack = Archivo_Black({
  weight: "400",
  variable: "--font-display",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
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
      className={`${inter.variable} ${archivoBlack.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className={`${inter.variable} ${archivoBlack.variable} ${jetbrainsMono.variable} antialiased h-screen overflow-hidden flex flex-col bg-[var(--coal)]`}>
        <ConvexClientProvider>
          <TeamProvider>
            {children}
          </TeamProvider>
        </ConvexClientProvider>
      </body>
    </html>
  );
}
