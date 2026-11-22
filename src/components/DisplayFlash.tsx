import { type Component, Show, createMemo } from "solid-js";
import {
  allFlashes,
  allFlickers,
  addToChain,
  formatClock12h,
  replaceInOpenFloaters,
  setFocusedEntity,
  setHoverEnt,
} from "../store";
import { } from './InStreamFloaters';

interface DisplayFlashProps {
  id: number;
  showTimes: () => boolean;
  isSpaced: () => boolean;
  renderedBy: string;
  parentStreamID?: number;
  parentFlickerID?: number;
  prevID?: number | null | (() => number | null);
  clickDo?: string;
  isHovered?: boolean;
}

export const DisplayFlash: Component<DisplayFlashProps> = (props) => {
  const flash = () => allFlashes.find(f => f.id === props.id);
  const showTimes = () => props.showTimes();
  const isSpaced = () => props.isSpaced();
  const resolvedPrevID = () =>
    typeof props.prevID === 'function' ? props.prevID() : (props.prevID ?? null);
  const holdingFlicker = () => allFlickers.find(f => f.contentIDs.includes(props.id));
  const isHighlighted = createMemo(() => props.isHovered);
  const isClickable = () =>
    (props.clickDo === 'multi' || props.clickDo === 'focus') &&
    props.renderedBy !== 'flash' &&
    props.renderedBy !== 'replay';

  const handleClick = () => {
    const flk = holdingFlicker();
    if (props.clickDo === 'chain') {
      addToChain(props.id);
    } else if (props.clickDo === 'focus') {
      if (props.renderedBy === 'stream' && flk) {
        setFocusedEntity({ refID: flk.id, entityType: 'flicker' });
      } else if (props.renderedBy !== 'flash') {
        setFocusedEntity({ refID: props.id, entityType: 'flash' });
      }
    } else if (props.clickDo === 'multi') {
      if (props.renderedBy === 'stream' && props.parentStreamID !== undefined) {
        const nextEnt = flk
          ? { entityType: 'flicker' as const, refID: flk.id }
          : { entityType: 'flash' as const, refID: props.id };
        replaceInOpenFloaters(
          { entityType: 'stream', refID: props.parentStreamID },
          nextEnt
        );
      } else if (props.renderedBy === 'flicker' && props.parentFlickerID !== undefined) {
        replaceInOpenFloaters(
          { entityType: 'flicker', refID: props.parentFlickerID },
          { entityType: 'flash', refID: props.id }
        );
      }
    }
  };

  const handleMouseOver = (e: MouseEvent) => {
    e.stopPropagation();
    const id = flash()?.id;
    if (id) {
      setHoverEnt({
        entityType: 'flash',
        refID: id,
      });
    }
  };

  return (
    <Show when={flash()}>
    <Show
          when={showTimes()}
          fallback={
            <span 
            onClick={()=>handleClick()}
            classList={{
              ['paragraph']: isSpaced(),
              ['flash-highlight']: isHighlighted(),
              ['flash-clickable']: isClickable(),
            }}
            style={{
              'word-wrap': 'break-word',
              'overflow-wrap': 'break-word',
            }}
            onMouseOver={handleMouseOver}
            onMouseLeave={() => setHoverEnt(null)}
            title={(flash()!.tSpan / 1000).toString() + ' seconds'}>
              {flash()!.textContents}&nbsp;
            </span>
          }>
          <div
            class="flash-timestamp"
            style={{
              'text-align': 'left',
              'text-decoration': resolvedPrevID() ? 'overline' : 'underline',
            }}
          >
            {(() => {
              const prevID = resolvedPrevID();
              if (!prevID) {
                return formatClock12h(flash()!.createDT);
              } else {
                const prevFlash = allFlashes.find(f => f.id === prevID);
                if (prevFlash) {
                  const prevEnd = prevFlash.createDT + prevFlash.tSpan;
                  const deltaMs = flash()!.createDT - prevEnd;
                  // Math.max prevents negative values if typing overlaps
                  const deltaSec = (Math.max(0, deltaMs) / 1000).toFixed(1);
                  return `⊦${deltaSec}s`;
                }
                return '';
              }
            })()}
          </div>
          <div
            class="paragraph flash"
            classList={{
              'flash-highlight': isHighlighted(),
              'flash-clickable': isClickable(),
            }}
            onMouseOver={handleMouseOver}
            onMouseLeave={() => setHoverEnt(null)}
            title={(flash()!.tSpan / 1000).toString() + ' seconds'}
            onClick={() => handleClick()}
          >
            {flash()!.textContents}&nbsp;
          </div>
        </Show>
    </Show>
  );
};
