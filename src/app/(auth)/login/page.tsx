import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen w-screen bg-black flex items-center justify-center relative overflow-hidden font-sans">
      {/* Subtle Professional Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_20%,transparent_100%)] pointer-events-none" />
      
      {/* The Mac OS Window Modal */}
      <div className="relative z-10 w-full max-w-[420px] px-4">
        <Link href="/" className="absolute -top-12 left-4 text-sm font-medium text-gray-500 hover:text-white transition-colors">
          ← Back
        </Link>
        <div className="w-full bg-[#1c1c1e]/90 backdrop-blur-3xl rounded-xl border border-white/15 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8),_0_0_0_1px_rgba(255,255,255,0.05)_inset] overflow-hidden flex flex-col">
          
          {/* Mac Window Title Bar */}
          <div className="h-10 bg-white/5 border-b border-white/5 flex items-center px-4 relative">
            <div className="flex items-center gap-2 absolute left-4">
              <div className="w-3 h-3 rounded-full bg-[#ff5f56] border border-[#e0443e]" />
              <div className="w-3 h-3 rounded-full bg-[#ffbd2e] border border-[#dea123]" />
              <div className="w-3 h-3 rounded-full bg-[#27c93f] border border-[#1aab29]" />
            </div>
            <div className="w-full text-center text-xs font-semibold text-white/50 tracking-wide">
              Sign In to VMAX
            </div>
          </div>

          <div className="flex justify-center w-full py-4">
            <SignIn 
              routing="hash"
              fallbackRedirectUrl="/setup"
              signUpUrl="/signup"
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "!bg-transparent !border-none !shadow-none",
                  headerTitle: "!text-white !text-2xl !font-medium !tracking-tight",
                  headerSubtitle: "!text-gray-400 !text-sm",
                socialButtonsBlockButton: "!bg-white/5 !border !border-white/10 hover:!bg-white/10 transition-colors !text-white !rounded-lg !py-2.5",
                socialButtonsBlockButtonText: "!text-white !font-medium",
                socialButtonsProviderIcon: "filter brightness-0 invert opacity-90",
                dividerLine: "!bg-white/10",
                dividerText: "!text-gray-500",
                formFieldLabel: "!text-gray-300 !text-sm !font-medium",
                  formFieldInput: "!bg-black/50 !border !border-white/10 !text-white placeholder:!text-gray-600 focus:!border-white/30 focus:!bg-black focus:!ring-1 focus:!ring-white/30 !rounded-lg transition-all !py-2.5",
                  formButtonPrimary: "!bg-white hover:!bg-gray-200 !text-black transition-all !py-2.5 !font-semibold !text-sm !rounded-lg !shadow-none",
                footerActionText: "!text-gray-400",
                footerActionLink: "!text-white hover:!text-gray-300 !font-medium transition-colors",
                identityPreviewText: "!text-white",
                identityPreviewEditButton: "!text-white hover:!text-gray-300",
                formFieldWarningText: "!text-amber-400",
                formFieldErrorText: "!text-red-400",
                alertText: "!text-white",
                alert: "!bg-red-500/10 !border !border-red-500/20 !text-white !rounded-lg",
              },
              variables: {
                colorPrimary: '#ffffff',
                colorBackground: '#0a0a0a',
                colorDanger: '#ff453a',
                colorSuccess: '#30d158',
                borderRadius: '0.5rem',
              }
            }}
          />
          </div>
        </div>
      </div>
    </div>
  );
}
