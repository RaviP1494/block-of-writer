// src/components/Stream.tsx
import { createMemo, Show, For, createSignal, createEffect, type Component } from 'solid-js';
import { allStreamsDB, allSpurtsDB, currentViewedStreamId, updateStreamTitle, deleteSpurt } from '../store';
import { EditTitle } from './EditTitle';
import { OptionsFrame } from './OptionsFrame';

type ViewMode = 'SpurtFullInfoView' | 'SpurtTextReadView' | 'SpurtDotsFeelView';

export const StreamView: Component = () => {
  const [isEditingTitle, setIsEditingTitle] = createSignal(false);
  const [activeSpurtMenuId, setActiveSpurtMenuId] = createSignal<number | null>(null);
  const [viewMode, setViewMode] = createSignal<ViewMode>('SpurtFullInfoView');
  const [useLineBreaks, setUseLineBreaks] = createSignal(false); 
  const [isContentReverseOrd, setIsContentReverseOrd] = createSignal(false);

  
  const currentStream = createMemo(() => 
    allStreamsDB.find(s => s.id === currentViewedStreamId())
  );

  const streamSpurts = createMemo(() => {
    const stream = currentStream();
    if (!stream) return [];
    
    return stream.contentIds
      .map(id => allSpurtsDB.find(spurt => spurt.id === id))
      .filter(spurt => spurt !== undefined);
  });

  // --- Reversal Logic ---
  // Watchdog: Auto-disable reversal if in TextReadMode without line breaks
  createEffect(() => {
    if (viewMode() === 'SpurtTextReadView' && !useLineBreaks()) {
      setIsContentReverseOrd(false);
    }
  });

  // Derived State: The actual array rendered to the screen
  const displayedSpurts = createMemo(() => {
    return isContentReverseOrd() 
      ? [...streamSpurts()].reverse() 
      : streamSpurts();
  });
  
  // --- Helper Math & Aggregates ---
  const getWordCount = (text: string) => text.trim().split(/\s+/).filter(w => w.length > 0).length;

  const totalTime = createMemo(() => streamSpurts().reduce((acc, s) => acc + s!.tSpan, 0));
  const totalKeys = createMemo(() => streamSpurts().reduce((acc, s) => acc + s!.spurTents.length, 0));
  const totalWords = createMemo(() => streamSpurts().reduce((acc, s) => acc + getWordCount(s!.spurTents), 0));
  
  // Averages (Calculated per second)
  const avgKeysRate = createMemo(() => totalTime() > 0 ? (totalKeys() / (totalTime() / 1000)).toFixed(2) : "0");
  const maxKeysRate = createMemo(() => {
    const rates = streamSpurts().map(s => s!.tSpan > 0 ? s!.spurTents.length / (s!.tSpan / 1000) : 0);
    return rates.length > 0 ? Math.max(...rates).toFixed(2) : "0";
  });

  // --- DotsFeelView Math Engine ---
  const dotData = createMemo(() => {
    const spurts = displayedSpurts();
    if (spurts.length === 0) return { dots: [], height: 0 };

    // 1. Calculate rates (NOW USING WORDS) and find the max boundary
    const rawData = spurts.map(spurt => {
      const tSpanSec = spurt!.tSpan / 1000;
      const words = getWordCount(spurt!.spurTents);
      const rate = tSpanSec > 0 ? words / tSpanSec : 0; // Words per second
      return { spurt: spurt!, rate };
    });

    // Fallback to 0.1 so we don't divide by zero if the first spurt is super slow
    const maxRate = Math.max(...rawData.map(d => d.rate), 0.1); 

    // 2. Map coordinates and sizes
    const rowSpacing = 40;
    const dots = rawData.map((d, index) => {
      // pX: Percentage of max width
      const pxPercentage = (d.rate / maxRate) * 90 + 5; 
      
      // pY: Simple vertical stack
      const pyPixels = (index * rowSpacing) + 30; 
      
      // rD: Radius remains strictly dependent on characters (keys)
      const radius = Math.max(4, Math.min(24, Math.sqrt(d.spurt.spurTents.length) * 1.5));

      return {
        id: d.spurt.id,
        spurt: d.spurt,
        rate: d.rate,
        px: pxPercentage,
        py: pyPixels,
        r: radius
      };
    });

    return {
      dots,
      height: Math.max(200, dots.length * rowSpacing + 60)
    };
  });

  return (
    <div style={{ width: '54ch', margin: '0 auto', padding: '20px 0' }}>
      <Show when={currentStream()} fallback={<p style={{ color: '#aaa', "text-align": 'center' }}>No stream open.</p>}>
        
        {/* === STREAM HEADER === */}
        <div style={{ "border-bottom": '2px solid #ccc', "margin-bottom": '20px', "padding-bottom": '10px' }}>
          
          {/* Top Row: Title & Dropdown */}
          <div style={{ display: 'flex', "justify-content": 'space-between', "align-items": 'center', "margin-bottom": '12px' }}>
            <Show 
              when={isEditingTitle()} 
              fallback={
                <h2 
                  style={{ margin: 0, cursor: 'pointer' }} 
                  title="Click to edit title"
                  onClick={() => setIsEditingTitle(true)}
                >
                  {currentStream()?.title}
                </h2>
              }
            >
              <EditTitle 
                initialValue={currentStream()!.title}
                onSave={(newTitle: string) => {
                  updateStreamTitle(currentStream()!.id, newTitle);
                  setIsEditingTitle(false);
                }}
                onCancel={() => setIsEditingTitle(false)}
              />
            </Show>

            {/* View Mode & Specific Options */}
            <div style={{ display: 'flex', gap: '10px', "align-items": 'center' }}>
              
              {/* Reverse Order Checkbox */}
              <label style={{ 
                "font-size": '12px', 
                "font-family": 'monospace', 
                display: 'flex', 
                "align-items": 'center', 
                gap: '4px',
                cursor: (viewMode() === 'SpurtTextReadView' && !useLineBreaks()) ? 'not-allowed' : 'pointer',
                opacity: (viewMode() === 'SpurtTextReadView' && !useLineBreaks()) ? 0.5 : 1
              }}>
                <input 
                  type="checkbox" 
                  checked={isContentReverseOrd()} 
                  onChange={(e) => setIsContentReverseOrd(e.target.checked)} 
                  disabled={viewMode() === 'SpurtTextReadView' && !useLineBreaks()}
                />
                Reverse Ord
              </label>

              {/* Line Breaks Checkbox */}
              <Show when={viewMode() === 'SpurtTextReadView'}>
                <label style={{ "font-size": '12px', "font-family": 'monospace', cursor: 'pointer', display: 'flex', "align-items": 'center', gap: '4px' }}>
                  <input 
                    type="checkbox" 
                    checked={useLineBreaks()} 
                    onChange={(e) => setUseLineBreaks(e.target.checked)} 
                  />
                  Line Breaks
                </label>
              </Show>

              <select 
                value={viewMode()} 
                onChange={(e) => setViewMode(e.currentTarget.value as ViewMode)}
                style={{
                  padding: '4px 8px',
                  "font-family": 'monospace',
                  "font-size": '14px',
                  border: '1px solid #ccc',
                  "border-radius": '4px',
                  cursor: 'pointer',
                  "background-color": '#fafafa'
                }}
              >
                <option value="SpurtFullInfoView">*Spurt Info*</option>
                <option value="SpurtTextReadView">*Spurt Read*</option>
                <option value="SpurtDotsFeelView">*Spurt Dots*</option>
              </select>            </div>
          </div>

          {/* Dynamic Stream Stats */}
          <Show 
            when={viewMode() === 'SpurtFullInfoView'} 
            fallback={
              <div style={{ "font-size": '12px', color: '#666', display: 'flex', gap: '15px' }}>
                <span>Spurts: {streamSpurts().length}</span>
                <span>Created: {new Date(currentStream()!.createDT).toLocaleTimeString()}</span>
              </div>
            }
          >
            {/* Expanded Header for SpurtFullInfoView */}
            <div style={{ 
              display: 'grid', "grid-template-columns": '1fr 1fr', gap: '6px', 
              "font-size": '12px', color: '#444', "background-color": '#f5f5f5', 
              padding: '12px', "border-radius": '4px', border: '1px solid #e0e0e0' 
            }}>
              <div><strong>Title:</strong> {currentStream()?.title}</div>
              <div><strong>Created:</strong> @{new Date(currentStream()!.createDT).toLocaleString()}</div>
              <div><strong>Total Time:</strong> {totalTime()}ms</div>
              <div><strong>Total Keys:</strong> {totalKeys()}</div>
              <div><strong>Total Words:</strong> {totalWords()}</div>
              <div><strong>Average Rate:</strong> {avgKeysRate()} keys/sec</div>
              <div><strong>Max KeysWrRate:</strong> {maxKeysRate()} keys/sec</div>
            </div>
          </Show>
        </div>

        {/* === STREAM CONTENTS === */}
        <div style={{ "font-family": 'monospace', "font-size": '16px', "line-height": '1.6' }}>
          
          {/* 1. SpurtFullInfoView */}
          <Show when={viewMode() === 'SpurtFullInfoView'}>
            <div style={{ display: 'flex', "flex-direction": 'column', gap: '20px' }}>
              <For each={displayedSpurts()}>
                {(spurt) => {
                  const words = getWordCount(spurt!.spurTents);
                  const keys = spurt!.spurTents.length;
                  const tSpanSec = spurt!.tSpan / 1000;
                  const wordRate = tSpanSec > 0 ? (words / tSpanSec).toFixed(2) : "0";
                  const keyRate = tSpanSec > 0 ? (keys / tSpanSec).toFixed(2) : "0";

                  return (
                    <div style={{ border: '1px solid #ddd', "border-radius": '4px' }}>
                      {/* Spurt Header */}
                      <div style={{ 
                        "background-color": '#eee', padding: '8px', "font-size": '11px', 
                        display: 'grid', "grid-template-columns": '1fr 1fr', gap: '4px', 
                        "border-bottom": '1px solid #ddd', color: '#555' 
                      }}>
                        <span><strong>Written:</strong> @{new Date(spurt!.createDT).toLocaleTimeString()}</span>
                        <span><strong>TimeWriting:</strong> {spurt!.tSpan}ms</span>
                        <span><strong>Word Count:</strong> {words}</span>
                        <span><strong>Keys Count:</strong> {keys}</span>
                        <span><strong>WordWrRate:</strong> {wordRate}/s</span>
                        <span><strong>KeysWrRate:</strong> {keyRate}/s</span>
                        <span><strong>DelayUsed:</strong> {spurt!.delayTSpan}ms</span>
                      </div>
                      
                      {/* Spurt Body */}
                      <div style={{ padding: '12px', position: 'relative' }}>
                        <span 
                          onClick={() => setActiveSpurtMenuId(prev => prev === spurt!.id ? null : spurt!.id)}
                          style={{ cursor: 'pointer', display: 'inline-block', width: '100%' }}
                        >
                          {spurt!.spurTents}
                        </span>
                        
                        <Show when={activeSpurtMenuId() === spurt!.id}>
                          <OptionsFrame 
                            options={[
                              { label: "Delete", onClick: () => deleteSpurt(spurt!.id) },
                              { label: "Pop", onClick: () => console.log(`Pop ${spurt!.id}`) }
                            ]}
                            onClose={() => setActiveSpurtMenuId(null)}
                          />
                        </Show>
                      </div>
                    </div>
                  );
                }}
              </For>
            </div>
          </Show>

          {/* 2. SpurtTextReadView (Our previous default view) */}
          {/* 2. SpurtTextReadView */}
          <Show when={viewMode() === 'SpurtTextReadView'}>
            <div style={{ 
              display: useLineBreaks() ? 'flex' : 'block', 
              "flex-direction": 'column', 
              gap: useLineBreaks() ? '12px' : '0' 
            }}>
              <For each={displayedSpurts()}>
                {(spurt) => (
                  <div style={{ 
                    position: 'relative', 
                    display: useLineBreaks() ? 'block' : 'inline' // Block for line breaks, inline for continuous flow
                  }}>
                    <span 
                      class="spurt-highlight" 
                      title={`Created: ${new Date(spurt!.createDT).toLocaleTimeString()} | tSpan: ${spurt!.tSpan}ms`}
                      onClick={() => setActiveSpurtMenuId(prev => prev === spurt!.id ? null : spurt!.id)}
                      style={{ 
                        display: useLineBreaks() ? 'inline-block' : 'inline',
                        "margin-right": useLineBreaks() ? '0' : '8px' // Space between inline spurts
                      }}
                    >
                      {spurt!.spurTents}
                    </span>

                    <Show when={activeSpurtMenuId() === spurt!.id}>
                      <OptionsFrame 
                        options={[
                          { label: "Delete", onClick: () => deleteSpurt(spurt!.id) },
                          { label: "Pop", onClick: () => console.log(`Pop ${spurt!.id}`) }
                        ]}
                        onClose={() => setActiveSpurtMenuId(null)}
                      />
                    </Show>
                  </div>
                )}
              </For>
            </div>
          </Show>

          {/* 3. SpurtDotsFeelView */}
          <Show when={viewMode() === 'SpurtDotsFeelView'}>
            <div style={{ 
              position: 'relative', 
              width: '100%', 
              height: `${dotData().height}px`, 
              border: '1px solid #eee', 
              "border-radius": '4px',
              "background-color": '#fafbfc',
              overflow: 'hidden' // Keeps the SVG contained
            }}>
              
              {/* The Vector Canvas */}
              <svg width="100%" height="100%">
                <For each={dotData().dots}>
                  {(dot) => (
                    <circle
                      cx={`${dot.px}%`}
                      cy={dot.py}
                      r={dot.r}
                      fill={activeSpurtMenuId() === dot.id ? '#d32f2f' : '#607d8b'}
                      opacity="0.8"
                      style={{ cursor: 'pointer', transition: 'fill 0.2s ease, r 0.2s ease' }}
                      onClick={() => setActiveSpurtMenuId(prev => prev === dot.id ? null : dot.id)}
                    >
                      {/* Native SVG tooltip on hover */}
                      <title>{`Rate: ${dot.rate.toFixed(2)} keys/s | Keys: ${dot.spurt.spurTents.length}`}</title>
                    </circle>
                  )}
                </For>
              </svg>

              {/* The HTML Interactive Overlay */}
              <For each={dotData().dots}>
                {(dot) => (
                  <Show when={activeSpurtMenuId() === dot.id}>
                    <div style={{ 
                      position: 'absolute', 
                      left: `${dot.px}%`, 
                      top: `${dot.py + dot.r + 5}px`, 
                      "z-index": 10 
                    }}>
                      <OptionsFrame 
                        options={[
                          { label: "Delete", onClick: () => deleteSpurt(dot.id) },
                          { label: "Pop", onClick: () => console.log(`Pop ${dot.id}`) }
                        ]}
                        onClose={() => setActiveSpurtMenuId(null)}
                      />
                    </div>
                  </Show>
                )}
              </For>
            </div>
          </Show>

        </div>
      </Show>
    </div>
  );
};
