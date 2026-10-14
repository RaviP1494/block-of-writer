import { createEffect, createSignal, onCleanup, onMount, For, Show, type Component } from 'solid-js';
import { 
  chainTargetID, 
  createNewChain, 
  getChainStats, 
  getEmacsDateString, 
  openChains, 
  setChainTargetID, 
  setOpenChains, 
  sparkChains, 
  type SparkChain 
} from '../store';

type DisplayMode = 'bar' | 'grid';

const ChainSummaryCell: Component<{
  chain: SparkChain;
  isOpen: boolean;
  isTargeted: boolean;
  onSelect: () => void;
}> = (props) => {
  const stats = () => getChainStats(props.chain.id);
  const timeStr = () => stats().lastEntry ? getEmacsDateString(stats().lastEntry) : 'No Entries';

  return (
    <button 
      class="vs-summary-cell"
      classList={{ 'targeted-stream': props.isTargeted }}
      onClick={props.onSelect}
    >
      <div class="vs-cell-title">{props.chain.title}</div>
      <div class="vs-cell-stats">{stats().count} Sparks</div>
      <div class="vs-cell-date">{timeStr()}</div>
    </button>
  );
};

const ChainGridSelect: Component<{
  chains: SparkChain[];
  onSelect: (chainID: number) => void;
}> = (props) => {
  return (
    <div class="vs-grid-select">
      <For each={props.chains}>
        {(chain) => (
          <ChainSummaryCell 
            chain={chain}
            isOpen={openChains.includes(chain.id)}
            isTargeted={chainTargetID() === chain.id}
            onSelect={() => props.onSelect(chain.id)} 
          />
        )}
      </For>
    </div>
  );
};

const ChainBarSelect: Component<{
  chains: SparkChain[];
  onOpenGrid: () => void;
  onToggleChain: (chainID: number) => void;
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
      const target = chainTargetID();
      if (target) {
        const btn = document.getElementById('chain-btn-' + target);
        btn?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
      }
    }, 50);
  });

  let prevCount = props.chains.length;
  createEffect(() => {
    const currentCount = props.chains.length;
    if (currentCount > prevCount) {
      const newChain = props.chains[props.chains.length - 1];
      setTimeout(() => {
        const btn = document.getElementById('chain-btn-' + newChain?.id);
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
        <For each={props.chains}>
          {(chain) => {
            const isOpen = () => openChains.includes(chain.id);
            const isTargeted = () => chainTargetID() === chain.id;
            return (
              <button 
                id={'chain-btn-' + chain.id}
                class="vs-bar-title"
                classList={{ 
                  'targeted-stream': isTargeted(),
                  'chain-open-tab': isOpen() && !isTargeted()
                }}
                onClick={() => props.onToggleChain(chain.id)}
                title={isTargeted() ? 'Targeted Chain' : isOpen() ? 'Opened Chain' : 'Click to Open'}
              >
                {chain.title}
              </button>
            );
          }}
        </For>
      </div>
      <button class="vs-btn-icon" onClick={scrollRight} title="Scroll Right">&gt;</button>
      <button 
        class="vs-btn-icon"
        onClick={props.onCreateNew}
        title="Create New SparkChain"
      >+</button>
    </div>
  );
};

export const SparkChainSelector: Component = () => {
  const [displayMode, setDisplayMode] = createSignal<DisplayMode>('bar');
  let containerRef: HTMLDivElement | undefined;

  const handleToggleChain = (chainID: number) => {
    if (openChains.includes(chainID)) {
      setOpenChains(prev => prev.filter(id => id !== chainID));
      if (chainTargetID() === chainID) {
        setChainTargetID(openChains.length > 1 ? openChains.find(id => id !== chainID) || null : null);
      }
    } else {
      setOpenChains(prev => [...prev, chainID]);
      if (!chainTargetID()) {
        setChainTargetID(chainID);
      }
    }
  };

  const handleGridSelect = (chainID: number) => {
    if (!openChains.includes(chainID)) {
      setOpenChains(prev => [...prev, chainID]);
    }
    setChainTargetID(chainID);
    setDisplayMode('bar');
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
      class="vs-lister-container spark-chain-selector-container"
    >
      <Show when={displayMode() === 'bar'}>
        <ChainBarSelect 
          chains={sparkChains}
          onOpenGrid={() => setDisplayMode('grid')} 
          onToggleChain={handleToggleChain}
          onCreateNew={() => {
            createNewChain();
            const latest = sparkChains[sparkChains.length - 1];
            if (latest && !openChains.includes(latest.id)) {
              setOpenChains(prev => [...prev, latest.id]);
              setChainTargetID(latest.id);
            }
          }}
        />
      </Show>
      <Show when={displayMode() === 'grid'}>
        <ChainGridSelect 
          chains={sparkChains}
          onSelect={handleGridSelect} 
        />
      </Show>
    </div>
  );
};
