'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X } from 'lucide-react';
import { useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useUser } from '@clerk/nextjs';

export function AchievementToast() {
  const { user } = useUser();
  const userProgress = useQuery(api.users.getUserProgress, user ? { clerkId: user.id } : "skip");
  
  const [show, setShow] = useState(false);
  const [prevLevel, setPrevLevel] = useState<number | null>(null);

  useEffect(() => {
    if (userProgress && prevLevel !== null && userProgress.level > prevLevel) {
      setShow(true);
      const timer = setTimeout(() => setShow(false), 2500);
      return () => clearTimeout(timer);
    }
    if (userProgress && prevLevel === null) {
      setPrevLevel(userProgress.level);
    }
  }, [userProgress?.level]);

  // For testing visually if level doesn't change
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'a' && e.ctrlKey) {
        setShow(true);
        setTimeout(() => setShow(false), 2500);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="absolute bottom-20 left-1/2 -translate-x-1/2 z-50 pointer-events-none">
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            transition={{ type: 'tween', ease: 'easeOut', duration: 0.2 }}
            className="bg-[var(--coal)] bevel p-4 flex items-center gap-4 shadow-[0_10px_40px_rgba(0,0,0,0.5)] pointer-events-auto min-w-[300px] cursor-pointer"
            onClick={() => setShow(false)}
          >
            <div className="w-12 h-12 bevel-inset bg-[var(--slate)] flex items-center justify-center shrink-0">
              <Trophy size={24} className="text-[var(--ore)]" />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-[var(--ore)] text-sm tracking-widest uppercase">Achievement Unlocked</h3>
              <p className="font-sans text-[var(--quartz)] text-sm font-medium mt-1">
                You reached Level {userProgress?.level || 2}!
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
