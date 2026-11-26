import { batch, createEffect, createMemo, createSignal, onCleanup, onMount, For, Show, type Component } from 'solid-js';
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
  setFocusedStreamID,
  setFocusedEntity,
  setUserMode,
  type Stream,
  type MultEnt
} from '../store';
import { isActiveTimer } from './FocusWriter';

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
  isOpen: boolean;
  onSelect: () => void;
}> = (props) => {
  const stats = () => getStreamStats(props.stream.id, props.stream.createDT);
  const timeStr = () => stats().lastEntry ? getEmacsDateString(stats().lastEntry) : 'No Entries';

  return (
    <button
      type="button"
      class="vs-summary-cell"
      classList={{
        'targeted-stream': props.isTargeted,
        'opened-stream-pill': props.isOpen,
      }}
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
  floatingCount: () => number;
  hasOpenFloating: () => boolean;
  onFloatingClick: () => void;
  targetedID: () => number | null;
  onSelect: (streamID: number) => void;
}> = (props) => {
  const isFloatingTargeted = () => props.targetedID() === null;

  return (
    <div class="vs-grid-select">
      <button
        type="button"
        class="vs-summary-cell vs-summary-cell--floating"
        classList={{
          'targeted-stream': isFloatingTargeted(),
          'opened-stream-pill': props.hasOpenFloating(),
        }}
        onClick={props.onFloatingClick}
      >
        <div class="vs-cell-title">Free: {props.floatingCount()}</div>
        <div class="vs-cell-stats">Loose Flashes &amp; Flickers</div>
        <div class="vs-cell-date">
          {!isFloatingTargeted()
            ? 'Click to clear stream target'
            : props.hasOpenFloating()
              ? 'Click to minimize all'
              : 'Click to open all'}
        </div>
      </button>
      <For each={props.streams}>
        {(stream) => (
          <StreamSummaryCell
            stream={stream}
            isTargeted={props.targetedID() === stream.id}
            isOpen={openFloaters.some(
              (e) => e.entityType === 'stream' && e.refID === stream.id
            )}
            onSelect={() => props.onSelect(stream.id)}
          />
        )}
      </For>
    </div>
  );
};

const StreamBarSelect: Component<{
  streams: Stream[];
  floatingCount: () => number;
  hasOpenFloating: () => boolean;
  onFloatingClick: () => void;
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

  const isFloatingTargeted = () => props.targetedID() === null;

  return (
    <div class="stream-bar-select">
      <button
        type="button"
        class="stream-btn-icon"
        disabled={isActiveTimer()}
        onClick={props.onOpenGrid}
        title="Browse Streams in Grid"
        aria-label="Browse Streams in Grid"
      >
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <path d="M1.5 3h11M1.5 7h11M1.5 11h7.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" />
        </svg>
      </button>
      <button
        type="button"
        class="stream-btn-icon stream-btn-icon--scroll"
        tabindex="-1"
        disabled={isActiveTimer()}
        onClick={scrollLeft}
        title="Scroll Left"
        aria-label="Scroll streams left"
      >
        &lt;
      </button>
      <div class="stream-bar-scroll" ref={scrollRef} style={{ 'scroll-behavior': 'smooth' }}>
        <button
          type="button"
          class="stream-bar-title stream-bar-title--floating"
          classList={{
            'targeted-stream': isFloatingTargeted(),
            'opened-stream-pill': props.hasOpenFloating(),
          }}
          onMouseDown={(e) => {
            if (isActiveTimer()) e.preventDefault();
          }}
          onClick={props.onFloatingClick}
          title={
            !isFloatingTargeted()
              ? 'Click to write free (clear stream target)'
              : props.hasOpenFloating()
                ? 'Free target active — click to minimize free items'
                : 'Free target active — click to open free items'
          }
        >
          Free: {props.floatingCount()}
        </button>
        <For each={props.streams}>
          {(stream) => {
            const isTargeted = () => props.targetedID() === stream.id;
            const isOpen = () =>
              openFloaters.some(
                (e) => e.entityType === 'stream' && e.refID === stream.id
              );

            return (
              <button
                type="button"
                id={'stream' + stream.id.toString()}
                class="stream-bar-title"
                classList={{
                  'targeted-stream': isTargeted(),
                  'opened-stream-pill': isOpen(),
                }}
                onMouseDown={(e) => {
                  if (isActiveTimer()) e.preventDefault();
                }}
                onClick={() => props.onSelect(stream.id)}
                title={
                  isActiveTimer()
                    ? 'Click to redirect active flash/flicker target'
                    : !isTargeted()
                      ? 'Click to set as write target'
                      : !isOpen()
                        ? 'Targeted — click again to open'
                        : 'Targeted & open — click again to focus in Review mode'
                }
              >
                {stream.title}
              </button>
            );
          }}
        </For>
      </div>
      <button
        type="button"
        class="stream-btn-icon stream-btn-icon--scroll"
        tabindex="-1"
        disabled={isActiveTimer()}
        onClick={scrollRight}
        title="Scroll Right"
        aria-label="Scroll streams right"
      >
        &gt;
      </button>
      <button
        type="button"
        class="stream-btn-icon stream-btn-icon--add"
        disabled={isActiveTimer()}
        onClick={props.onCreateNew}
        title="Create New Stream"
        aria-label="Create New Stream"
      >
        +
      </button>
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

  const floatingEnts = createMemo<MultEnt[]>(() =>
    (currentVS()?.tentsInSpace || []).filter(
      (ent) => ent.entityType === 'flash' || ent.entityType === 'flicker'
    )
  );

  const hasOpenFloating = createMemo(() =>
    openFloaters.some(
      (ent) => ent.entityType === 'flash' || ent.entityType === 'flicker'
    )
  );

  const scrollReaderCardIntoView = (entityType: string, refID: number) => {
    requestAnimationFrame(() => {
      const el = document.getElementById(`companion-${entityType}-${refID}`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
    });
  };

  const handleStreamClick = (streamID: number) => {
    // While generating a flash/flicker, stream buttons only retarget without opening cards or leaving Write mode
    if (isActiveTimer()) {
      setWriterTargetID(streamID);
      return;
    }

    const isTargeted = writerTargetID() === streamID;
    const isOpen = openFloaters.some(
      (ent) => ent.entityType === 'stream' && ent.refID === streamID
    );

    if (!isTargeted) {
      // 1st click: target only
      setWriterTargetID(streamID);
    } else if (!isOpen) {
      // 2nd click: open into ViewMultItems below
      setOpenFloaters((prev) => [...prev, { entityType: 'stream', refID: streamID }]);
      scrollReaderCardIntoView('stream', streamID);
    } else {
      // 3rd click: focus selected stream in Read mode
      batch(() => {
        setFocusedStreamID(streamID);
        setFocusedEntity({ entityType: 'stream', refID: streamID });
        setUserMode('Read');
      });
    }
  };

  const handleFloatingClick = () => {
    if (isActiveTimer()) {
      setWriterTargetID(null);
      return;
    }

    if (writerTargetID() !== null) {
      // Always clear stream target on click
      setWriterTargetID(null);
      return;
    }

    if (hasOpenFloating()) {
      setOpenFloaters((prev) =>
        prev.filter((ent) => ent.entityType !== 'flash' && ent.entityType !== 'flicker')
      );
    } else {
      const loose = floatingEnts();
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

  createEffect(() => {
    if (isActiveTimer() && displayMode() === 'grid') {
      setDisplayMode('bar');
    }
  });

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
      class="stream-lister-container stream-selector-container"
    >
      <StreamBarSelect
        streams={streams()}
        floatingCount={() => floatingEnts().length}
        hasOpenFloating={hasOpenFloating}
        onFloatingClick={handleFloatingClick}
        targetedID={writerTargetID}
        onOpenGrid={() => setDisplayMode((prev) => (prev === 'grid' ? 'bar' : 'grid'))}
        onSelect={handleStreamClick}
        onCreateNew={openNewStreamModal}
      />

      <Show when={displayMode() === 'grid'}>
        <StreamGridSelect
          streams={streams()}
          floatingCount={() => floatingEnts().length}
          hasOpenFloating={hasOpenFloating}
          onFloatingClick={() => {
            handleFloatingClick();
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
    </div>
  );
};
