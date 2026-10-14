import { createEffect, createSignal, onCleanup, onMount, For, Show, type Component } from 'solid-js';
import { 
  activeViewSpaceID, 
  createNewViewSpace, 
  setActiveViewSpaceID, 
  updateSpaceName, 
  viewSpaces,
  streamFlashes,
  getFlash,
  getFlicker,
  getEmacsDateString,
  type ViewSpace
} from '../store';
import { EditTitle } from './EditTitle';

type DisplayMode = 'active' | 'bar' | 'grid';

const getVSStats = (vs: ViewSpace) => {
  let streams = 0;
  let flashes = 0;
  let tSpan = 0;
  let lastEntry = 0;

  vs.tentsInSpace.forEach(ent => {
    if (ent.entityType === 'stream') {
      streams++;
      const sFlashes = streamFlashes(ent.refID);
      flashes += sFlashes.length;
      sFlashes.forEach(f => {
        tSpan += f.tSpan;
        if (f.createDT > lastEntry) lastEntry = f.createDT;
      });
    } else if (ent.entityType === 'flash') {
      flashes++;
      const f = getFlash(ent.refID);
      if (f && f.id !== 0) { // getFlash returns a dummy if not found
        tSpan += f.tSpan;
        if (f.createDT > lastEntry) lastEntry = f.createDT;
      }
    } else if (ent.entityType === 'flicker') {
      const b = getFlicker(ent.refID);
      if (b && b.id !== 0 && b.contentIDs) {
         flashes += b.contentIDs.length;
         b.contentIDs.forEach(fid => {
            const f = getFlash(fid);
            if (f && f.id !== 0) {
               tSpan += f.tSpan;
               if (f.createDT > lastEntry) lastEntry = f.createDT;
            }
         });
      }
    }
  });

  return { 
    streams, 
    flashes, 
    seconds: Math.floor(tSpan / 1000), 
    lastEntry 
  };
};

const VSSummaryCell: Component<{ vs: ViewSpace, onSelect: () => void }> = (props) => {
  const stats = () => getVSStats(props.vs);
  const timeStr = () => stats().lastEntry ? getEmacsDateString(stats().lastEntry) : 'No Entries';

  return (
    <button class="vs-summary-cell" onClick={props.onSelect}>
      <div class="vs-cell-title">{props.vs.title}</div>
      <div class="vs-cell-stats">
        {stats().flashes} Flashes / {stats().streams} Streams / {stats().seconds}s
      </div>
      <div class="vs-cell-date">{timeStr()}</div>
    </button>
  );
};

const VSGridSelect: Component<{ onSelect: () => void }> = (props) => {
  return (
    <div class="vs-grid-select">
      <For each={viewSpaces}>
        {(vs) => (
          <VSSummaryCell 
            vs={vs} 
            onSelect={() => {
              setActiveViewSpaceID(vs.id);
              props.onSelect();
            }} 
          />
        )}
      </For>
    </div>
  );
};

const VSBarSelect: Component<{ onOpenGrid: () => void, onSelect: () => void }> = (props) => {
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
      const activeID = activeViewSpaceID();
      const activeBtn = document.getElementById('vs-btn-' + activeID);
      activeBtn?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }, 50);
  });

  let prevCount = viewSpaces.length;
  createEffect(() => {
    const currentCount = viewSpaces.length;
    if (currentCount > prevCount) {
      const newVS = viewSpaces[viewSpaces.length - 1];
      setTimeout(() => {
        const btn = document.getElementById('vs-btn-' + newVS?.id);
        btn?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
      }, 50);
    }
    prevCount = currentCount;
  });

  return (
    <div class="vs-bar-select">
      <button class="vs-btn-icon" onClick={props.onOpenGrid} title="Open Grid">🗖</button>
      <button class="vs-btn-icon" onClick={scrollLeft} title="Scroll Left">&lt;</button>
      <div class="vs-bar-scroll" ref={scrollRef} style={{ 'scroll-behavior': 'smooth' }}>
        <For each={viewSpaces}>
          {(vs) => (
            <button 
              id={'vs-btn-' + vs.id}
              class="vs-bar-title"
              onClick={() => {
                setActiveViewSpaceID(vs.id);
                props.onSelect();
              }}
            >
              {vs.title}
            </button>
          )}
        </For>
      </div>
      <button class="vs-btn-icon" onClick={scrollRight} title="Scroll Right">&gt;</button>
      <button 
        class="vs-btn-icon"
        onClick={() => {
          createNewViewSpace();
        }}
        title="Create New ViewSpace"
      >+</button>
    </div>
  );
};

const ActiveVSDisplay: Component<{ onOpenBar: () => void }> = (props) => {
  const [isEditingTitle, setIsEditingTitle] = createSignal(false);
  const activeVS = () => viewSpaces.find(vs => vs.id === activeViewSpaceID());

  return (
    <div class="active-vs-display">
      <button class="vs-btn-icon" onClick={props.onOpenBar}>🗖</button>
      <Show when={isEditingTitle()}
        fallback={
          <div class="active-vs-title-wrapper" onClick={() => setIsEditingTitle(true)}>
            <span class="active-vs-title">{activeVS()?.title}</span>
            <span class="active-vs-edit-icon">✎</span>
          </div>
        }
      >
        <EditTitle
          initialValue={activeVS()!.title}
          onSave={(title: string) => {
            updateSpaceName(activeVS()!.id, title);
            setIsEditingTitle(false);
          }}
          onCancel={() => setIsEditingTitle(false)} 
        />
      </Show>
      <button 
        class="vs-btn-icon" 
        onClick={() => createNewViewSpace()}
      >+</button>
    </div>
  );
};

export const VSLister: Component = () => {
  const [displayMode, setDisplayMode] = createSignal<DisplayMode>('active');
  let containerRef: HTMLDivElement | undefined;

  onMount(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (displayMode() === 'active') return;
      if (containerRef && !containerRef.contains(e.target as Node) && !e.composedPath().includes(containerRef)) {
        setDisplayMode('active');
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
      class="vs-lister-container"
    >
      <Show when={displayMode() === 'active'}>
        <ActiveVSDisplay onOpenBar={() => setDisplayMode('bar')} />
      </Show>
      <Show when={displayMode() === 'bar'}>
        <VSBarSelect 
          onOpenGrid={() => setDisplayMode('grid')} 
          onSelect={() => setDisplayMode('active')} 
        />
      </Show>
      <Show when={displayMode() === 'grid'}>
        <VSGridSelect 
          onSelect={() => setDisplayMode('active')} 
        />
      </Show>
    </div>
  );
};
