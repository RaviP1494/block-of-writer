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
export const [tSpurtDelay, setTSpurtDelay] = createSignal<number>(1); // Default 2 seconds
export const [delayTDelta, setDelayTDelta] = createSignal<number>(0.25);  // Default 0.25 seconds
export const [spurtgatoryEnabled, setSpurtgatoryEnabled] = createSignal<boolean>(true);
//webworker
export const [isWritersBlockEmpty, setIsWritersBlockEmpty] = createSignal<boolean>(true);
export const [typingStartTime, setTypingStartTime] = createSignal<number | null>(null);
// Active Routing / Holders
export const [currentViewedStreamId, setCurrentViewedStreamId] = createSignal<number | null>(null);
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

let nextSpurtId = 1;
let nextStreamId = 2; // Starting at 2 because App.tsx creates Stream 1 on mount

// Action to clear Spurtgatory (tied to the button you requested)
export const clearSpurtgatory = () => {
  setCurrentSpurtgatoryHolder(null);
};

// Add these counters outside your functions to persist during the session
// In a future stage with local storage, we will calculate these by finding the max ID in the DBs

export const pushSpurtToTarget = (spurt: Spurt) => {
  // Assign the permanent, incremental ID right before it hits the database
  const finalSpurt = { ...spurt, id: nextSpurtId++ };

  // 1. Save to the main database
  setAllSpurtsDB((prev) => [...prev, finalSpurt]);
  
  // 2. Link it to the active stream
  const targetId = currentTargetStreamId();
  if (targetId !== null) {
    setAllStreamsDB(
      (stream) => stream.id === targetId,
      'contentIds',
      (prevIds) => [...prevIds, finalSpurt.id]
    );
  } else {
    // LooseLake routing
    console.log("Sent to LooseLake with ID:", finalSpurt.id);
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

export const deleteSpurt = (spurtId: number) => {
  // 1. Remove from the main Spurt database
  setAllSpurtsDB(prev => prev.filter(spurt => spurt.id !== spurtId));
  
  // 2. Efficiently remove the ID from the contentIds array of whichever stream holds it
  setAllStreamsDB(
    stream => stream.contentIds.includes(spurtId),
    'contentIds',
    prevIds => prevIds.filter(id => id !== spurtId)
  );
};

export const flushSpurtgatoryToStream = () => {
  const existingSpurt = currentSpurtgatoryHolder();
  if (existingSpurt) {
    pushSpurtToTarget(existingSpurt);
    setCurrentSpurtgatoryHolder(null);
  }
};

export const createNewStream = () => {
  const newStream: Stream = {
    id: nextStreamId++,
    title: `Stream ${nextStreamId - 1}`, // e.g., "Stream 2", "Stream 3"
    createDT: Date.now(),
    readMode: 'TextReadMode',
    contentIds: []
  };
  
  setAllStreamsDB((prev) => [...prev, newStream]);
  setCurrentTargetStreamId(newStream.id); // Automatically switch to the new stream
  setCurrentViewedStreamId(newStream.id); // Automatically switch to the new stream
};

export const updateStreamTitle = (streamId: number, newTitle: string) => {
  // If the user submits an empty string, we can optionally prevent it or provide a default.
  // Here we just accept valid strings.
  if (newTitle.trim()) {
    setAllStreamsDB(
      (stream) => stream.id === streamId,
      'title',
      newTitle.trim()
    );
  }
};
