import { createSignal } from 'solid-js';
import { createStore } from 'solid-js/store';

// ==========================================
// 1. TYPES & INTERFACES
// ==========================================

export interface Spurt {
  id: number; // Positive integer
  createDT: number; // Storing as Unix timestamp (Date.now()) for easier sorting/math
  spurTents: string;
  tSpan: number; // in milliseconds
  delayTSpan: number; // in milliseconds
}

export interface Stream {
  id: number;
  title: string;
  createDT: number;
  readMode: 'TextReadMode' | 'BlindMode' | 'DotMode';
  contentIds: number[]; // Positive for Spurts, Negative for Bursts
}

// ==========================================
// 2. GLOBAL SIGNALS (Ephemeral UI State)
// ==========================================

// Settings
export const [tSpurtDelay, setTSpurtDelay] = createSignal<number>(2000); // Default 2 seconds
export const [delayTDelta, setDelayTDelta] = createSignal<number>(250);  // Default 0.25 seconds
export const [spurtgatoryEnabled, setSpurtgatoryEnabled] = createSignal<boolean>(true);
//webworker
export const [isWritersBlockEmpty, setIsWritersBlockEmpty] = createSignal<boolean>(true);
export const [typingStartTime, setTypingStartTime] = createSignal<number | null>(null);
// Active Routing / Holders
export const [currentTargetStreamId, setCurrentTargetStreamId] = createSignal<number | null>(null); // null = LooseLake
export const [currentSpurtgatoryHolder, setCurrentSpurtgatoryHolder] = createSignal<Spurt | null>(null);

// ==========================================
// 3. GLOBAL STORES (Persistent Databases)
// ==========================================

// Using createStore for arrays/objects allows Solid to track deep mutations efficiently
export const [allSpurtsDB, setAllSpurtsDB] = createStore<Spurt[]>([]);
export const [allStreamsDB, setAllStreamsDB] = createStore<Stream[]>([]);

// ==========================================
// 4. HELPER ACTIONS
// ==========================================

// Action to clear Spurtgatory (tied to the button you requested)
export const clearSpurtgatory = () => {
  setCurrentSpurtgatoryHolder(null);
};

export const pushSpurtToTarget = (spurt: Spurt) => {
  // 1. Save to the main database
  setAllSpurtsDB((prev) => [...prev, spurt]);
  
  // 2. Link it to the active stream
  const targetId = currentTargetStreamId();
  if (targetId !== null) {
    setAllStreamsDB(
      (stream) => stream.id === targetId,
      'contentIds',
      (prevIds) => [...prevIds, spurt.id]
    );
  } else {
    // LooseLake routing will go here later
    console.log("Sent to LooseLake (Pending implementation)");
  }
};

export const processNewSpurt = (newSpurt: Spurt) => {
  if (spurtgatoryEnabled()) {
    const existingSpurt = currentSpurtgatoryHolder();
    // If Spurtgatory is full, push the old one out to the Stream first
    if (existingSpurt) {
      pushSpurtToTarget(existingSpurt);
    }
    // Set the new one in Spurtgatory
    setCurrentSpurtgatoryHolder(newSpurt);
  } else {
    // If disabled, bypass Spurtgatory entirely
    pushSpurtToTarget(newSpurt);
  }
};

export const flushSpurtgatoryToStream = () => {
  const existingSpurt = currentSpurtgatoryHolder();
  if (existingSpurt) {
    pushSpurtToTarget(existingSpurt);
    setCurrentSpurtgatoryHolder(null);
  }
};
