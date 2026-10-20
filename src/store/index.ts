import { createSignal, batch } from 'solid-js';
import { createStore, unwrap } from 'solid-js/store';

// ==========================================
// 1. TYPES & INTERFACES
// ==========================================

export type EntityType = 'flash' | 'flicker' | 'stream';
export type FlickFlash = 'flash' | 'flicker';
export type RenderContext = 'ViewSpace' | 'FlickerView' | 'StreamView' | 'ReflectionHold';
export type FocusMode = 'Write' | 'Read' | 'Float';

export type Keymote = [
  charTyped: string,
  tTypedRel: number,
  cursorPosition: number
];

export interface Flash {
  id: number; 
  createDT: number; 
  textContents: string;
  tSpan: number; 
  delayTSpan: number; 
  log: Keymote[] | null;
}

export interface Flicker {
  id: number; // Negative integer
  createDT: number;
  contentIDs: number[]; // Array of positive Spurt IDs
  delayTSpan: number;
}

export interface Stream {
  id: number;
  title: string;
  createDT: number;
  contentIDs: number[]; // Positive for Spurts, Negative for Bursts
}

export interface MultEnt {
  entityType: EntityType;
  refID: number;
}

export interface ViewSpace {
  id: number;
  title: string;
  tentsInSpace: MultEnt[];
}

export interface SparkChain {
  id: number;
  title: string;
  sparkIDs: number[];
}

// ==========================================
// 2. GLOBAL SIGNALS (Transient State)
// ==========================================

export const [userMode, setUserMode] = createSignal<string> ('Write');
export const [flashDelayT, setFlashDelayT] = createSignal<number>(2);

export const [flickerModeOn, setFlickerModeOn] = createSignal<boolean>(true);
export const [flickerDelayT, setFlickerDelayT] = createSignal<number>(6); 
export const [isFlickerOpen, setIsFlickerOpen] = createSignal<boolean>(false);

export const [inflecTents, setInflecTents] = createSignal<Flash[] | null>(null);
export const [inflectionOn, setInflectionOn] = createSignal<boolean>(false);
export const [backspaceDisabled, setBackspaceDisabled] = createSignal<boolean>(false);

export const [typingStartTime, setTypingStartTime] = createSignal<number | null>(null);

export const [writerTargetID, setWriterTargetID] = createSignal<number | null>(null); 
export const [focusedStreamID, setFocusedStreamID] = createSignal<number>(0); 
export const [hoverEnt, setHoverEnt] = createSignal<MultEnt | null>(null);

export const [chainTargetID, setChainTargetID] = createSignal<number | null>(null); 
export const [focusedChainID, setFocusedChainID] = createSignal<number>(0); 

export const [focusedEntity, setFocusedEntity] = createSignal<MultEnt | null>(null);
export const [activeViewSpaceID, setActiveViewSpaceID] = createSignal<number>(1);

export const [showStats, setShowStats] = createSignal<MultEnt | null>(null);



// ==========================================
// 3. GLOBAL STORES (Persistent Databases)
// ==========================================


export const [allFlashes, setAllFlashes] = createStore<Flash[]>([]);
export const getFlash = (flashID: number) =>
  allFlashes.find(f => f.id === flashID) 
  || {id: 0, textContents: '', createDT: 0, delayTSpan: 1, tSpan: 1, log: null}; 
export const [allFlickers, setAllFlickers] = createStore<Flicker[]>([]);
export const getFlicker = (flickerID: number) => allFlickers.find(f => f.id === flickerID) 
|| {id: 0, contentIDs: [], createDT: 0, delayTSpan: 1};
export const [allStreams, setAllStreams] = createStore<Stream[]>([]);
export const getStream = (streamID: number) => allStreams.find(s => s.id === streamID);
export const [suspenBarTents, setSuspenBarTents] = createStore<MultEnt[]>([]);
export const [viewSpaces, setViewSpaces] = createStore<ViewSpace[]>([
  { id: 1, title: 'Initial Space', tentsInSpace: [] }
]);
export const [sparkChains, setSparkChains] = createStore<SparkChain[]>([]);
export const [openStreams, setOpenStreams] = createStore<number[]>([]);
export const [openChains, setOpenChains] = createStore<number[]>([]);
export const [openFloaters, setOpenFloaters] = createStore<MultEnt[]>([]);

// ==========================================
// 4. HELPER ACTIONS
// ==========================================

let nextFlashID = 1;
let nextStreamID = 1;
let nextFlickerID = -1;
let nextChainID = 1;
let nextViewSpaceID = 2;


export const addFlash = (flash: Flash) => {
  const newFlash: Flash = { ...flash, id: nextFlashID++ };

  if (!flickerModeOn()) {
    if (!inflectionOn()) {
      sendFlash(newFlash);
    } else {
      if (inflecTents()) outFlect();
      setInflecTents([newFlash]); 
    }
  } else {
    if (!isFlickerOpen()) {
      if (inflecTents()) outFlect();
      setIsFlickerOpen(true);
      setInflecTents([newFlash]);
    } else {
      setInflecTents(prev => prev ? [...prev, newFlash] : [newFlash]);
    }
  }
};

export const outFlect = () => {
  const current = inflecTents();
  
  if (!current || current.length === 0) return;

  if (current.length > 1) {
    const newFlicker: Flicker = {
      id: nextFlickerID--,
      createDT: current[0].createDT,
      contentIDs: current.map(f => f.id),
      delayTSpan: flickerDelayT()
    };
    
    setAllFlashes(prev => [...prev, ...current]);
    setAllFlickers(prev => [...prev, newFlicker]);
    sendFlickOrFlash('flicker', newFlicker.id);
  } 
  else {
    sendFlash(current[0]);
  }

  setInflecTents(null);
  setIsFlickerOpen(false);
};

const sendFlash = (flash: Flash) => {
  setAllFlashes(prev => [...prev, flash]);
  sendFlickOrFlash('flash', flash.id);
};

const sendFlickOrFlash = (entityType: 'flash' | 'flicker', entityId: number) => {
  const targetId = writerTargetID();
  
  if (targetId !== null) {
    setAllStreams(s => s.id === targetId, 'contentIDs', prev => [...prev, entityId]);
  } else {
    sendToViewSpace(entityType, entityId);
  }
};

export const makeStreamFrom = (ent: MultEnt) => {
  if( ent.entityType === 'flash' ){
    const flash = allFlashes.find(f => f.id === ent.refID);
    if (!flash) return;

    const finalFlash = { ...flash, id: nextFlashID++ };
    setAllFlashes(prev => [...prev, finalFlash ]);
    const newStreamID = nextStreamID++;

    const newStream: Stream = {
      id: newStreamID,
      title: `Stream ${newStreamID}`, 
      createDT: Date.now(),
      contentIDs: [finalFlash.id] // <-- The crucial link!
    };
    setAllStreams(prev => [...prev, newStream]);
    sendToViewSpace('stream', newStreamID);
  } else if( ent.entityType === 'flicker' ){

    const flicker = allFlickers.find(b => b.id === ent.refID);
    if (!flicker) return;
    const clonedFlashIDs: number[] = [];
    const clonedFlashes: Flash[] = [];

    flicker.contentIDs.forEach(flashID => {
      const originalFlash = allFlashes.find(f => f.id === flashID);
      if (originalFlash) {
        const newFlash = { ...originalFlash, id: nextFlashID++ };
        clonedFlashes.push(newFlash);
        clonedFlashIDs.push(newFlash.id);
      }
    });

    if (clonedFlashes.length > 0) {
      setAllFlashes(prev => [...prev, ...clonedFlashes]);
    }

    const newFlickerID = nextFlickerID--;
    const newFlicker: Flicker = {
      ...flicker,
      id: newFlickerID,
      contentIDs: clonedFlashIDs // <-- The crucial link for the Flicker!
    };
    
    setAllFlickers(prev => [...prev, newFlicker]);

    const newStreamID = nextStreamID++;
    const newStream: Stream = {
      id: newStreamID,
      title: `Stream ${newStreamID}`, 
      createDT: flicker.createDT,
      contentIDs: [newFlicker.id] // <-- The crucial link for the Stream!
    };

    setAllStreams(prev => [...prev, newStream]);
    sendToViewSpace('stream', newStreamID);
    }
    else if (ent.entityType === 'stream'){
      const stream = allStreams.find(s => s.id === ent.refID);
      if (!stream) return;
      const newStreamID = nextStreamID++;
      const newStream: Stream = {
        id: newStreamID,
        title: `Stream ${newStreamID}`, 
        createDT: Date.now(),
        contentIDs: []
      };
      const clonedFlashes: Flash[] = [];

      stream.contentIDs.forEach((i) => {
        if(i >= 0){
          const originalFlash = allFlashes.find(f => f.id === i);
          if (originalFlash) {
            const newFlash = { ...originalFlash, id: nextFlashID++ };
            clonedFlashes.push(newFlash);
            newStream.contentIDs.push(newFlash.id);
            setAllFlashes(prev => [...prev, newFlash]);
          }
        } else if(i < 0){
          const originalFlicker = allFlickers.find(b => b.id === i);
          if (originalFlicker) {
            const flickerFlashIDs: number[] = [];
            originalFlicker.contentIDs.forEach(flashID => {
              const originalFlash = allFlashes.find(f => f.id === flashID);
              if (originalFlash) {
                const newFlash = { ...originalFlash, id: nextFlashID++ };
                clonedFlashes.push(newFlash);
                flickerFlashIDs.push(newFlash.id);
              }
            })
            const newFlickerID = nextFlickerID--;
            const newFlicker = { 
              ...originalFlicker,
              id: newFlickerID,
              contentIDs: flickerFlashIDs 
            }
            newStream.contentIDs.push(newFlickerID);
            setAllFlickers(prev => [...prev, newFlicker]);
          }
        }
      })
      setAllFlashes(prev => [...prev, ...clonedFlashes]);
      setAllStreams(prev => [...prev, newStream]);
      sendToViewSpace('stream', newStreamID);
    };
};

export const sendToSuspenBar = (entityType: EntityType, refID: number) => {
  batch(() => {
    if (entityType === 'stream') {
      setViewSpaces(
        (vs) => vs.tentsInSpace && vs.tentsInSpace.length > 0,
        'tentsInSpace',
        (prev) => prev.filter((e) => !(e.entityType === 'stream' && e.refID === refID))
      );
      if (writerTargetID() === refID) setWriterTargetID(null);
      if (focusedStreamID() === refID) setFocusedStreamID(0);
    } else if (entityType === 'flicker') {
      setAllStreams(
        (stream) => stream.contentIDs.includes(refID),
        'contentIDs',
        (prevIds) => prevIds.filter((id) => id !== refID)
      );
      setViewSpaces(
        (vs) => vs.tentsInSpace && vs.tentsInSpace.length > 0,
        'tentsInSpace',
        (prev) => prev.filter((e) => !(e.entityType === 'flicker' && e.refID === refID))
      );
    } else if (entityType === 'flash') {
      setAllFlickers(
        (flicker) => flicker.contentIDs.includes(refID),
        'contentIDs',
        (prevIds) => prevIds.filter((id) => id !== refID)
      );
      setAllStreams(
        (stream) => stream.contentIDs.includes(refID),
        'contentIDs',
        (prevIds) => prevIds.filter((id) => id !== refID)
      );
      setViewSpaces(
        (vs) => vs.tentsInSpace && vs.tentsInSpace.length > 0,
        'tentsInSpace',
        (prev) => prev.filter((e) => !(e.entityType === 'flash' && e.refID === refID))
      );
    }

    setOpenFloaters((prev) =>
      prev.filter((e) => !(e.entityType === entityType && e.refID === refID))
    );

    if (
      focusedEntity()?.entityType === entityType &&
      focusedEntity()?.refID === refID
    ) {
      setFocusedEntity(null);
    }

    setSuspenBarTents((prev) =>
      prev.some((e) => e.entityType === entityType && e.refID === refID)
        ? prev
        : [...prev, { entityType, refID }]
    );
  });
};

export const sendToViewSpace = (entityType: EntityType, refID: number) => {
    const activeID = activeViewSpaceID();
    if (activeID !== null){
      setViewSpaces(vs => vs.id === activeID, 
                    'tentsInSpace', 
                         prev => [...prev, {
                         entityType,
                         refID
                     }]);
    }
};


export const deleteFlash = (flashID: number) => {
  if (!allFlashes.some(f=> f.id === flashID)) return 0;
  setAllFlashes(prev => prev.filter(flash => flash.id !== flashID));

  setAllFlickers(
    flicker => flicker.contentIDs.includes(flashID),
    'contentIDs',
    prevIds => prevIds.filter(id => id !== flashID)
  );
  setAllStreams(
    stream => stream.contentIDs.includes(flashID),
    'contentIDs',
    prevIds => prevIds.filter(id => id !== flashID)
  );
  setViewSpaces( vs => vs.tentsInSpace && vs.tentsInSpace.length > 0,
                'tentsInSpace',
                prev => prev.filter(e => !(e.entityType === 'flash' && e.refID === flashID)));

  setSuspenBarTents(prev => prev.filter(e => !(e.entityType === 'flash' && e.refID === flashID)));
  setSparkChains(
    chain => chain.sparkIDs.includes(flashID),
    'sparkIDs',
    prevIds => prevIds.filter(id => id !== flashID)
  );
  return 1;
};

export const deleteFlicker = (flickerID: number) => {
  const flicker = allFlickers.find(b => b.id === flickerID);
  if (!flicker) return 0;

  const flashesToDelete = [...flicker.contentIDs];
  flashesToDelete.forEach(flashID => deleteFlash(flashID));

  setAllStreams(
    stream => stream.contentIDs.includes(flickerID),
    'contentIDs',
    prevIds => prevIds.filter(id => id !== flickerID)
  );

  setViewSpaces(vs => vs.tentsInSpace && vs.tentsInSpace.length > 0, 
                 'tentsInSpace', 
                  prev => prev.filter(e => !(e.entityType === 'flicker' && e.refID === flickerID)));
  setSuspenBarTents(prev => prev.filter(e => !(e.entityType === 'flicker' && e.refID === flickerID)));
  setSparkChains(
    chain => chain.sparkIDs.includes(flickerID),
    'sparkIDs',
    prevIds => prevIds.filter(id => id !== flickerID)
  );

  setAllFlickers(prev => prev.filter(b => b.id !== flickerID));
  return 1;
};

export const deleteStream = (streamID: number) => {
  const stream = allStreams.find(s => s.id === streamID);
  if (!stream) return 0;
  const contentsToDelete = [...stream.contentIDs];
  contentsToDelete.forEach(id => {
    if (id > 0) {
      deleteFlash(id); // Positive IDs are Flashes
    } else {
      deleteFlicker(id);  // Negative IDs are Flickers
    }
  });

  setViewSpaces(vs => vs.tentsInSpace && vs.tentsInSpace.length > 0,
    'tentsInSpace',
    prev => prev.filter(e =>
      !(e.entityType === 'stream'
        && e.refID === streamID)));

  setSuspenBarTents(prev =>
    prev.filter(e =>
      !(e.entityType === 'stream'
        && e.refID === streamID)));

  if (writerTargetID() === streamID) {
    setWriterTargetID(null);
  }
  setAllStreams(prev => prev.filter(s => s.id !== streamID));
  return 1;
};

export const deleteChain = (chainID: number) => {
  const chain = sparkChains.find(c => c.id === chainID);
  if (!chain) return null;
  setSparkChains(prev => prev.filter(c => c.id !== chainID));
  setOpenChains(prev => prev.filter(id => id !== chainID));
  if (chainTargetID() === chainID) {
    setChainTargetID(null);
  }
  if (focusedChainID() === chainID) {
    setFocusedChainID(0);
  }
  return 1;
};

export const addToChain = (id: number, targetChainID?: number) => {
  const targetID = targetChainID ?? chainTargetID() ?? focusedChainID();
  if (!targetID) return;
  const targetChain = sparkChains.find(c => c.id === targetID);
  if (!targetChain) return;

  if (!targetChain.sparkIDs.includes(id)) {
    setSparkChains(
      (chain) => chain.id === targetID,
      'sparkIDs',
      (prev) => [...prev, id]
    );
  }
};

export const removeFromChain = (chainID: number, sparkID: number) => {
  setSparkChains(
    (chain) => chain.id === chainID,
    'sparkIDs',
    (prev) => prev.filter(id => id !== sparkID)
  );
};

export const getChainStats = (chainID: number) => {
  const chain = sparkChains.find(c => c.id === chainID);
  if (!chain) return { count: 0, lastEntry: 0 };
  let count = chain.sparkIDs.length;
  let lastEntry = 0;

  chain.sparkIDs.forEach(id => {
    if (id > 0) {
      const f = getFlash(id);
      if (f && f.createDT > lastEntry) lastEntry = f.createDT;
    } else {
      const b = getFlicker(id);
      if (b && b.createDT > lastEntry) lastEntry = b.createDT;
    }
  });

  return { count, lastEntry };
};

export const createNewChain = (name?:string) => {
  const chainName = name && name?.length > 0 ? name : `Chain ${nextChainID}`
  const newChain: SparkChain = {
    id: nextChainID++,
    title: chainName,
    sparkIDs: []
  };
  setSparkChains((prev)=> [...prev, newChain]);
  setFocusedChainID(newChain.id);
}

export const createNewStream = (name?:string) => {
  const streamName = name && name?.length > 0 ? name : `Stream ${nextStreamID}`
  const newStream: Stream = {
    id: nextStreamID++,
    title: streamName, // e.g., "Stream 2", "Stream 3"
    createDT: Date.now(),
    contentIDs: []
  };
  setAllStreams((prev) => [...prev, newStream]);
  const activeID = activeViewSpaceID();
  setViewSpaces(vs => vs.id === activeID, 
                 'tentsInSpace',
                   (prev) => [...prev, {
                             entityType: 'stream',
                             refID: newStream.id 
                             } as MultEnt
                   ]
                );
  setWriterTargetID(newStream.id); // Automatically switch to the new stream
  setOpenFloaters((prev) =>
    prev.some((e) => e.entityType === 'stream' && e.refID === newStream.id)
      ? prev
      : [...prev, { entityType: 'stream', refID: newStream.id }]
  );
};

export const createNewViewSpace = (name?: string) => {
  const vsName = name && name.trim().length > 0 ? name.trim() : `ViewSpace ${nextViewSpaceID}`;
  const newVS: ViewSpace = {
    id: nextViewSpaceID++,
    title: vsName,
    tentsInSpace: [],
  };
  setViewSpaces(prev => [...prev, newVS]);
  setActiveViewSpaceID(newVS.id);
};

export const updateChainTitle = (chainID: number, newTitle: string) => {
  if (newTitle.trim()) {
    setSparkChains(
      (chain) => chain.id === chainID,
      'title',
      newTitle.trim()
    );
  }
};
export const updateStreamTitle = (streamID: number, newTitle: string) => {
  if (newTitle.trim()) {
    setAllStreams(
      (stream) => stream.id === streamID,
      'title',
      newTitle.trim()
    );
  }
};

export const updateSpaceName = (spaceID: number, newName: string) => {
  if (newName.trim()) {
    setViewSpaces(
      (space) => space.id === spaceID,
      'title',
      newName.trim()
    );
  }
}

export const getEmacsDateString = (createDT: number) => {
      const d = new Date(createDT);
      const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      const day = days[d.getDay()];
      const pad = (n: number) => n.toString().padStart(2, '0');
      
      const dateStr = `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
      const timeStr = `${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`;

      return `@<${dateStr} ${day} ${timeStr}>`;
  };



export const streamFlashes = (streamID:number) => {
    const stream = allStreams.find((s)=>s.id === streamID);
    if (!stream) return [];
    const flashes: Flash[] = [];
    
    stream.contentIDs.forEach(id => {
      if (id > 0) {
        const fls = allFlashes.find(f => f.id === id);
        if (fls) flashes.push(fls);
      } else {
        const flk = allFlickers.find(f => f.id === id);
        if (flk) {
          flk.contentIDs.forEach(fid => {
            const f = allFlashes.find(f => f.id === fid);
            if (f) flashes.push(f);
          });
        }
      }
    });
    return flashes;
};

export const groupedFlashIDs = (streamID: number) => {
  if (!streamID && streamID !== 0) return [];
  const ids = allStreams.find((stream) => stream.id === streamID)?.contentIDs
  if (!ids) return [];
  const groups: Array<{ type: 'flashes' | 'flicker', flashIDs: number[], flickerID: number | null }> = [];
  let currentFlashGroup: number[] = [];
  ids.forEach(id => {
    if (id > 0) {
      currentFlashGroup.push(id);
    } else {
      if (currentFlashGroup.length > 0) {
        groups.push({ type: 'flashes', flashIDs: currentFlashGroup, flickerID: null });
        currentFlashGroup = [];
      }
      const flicker = allFlickers.find(f => f.id === id);
      groups.push({ type: 'flicker', flashIDs: flicker ? flicker.contentIDs : [], flickerID: flicker ? flicker.id : 0 });
    }
  });
  if (currentFlashGroup.length > 0) {
    groups.push({ type: 'flashes', flashIDs: currentFlashGroup, flickerID: null });
  }
  return groups;
}

export const streamWordCount = (streamID:number) => {
  return streamFlashes(streamID).reduce((total, f) => {
    return total + (f.textContents.trim().split(/\s+/).filter(w => w.length > 0).length);
  }, 0);
};

export const flickerWordCount = (flickerID:number) => {
  const flicker = allFlickers.find((f) => f.id === flickerID);
  return flicker?.contentIDs?.reduce((total, id) => {
    const f = allFlashes.find((flash) => flash.id === id);
    if (!f) return total;
    
    const wordCount = f.textContents.trim().split(/\s+/).filter(w => w.length > 0).length;
    return total + wordCount;
  }, 0);
};

export const flickerCharCount = (flickerID:number) => {
  const flicker = allFlickers.find((f) => f.id === flickerID);
  return flicker?.contentIDs?.reduce((total, id) => {
    const f = allFlashes.find((flash) => flash.id === id);
    if (!f) return total;
    
    const charCount = f.textContents.length;
    return total + charCount;
  }, 0);
};

export const textWordCount = (text:string | null) => text?.trim().split(/\s+/).filter(w => w.length > 0).length || 0;

export const getStreamTSpan = (streamID:number) => {
  const ms = streamFlashes(streamID).reduce((total, f) => total + f.tSpan, 0);
  const sec = ms / 1000;
  const hours = Math.floor(sec / 3600);
  const minutes = Math.floor(sec / 60) - hours;
  const seconds = Math.floor(sec % 60);
  let retStr = '';
  hours ? retStr+=hours.toString() + 'h:' : '';
  minutes ? retStr+=minutes.toString() + 'm:' :'';
  retStr.length ? retStr+=seconds.toString() + 's' : retStr+=Number((ms / 1000).toFixed(2)) + 's';
  return retStr;
};

export const getFlickerTSpan = (flickerID: number) => {
  const flicker = allFlickers.find((b) => b.id === flickerID);
  if (!flicker) return 0;
  if (!flicker.contentIDs) {
    deleteFlicker(flickerID);
    return 0;
  }
  const endT = allFlashes.find((f)=> 
                               f.id === flicker.contentIDs[flicker.contentIDs.length - 1])?.createDT || 0;
  if (!endT || !flicker.createDT) return 0;
  return (endT - flicker.createDT);
}


// ==========================================
// 5. LOCAL STORAGE (IndexedDB Snapshot)
// ==========================================

const DB_NAME = 'WritersBlockDB';
const DB_VERSION = 1;
const STORE_NAME = 'SaveStates';
const SAVE_KEY = 'manual_save';

// Helper: Initialize and return the DB instance
const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (e) => {
      const db = (e.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Helper: Write data to DB
const saveToDB = async (key: string, data: any): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.put(data, key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

// Helper: Read data from DB
const loadFromDB = async (key: string): Promise<any> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
};

// Action: Package the current app state and save it
export const manualSaveApp = async () => {
  const snapshot = {
    // Local module counters
    nextFlashID,
    nextStreamID,
    nextFlickerID,
    nextViewSpaceID,
    
    // Signals (executed to get current value)
    activeViewSpaceID: activeViewSpaceID(),
    flickerDelayT: flickerDelayT(),
    flickerModeOn: flickerModeOn(),
    flashDelayT: flashDelayT(),
    
    // Stores (unwrapped to remove proxies)
    allFlashes: unwrap(allFlashes),
    allStreams: unwrap(allStreams),
    allFlickers: unwrap(allFlickers),
    suspenBarTents: unwrap(suspenBarTents),
    viewSpaces: unwrap(viewSpaces),
    sparkChains: unwrap(sparkChains),
  };

  try {
    await saveToDB(SAVE_KEY, snapshot);
    console.log('App state successfully saved to IndexedDB!');
  } catch (err) {
    console.error('Failed to save app state:', err);
  }
};

// Action: Load the snapshot and hydrate the app
export const loadSavedApp = async () => {
  try {
    const data = await loadFromDB(SAVE_KEY);
    if (!data) {
      console.log('No saved state found. Starting fresh.');
      return;
    }

    batch(() => {
      // 1. Restore local module counters safely
      nextFlashID = data.nextFlashID || 1;
      nextStreamID = data.nextStreamID || 1;
      nextFlickerID = data.nextFlickerID || -1;
      nextViewSpaceID = data.nextViewSpaceID || 2;

      // 2. Restore stores safely (ensuring backwards compatibility for layoutMode)
      setAllFlashes(data.allFlashes || []);
      setAllStreams(data.allStreams || []);
      setAllFlickers(data.allFlickers || []);
      setSuspenBarTents(data.suspenBarTents || []);
      setSparkChains(data.sparkChains || []);
      
      const safeViewSpaces = (data.viewSpaces || []).map((vs: any) => ({
        ...vs,
        layoutMode: vs.layoutMode || 'spreadmixed'
      }));
      setViewSpaces(safeViewSpaces.length > 0 ? safeViewSpaces : [
        { id: 1, title: 'Initial Space', tentsInSpace: [], layoutMode: 'spreadmixed' }
      ]);
      

      // 3. Restore signals AFTER stores are prepped
      setActiveViewSpaceID(data.activeViewSpaceID !== undefined ? data.activeViewSpaceID : 1);
      setFlickerDelayT(data.FlickerDelayT !== undefined ? data.FlickerDelayT : 6);
      setFlickerModeOn(data.FlickerModeOn || true);
      setFlashDelayT(data.flashDelayT !== undefined ? data.flashDelayT : 2);
    });

    console.log('App state successfully loaded from IndexedDB!');
  } catch (err) {
    console.error('Failed to load app state:', err);
  }
};

// ==========================================
// 6. FILE SYSTEM EXPORT / IMPORT
// ==========================================

export const [fileErrorMessage, setFileErrorMessage] = createSignal<string | null>(null);

let fileErrorTimer: number | undefined;
export const triggerFileError = (msg: string) => {
  if (fileErrorTimer) clearTimeout(fileErrorTimer);
  setFileErrorMessage(msg);
  fileErrorTimer = window.setTimeout(() => {
    setFileErrorMessage(null);
  }, 3000);
};

export const saveJsonWithPicker = async (data: any, suggestedName: string) => {
  const jsonString = JSON.stringify(data, null, 2);

  // 1. Desktop Chromium: File System Access API
  if ('showSaveFilePicker' in window) {
    try {
      const handle = await (window as any).showSaveFilePicker({
        suggestedName,
        types: [
          {
            description: 'JSON Files',
            accept: { 'application/json': ['.json'] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(jsonString);
      await writable.close();
      return true;
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return false;
      }
      console.warn('showSaveFilePicker failed, trying fallback...', err);
    }
  }

  const blob = new Blob([jsonString], { type: 'application/json' });

  // 2. Mobile fallback: Web Share API (native share sheet: Save to Files / Drive / iCloud / AirDrop)
  if (typeof navigator !== 'undefined' && 'canShare' in navigator) {
    try {
      const file = new File([blob], suggestedName, { type: 'application/json' });
      if (navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: suggestedName,
        });
        return true;
      }
    } catch (err: any) {
      if (err.name === 'AbortError') {
        return false;
      }
      console.warn('Web Share API failed, falling back to Blob download...', err);
    }
  }

  // 3. Firefox / Safari / Universal fallback: Blob URL Download
  try {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = suggestedName;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  } catch (err: any) {
    triggerFileError(err?.message || 'Failed to save file.');
    return false;
  }
};

export const saveToFile = async (streamID?: number) => {
  if (typeof streamID === 'number') {
    return await saveStreamToFile(streamID);
  }
  return await saveSessionToFile();
};

export const saveSessionToFile = async () => {
  const snapshot = {
    nextFlashID,
    nextStreamID,
    nextFlickerID,
    nextViewSpaceID,
    nextChainID,

    activeViewSpaceID: activeViewSpaceID(),
    flickerDelayT: flickerDelayT(),
    flickerModeOn: flickerModeOn(),
    flashDelayT: flashDelayT(),

    allFlashes: unwrap(allFlashes),
    allStreams: unwrap(allStreams),
    allFlickers: unwrap(allFlickers),
    suspenBarTents: unwrap(suspenBarTents),
    viewSpaces: unwrap(viewSpaces),
    sparkChains: unwrap(sparkChains),
  };

  const payload = {
    type: 'wb-session',
    version: 1,
    exportDate: Date.now(),
    data: snapshot,
  };

  const dateStr = new Date().toISOString().slice(0, 10);
  return await saveJsonWithPicker(payload, `writers-block-session-${dateStr}.json`);
};

export const saveStreamToFile = async (streamID: number) => {
  const stream = getStream(streamID);
  if (!stream) {
    triggerFileError('Stream not found.');
    return;
  }

  const flashes = streamFlashes(streamID);
  const flickerIDs = stream.contentIDs.filter(id => id < 0);
  const flickers = flickerIDs
    .map(id => getFlicker(id))
    .filter(f => f && f.id !== 0);

  const payload = {
    type: 'wb-stream',
    version: 1,
    exportDate: Date.now(),
    stream: unwrap(stream),
    flashes: flashes.map(f => unwrap(f)),
    flickers: flickers.map(f => unwrap(f)),
  };

  const safeTitle = (stream.title || `stream-${streamID}`).replace(/[^a-zA-Z0-9_-]/g, '_');
  await saveJsonWithPicker(payload, `${safeTitle}.stream.json`);
};

export const saveSparkChainToFile = async (chainID: number) => {
  const chain = sparkChains.find(c => c.id === chainID);
  if (!chain) {
    triggerFileError('SparkChain not found.');
    return;
  }

  const flashIDs = new Set<number>();
  const flickers: Flicker[] = [];

  chain.sparkIDs.forEach(id => {
    if (id > 0) {
      flashIDs.add(id);
    } else {
      const b = getFlicker(id);
      if (b && b.id !== 0) {
        flickers.push(unwrap(b));
        b.contentIDs.forEach(fid => flashIDs.add(fid));
      }
    }
  });

  const flashes = Array.from(flashIDs)
    .map(fid => getFlash(fid))
    .filter(f => f && f.id !== 0)
    .map(f => unwrap(f));

  const payload = {
    type: 'wb-sparkchain',
    version: 1,
    exportDate: Date.now(),
    chain: unwrap(chain),
    flashes,
    flickers,
  };

  const safeTitle = (chain.title || `chain-${chainID}`).replace(/[^a-zA-Z0-9_-]/g, '_');
  await saveJsonWithPicker(payload, `${safeTitle}.chain.json`);
};

export const importLoadedJson = (json: any) => {
  if (!json || typeof json !== 'object') {
    triggerFileError('Invalid file format.');
    return;
  }

  // Case 1: Session
  if (json.type === 'wb-session' || (json.data && json.data.allStreams) || json.allStreams) {
    const data = json.data || json;
    batch(() => {
      nextFlashID = data.nextFlashID || nextFlashID;
      nextStreamID = data.nextStreamID || nextStreamID;
      nextFlickerID = data.nextFlickerID || nextFlickerID;
      nextViewSpaceID = data.nextViewSpaceID || nextViewSpaceID;
      nextChainID = data.nextChainID || nextChainID;

      setAllFlashes(data.allFlashes || []);
      setAllStreams(data.allStreams || []);
      setAllFlickers(data.allFlickers || []);
      setSuspenBarTents(data.suspenBarTents || []);
      setSparkChains(data.sparkChains || []);
      setViewSpaces(data.viewSpaces?.length ? data.viewSpaces : [
        { id: 1, title: 'Initial Space', tentsInSpace: [], layoutMode: 'spreadmixed' }
      ]);

      setActiveViewSpaceID(data.activeViewSpaceID ?? 1);
      setFlickerDelayT(data.flickerDelayT ?? 6);
      setFlickerModeOn(data.flickerModeOn ?? true);
      setFlashDelayT(data.flashDelayT ?? 2);
    });
    return;
  }

  // Case 2: Stream
  if (json.type === 'wb-stream' || (json.stream && json.flashes)) {
    const rawStream: Stream = json.stream;
    const rawFlashes: Flash[] = json.flashes || [];
    const rawFlickers: Flicker[] = json.flickers || [];

    const flashIdMap = new Map<number, number>();
    const clonedFlashes: Flash[] = rawFlashes.map(f => {
      const newId = nextFlashID++;
      flashIdMap.set(f.id, newId);
      return { ...f, id: newId };
    });

    const flickerIdMap = new Map<number, number>();
    const clonedFlickers: Flicker[] = rawFlickers.map(b => {
      const newFlickerId = nextFlickerID--;
      flickerIdMap.set(b.id, newFlickerId);
      const remappedContentIDs = b.contentIDs.map(fid => flashIdMap.get(fid) ?? fid);
      return { ...b, id: newFlickerId, contentIDs: remappedContentIDs };
    });

    const newStreamID = nextStreamID++;
    const remappedStreamContentIDs = rawStream.contentIDs.map(id => {
      if (id > 0) return flashIdMap.get(id) ?? id;
      return flickerIdMap.get(id) ?? id;
    });

    const newStream: Stream = {
      ...rawStream,
      id: newStreamID,
      contentIDs: remappedStreamContentIDs,
    };

    batch(() => {
      setAllFlashes(prev => [...prev, ...clonedFlashes]);
      setAllFlickers(prev => [...prev, ...clonedFlickers]);
      setAllStreams(prev => [...prev, newStream]);

      const activeID = activeViewSpaceID();
      if (activeID !== null) {
        setViewSpaces(vs => vs.id === activeID, 'tentsInSpace', prev => [
          ...prev,
          { entityType: 'stream' as const, refID: newStreamID },
        ]);
      }
      setWriterTargetID(newStreamID);
    });
    return;
  }

  // Case 3: SparkChain
  if (json.type === 'wb-sparkchain' || (json.chain && json.sparkIDs !== undefined) || (json.chain && json.flashes)) {
    const rawChain: SparkChain = json.chain || json;
    const rawFlashes: Flash[] = json.flashes || [];
    const rawFlickers: Flicker[] = json.flickers || [];

    const flashIdMap = new Map<number, number>();
    const clonedFlashes: Flash[] = rawFlashes.map(f => {
      const newId = nextFlashID++;
      flashIdMap.set(f.id, newId);
      return { ...f, id: newId };
    });

    const flickerIdMap = new Map<number, number>();
    const clonedFlickers: Flicker[] = rawFlickers.map(b => {
      const newFlickerId = nextFlickerID--;
      flickerIdMap.set(b.id, newFlickerId);
      const remappedContentIDs = b.contentIDs.map(fid => flashIdMap.get(fid) ?? fid);
      return { ...b, id: newFlickerId, contentIDs: remappedContentIDs };
    });

    const newChainID = nextChainID++;
    const remappedSparkIDs = (rawChain.sparkIDs || []).map(id => {
      if (id > 0) return flashIdMap.get(id) ?? id;
      return flickerIdMap.get(id) ?? id;
    });

    const newChain: SparkChain = {
      ...rawChain,
      id: newChainID,
      sparkIDs: remappedSparkIDs,
    };

    batch(() => {
      if (clonedFlashes.length > 0) setAllFlashes(prev => [...prev, ...clonedFlashes]);
      if (clonedFlickers.length > 0) setAllFlickers(prev => [...prev, ...clonedFlickers]);
      setSparkChains(prev => [...prev, newChain]);
      setOpenChains(prev => [...prev, newChainID]);
      setChainTargetID(newChainID);
    });
    return;
  }

  triggerFileError('Unrecognized file structure.');
};

export const loadFromFile = async () => {
  let fileText: string | null = null;

  if ('showOpenFilePicker' in window) {
    try {
      const [handle] = await (window as any).showOpenFilePicker({
        types: [
          {
            description: 'JSON Files',
            accept: { 'application/json': ['.json'] },
          },
        ],
        multiple: false,
      });
      const file = await handle.getFile();
      fileText = await file.text();
    } catch (err: any) {
      if (err.name === 'AbortError') return;
      console.warn('showOpenFilePicker failed, falling back to file input...', err);
    }
  }

  // Mobile & Cross-browser fallback: HTML5 file input
  if (!fileText) {
    fileText = await new Promise<string | null>((resolve) => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.style.display = 'none';
      document.body.appendChild(input);

      const cleanup = () => {
        if (document.body.contains(input)) {
          document.body.removeChild(input);
        }
      };

      input.onchange = async () => {
        const file = input.files?.[0];
        cleanup();
        if (file) {
          try {
            resolve(await file.text());
          } catch {
            resolve(null);
          }
        } else {
          resolve(null);
        }
      };

      input.oncancel = () => {
        cleanup();
        resolve(null);
      };

      input.click();
    });
  }

  if (!fileText) return;

  try {
    const json = JSON.parse(fileText);
    importLoadedJson(json);
  } catch (err: any) {
    triggerFileError('Invalid JSON file.');
  }
};

