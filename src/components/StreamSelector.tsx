// src/components/StreamSelector.tsx
import { type Component, For, createSignal, Show } from 'solid-js';
import { 
  allStreamsDB, 
  currentTargetStreamId, 
  setCurrentTargetStreamId, 
  currentViewedStreamId, 
  setCurrentViewedStreamId 
} from '../store';
import { OptionsFrame } from './OptionsFrame';
import './styles/StreamSelector.css';

export const StreamSelector: Component = () => {
  const [openOptionsId, setOpenOptionsId] = createSignal<number | null>(null);
  
  const toggleOptions = (id: number) => {
    setOpenOptionsId((prev: number | null) => prev === id ? null : id);
  };

  return (
    <div style={{ display: 'flex', "flex-direction": 'column', "align-items": 'center', width: '100%' }}>
      
      {/* New Clear Target Button */}
      <button 
        onClick={() => setCurrentTargetStreamId(null)}
        style={{ 
          "margin-bottom": '12px', 
          padding: '4px 12px', 
          "font-family": 'monospace', 
          "font-size": '12px', 
          cursor: 'pointer',
          "border-radius": '4px',
          border: '1px solid #ccc',
          "background-color": currentTargetStreamId() === null ? '#333' : '#fafafa',
          color: currentTargetStreamId() === null ? '#fff' : '#000'
        }}
        title="Send spurts to LooseLake"
      >
        Clear Target
      </button>

      <div class="stream-selector-container">
        <For each={allStreamsDB}>
          {(stream) => {
            // FIX: Turn these into functions so SolidJS tracks them reactively!
            const isViewed = () => stream.id === currentViewedStreamId();
            const isTargeted = () => stream.id === currentTargetStreamId();

            return (
              <div class="stream-item-wrapper">
                <button
                  // FIX: Call the functions here with ()
                  class={`stream-btn ${isViewed() ? 'active-stream' : ''} ${isTargeted() ? 'target-stream' : ''}`}
                  onClick={() => toggleOptions(stream.id)}
                >
                  {stream.title}
                </button>
                
                <Show when={openOptionsId() === stream.id}>
                  <OptionsFrame 
                    options={[
                      { label: "Open", onClick: () => setCurrentViewedStreamId(stream.id) },
                      { label: "Target", onClick: () => setCurrentTargetStreamId(stream.id) }
                    ]}
                    onClose={() => setOpenOptionsId(null)}
                  />
                </Show>
              </div>
            );
          }}
        </For>
      </div>
    </div>
  );
};
