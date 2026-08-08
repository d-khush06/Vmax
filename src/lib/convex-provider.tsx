"use client";

import { ClerkProvider, useAuth } from "@clerk/nextjs";
import { ConvexProviderWithClerk } from "convex/react-clerk";
import { ConvexReactClient } from "convex/react";

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL || "https://fake-url.convex.cloud");

export function ConvexClientProvider({ children }: { children: React.ReactNode }) {
  const clerkAppearance: any = {
    variables: {
      colorPrimary: "#00FF41", // Phosphor green
      colorBackground: "#050505", // Terminal black
      colorText: "#00FF41",
      colorInputBackground: "#0A0A0A",
      colorInputText: "#00FFFF",
      fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
    },
    elements: {
      card: "bg-[#050505] border border-[#00FF41]/30 shadow-[0_0_20px_rgba(0,255,65,0.15)] rounded-none",
      headerTitle: "text-[#00FF41] text-2xl font-bold tracking-widest uppercase",
      headerSubtitle: "text-[#00FF41]/70 text-xs tracking-widest",
      socialButtonsBlockButton: "bg-[#0A0A0A] border border-[#00FF41]/30 hover:bg-[#00FF41]/10 text-[#00FFFF] transition-all rounded-none",
      socialButtonsBlockButtonText: "font-mono text-xs tracking-widest",
      dividerLine: "bg-[#00FF41]/30",
      dividerText: "text-[#00FF41]/50 font-mono text-[10px]",
      formFieldLabel: "text-[#00FF41]/80 text-xs font-mono uppercase tracking-widest",
      formFieldInput: "bg-[#000000] border border-[#00FF41]/40 text-[#00FFFF] placeholder:text-[#00FF41]/30 focus:border-[#00FFFF] focus:bg-[#0A0A0A] transition-all rounded-none font-mono",
      primaryButton: "bg-[#00FF41]/20 border border-[#00FF41] hover:bg-[#00FF41]/40 text-[#00FF41] font-bold transition-all shadow-[0_0_15px_rgba(0,255,65,0.2)] rounded-none tracking-widest uppercase",
      footerActionText: "text-[#00FF41]/60 font-mono text-xs",
      footerActionLink: "text-[#00FFFF] hover:text-[#00FFFF]/80 font-bold transition-colors font-mono tracking-widest",
      identityPreviewText: "text-[#00FF41] font-mono",
      identityPreviewEditButton: "text-[#00FFFF] hover:text-[#00FFFF]/80",
      formResendCodeLink: "text-[#00FFFF] hover:text-[#00FFFF]/80 font-mono text-xs",
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
