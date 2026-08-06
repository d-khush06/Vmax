import CustomAuthModal from '@/components/CustomAuthModal';
import Link from 'next/link';

export default function SignUpPage() {
  return (
    <div className="min-h-screen w-screen bg-[#030303] flex items-center justify-center relative overflow-hidden text-gray-200">
      {/* Background Elements */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[90vw] h-[60vh] rounded-full bg-gradient-radial from-orange-500/20 via-purple-600/5 to-transparent blur-[100px] pointer-events-none" />
      <div className="absolute top-[40%] -left-[10%] w-[50vw] h-[50vw] rounded-full bg-purple-900/15 blur-[120px] pointer-events-none" />
      
      {/* The Modal */}
      <div className="relative z-10 w-full max-w-md">
        <Link href="/" className="absolute -top-12 left-0 text-sm font-semibold text-gray-400 hover:text-white transition-colors">
          ← Back to Home
        </Link>
        <CustomAuthModal initialMode="sign-up" onClose={() => {}} />
      </div>
    </div>
  );
}
