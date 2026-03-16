import { createSignal } from 'solid-js';
import { createStore } from 'solid-js/store';
import { type Particle } from '../workers/animWorker';

// ==========================================
// 1. TYPES & INTERFACES
// ==========================================

export type EntityType = 'spurt' | 'burst' | 'stream';

export interface Spurt {
  id: number; // Positive integer
  createDT: number; // Storing as Unix timestamp (Date.now()) for easier sorting/math
  spurTents: string;
  tSpan: number; // in milliseconds
  delayTSpan: number; // in milliseconds
}

export interface Burst {
  id: number; // Negative integer
  createDT: number;
  contentIds: number[]; // Array of positive Spurt IDs
}

export interface Stream {
  id: number;
  title: string;
  createDT: number;
  readMode: 'TextReadMode' | 'BlindMode' | 'DotMode';
  contentIds: number[]; // Positive for Spurts, Negative for Bursts
}

export interface LakeItem {
  lakeId: number;     // Unique ID for the lake entry itself
  entityType: EntityType;
  refId: number;      // The ID of the actual object in its respective DB
  droppedDT: number;  // Timestamp of when it was added to the lake
}

// ==========================================
// 2. GLOBAL SIGNALS (Ephemeral UI State)
// ==========================================

// Settings
export const [tSpurtDelay, setTSpurtDelay] = createSignal<number>(2); // Default 2 seconds
export const [delayTDelta, setDelayTDelta] = createSignal<number>(0.25);  // Default 0.25 seconds

export const [burstModeEnabled, setBurstModeEnabled] = createSignal<boolean>(false);
export const [tBurstDelay, setTBurstDelay] = createSignal<number>(5); // Default 5 seconds

export const [currentSpurtgatoryHolder, setCurrentSpurtgatoryHolder] = createSignal<Spurt | Burst | null>(null);
export const [spurtgatoryEnabled, setSpurtgatoryEnabled] = createSignal<boolean>(false);
export const [backspaceDisabled, setBackspaceDisabled] = createSignal<boolean>(false);
//
//webworker
export const [isWritersBlockEmpty, setIsWritersBlockEmpty] = createSignal<boolean>(true);
export const [typingStartTime, setTypingStartTime] = createSignal<number | null>(null);
// Active Routing / Holders
export const [currentViewedStreamId, setCurrentViewedStreamId] = createSignal<number | null>(null);
export const [currentTargetStreamId, setCurrentTargetStreamId] = createSignal<number | null>(null); 

export const [activeParticles, setActiveParticles] = createSignal<Particle[]>([]);

export const animWorker = new Worker(new URL('../workers/animWorker.ts', import.meta.url), { type: 'module' });

animWorker.onmessage = (e) => {
  if (e.data.type === 'tick') {
    // SolidJS will batch these updates and efficiently update the SVG
    setActiveParticles(e.data.particles);
  }
};

// ==========================================
// 3. GLOBAL STORES (Persistent Databases)
// ==========================================

// Using createStore for arrays/objects allows Solid to track deep mutations efficiently
export const [allSpurtsDB, setAllSpurtsDB] = createStore<Spurt[]>([]);
export const [allStreamsDB, setAllStreamsDB] = createStore<Stream[]>([]);
export const [allBurstsDB, setAllBurstsDB] = createStore<Burst[]>([]);
export const [looseLakeDB, setLooseLakeDB] = createSignal<LakeItem[]>([]);


// ==========================================
// 4. HELPER ACTIONS
// ==========================================

let nextSpurtId = 1;
let nextStreamId = 2; // Starting at 2 because App.tsx creates Stream 1 on mount
let nextBurstId = -1;
let nextLakeId = 1;

export const sendToLooseLake = (entityType: EntityType, refId: number) => {
  setLooseLakeDB(prev => [...prev, {
    lakeId: nextLakeId++,
    entityType,
    refId,
    droppedDT: Date.now()
  }]);
};

// Action to clear Spurtgatory (tied to the button you requested)
export const clearSpurtgatory = () => {
  setCurrentSpurtgatoryHolder(null);
};

export const flushSpurtgatoryToStream = () => {
  const holder = currentSpurtgatoryHolder();
  if (!holder) return;

  const targetId = currentTargetStreamId();
  
  // 1. Check if we need to unwrap a 1-spurt Burst
  const isSingleSpurtBurst = 'contentIds' in holder && holder.contentIds.length === 1;
  const finalId = isSingleSpurtBurst ? holder.contentIds[0] : holder.id;

  if (spurtgatoryEnabled()) {
    // If Spurtgatory was ON, it was hiding. Push it to the stream now.
    if (targetId !== null) {
      setAllStreamsDB(s => s.id === targetId, 'contentIds', prev => [...prev, finalId]);
    } else {
      sendToLooseLake(isSingleSpurtBurst ? 'spurt' : 'burst', finalId); 
    }
  } else {
    // If Spurtgatory was OFF, it's ALREADY in the stream or lake! 
    // We just need to swap the ID to unwrap it ONLY if it was a single spurt.
    if (isSingleSpurtBurst) {
      if (targetId !== null) {
        // Unwrap in the Stream
        setAllStreamsDB(s => s.id === targetId, 'contentIds', prev => 
          prev.map(id => id === holder.id ? finalId : id)
        );
      } else {
        // Unwrap in LooseLake
        setLooseLakeDB(prev => prev.map(item => 
          (item.entityType === 'burst' && item.refId === holder.id)
            ? { ...item, entityType: 'spurt', refId: finalId }
            : item
        ));
      }
    }
    // If it's NOT a single spurt burst, we do nothing! It's already happily resting in the Lake.
  }

  // Garbage collection: Remove the useless Burst wrapper from the database
  if (isSingleSpurtBurst) {
    setAllBurstsDB(prev => prev.filter(b => b.id !== holder.id));
  }

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
    sendToLooseLake('spurt', finalSpurt.id);
  }
};

export const processNewSpurt = (spurt: Spurt) => {
  const finalSpurt = { ...spurt, id: nextSpurtId++ };
  setAllSpurtsDB(prev => [...prev, finalSpurt]);

  const holder = currentSpurtgatoryHolder();
  const targetId = currentTargetStreamId();

  // 1. Burst Mode takes absolute priority
  if (burstModeEnabled()) {
    if (holder && 'contentIds' in holder) {
      // Append to active Burst (Stream will react automatically if it's already there)
      setAllBurstsDB(b => b.id === holder.id, 'contentIds', prev => [...prev, finalSpurt.id]);
      setCurrentSpurtgatoryHolder(allBurstsDB.find(b => b.id === holder.id)!);
    } else {
      // Start a new Burst
      if (holder) flushSpurtgatoryToStream(); 
      
      const newBurst: Burst = { id: nextBurstId--, createDT: Date.now(), contentIds: [finalSpurt.id] };
      setAllBurstsDB(prev => [...prev, newBurst]);
      setCurrentSpurtgatoryHolder(newBurst);

      // If Spurtgatory is OFF, push the Burst ID to the stream IMMEDIATELY
      if (!spurtgatoryEnabled() && targetId !== null) {
        setAllStreamsDB(s => s.id === targetId, 'contentIds', prev => [...prev, newBurst.id]);
      }
      else if (!spurtgatoryEnabled() && targetId === null){
        sendToLooseLake('burst', newBurst.id);
      }
    }
  } 
  // 2. Standard Spurtgatory
  else if (spurtgatoryEnabled()) {
    if (holder) flushSpurtgatoryToStream();
    setCurrentSpurtgatoryHolder(finalSpurt);
  } 
  // 3. No Bursts, No Spurtgatory -> Straight to Stream
  else {
    if (holder) flushSpurtgatoryToStream();
    if (targetId !== null) {
      setAllStreamsDB(stream => stream.id === targetId, 'contentIds', prev => [...prev, finalSpurt.id]);
    }
    else {
      sendToLooseLake('spurt', finalSpurt.id);
    }
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
