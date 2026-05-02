import { createSignal, createMemo, For, Show, type Component } from 'solid-js'
import { allStreams, flickerCharCount, focusedEntity, getFlash, setFocusedEntity, type MultEnt } from '../store';

interface InStreamFloatersProps {
  streamID: number | null;
  clickAct: string;
};

export const [hoverEnt, setHoverEnt] = createSignal<MultEnt | null>(null);
export const InStreamFloaters: Component<InStreamFloatersProps> = (props) => {
  const [activated, setActivated] = createSignal(true);
  const [ordered, setOrdered] = createSignal(false);
  const [shuffleTick, setShuffleTick] = createSignal(0);

  if (!props.streamID) return (<div>no stream</div>);

  const stream = () => allStreams.find(s => s.id === props.streamID);
  const floatIDs = createMemo(() => allStreams.find(s => s.id === props.streamID)?.contentIDs);

  const handleClick = (ent: MultEnt) => 
  !(focusedEntity()?.entityType 
    === ent.entityType 
    && 
      focusedEntity()?.refID 
    === ent.refID)
    ? setFocusedEntity(ent) 
    : setFocusedEntity(null);

  return (
    <div class='floater-box'>
      <div class='floater-top'>
        <h4> {stream()?.title} </h4>
        <div style={{
          display: activated() ? 'flex' : 'none'
        }}>
          <button 
            class='floater-button'
            onClick={(e) => {
              e.stopPropagation();
              setOrdered(!ordered());
            }}>
            {ordered() ? 'Disorder' : 'Order'}
          </button>
          <Show when={!ordered()}>
            <button 
            class='floater-button'
            onClick={(e) => {
              e.stopPropagation();
              setShuffleTick(t => t+1);
            }}>
              Shuffle
            </button>
          </Show>
        </div>
      </div>
      <svg 
      class={activated() ? 'floater-circles' : 'hiding-circles'}>
      <Show when={activated()}>
        <For each={floatIDs()}>
          {(floatID, index) => {
            const radius = () => floatID > 0
              ? Math.sqrt(getFlash(floatID)?.textContents.length || 1) + 4
              : Math.sqrt(flickerCharCount(floatID) || 1) + 4;
            const spread = () => (index() / (floatIDs()?.length || 1) * 80);
            const randomX = createMemo(() => {
              shuffleTick(); // Subscribe to the shuffle event
              return 10 + Math.random() * 80;
            });
            
            const randomY = createMemo(() => {
              shuffleTick(); // Subscribe to the shuffle event
              return 10 + Math.random() * 80;
            });
            const finalCx = () => ordered() ? 50 : randomX();
            const finalCy = () => ordered() ? 10 + spread() : randomY();

            return (
              <Show
                when={floatID < 0}
                fallback={
                  <g
                    onMouseOver={() => setHoverEnt({entityType: 'flash', refID: floatID})}
                    onMouseLeave={() => setHoverEnt(null)}
                    onClick={() => handleClick({entityType: 'flash', refID: floatID})}
                  >
                    <circle
                      style={{
                        transition: 'all 0.3s ease',
                        r: `${(hoverEnt()?.entityType === 'flash' 
                                && hoverEnt()?.refID === floatID) 
                            ? radius() * 3 
                            : radius()}`,
                        cx: `${finalCx()}%`,
                        cy: `${finalCy()}%`
                      }}
                      r= {`${(hoverEnt()?.entityType === 'flash' 
                                && hoverEnt()?.refID === floatID) 
                            ? radius() * 3 
                            : radius()}`}
                      cx={`${finalCx()}%`}
                      cy={`${finalCy()}%`}
                      fill='#ffff00'
                      stroke='#ff8000'
                    stroke-width='2px'
                    />
                    {/* Removed <Show> block here */}
                    <text
                      style={{
                        transition: 'all 0.4s ease', // Matches the circle's transition perfectly
                        opacity: (hoverEnt()?.entityType === 'flash' 
                                && hoverEnt()?.refID === floatID) ? 1 : 0, // Handles the visibility!
                        'pointer-events': 'none', // Prevents the invisible text from breaking hover state
                        'font-size': `${(hoverEnt()?.entityType === 'flash' 
                                && hoverEnt()?.refID === floatID) 
                                  ? radius() * 2 
                                  : radius() * 1.14}px`,
                      }}
                      x={`${finalCx()}%`}
                      y={`${finalCy()}%`}
                      text-anchor="middle"
                      dominant-baseline="central"
                      fill='black'
                    >
                      f({floatID})
                    </text>
                  </g>
                }
              >
                <g
                  onMouseOver={() => setHoverEnt({entityType: 'flicker', refID: floatID})}
                  onMouseLeave={() => setHoverEnt(null)}
                  onClick={() => handleClick({entityType: 'flicker', refID: floatID})}
                >
                  <circle
                    style={{
                      transition: 'all 0.4s ease',
                      r: `${(hoverEnt()?.entityType === 'flicker' 
                             && hoverEnt()?.refID === floatID) 
                               ? radius() * 3 
                               : radius()}`,
                      cx: `${finalCx()}%`,
                      cy: `${finalCy()}%`
                    }}
                    r={(hoverEnt()?.entityType === 'flicker' 
                        && hoverEnt()?.refID === floatID) 
                          ? radius() * 3 
                          : radius()}
                    cx={`${finalCx()}%`}
                    cy={`${finalCy()}%`}
                    fill='transparent'
                    stroke='#ffff00'
                    stroke-width='2px'
                  />
                  {/* Removed <Show> block here */}
                  <text
                    style={{
                      transition: 'all 0.2s ease',
                      opacity: (hoverEnt()?.entityType === 'flicker' 
                                && hoverEnt()?.refID === floatID) 
                                  ? 1 
                                  : 0,
                      'pointer-events': 'none',
                      'font-size': `${(hoverEnt()?.entityType === 'flicker' 
                                && hoverEnt()?.refID === floatID) 
                                  ? radius() * 2.3 
                                  : radius() * 1.14}px`,
                    }}
                    x={`${finalCx()}%`}
                    y={`${finalCy()}%`}
                    text-anchor="middle"
                    dominant-baseline="central"
                    fill='white'
                  >
                    F({floatID * -1})
                  </text>
                </g>
              </Show>);
          }}
        </For>
        </Show>
      </svg>
        <button class={activated() ? 'minibar' : 'minibar maxer'}
        onClick={()=>setActivated(!activated())}>
          <span>⮝</span>
          <span>⮝</span>
        </button>
    </div>
  );
}
