import { createSignal, createMemo, For, Show, type Component } from 'solid-js'
import { allStreams, flickerCharCount, flickerWordCount, focusedEntity, getFlash, hoverEnt, setFocusedEntity, setHoverEnt, textWordCount, type MultEnt } from '../store';

interface InStreamFloatersProps {
  streamID: number | null;
  clickAct: string;
};

export const InStreamFloaters: Component<InStreamFloatersProps> = (props) => {
  const [activated, setActivated] = createSignal(true);
  const [ordered, setOrdered] = createSignal(false);
  const [shuffleTick, setShuffleTick] = createSignal(0);

  if (!props.streamID) return (<div>no stream</div>);

  const stream = () => allStreams.find(s => s.id === props.streamID);
  const hoverText = (id:number) => {
    if (id < 0) return flickerWordCount(id);
    else {
      const f = getFlash(id);
      return f ? textWordCount(f.textContents) : 0;
    }
  }

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
            const radius = () => {
              if (floatID > 0) {
              const calced = (2 * Math.log(getFlash(floatID)
                ?.textContents.length || 1)) + 1;
                return calced > 3 ? calced : 3;
              }
              else {
                const calced 
                = (2 * Math.log(flickerCharCount(floatID) 
                  || 1)) + 1;
              return calced > 3 ? calced : 3;
              }
            }
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
              <Show when={floatID}>
                <g
                  onMouseOver={() => setHoverEnt({
                    entityType: floatID < 0 ? 'flicker' : 'flash',
                    refID: floatID
                  })}
                  onMouseLeave={() => setHoverEnt(null)}
                  onClick={() => handleClick({
                    entityType: floatID < 0 ? 'flicker' : 'flash',
                    refID: floatID
                  })}
                >
                  <circle
                    style={{
                      transition: 'all 0.4s ease',
                      r: `${(hoverEnt() && hoverEnt()?.entityType === 
                             (floatID < 0 ? 'flicker' : 'flash') 
                             && hoverEnt()?.refID === floatID) 
                               ? radius() + 10
                               : radius()}`,
                      cx: `${finalCx()}%`,
                      cy: `${finalCy()}%`
                    }}
                    r={(hoverEnt() && hoverEnt()?.entityType === 
                        (floatID < 0 ? 'flicker' : 'flash')
                        && hoverEnt()?.refID === floatID) 
                          ? radius() + 10
                          : radius()}
                    cx={`${finalCx()}%`}
                    cy={`${finalCy()}%`}
                    fill={floatID < 0 ? '#ffff00' : 'rgba(255,255,0,0.5)'}
                    stroke={floatID < 0 ? '#ff8000' : '#ffff00'}
                    stroke-dasharray={floatID < 0 ? '1,0' : '3,3'}
                    stroke-width={floatID < 0 ? '3px' : '1px'}
                  />
                  <text
                    style={{
                      transition: 'all 0.2s ease',
                      opacity: (hoverEnt() && hoverEnt()?.entityType === (floatID < 0 ? 'flicker' : 'flash') 
                                && hoverEnt()?.refID === floatID) 
                                  ? 1 
                                  : 0,
                      'pointer-events': 'none',
                      'font-size': `${(hoverEnt() && hoverEnt()?.entityType === (floatID < 0 ? 'flicker' : 'flash') 
                                && hoverEnt()?.refID === floatID) 
                                  ? radius() + 5
                                  : radius()}
                                  px`,
                    }}
                    x={`${finalCx()}%`}
                    y={`${finalCy()}%`}
                    text-anchor="middle"
                    dominant-baseline="central"
                    fill={`${floatID < 0 ? 'black' : 'black'}`}
                  >
                  {hoverText(floatID)}
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
