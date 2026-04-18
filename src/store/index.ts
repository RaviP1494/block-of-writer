import { createSignal, batch } from 'solid-js';
import { createStore, unwrap } from 'solid-js/store';

// ==========================================
// 1. TYPES & INTERFACES
// ==========================================

export type EntityType = 'flash' | 'flicker' | 'stream';
export type RenderContext = 'ViewSpace' | 'FlickerView' | 'StreamView' | 'ReflectionHold';
export type FocusMode = 'Write' | 'Read' | 'Float';

export interface Flash {
  id: number; 
  createDT: number; 
  textContents: string;
  tSpan: number; 
  delayTSpan: number; 
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
  name: string;
  tentsInSpace: MultEnt[];
}

// ==========================================
// 2. GLOBAL SIGNALS (Transient State)
// ==========================================

export const [userMode, setUserMode] = createSignal<string> ('ReadWrite');
export const [flashDelayT, setFlashDelayT] = createSignal<number>(2);

export const [flickerModeOn, setFlickerModeOn] = createSignal<boolean>(true);
export const [flickerDelayT, setFlickerDelayT] = createSignal<number>(6); 
export const [isFlickerOpen, setIsFlickerOpen] = createSignal<boolean>(false);

export const [inflecTents, setInflecTents] = createSignal<Flash | Flicker | null>(null);
export const [inflectionOn, setInflectionOn] = createSignal<boolean>(false);
export const [backspaceDisabled, setBackspaceDisabled] = createSignal<boolean>(false);

//webworker
export const [isWritersBlockEmpty, setIsWritersBlockEmpty] = createSignal<boolean>(true);
export const [typingStartTime, setTypingStartTime] = createSignal<number | null>(null);

export const [writerTargetID, setWriterTargetID] = createSignal<number | null>(null); 
export const [focusedStreamID, setFocusedStreamID] = createSignal<number>(0); 
export const [activeViewSpaceID, setActiveViewSpaceID] = createSignal<number | null>(1);




// ==========================================
// 3. GLOBAL STORES (Persistent Databases)
// ==========================================


export const [allFlashes, setAllFlashes] = createStore<Flash[]>([]);
export const [allStreams, setAllStreams] = createStore<Stream[]>([]);
export const [allFlickers, setAllFlickers] = createStore<Flicker[]>([]);
export const [suspenBarTents, setSuspenBarTents] = createStore<MultEnt[]>([]);
export const [viewSpaces, setViewSpaces] = createStore<ViewSpace[]>([
  { id: 1, name: 'Space', tentsInSpace: [] }
]);

// ==========================================
// 4. HELPER ACTIONS
// ==========================================

let nextFlashID = 1;
let nextStreamID = 1;
let nextFlickerID = -1;
let nextViewSpaceID = 1;


export const sendFlash = (flash: Flash) => {
  const finalFlash = { ...flash, id: nextFlashID++ };
  setAllFlashes(prev => [...prev, finalFlash]);

  const holder = inflecTents();
  const targetId = writerTargetID();

  if (flickerModeOn()) {
    if (isFlickerOpen() && holder && 'contentIDs' in holder) {
      setAllFlickers(b => b.id === holder.id, 'contentIDs', prev => [...prev, finalFlash.id]);
      setInflecTents(allFlickers.find(b => b.id === holder.id)!);
    } else {
      if (holder) flickFlash(); 
      
      const newFlicker: Flicker = { id: nextFlickerID--, delayTSpan: flickerDelayT(), createDT: Date.now(), contentIDs: [finalFlash.id] };
      setAllFlickers(prev => [...prev, newFlicker]);
      setInflecTents(newFlicker);
      setIsFlickerOpen(true);

      if (!inflectionOn() && targetId !== null) {
        setAllStreams(s => s.id === targetId, 'contentIDs', prev => [...prev, newFlicker.id]);
      }
      else if (!inflectionOn() && targetId === null){
        sendToViewSpace('flicker', newFlicker.id);
      }
    }
  } 
  else if (inflectionOn()) {
    if (holder) flickFlash();
    setInflecTents(finalFlash);
  } 
  else {
    if (holder) flickFlash();
    if (targetId !== null) {
      setAllStreams(stream => stream.id === targetId, 'contentIDs', prev => [...prev, finalFlash.id]);
    }
    else {
      sendToViewSpace('flash', finalFlash.id);
    }
  }
};

export const flickFlash = () => {
  const holder = inflecTents();
  if (!holder) return;

  const targetID = writerTargetID();
  
  const isFlash = !('contentIDs' in holder);
  const isSingleFlashFlicker = !isFlash && holder.contentIDs.length === 1;
  const finalID = isSingleFlashFlicker ? holder.contentIDs[0] : holder.id;

  if (inflectionOn()) {
    if (targetID !== null) {
      setAllStreams(s => s.id === targetID, 'contentIDs', prev => [...prev, finalID]);
    } else{
      sendToViewSpace(isFlash || isSingleFlashFlicker ? 'flash' : 'flicker', finalID); 
    }
  } else {
    if (isSingleFlashFlicker) {
      if (targetID !== null) {
        setAllStreams(s => s.id === targetID, 'contentIDs', prev => 
          prev.map(id => id === holder.id ? finalID : id)
        );
      } else {
        setViewSpaces(vs => vs.id === activeViewSpaceID()! , 'tentsInSpace', prev => prev.map(item => 
          (item.entityType === 'flicker' && item.refID === holder.id)
            ? { ...item, entityType: 'flash', refId: finalID }
            : item
        ));
        sendToViewSpace('flash',finalID);
        setIsFlickerOpen(false);
      }
    }
  }
  if (isSingleFlashFlicker) {
    setAllFlickers(prev => prev.filter(b => b.id !== holder.id));
  }

  setInflecTents(null);
};

export const makeStreamFrom = (entityType: EntityType, refID: number) => {
  if( entityType === 'flash' ){
    const flash = allFlashes.find(f => f.id === refID);
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
  } else if( entityType === 'flicker' ){

    const flicker = allFlickers.find(b => b.id === refID);
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
    else if (entityType === 'stream'){
      const stream = allStreams.find(s => s.id === refID);
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
  setSuspenBarTents(prev => [...prev, {
    entityType,
    refID,
  }]);
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
};

export const deleteFlicker = (flickerID: number) => {
  const flicker = allFlickers.find(b => b.id === flickerID);
  if (!flicker) return;

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

  setAllFlickers(prev => prev.filter(b => b.id !== flickerID));
};

export const deleteStream = (streamID: number) => {
  const stream = allStreams.find(s => s.id === streamID);
  if (!stream) return;
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
                prev => prev.filter(e => !(e.entityType === 'stream' && e.refID === streamID)));
  setSuspenBarTents(prev => prev.filter(e => !(e.entityType === 'stream' && e.refID === streamID)));

  if (writerTargetID() === streamID) {
    setWriterTargetID(null);
  }
  setAllStreams(prev => prev.filter(s => s.id !== streamID));
};


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
      'name',
      newName.trim()
    );
  }
}

export const getDateString = (createDT: number) => {
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
  const groups: Array<{ type: 'flashes' | 'flicker', flashIDs: number[] }> = [];
  let currentFlashGroup: number[] = [];
  ids.forEach(id => {
    if (id > 0) {
      currentFlashGroup.push(id);
    } else {
      if (currentFlashGroup.length > 0) {
        groups.push({ type: 'flashes', flashIDs: currentFlashGroup });
        currentFlashGroup = [];
      }
      const flicker = allFlickers.find(f => f.id === id);
      groups.push({ type: 'flicker', flashIDs: flicker ? flicker.contentIDs : [] });
    }
  });
  if (currentFlashGroup.length > 0) {
    groups.push({ type: 'flashes', flashIDs: currentFlashGroup });
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

export const getStreamTSpan = (streamID:number) => {
  const ms = streamFlashes(streamID).reduce((total, f) => total + f.tSpan, 0);
  return Number((ms / 1000).toFixed(2));
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
  return (endT - flicker.createDT) / 1000;
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
      
      const safeViewSpaces = (data.viewSpaces || []).map((vs: any) => ({
        ...vs,
        layoutMode: vs.layoutMode || 'spreadmixed'
      }));
      setViewSpaces(safeViewSpaces.length > 0 ? safeViewSpaces : [
        { id: 1, name: 'Initial Space', tentsInSpace: [], layoutMode: 'spreadmixed' }
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

