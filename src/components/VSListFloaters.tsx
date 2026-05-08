import { createSignal, createMemo, For, Show, type Component } from 'solid-js'
import { flickerCharCount, flickerWordCount, focusedEntity, getFlash, setFocusedEntity, setWriterTargetID, textWordCount, viewSpaces, type MultEnt } from '../store';

interface VSListFloatersProps {
  id: number | null;
  clickAct: string;
};
export const VSListFloaters: Component<VSListFloatersProps> = (props) => {
  const [activated, setActivated] = createSignal(true);
  const [ordered, setOrdered] = createSignal(false);
  const [shuffleTick, setShuffleTick] = createSignal(0);
  const [hoverEnt, setHoverEnt] = createSignal<MultEnt | null>(null);

  if (!props.id) return (<div>no viewspace</div>);

  const vs = () => viewSpaces.find(vs => vs.id === props.id);
  const floaters = createMemo(
    () => vs()?.tentsInSpace
    .filter((ent) => ent.entityType !== 'stream' )
    .reverse() || []);

  const hoverText = (id:number) => {
    if (id < 0) return flickerWordCount(id);
    else {
      const f = getFlash(id);
      return f ? textWordCount(f.textContents) : 0;
    }
  }
  const handleClick = (ent: MultEnt) => focusedEntity() !== ent 
    ? setFocusedEntity(ent) 
    : null;

  return (
    <div class='floater-box'>
      <div class='floater-top'
      style={{
        'background-color': '#ffffff',
      }}>
        <h4
        style={{
        color: '#000000'
        }}
        > Free Floaters </h4>
        <div style={{
          display: activated() ? 'flex' : 'none',
        }}>
          <button 
        style={{
        color: '#000000'
        }}
            class='floater-button'
            onClick={(e) => {
              e.stopPropagation();
              setOrdered(!ordered());
            }}>
            {ordered() ? 'Disorder' : 'Order'}
          </button>
          <Show when={!ordered()}>
            <button 
        style={{
        color: '#000000'
        }}
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
      onClick={() => setWriterTargetID(null)}
      class={activated() ? 'floater-circles' : 'hiding-circles'}>
      <Show when={activated()}>
        <For each={floaters()}>
          {(ent, index) => {
            const radius = () => {
              if (ent.entityType === 'flash') { 
                return 3;
              }
              else if (ent.entityType === 'flicker') { 
                const calced 
                = (2 * Math.log(flickerCharCount(ent.refID) || 1)) + 1;
                return calced > 3 ? calced : 3;
              }
              else {
                return 1;
              }
            };
            const spread = () => (index() / (floaters()?.length || 1) * 80);
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
              <Show when={ent}>
                <g
                  class='grav-pt'
                  onMouseOver={() => setHoverEnt(ent)}
                  onMouseLeave={() => setHoverEnt(null)}
                  onClick={() => handleClick(ent)}
                >
                  <circle
                    style={{
                      transition: 'all 0.4s ease',
                      r: `${hoverEnt() === ent ? 20 : radius()}`,
                      cx: `${finalCx()}%`,
                      cy: `${finalCy()}%`
                    }}
                    r={hoverEnt() === ent ? 20 : radius()}
                    cx={`${finalCx()}%`}
                    cy={`${finalCy()}%`}
                    fill={ent.entityType === 'flicker' ? '#ffff00' : 'rgba(255,255,0,0.5)'}
                    stroke={ent.entityType === 'flicker' ? 'rgba(255,255,0,0.5)' : '#ffff00'}
                    stroke-dasharray='3,3'
                    stroke-width={ent.entityType === 'flicker' ? '3px' : '1px'}
                  />
                  {/* Removed <Show> block here */}
                  <text
                    style={{
                      transition: 'all 0.2s ease',
                      opacity: (hoverEnt() && hoverEnt() === ent ? '1' : '0') ,
                      'pointer-events': 'none',
                      'font-size': `${hoverEnt() === ent ? radius() + 5 : radius()}px`,
                    }}
                    x={`${finalCx()}%`}
                    y={`${finalCy()}%`}
                    text-anchor="middle"
                    dominant-baseline="central"
                    fill={`${ent.entityType === 'flicker' ? 'black' : '#d0d0d0'}`}
                  >
                    <tspan x={`${finalCx()}%`} dy="-0.3em">
                      {hoverText(ent.refID)}
                    </tspan>

                    <tspan x={`${finalCx()}%`} dy="1.2em" font-size="0.6em">
                      words
                    </tspan>
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
