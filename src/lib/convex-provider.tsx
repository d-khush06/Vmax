"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";
import { dark } from "@clerk/themes";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!);

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  const clerkAppearance: any = {
    baseTheme: dark,
    elements: {
      card: "bg-black/40 backdrop-blur-3xl border border-white/10 shadow-[0_30px_60px_rgba(0,0,0,0.8)] rounded-2xl",
      headerTitle: "text-white text-2xl font-bold",
      headerSubtitle: "text-gray-400 text-sm",
      socialButtonsBlockButton: "bg-white/[0.03] border border-white/10 hover:bg-white/10 text-white transition-all",
      socialButtonsBlockButtonText: "font-semibold",
      dividerLine: "bg-white/10",
      dividerText: "text-gray-500",
      formFieldLabel: "text-gray-300",
      formFieldInput: "bg-white/[0.03] border border-white/10 text-white placeholder:text-gray-500 focus:border-teal-500/50 focus:bg-white/[0.05] transition-all rounded-lg",
      primaryButton: "bg-teal-500 hover:bg-teal-400 text-white font-semibold transition-all shadow-[0_0_15px_rgba(20,184,166,0.3)] rounded-lg",
      footerActionText: "text-gray-400",
      footerActionLink: "text-teal-400 hover:text-teal-300 font-semibold transition-colors",
      identityPreviewText: "text-gray-300",
      identityPreviewEditButton: "text-teal-400 hover:text-teal-300",
      formResendCodeLink: "text-teal-400 hover:text-teal-300",
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
