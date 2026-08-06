"use client";

import React, { useState } from 'react';
import { useClerk } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
export type OAuthStrategy = 'oauth_google' | 'oauth_discord' | 'oauth_github' | string;
import { motion, AnimatePresence } from 'framer-motion';
import { X, Mail, Lock, ArrowRight, Loader2, AlertCircle } from 'lucide-react';

interface CustomAuthModalProps {
  initialMode: 'sign-in' | 'sign-up';
  onClose?: () => void;
}

export default function CustomAuthModal({ initialMode, onClose }: CustomAuthModalProps) {
  const { client, setActive } = useClerk();
  const router = useRouter();

  const [mode, setMode] = useState<'sign-in' | 'sign-up'>(initialMode);
  
  // Form State
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  
  // UI State
  const [pendingVerification, setPendingVerification] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  // ── OAuth Handlers ──
  const handleOAuth = async (strategy: OAuthStrategy) => {
    setIsLoading(true);
    setError('');

    try {
      const redirectUrl = `${window.location.origin}/sso-callback`;
      const redirectUrlComplete = `${window.location.origin}/setup`;

      if (mode === 'sign-in') {
        await client.signIn.authenticateWithRedirect({
          strategy,
          redirectUrl,
          redirectUrlComplete,
        });
      } else {
        await client.signUp.authenticateWithRedirect({
          strategy,
          redirectUrl,
          redirectUrlComplete,
        });
      }
    } catch (err: any) {
      console.error('OAuth error:', err);
      setError(err.errors?.[0]?.longMessage || err.message || 'OAuth authentication failed.');
      setIsLoading(false);
    }
  };

  // ── Email/Password Sign Up ──
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setError('');

    try {
      await client.signUp.create({
        emailAddress: email,
        password,
        username,
      });

      // Send the OTP
      await client.signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      setPendingVerification(true);
      setIsLoading(false);
    } catch (err: any) {
      console.error('Sign up error:', err);
      if (err.errors?.[0]?.code === 'form_username_taken') {
        setError('This username is already taken. Please choose another one.');
      } else {
        setError(err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'An error occurred during sign up.');
      }
      setIsLoading(false);
    }
  };

  // ── Verify OTP ──
  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setError('');

    try {
      const completeSignUp = await client.signUp.attemptEmailAddressVerification({
        code,
      });

      if (completeSignUp.status === 'complete') {
        await setActive({ session: completeSignUp.createdSessionId });
        router.push('/setup');
      } else {
        // Needs further steps (e.g. missing fields)
        console.error('Sign up is not complete:', completeSignUp);
        setError('Missing requirements for sign up.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Invalid verification code.');
    } finally {
      setIsLoading(false);
    }
  };

  // ── Email/Password Sign In ──
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsLoading(true);
    setError('');

    try {
      const completeSignIn = await client.signIn.create({
        identifier: email,
        password,
      });

      if (completeSignIn.status === 'complete') {
        await setActive({ session: completeSignIn.createdSessionId });
        router.push('/setup');
      } else {
        // e.g. Requires 2FA
        console.error('Sign in is not complete:', completeSignIn);
        setError('Additional verification required. (Not supported in this basic UI yet)');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.errors?.[0]?.longMessage || err.errors?.[0]?.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, y: 20 }}
      transition={{ duration: 0.25 }}
      className="relative w-full max-w-md mx-auto"
      onClick={(e) => e.stopPropagation()} // Prevent backdrop click from closing
    >
      {/* Close Button */}
      <button
        onClick={onClose}
        className="absolute -top-4 -right-4 z-50 w-8 h-8 rounded-full bg-[#0a0a0c] border border-white/10 flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/10 transition-all shadow-xl"
      >
        <X size={15} />
      </button>

      {/* Abstract Glow */}
      <div className="absolute -inset-4 bg-gradient-to-r from-orange-500/15 to-purple-500/15 rounded-3xl blur-2xl -z-10" />

      {/* Main Container */}
      <div className="bg-[#0a0a0c]/95 backdrop-blur-3xl border border-white/10 shadow-2xl rounded-2xl p-6 sm:p-8 overflow-hidden relative">
        
        {/* Header */}
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 mb-4 rounded-2xl overflow-hidden shadow-2xl shadow-orange-500/20 border border-white/10">
            <img src="/logo.png" alt="VMAX Logo" className="w-full h-full object-cover" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            {pendingVerification ? 'Check your email' : (mode === 'sign-in' ? 'Welcome back' : 'Create an account')}
          </h2>
          <p className="text-sm text-gray-400">
            {pendingVerification 
              ? `We've sent a 6-digit code to ${email}`
              : (mode === 'sign-in' ? 'Sign in to your VMAX account' : 'Start your journey with VMAX')}
          </p>
        </div>

        {error && (
          <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3">
            <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <p className="text-sm text-red-400 leading-relaxed">{error}</p>
          </div>
        )}

        {pendingVerification ? (
          /* OTP Form */
          <form onSubmit={handleVerifyOTP} className="flex flex-col gap-5">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-gray-300 ml-1">Verification Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="123456"
                className="w-full px-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all text-center tracking-widest text-lg font-mono"
                required
              />
            </div>
            
            <button
              type="submit"
              disabled={isLoading || code.length < 6}
              className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-purple-600 text-white font-bold hover:from-orange-400 hover:to-purple-500 transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {isLoading ? <Loader2 size={20} className="animate-spin" /> : 'Verify Email'}
            </button>
          </form>
        ) : (
          /* Sign In / Sign Up Form */
          <>
            <form onSubmit={mode === 'sign-in' ? handleSignIn : handleSignUp} className="flex flex-col gap-5">
              
              {mode === 'sign-up' && (
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-gray-300 ml-1">Username</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                      <span className="text-lg font-bold">@</span>
                    </div>
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="username"
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all"
                      required
                    />
                  </div>
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300 ml-1">
                  {mode === 'sign-in' ? 'Username or Email' : 'Email Address'}
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                    <Mail size={18} />
                  </div>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder={mode === 'sign-in' ? 'username or you@example.com' : 'you@example.com'}
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all"
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-gray-300 ml-1">Password</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-500">
                    <Lock size={18} />
                  </div>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder:text-gray-600 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500/50 transition-all"
                    required
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-purple-600 text-white font-bold hover:from-orange-400 hover:to-purple-500 transition-all shadow-lg shadow-orange-500/25 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
              >
                {isLoading ? <Loader2 size={20} className="animate-spin" /> : (
                  <>
                    {mode === 'sign-in' ? 'Sign In' : 'Create Account'}
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>

            <div className="flex items-center gap-4 my-8">
              <div className="flex-1 h-px bg-white/10"></div>
              <span className="text-xs text-gray-500 font-medium uppercase tracking-wider">or continue with</span>
              <div className="flex-1 h-px bg-white/10"></div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => handleOAuth('oauth_google')}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm font-semibold text-white transition-all"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                </svg>
                Google
              </button>
              <button
                type="button"
                onClick={() => handleOAuth('oauth_discord')}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm font-semibold text-white transition-all"
              >
                <svg width="18" height="18" viewBox="0 0 127.14 96.36" fill="#5865F2" xmlns="http://www.w3.org/2000/svg">
                  <path d="M107.7,8.07A105.15,105.15,0,0,0,81.47,0a72.06,72.06,0,0,0-3.36,6.83A97.68,97.68,0,0,0,49,6.83,72.37,72.37,0,0,0,45.64,0,105.89,105.89,0,0,0,19.39,8.09C2.79,32.65-1.71,56.6.54,80.21h0A105.73,105.73,0,0,0,32.71,96.36,77.7,77.7,0,0,0,39.6,85.25a68.42,68.42,0,0,1-10.85-5.18c.91-.66,1.8-1.34,2.66-2a75.57,75.57,0,0,0,64.32,0c.87.71,1.76,1.39,2.66,2a68.68,68.68,0,0,1-10.87,5.19,77,77,0,0,0,6.89,11.1A105.25,105.25,0,0,0,126.6,80.22h0C129.24,52.84,122.09,29.11,107.7,8.07ZM42.45,65.69C36.18,65.69,31,60,31,53s5-12.74,11.43-12.74S54,46,53.89,53,48.84,65.69,42.45,65.69Zm42.24,0C78.41,65.69,73.31,60,73.31,53s5-12.74,11.43-12.74S96.3,46,96.19,53,91.08,65.69,84.69,65.69Z"/>
                </svg>
                Discord
              </button>
              <button
                type="button"
                onClick={() => handleOAuth('oauth_github')}
                className="flex items-center justify-center gap-2 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-sm font-semibold text-white transition-all"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.42 2.865 8.166 6.839 9.489.5.092.682-.217.682-.482 0-.237-.008-.866-.013-1.7-2.782.603-3.369-1.34-3.369-1.34-.454-1.156-1.11-1.462-1.11-1.462-.908-.62.069-.608.069-.608 1.003.07 1.531 1.03 1.531 1.03.892 1.529 2.341 1.087 2.91.831.092-.646.35-1.086.636-1.336-2.22-.253-4.555-1.11-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.27.098-2.647 0 0 .84-.269 2.75 1.025A9.578 9.578 0 0112 6.836c.85.004 1.705.114 2.504.336 1.909-1.294 2.747-1.025 2.747-1.025.546 1.377.203 2.394.1 2.647.64.699 1.028 1.592 1.028 2.683 0 3.842-2.339 4.687-4.566 4.935.359.309.678.919.678 1.852 0 1.336-.012 2.415-.012 2.743 0 .267.18.578.688.48C19.138 20.161 22 16.416 22 12c0-5.523-4.477-10-10-10z"/>
                </svg>
                GitHub
              </button>
            </div>

            <div className="mt-8 text-center text-sm text-gray-400">
              {mode === 'sign-in' ? (
                <>
                  Don't have an account?{' '}
                  <button onClick={() => setMode('sign-up')} className="text-orange-400 hover:text-orange-300 font-semibold transition-colors">
                    Sign up
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button onClick={() => setMode('sign-in')} className="text-orange-400 hover:text-orange-300 font-semibold transition-colors">
                    Sign in
                  </button>
                </>
              )}
            </div>
          </>
        )}
        
        {/* Clerk Bot Protection DOM Node */}
        <div id="clerk-captcha"></div>
      </div>
    </motion.div>
  );
}
