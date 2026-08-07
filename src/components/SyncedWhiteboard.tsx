"use client"

import React from 'react';
import { Tldraw } from 'tldraw';
import { useSyncDemo } from '@tldraw/sync';
import 'tldraw/tldraw.css';

interface SyncedWhiteboardProps {
  roomId: string;
}

export default function SyncedWhiteboard({ roomId }: SyncedWhiteboardProps) {
  const store = useSyncDemo({ roomId });
  
  return (
    <Tldraw store={store} />
  );
}
