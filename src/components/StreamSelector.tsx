import { createEffect, createMemo, createSignal, onCleanup, onMount, For, Show, type Component } from 'solid-js';
import { 
  activeViewSpaceID, 
  createNewStream, 
  getEmacsDateString, 
  getStream, 
  streamFlashes, 
  viewSpaces, 
  writerTargetID, 
  setWriterTargetID, 
  type Stream 
} from '../store';

type DisplayMode = 'bar' | 'grid';

const getStreamStats = (streamID: number, streamCreateDT: number) => {
  const flashes = streamFlashes(streamID);
  let lastEntry = streamCreateDT;
  flashes.forEach(f => {
    if (f.createDT > lastEntry) lastEntry = f.createDT;
  });
  return {
    flashes: flashes.length,
    lastEntry
  };
};

const StreamSummaryCell: Component<{
  stream: Stream;
  isTargeted: boolean;
  onSelect: () => void;
}> = (props) => {
  const stats = () => getStreamStats(props.stream.id, props.stream.createDT);
  const timeStr = () => stats().lastEntry ? getEmacsDateString(stats().lastEntry) : 'No Entries';

  return (
    <button 
      class="vs-summary-cell"
      classList={{ 'targeted-stream': props.isTargeted }}
      onClick={props.onSelect}
    >
      <div class="vs-cell-title">{props.stream.title}</div>
      <div class="vs-cell-stats">
        {stats().flashes} Flashes
      </div>
      <div class="vs-cell-date">{timeStr()}</div>
    </button>
  );
};

const StreamGridSelect: Component<{
  streams: Stream[];
  targetedID: () => number | null;
  onSelect: (streamID: number) => void;
}> = (props) => {
  return (
    <div class="vs-grid-select">
      <For each={props.streams}>
        {(stream) => (
          <StreamSummaryCell 
            stream={stream} 
            isTargeted={props.targetedID() === stream.id}
            onSelect={() => props.onSelect(stream.id)} 
          />
        )}
      </For>
    </div>
  );
};

const StreamBarSelect: Component<{
  streams: Stream[];
  targetedID: () => number | null;
  onOpenGrid: () => void;
  onSelect: (streamID: number) => void;
  onCreateNew: () => void;
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
      const targetID = props.targetedID();
      if (targetID) {
        const targetBtn = document.getElementById('stream' + targetID);
        targetBtn?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }, 50);
  });

  let prevCount = props.streams.length;
  createEffect(() => {
    const currentCount = props.streams.length;
    if (currentCount > prevCount) {
      const lastStream = props.streams[props.streams.length - 1];
      setTimeout(() => {
        const btn = document.getElementById('stream' + lastStream?.id);
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
        <For each={props.streams}>
          {(stream) => (
            <button 
              id={'stream' + stream.id.toString()}
              class="vs-bar-title"
              classList={{ 'targeted-stream': props.targetedID() === stream.id }}
              onClick={() => props.onSelect(stream.id)}
            >
              {stream.title}
            </button>
          )}
        </For>
      </div>
      <button class="vs-btn-icon" onClick={scrollRight} title="Scroll Right">&gt;</button>
      <button 
        class="vs-btn-icon"
        onClick={props.onCreateNew}
        title="Create New Stream"
      >+</button>
    </div>
  );
};

export interface StreamSelectorProps {
  id?: number | null;
  clickAct?: string;
}

export const StreamSelector: Component<StreamSelectorProps> = (props) => {
  const [displayMode, setDisplayMode] = createSignal<DisplayMode>('bar');
  let containerRef: HTMLDivElement | undefined;

  const currentVSID = () => (props.id !== undefined && props.id !== null) ? props.id : activeViewSpaceID();
  const currentVS = () => viewSpaces.find(vs => vs.id === currentVSID());

  const streams = createMemo(() => {
    const ents = currentVS()?.tentsInSpace.filter(ent => ent.entityType === 'stream') || [];
    return ents
      .map(ent => getStream(ent.refID))
      .filter((s): s is Stream => Boolean(s));
  });

  const handleStreamClick = (streamID: number) => {
    if (writerTargetID() === streamID) {
      setWriterTargetID(null);
    } else {
      setWriterTargetID(streamID);
    }
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
      class="vs-lister-container stream-selector-container"
    >
      <Show when={displayMode() === 'bar'}>
        <StreamBarSelect 
          streams={streams()}
          targetedID={writerTargetID}
          onOpenGrid={() => setDisplayMode('grid')} 
          onSelect={handleStreamClick}
          onCreateNew={() => createNewStream()}
        />
      </Show>
      <Show when={displayMode() === 'grid'}>
        <StreamGridSelect 
          streams={streams()}
          targetedID={writerTargetID}
          onSelect={(streamID) => {
            handleStreamClick(streamID);
            setDisplayMode('bar');
          }} 
        />
      </Show>
    </div>
  );
};
