import { createSignal, createMemo, For, Show, type Component } from 'solid-js'
import { flickerCharCount, focusedEntity, getFlash, setFocusedEntity, viewSpaces, type MultEnt } from '../store';

interface VSListFloatersProps {
  id: number | null;
  clickAct: string;
};
export const VSListFloaters: Component<VSListFloatersProps> = (props) => {
  const [ordered, setOrdered] = createSignal(false);

  if (!props.id) return (<div>no viewspace</div>)
  const vs = () => viewSpaces.find(vs => vs.id === props.id);
  const floaters = createMemo(() => vs()?.tentsInSpace.filter((ent) => ent.entityType !== 'stream' ).reverse() || []);

  const handleClick = (ent: MultEnt) => focusedEntity() !== ent ? setFocusedEntity(ent) : null;

  return (
    <div class='floater-box'>
      <div class='floater-top'>
        <h3> Free Floaters </h3>
        <div>
          <Show when={!ordered()}>
            <button onClick={() => {
              setOrdered(!ordered());
              setOrdered(!ordered());
            }}>
              Shuffle
            </button>
          </Show>
          <button onClick={() => setOrdered(!ordered())}>
            {ordered() ? 'Disorder' : 'Order'}
          </button>
        </div>
      </div>
      <svg class='floater-circles'>
        <For each={floaters()}>
          {(ent, index) => {
            const radius = ent.entityType === 'flash'
              ? Math.sqrt(getFlash(ent.refID)?.textContents.length || 1) + 4
              : Math.sqrt(flickerCharCount(ent.refID) || 1) + 4;
            const spread = () => (index() / (floaters()?.length || 1) * 80);
            const finalCx = () => ordered() ? 50 : 10 + Math.random() * 80;
            const finalCy = () => ordered() ? 10 + spread() : 10 + Math.random() * 80;

            return (
              <Show when={ent.entityType === 'flicker'}
                fallback={
                  <circle
                    onClick={() => handleClick(ent)}
                    class='flicker-floater-dot'
                    style={{
                      transition: 'all 1.0s ease',
                      cx: `${finalCx()}%`,
                      cy: `${finalCy()}%`
                    }}

                    r={radius}
                    cx={`${finalCx()}%`}
                    cy={`${finalCy()}%`}
                    fill='#d0d000'
                  />
                }
              >
                <circle
                  onClick={() => handleClick(ent)}
                  class='flash-floater-dot'
                  style={{
                    transition: 'all 1.0s ease',
                    cx: `${finalCx()}%`,
                    cy: `${finalCy()}%`
                  }}
                  r={radius}
                  cx={`${finalCx()}%`}
                  cy={`${finalCy()}%`}
                  fill='#ffff00'
                  stroke='#000000'
                />
              </Show>
            );
          }}
        </For>
      </svg>
    </div>
  );
}
