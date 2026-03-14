// src/components/Spurtgatory.tsx
import { Show, type Component } from 'solid-js';
import { currentSpurtgatoryHolder, spurtgatoryEnabled, clearSpurtgatory } from '../store';

export const Spurtgatory: Component = () => {
  return (
    <Show when={spurtgatoryEnabled()}>
      <div style={{ 
        width: '300px', 
        padding: '15px', 
        border: '1px dashed #888', 
        "border-radius": '4px',
        "background-color": '#fafafa'
      }}>
        <div style={{ display: 'flex', "justify-content": 'space-between', "align-items": 'center', "margin-bottom": '10px' }}>
          <h3 style={{ margin: 0, "font-size": '14px', "text-transform": "uppercase", color: '#555' }}>
            Spurtgatory
          </h3>
          <button 
            onClick={clearSpurtgatory} 
            disabled={!currentSpurtgatoryHolder()}
            style={{ padding: '2px 8px', cursor: currentSpurtgatoryHolder() ? 'pointer' : 'not-allowed' }}
          >
            Clear
          </button>
        </div>
        
        <div style={{ 
          "min-height": '60px', 
          "font-family": 'monospace', 
          "font-size": '14px', 
          color: currentSpurtgatoryHolder() ? '#000' : '#aaa' 
        }}>
          <Show 
            when={currentSpurtgatoryHolder()} 
            fallback={<i>Awaiting spurts...</i>}
          >
            {(spurt) => <span>{spurt().spurTents}</span>}
          </Show>
        </div>
      </div>
    </Show>
  );
};
