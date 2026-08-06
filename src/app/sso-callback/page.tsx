import { AuthenticateWithRedirectCallback } from "@clerk/nextjs";

export default function SSOCallback() {
  return (
    <div className="min-h-screen w-screen bg-[#030303] flex items-center justify-center relative overflow-hidden text-gray-200">
      
      {/* Abstract Background Elements */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[100vw] h-[60vh] bg-gradient-to-b from-orange-500/10 via-purple-600/5 to-transparent pointer-events-none blur-[120px] mix-blend-screen" />
      <div className="absolute -bottom-1/2 -left-1/4 w-[80vw] h-[80vh] bg-purple-900/10 rounded-full pointer-events-none blur-[150px] mix-blend-screen" />
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.04] mix-blend-overlay pointer-events-none z-0"></div>

      <div className="flex flex-col items-center gap-6 relative z-10">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-purple-600 flex items-center justify-center font-bold text-2xl text-white shadow-lg shadow-orange-500/30 animate-pulse">
          V
        </div>
        <p className="text-gray-400 font-medium animate-pulse">Authenticating with VMAX...</p>
        <AuthenticateWithRedirectCallback 
          signInFallbackRedirectUrl="/setup"
          signUpFallbackRedirectUrl="/setup"
        />
      </div>

    </div>
  );
}
