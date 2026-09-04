'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { useUser } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';

export function LivePresence({ teamId }: { teamId: string }) {
  const { user } = useUser();
  const pathname = usePathname();
  const updatePresence = useMutation(api.presence.updatePresence);
  
  // We don't filter by route right now, so we see all cursors in the same team.
  // Actually, filtering by route makes it so cursors only show if they are on the same page.
  // We'll filter by route to avoid cursors flying around randomly if they are looking at another page.
  const presences = useQuery(api.presence.getPresence, { 
    teamId: teamId as any, 
    route: pathname 
  });

  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Throttle cursor updates to reduce DB spam
  useEffect(() => {
    let lastCall = 0;
    
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
      
      const now = Date.now();
      if (now - lastCall > 100) { // Update max 10 times a second
        if (user && teamId) {
          updatePresence({
            teamId: teamId as any,
            clerkId: user.id,
            name: user.fullName || 'User',
            avatarUrl: user.imageUrl,
            route: pathname,
            x: e.clientX,
            y: e.clientY,
          }).catch(console.error);
        }
        lastCall = now;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [user, teamId, pathname, updatePresence]);

  if (!presences) return null;

  return (
    <div className="pointer-events-none fixed inset-0 z-[9999] overflow-hidden">
      <AnimatePresence>
        {presences.map((p) => {
          if (p.clerkId === user?.id) return null; // Don't show own cursor

          return (
            <motion.div
              key={p.clerkId}
              initial={{ opacity: 0, x: p.x, y: p.y }}
              animate={{ opacity: 1, x: p.x, y: p.y }}
              exit={{ opacity: 0 }}
              transition={{
                duration: 0.15,
                ease: "linear",
              }}
              className="absolute top-0 left-0 flex flex-col items-start drop-shadow-md"
              style={{
                // Offset cursor slightly so it points precisely
                marginLeft: '-2px',
                marginTop: '-2px'
              }}
            >
              {/* macOS style cursor pointer */}
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white drop-shadow-sm">
                <path d="M5.65376 21.9213L2.52988 2.82512C2.33957 1.66164 3.53503 0.771987 4.59858 1.28586L21.5794 9.48972C22.6133 9.98935 22.5694 11.4586 21.5036 11.8953L14.0044 14.9669C13.6705 15.1037 13.4005 15.3622 13.2505 15.6903L9.94315 22.9234C9.48507 23.9248 8.04944 23.9048 7.62534 22.8941L5.65376 21.9213Z" fill="currentColor" stroke="black" strokeWidth="1.5" strokeLinejoin="round"/>
              </svg>
              
              <div className="ml-4 -mt-1 flex items-center gap-1.5 bg-black/70 backdrop-blur-md text-white text-[11px] font-medium px-2 py-1 rounded-full shadow-[0_2px_10px_rgba(0,0,0,0.2)] border border-white/20 whitespace-nowrap">
                <img src={p.avatarUrl} alt="" className="w-4 h-4 rounded-full border border-white/30" />
                <span>{p.name}</span>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
