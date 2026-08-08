import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';

export default function LoginPage() {
  return (
    <div className="min-h-screen w-screen bg-[#0b120c] flex items-center justify-center relative overflow-hidden text-gray-200">
      {/* Background Elements */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[90vw] h-[60vh] rounded-full bg-gradient-radial from-green-500/10 via-emerald-600/5 to-transparent blur-[100px] pointer-events-none" />
      <div className="absolute top-[40%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-green-900/10 blur-[120px] pointer-events-none" />
      
      {/* The Modal */}
      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="absolute -top-12 left-0 text-sm font-semibold text-gray-400 hover:text-white transition-colors">
          ← Back to Home
        </Link>
        <div className="flex justify-center shadow-2xl">
          <SignIn routing="hash" />
        </div>
      </div>
    </div>
  );
}
