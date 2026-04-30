import { createSignal, createMemo, For, Show, type Component } from 'solid-js'
import { flickerCharCount, focusedEntity, getFlash, setFocusedEntity, viewSpaces, type MultEnt } from '../store';

interface VSListFloatersProps {
  id: number | null;
  clickAct: string;
};
export const VSListFloaters: Component<VSListFloatersProps> = (props) => {
  const [ordered, setOrdered] = createSignal(false);
  const [shuffleTick, setShuffleTick] = createSignal(0);
  const [hoverEnt, setHoverEnt] = createSignal<MultEnt | null>(null);

  if (!props.id) return (<div>no viewspace</div>);

  const vs = () => viewSpaces.find(vs => vs.id === props.id);
  const floaters = createMemo(() => vs()?.tentsInSpace.filter((ent) => ent.entityType !== 'stream' ).reverse() || []);

  const handleClick = (ent: MultEnt) => focusedEntity() !== ent ? setFocusedEntity(ent) : null;

  return (
    <div class='floater-box'>
      <div class='floater-top'>
        <h3> Free Floaters </h3>
        <div>
          <button 
            class='transparent'
            onClick={() => setOrdered(!ordered())}>
            {ordered() ? 'Disorder' : 'Order'}
          </button>
          <Show when={!ordered()}>
            <button 
            class='transparent'
            onClick={() => {
              setShuffleTick(t => t+1);
            }}>
              Shuffle
            </button>
          </Show>
        </div>
      </div>
      <svg class='floater-circles'>
        <For each={floaters()}>
          {(ent, index) => {
            const radius = () => ent.entityType === 'flash'
              ? Math.sqrt(getFlash(ent.refID)?.textContents.length || 1) + 4
              : Math.sqrt(flickerCharCount(ent.refID) || 1) + 4;
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
              <Show
                when={ent.entityType === 'flicker'}
                fallback={
                  <g
                    onMouseOver={() => setHoverEnt(ent)}
                    onMouseLeave={() => setHoverEnt(null)}
                    onClick={() => handleClick(ent)}
                  >
                    <circle
                      class='flash-floater-dot'
                      style={{
                        transition: 'all 0.3s ease',
                        r: `${hoverEnt() === ent ? radius() * 2 : radius()}`,
                        cx: `${finalCx()}%`,
                        cy: `${finalCy()}%`
                      }}
                      r={hoverEnt() === ent ? radius() * 2 : radius()}
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
                        opacity: hoverEnt() === ent ? 1 : 0, // Handles the visibility!
                        'pointer-events': 'none', // Prevents the invisible text from breaking hover state
                        'font-size': `${hoverEnt() === ent ? radius() * 2 : radius() * 1.14}px`,
                      }}
                      x={`${finalCx()}%`}
                      y={`${finalCy()}%`}
                      text-anchor="middle"
                      dominant-baseline="central"
                      fill='black'
                    >
                      F{ent.refID * -1}
                    </text>
                  </g>
                }
              >
                <g
                  onMouseOver={() => setHoverEnt(ent)}
                  onMouseLeave={() => setHoverEnt(null)}
                  onClick={() => handleClick(ent)}
                >
                  <circle
                    class='flicker-floater-dot'
                    style={{
                      transition: 'all 0.4s ease',
                      r: `${hoverEnt() === ent ? radius() * 2 : radius()}`,
                      cx: `${finalCx()}%`,
                      cy: `${finalCy()}%`
                    }}
                    r={hoverEnt() === ent ? radius() * 2 : radius()}
                    cx={`${finalCx()}%`}
                    cy={`${finalCy()}%`}
                      fill='#ffffff'
                      stroke='#ffff00'
                    stroke-width='2px'
                  />
                  {/* Removed <Show> block here */}
                  <text
                    style={{
                      transition: 'all 0.2s ease',
                      opacity: hoverEnt() === ent ? 1 : 0,
                      'pointer-events': 'none',
                      'font-size': `${hoverEnt() === ent ? radius() * 2 : radius() * 1.14}px`,
                    }}
                    x={`${finalCx()}%`}
                    y={`${finalCy()}%`}
                    text-anchor="middle"
                    dominant-baseline="central"
                    fill='black'
                  >
                    f{ent.refID}
                  </text>
                </g>
              </Show>);
          }}
        </For>
      </svg>
    </div>
  );
}
