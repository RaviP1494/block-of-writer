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
  openFloaters,
  setOpenFloaters,
  type Stream,
  type MultEnt
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
  streamlessCount: () => number;
  hasOpenStreamless: () => boolean;
  onToggleStreamless: () => void;
  targetedID: () => number | null;
  onSelect: (streamID: number) => void;
}> = (props) => {
  return (
    <div class="vs-grid-select">
      <button
        type="button"
        class="vs-summary-cell vs-summary-cell--streamless"
        classList={{ 'targeted-stream': props.hasOpenStreamless() }}
        onClick={props.onToggleStreamless}
      >
        <div class="vs-cell-title">Streamless: {props.streamlessCount()}</div>
        <div class="vs-cell-stats">Loose Flashes &amp; Flickers</div>
        <div class="vs-cell-date">
          {props.hasOpenStreamless() ? 'Click to minimize all' : 'Click to open all'}
        </div>
      </button>
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
  streamlessCount: () => number;
  hasOpenStreamless: () => boolean;
  onToggleStreamless: () => void;
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
        <button
          type="button"
          class="vs-bar-title vs-bar-title--streamless"
          classList={{ 'targeted-stream': props.hasOpenStreamless() }}
          onClick={props.onToggleStreamless}
          title={
            props.hasOpenStreamless()
              ? 'Minimize loose flashes and flickers'
              : 'Open loose flashes and flickers'
          }
        >
          Streamless: {props.streamlessCount()}
        </button>
        <For each={props.streams}>
          {(stream) => (
            <button 
              id={'stream' + stream.id.toString()}
              class="vs-bar-title"
              classList={{
                'targeted-stream': props.targetedID() === stream.id,
                'opened-stream-pill': openFloaters.some(
                  (e) => e.entityType === 'stream' && e.refID === stream.id
                ),
              }}
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
  const [showNewModal, setShowNewModal] = createSignal(false);
  const [newStreamName, setNewStreamName] = createSignal('');
  const [displayMode, setDisplayMode] = createSignal<DisplayMode>('bar');
  let containerRef: HTMLDivElement | undefined;
  let nameInputRef: HTMLInputElement | undefined;

  const openNewStreamModal = () => {
    setNewStreamName('');
    setShowNewModal(true);
    setTimeout(() => nameInputRef?.focus(), 20);
  };

  const submitNewStream = () => {
    createNewStream(newStreamName().trim());
    setNewStreamName('');
    setShowNewModal(false);
  };

  const currentVSID = () => (props.id !== undefined && props.id !== null) ? props.id : activeViewSpaceID();
  const currentVS = () => viewSpaces.find(vs => vs.id === currentVSID());

  const streams = createMemo(() => {
    const ents = currentVS()?.tentsInSpace.filter(ent => ent.entityType === 'stream') || [];
    return ents
      .map(ent => getStream(ent.refID))
      .filter((s): s is Stream => Boolean(s));
  });

  const streamlessEnts = createMemo<MultEnt[]>(() =>
    (currentVS()?.tentsInSpace || []).filter(
      (ent) => ent.entityType === 'flash' || ent.entityType === 'flicker'
    )
  );

  const hasOpenStreamless = createMemo(() =>
    openFloaters.some(
      (ent) => ent.entityType === 'flash' || ent.entityType === 'flicker'
    )
  );

  const scrollCompanionCardIntoView = (entityType: string, refID: number) => {
    requestAnimationFrame(() => {
      const el = document.getElementById(`companion-${entityType}-${refID}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    });
  };

  const handleStreamClick = (streamID: number) => {
    const alreadyOpen = openFloaters.some(
      (ent) => ent.entityType === 'stream' && ent.refID === streamID
    );
    setWriterTargetID(streamID);

    if (!alreadyOpen) {
      setOpenFloaters((prev) => [...prev, { entityType: 'stream', refID: streamID }]);
    }
    scrollCompanionCardIntoView('stream', streamID);
  };

  const handleToggleStreamless = () => {
    if (hasOpenStreamless()) {
      setOpenFloaters((prev) =>
        prev.filter((ent) => ent.entityType !== 'flash' && ent.entityType !== 'flicker')
      );
    } else {
      setWriterTargetID(null);
      const loose = streamlessEnts();
      if (loose.length > 0) {
        setOpenFloaters((prev) => [
          ...prev,
          ...loose.filter(
            (l) => !prev.some((p) => p.entityType === l.entityType && p.refID === l.refID)
          ),
        ]);
      }
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
          streamlessCount={() => streamlessEnts().length}
          hasOpenStreamless={hasOpenStreamless}
          onToggleStreamless={handleToggleStreamless}
          targetedID={writerTargetID}
          onOpenGrid={() => setDisplayMode('grid')} 
          onSelect={handleStreamClick}
          onCreateNew={openNewStreamModal}
        />
      </Show>
      <Show when={displayMode() === 'grid'}>
        <StreamGridSelect 
          streams={streams()}
          streamlessCount={() => streamlessEnts().length}
          hasOpenStreamless={hasOpenStreamless}
          onToggleStreamless={() => {
            handleToggleStreamless();
            setDisplayMode('bar');
          }}
          targetedID={writerTargetID}
          onSelect={(streamID) => {
            handleStreamClick(streamID);
            setDisplayMode('bar');
          }} 
        />
      </Show>

      <Show when={showNewModal()}>
        <div
          class="wb-modal-backdrop"
          onClick={() => setShowNewModal(false)}
        >
          <div
            class="wb-modal-card"
            role="dialog"
            aria-modal="true"
            aria-label="Create New Stream"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 class="wb-modal-card__title">New Stream</h3>
            <input
              ref={nameInputRef}
              type="text"
              class="wb-modal-card__input"
              placeholder="Stream name (leave blank for default)..."
              value={newStreamName()}
              onInput={(e) => setNewStreamName(e.currentTarget.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') submitNewStream();
                if (e.key === 'Escape') setShowNewModal(false);
              }}
            />
            <div class="wb-modal-card__actions">
              <button
                type="button"
                class="wb-navbar__btn"
                onClick={() => setShowNewModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                class="wb-navbar__btn wb-navbar__btn--active"
                onClick={submitNewStream}
              >
                Create
              </button>
            </div>
          </div>
        </div>
      </Show>
    </div>  );
};
