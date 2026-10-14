import { createEffect, createMemo, createSignal, onCleanup, onMount, For, Show, type Component } from 'solid-js';
import { 
  activeViewSpaceID, 
  getEmacsDateString, 
  getFlash, 
  getFlicker, 
  getStream, 
  streamFlashes, 
  viewSpaces, 
  focusedEntity, 
  setFocusedEntity, 
  type MultEnt 
} from '../store';

type DisplayMode = 'bar' | 'grid';

const formatTimeAMPM = (dt: number) => {
  if (!dt) return '@--:--';
  const d = new Date(dt);
  let hours = d.getHours();
  const minutes = d.getMinutes().toString().padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `@${hours}:${minutes} ${ampm}`;
};

const getEntityLabel = (ent: MultEnt) => {
  if (ent.entityType === 'stream') {
    const s = getStream(ent.refID);
    return s?.title || `Stream ${ent.refID}`;
  } else if (ent.entityType === 'flash') {
    const f = getFlash(ent.refID);
    return `flash ${formatTimeAMPM(f.createDT)}`;
  } else if (ent.entityType === 'flicker') {
    const b = getFlicker(ent.refID);
    return `flicker ${formatTimeAMPM(b.createDT)}`;
  }
  return `${ent.entityType} ${ent.refID}`;
};

const getEntityStats = (ent: MultEnt) => {
  if (ent.entityType === 'stream') {
    const s = getStream(ent.refID);
    const flashes = streamFlashes(ent.refID);
    let lastEntry = s?.createDT || 0;
    flashes.forEach(f => {
      if (f.createDT > lastEntry) lastEntry = f.createDT;
    });
    return {
      title: s?.title || `Stream ${ent.refID}`,
      countText: `${flashes.length} Flashes`,
      timeStr: lastEntry ? getEmacsDateString(lastEntry) : 'No Entries',
    };
  } else if (ent.entityType === 'flash') {
    const f = getFlash(ent.refID);
    return {
      title: `flash ${formatTimeAMPM(f.createDT)}`,
      countText: 'Flash',
      timeStr: f.createDT ? getEmacsDateString(f.createDT) : 'No Entries',
    };
  } else if (ent.entityType === 'flicker') {
    const b = getFlicker(ent.refID);
    const count = b.contentIDs?.length || 0;
    let lastEntry = b.createDT || 0;
    if (b.contentIDs && b.contentIDs.length > 0) {
      const lastF = getFlash(b.contentIDs[b.contentIDs.length - 1]);
      if (lastF && lastF.createDT > lastEntry) lastEntry = lastF.createDT;
    }
    return {
      title: `flicker ${formatTimeAMPM(b.createDT)}`,
      countText: `${count} Flashes`,
      timeStr: lastEntry ? getEmacsDateString(lastEntry) : 'No Entries',
    };
  }
  return {
    title: `${ent.entityType} ${ent.refID}`,
    countText: '',
    timeStr: 'No Entries'
  };
};

const ReadSummaryCell: Component<{
  ent: MultEnt;
  isFocused: boolean;
  onSelect: () => void;
}> = (props) => {
  const stats = () => getEntityStats(props.ent);

  return (
    <button 
      class="vs-summary-cell"
      classList={{ 'targeted-stream': props.isFocused }}
      onClick={props.onSelect}
    >
      <div class="vs-cell-title">{stats().title}</div>
      <div class="vs-cell-stats">{stats().countText}</div>
      <div class="vs-cell-date">{stats().timeStr}</div>
    </button>
  );
};

const ReadGridSelect: Component<{
  items: MultEnt[];
  focused: () => MultEnt | null;
  onSelect: (ent: MultEnt) => void;
}> = (props) => {
  return (
    <div class="vs-grid-select">
      <For each={props.items}>
        {(ent) => (
          <ReadSummaryCell 
            ent={ent} 
            isFocused={props.focused()?.entityType === ent.entityType && props.focused()?.refID === ent.refID}
            onSelect={() => props.onSelect(ent)} 
          />
        )}
      </For>
    </div>
  );
};

const ReadBarSelect: Component<{
  items: MultEnt[];
  focused: () => MultEnt | null;
  onOpenGrid: () => void;
  onSelect: (ent: MultEnt) => void;
}> = (props) => {
  let scrollRef: HTMLDivElement | undefined;

  const scrollLeft = () => {
    scrollRef?.scrollBy({ left: -150, behavior: 'smooth' });
  };

  const scrollRight = () => {
    scrollRef?.scrollBy({ left: 150, behavior: 'smooth' });
  };

  onMount(() => {
    if (scrollRef) {
      const handleWheel = (e: WheelEvent) => {
        if (e.deltaY !== 0) {
          e.preventDefault();
          scrollRef!.scrollBy({ left: e.deltaY, behavior: 'smooth' });
        }
      };
      scrollRef.addEventListener('wheel', handleWheel, { passive: false });
      onCleanup(() => {
        scrollRef?.removeEventListener('wheel', handleWheel);
      });
    }

    setTimeout(() => {
      const cur = props.focused();
      if (cur) {
        const btn = document.getElementById(`read-ent-${cur.entityType}-${cur.refID}`);
        btn?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }, 50);
  });

  return (
    <div class="vs-bar-select">
      <button class="vs-btn-icon" onClick={props.onOpenGrid} title="Open Grid">🗖</button>
      <button class="vs-btn-icon" onClick={scrollLeft} title="Scroll Left">&lt;</button>
      <div class="vs-bar-scroll" ref={scrollRef} style={{ 'scroll-behavior': 'smooth' }}>
        <For each={props.items}>
          {(ent) => {
            const isCur = () => props.focused()?.entityType === ent.entityType && props.focused()?.refID === ent.refID;
            return (
              <button 
                id={`read-ent-${ent.entityType}-${ent.refID}`}
                class="vs-bar-title"
                classList={{ 'targeted-stream': isCur() }}
                onClick={() => props.onSelect(ent)}
              >
                {getEntityLabel(ent)}
              </button>
            );
          }}
        </For>
      </div>
      <button class="vs-btn-icon" onClick={scrollRight} title="Scroll Right">&gt;</button>
      <button 
        class="vs-btn-icon"
        title="More options"
        style={{ cursor: 'default' }}
      >...</button>
    </div>
  );
};

export interface VSReadPickerProps {
  id?: number | null;
}

export const VSReadPicker: Component<VSReadPickerProps> = (props) => {
  const [displayMode, setDisplayMode] = createSignal<DisplayMode>('bar');
  let containerRef: HTMLDivElement | undefined;

  const currentVSID = () => (props.id !== undefined && props.id !== null) ? props.id : activeViewSpaceID();
  const currentVS = () => viewSpaces.find(vs => vs.id === currentVSID());
  const items = createMemo(() => currentVS()?.tentsInSpace || []);

  const handleSelect = (ent: MultEnt) => {
    setFocusedEntity(ent);
  };

  onMount(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (displayMode() === 'bar') return;
      if (containerRef && !containerRef.contains(e.target as Node) && !e.composedPath().includes(containerRef)) {
        setDisplayMode('bar');
      }
    };

    document.addEventListener('click', handleClickOutside);
    onCleanup(() => {
      document.removeEventListener('click', handleClickOutside);
    });
  });

  return (
    <div 
      ref={containerRef}
      class="vs-lister-container read-picker-container"
    >
      <Show when={displayMode() === 'bar'}>
        <ReadBarSelect 
          items={items()}
          focused={focusedEntity}
          onOpenGrid={() => setDisplayMode('grid')} 
          onSelect={handleSelect}
        />
      </Show>
      <Show when={displayMode() === 'grid'}>
        <ReadGridSelect 
          items={items()}
          focused={focusedEntity}
          onSelect={(ent) => {
            handleSelect(ent);
            setDisplayMode('bar');
          }} 
        />
      </Show>
    </div>
  );
};
