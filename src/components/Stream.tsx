// src/components/Stream.tsx
import { createMemo, Show, For, type Component } from 'solid-js';
import { allStreamsDB, allSpurtsDB, currentTargetStreamId } from '../store';

export const StreamView: Component = () => {
  // Reactively find the current active stream
  const currentStream = createMemo(() => 
    allStreamsDB.find(s => s.id === currentTargetStreamId())
  );

  // Reactively fetch the actual Spurt objects based on the stream's contentIds
  const streamSpurts = createMemo(() => {
    const stream = currentStream();
    if (!stream) return [];
    
    return stream.contentIds
      .map(id => allSpurtsDB.find(spurt => spurt.id === id))
      .filter(spurt => spurt !== undefined); // Filter out undefined if not found
  });

  return (
    <div style={{ width: '54ch', margin: '0 auto', padding: '20px 0' }}>
      <Show when={currentStream()} fallback={<p style={{ color: '#aaa', "text-align": 'center' }}>No active stream selected.</p>}>
        
        {/* Stream Header */}
        <div style={{ "border-bottom": '2px solid #ccc', "margin-bottom": '20px', "padding-bottom": '10px' }}>
          <h2 style={{ margin: '0 0 10px 0', cursor: 'pointer' }} title="Click to rename (Coming soon)">
            {currentStream()?.title}
          </h2>
          <div style={{ "font-size": '12px', color: '#666', display: 'flex', gap: '15px' }}>
            <span>Spurts: {streamSpurts().length}</span>
            <span>Created: {new Date(currentStream()!.createDT).toLocaleTimeString()}</span>
          </div>
        </div>

        {/* Stream Contents (TextReadMode without line breaks format) */}
        <div style={{ "font-family": 'monospace', "font-size": '16px', "line-height": '1.6' }}>
          <For each={streamSpurts()}>
            {(spurt) => (
              <span 
                class="spurt-highlight" // We will style this with CSS in App.tsx
                title={`Created: ${new Date(spurt!.createDT).toLocaleTimeString()} | tSpan: ${spurt!.tSpan}ms`}
              >
                {spurt!.spurTents}{" "}
              </span>
            )}
          </For>
        </div>

      </Show>
    </div>
  );
};
