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
      <div className="w-full h-full flex flex-col items-center justify-center text-teal-500 gap-4">
        <div className="animate-spin w-8 h-8 border-2 border-teal-500 border-t-transparent rounded-full"></div>
        <p className="text-sm font-medium">Loading Workspace Canvas...</p>
      </div>
    );
  }

  return (
    <Tldraw store={store} />
  );
}
