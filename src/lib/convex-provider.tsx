"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL || "https://fake-url.convex.cloud");

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  const clerkAppearance: any = {
    layout: {
      socialButtonsPlacement: 'top',
      logoImageUrl: '/logo.png',
    },
    variables: {
      colorPrimary: "#22c55e", // green-500
      colorBackground: "#0b120c", // dark green
      colorText: "#e5e7eb", // gray-200
      colorInputBackground: "#111a12", // slightly lighter dark green
      colorInputText: "#ffffff",
      fontFamily: "'Inter', sans-serif",
    },
    elements: {
      card: "bg-[#0b120c] border border-green-500/30 shadow-[0_0_40px_rgba(34,197,94,0.2)] rounded-2xl",
      headerTitle: "text-white text-2xl font-bold tracking-tight",
      headerSubtitle: "text-green-400/70 text-sm",
      socialButtonsBlockButton: "bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 text-white transition-all rounded-xl",
      socialButtonsBlockButtonText: "font-semibold text-sm",
      dividerLine: "bg-green-500/20",
      dividerText: "text-gray-500 text-sm",
      formFieldLabel: "text-gray-300 text-xs font-semibold uppercase tracking-wide",
      formFieldInput: "bg-[#0b120c] border border-green-500/30 text-white placeholder:text-gray-600 focus:border-green-500 focus:bg-green-500/5 transition-all rounded-xl",
      primaryButton: "bg-green-500 hover:bg-green-400 text-black font-bold transition-all shadow-[0_0_20px_rgba(34,197,94,0.4)] rounded-xl",
      footerActionText: "text-gray-400 text-sm",
      footerActionLink: "text-green-400 hover:text-green-300 font-semibold transition-colors",
      identityPreviewText: "text-white font-medium",
      identityPreviewEditButton: "text-green-400 hover:text-green-300",
      formResendCodeLink: "text-green-400 hover:text-green-300 text-sm font-semibold",
    }
  };

  return (
    <ClerkProvider appearance={clerkAppearance}>
      <ConvexProviderWithClerk client={convex} useAuth={useAuth}>
        {children}
      </ConvexProviderWithClerk>
    </ClerkProvider>
  );
}
