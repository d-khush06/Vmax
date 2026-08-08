"use client"

import React, { useState, useEffect, useRef } from 'react';
import { Tldraw, createTLStore, defaultShapeUtils, getSnapshot, loadSnapshot } from 'tldraw';
import 'tldraw/tldraw.css';
import { useQuery, useMutation } from 'convex/react';
import { api } from '../../convex/_generated/api';
import { Id } from '../../convex/_generated/dataModel';

interface SyncedWhiteboardProps {
  teamId: Id<"teams">;
}

export default function SyncedWhiteboard({ teamId }: SyncedWhiteboardProps) {
  const [store] = useState(() => createTLStore({ shapeUtils: defaultShapeUtils }));
  const [isLoaded, setIsLoaded] = useState(false);
  
  const whiteboardData = useQuery(api.whiteboards.get, { teamId });
  const saveWhiteboard = useMutation(api.whiteboards.save);
  
  const lastSavedSnapshot = useRef<string>("");

  // Load initial data
  useEffect(() => {
    if (whiteboardData !== undefined && !isLoaded) {
      if (whiteboardData?.snapshot) {
        try {
          const snapshot = JSON.parse(whiteboardData.snapshot);
          loadSnapshot(store, snapshot);
          lastSavedSnapshot.current = whiteboardData.snapshot;
        } catch (e) {
          console.error("Failed to load whiteboard snapshot", e);
        }
      }
      setIsLoaded(true);
    }
  }, [whiteboardData, isLoaded, store]);

  // Sync remote changes from other users
  useEffect(() => {
    if (!isLoaded || !whiteboardData?.snapshot) return;
    
    // If the snapshot from Convex is different from what we last saved/loaded, it means someone else updated it!
    if (whiteboardData.snapshot !== lastSavedSnapshot.current) {
      try {
        const snapshot = JSON.parse(whiteboardData.snapshot);
        loadSnapshot(store, snapshot);
        lastSavedSnapshot.current = whiteboardData.snapshot;
      } catch (e) {
        console.error("Failed to sync remote whiteboard changes", e);
      }
    }
  }, [whiteboardData, isLoaded, store]);

  // Save changes automatically (debounced)
  useEffect(() => {
    if (!isLoaded) return;

    let timeout: NodeJS.Timeout;
    
    const cleanup = store.listen((entry) => {
      // Only save if there are actual document changes
      if (entry.changes.added || entry.changes.updated || entry.changes.removed) {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
          const snapshotString = JSON.stringify(getSnapshot(store));
          // Only save if it actually changed to prevent infinite loops
          if (snapshotString !== lastSavedSnapshot.current) {
            lastSavedSnapshot.current = snapshotString;
            saveWhiteboard({ teamId, snapshot: snapshotString }).catch(console.error);
          }
        }, 1000); // 1 second debounce
      }
    });

    return () => {
      cleanup();
      clearTimeout(timeout);
    };
  }, [isLoaded, store, teamId, saveWhiteboard]);

  if (!isLoaded) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 bg-[#0b120c]">
        <div className="animate-spin w-10 h-10 border-2 border-emerald-500/20 border-t-emerald-400 rounded-full shadow-[0_0_15px_rgba(52,211,153,0.2)]"></div>
        <p className="text-[13px] font-medium text-emerald-100/70 tracking-wider">LOADING CANVAS...</p>
      </div>
    );
  }

  return (
    <div className="w-full h-full" style={{ '--color-background': '#0b120c' } as any}>
      <Tldraw store={store} />
    </div>
  );
}
