import { type Component, Show, For, createMemo } from 'solid-js';
import { currentSpurtgatoryHolder, spurtgatoryEnabled, clearSpurtgatory, allSpurtsDB } from '../store';

export const Spurtgatory: Component = () => {
  
  // Dynamically resolve what is currently being held
  const holderSpurts = createMemo(() => {
    const holder = currentSpurtgatoryHolder();
    if (!holder) return [];
    
    // If it's a burst, fetch all its spurts. If it's a single spurt, wrap it in an array.
    if ('contentIds' in holder) {
      return holder.contentIds.map(id => allSpurtsDB.find(s => s.id === id)).filter(Boolean);
    }
    return [holder];
  });

  return (
    <Show when={spurtgatoryEnabled()}>
      <div style={{ width: '300px', padding: '15px', border: '1px dashed #888', "border-radius": '4px', "background-color": '#fafafa' }}>
        <div style={{ display: 'flex', "justify-content": 'space-between', "align-items": 'center', "margin-bottom": '10px' }}>
          <h3 style={{ margin: 0, "font-size": '16px', "text-transform": "uppercase", color: '#555' }}>
            Last Look {currentSpurtgatoryHolder() && 'contentIds' in currentSpurtgatoryHolder()! ? '(Bursting)' : ''}
          </h3>
          <button onClick={clearSpurtgatory} disabled={!currentSpurtgatoryHolder()} style={{ padding: '2px 8px' }}>
            x
          </button>
        </div>
        
        <div style={{ "min-height": '60px', "font-family": 'monospace', "font-size": '10px', color: currentSpurtgatoryHolder() ? '#000' : '#aaa' }}>
          <Show when={currentSpurtgatoryHolder()} fallback={<i>to review</i>}>
            <For each={holderSpurts()}>
              {(spurt) => <span style={{ "margin-right": '8px' }}>{spurt?.spurTents}</span>}
            </For>
          </Show>
        </div>
      </div>
    </Show>
  );
};
