import { createMemo, Show, For, createSignal, createEffect, type Component } from 'solid-js';
import { allStreamsDB, allSpurtsDB, allBurstsDB, currentViewedStreamId, updateStreamTitle, deleteSpurt, type Spurt } from '../store';
import { EditTitle } from './EditTitle';
import { OptionsFrame } from './OptionsFrame';

type ViewMode = 'SpurtTextReadView' | 'SpurtDotsFeelView';

export const StreamView: Component = () => {
  const [isEditingTitle, setIsEditingTitle] = createSignal(false);
  const [activeSpurtMenuId, setActiveSpurtMenuId] = createSignal<number | null>(null);
  
  const [viewMode, setViewMode] = createSignal<ViewMode>('SpurtTextReadView');
  const [useLineBreaks, setUseLineBreaks] = createSignal(false); 
  const [isContentReverseOrd, setIsContentReverseOrd] = createSignal(false);

  const currentStream = createMemo(() => allStreamsDB.find(s => s.id === currentViewedStreamId()));

  const streamItems = createMemo(() => {
    const stream = currentStream();
    if (!stream) return [];
    return stream.contentIds.map(id => {
      if (id > 0) {
        const spurt = allSpurtsDB.find(s => s.id === id);
        return { type: 'spurt' as const, id, spurt, burst: undefined, spurts: [] };
      } else {
        const burst = allBurstsDB.find(b => b.id === id);
        const spurts = burst ? burst.contentIds.map(sId => allSpurtsDB.find(s => s.id === sId)).filter(Boolean) as Spurt[] : [];
        return { type: 'burst' as const, id, spurt: undefined, burst, spurts };
      }
    }).filter(item => item.spurt !== undefined || item.burst !== undefined);
  });

  createEffect(() => {
    if (viewMode() === 'SpurtTextReadView' && !useLineBreaks()) setIsContentReverseOrd(false);
  });

  const displayedItems = createMemo(() => isContentReverseOrd() ? [...streamItems()].reverse() : streamItems());

  const allStreamSpurts = createMemo(() => streamItems().flatMap(item => item.type === 'spurt' ? [item.spurt!] : item.spurts));
  const getWordCount = (text: string) => text.trim().split(/\s+/).filter(w => w.length > 0).length;

  const dotData = createMemo(() => {
    const spurts = allStreamSpurts();
    if (spurts.length === 0) return { dots: [], burstLines: [], height: 0 };
    
    const rawData = spurts.map(spurt => {
      const tSpanSec = spurt.tSpan / 1000;
      return { spurt, rate: tSpanSec > 0 ? getWordCount(spurt.spurTents) / tSpanSec : 0 };
    });
    
    const maxRate = Math.max(...rawData.map(d => d.rate), 0.1); 
    const rowSpacing = 40;
    
    const dots = rawData.map((d, index) => ({
      id: d.spurt.id, spurt: d.spurt, rate: d.rate,
      px: (d.rate / maxRate) * 90 + 5, py: (index * rowSpacing) + 30,
      r: Math.max(4, Math.min(24, Math.sqrt(d.spurt.spurTents.length) * 1.5))
    }));

    const dotLookup = new Map(dots.map(d => [d.id, d]));
    const burstLines = streamItems().filter(item => item.type === 'burst' && item.spurts.length > 1).map(b => {
      const bWords = b.spurts.reduce((acc, s) => acc + getWordCount(s.spurTents), 0);
      const segments = [];
      for (let i = 0; i < b.spurts.length - 1; i++) {
        const d1 = dotLookup.get(b.spurts[i].id), d2 = dotLookup.get(b.spurts[i+1].id);
        if (d1 && d2) segments.push({ x1: d1.px, y1: d1.py, x2: d2.px, y2: d2.py });
      }
      return { id: b.id, strokeWidth: Math.max(2, Math.min(12, Math.sqrt(bWords) * 1.2)), segments };
    });

    return { dots, burstLines, height: Math.max(200, dots.length * rowSpacing + 60) };
  });

  const renderSpurtText = (spurt: Spurt, asBlock: boolean = false) => (
    <span style={{ position: 'relative', display: asBlock ? 'block' : 'inline' }}>
      <span class="spurt-highlight" title={`tSpan: ${spurt.tSpan}ms`} onClick={() => setActiveSpurtMenuId(prev => prev === spurt.id ? null : spurt.id)} style={{ display: asBlock ? 'inline-block' : 'inline', "margin-right": asBlock ? '0' : '8px' }}>
        {spurt.spurTents}
      </span>
      <Show when={activeSpurtMenuId() === spurt.id}>
        <div style={{ position: 'absolute', "z-index": 10 }}>
          <OptionsFrame options={[{ label: "Delete", onClick: () => deleteSpurt(spurt.id) }]} onClose={() => setActiveSpurtMenuId(null)} />
        </div>
      </Show>
    </span>
  );

  return (
    <div style={{ width: '54ch', margin: '0 auto', padding: '20px 0' }}>
      <Show when={currentStream()} fallback={<p style={{ color: '#aaa', "text-align": 'center' }}>No stream open.</p>}>
        <div style={{ 'text-align': 'center' }}>
          <Show when={isEditingTitle()} fallback={<h2 style={{ 'margin-bottom' : '20px', cursor: 'pointer' }} onClick={() => setIsEditingTitle(true)}>{currentStream()?.title}</h2>}>
            <EditTitle initialValue={currentStream()!.title} onSave={(title) => { updateStreamTitle(currentStream()!.id, title); setIsEditingTitle(false); }} onCancel={() => setIsEditingTitle(false)} />
          </Show>       
        </div>
        <div style={{ width: '100%', display: 'flex', "flex-direction": 'row', "justify-content": "space-between", "border-bottom": '2px solid #ccc', "padding-bottom": '10px' }}>
            <div style={{ display: 'flex', "flex-direction": 'column-reverse', gap: '10px', "align-items": 'left' }}>
              <label style={{ "font-size": '10px', "font-family": 'monospace', display: 'flex', gap: '4px', opacity: (viewMode() === 'SpurtTextReadView' && !useLineBreaks()) ? 0.5 : 1 }}>
                <input type="checkbox" checked={isContentReverseOrd()} onChange={(e) => setIsContentReverseOrd(e.target.checked)} disabled={viewMode() === 'SpurtTextReadView' && !useLineBreaks()} />
                  Newest on Top
              </label>
              <Show when={viewMode() === 'SpurtTextReadView'}>
                <label style={{ "font-size": '10px', "font-family": 'monospace', display: 'flex', gap: '4px' }}>
                  <input type="checkbox" checked={useLineBreaks()} onChange={(e) => setUseLineBreaks(e.target.checked)} />
                  Separate Spurts
                </label>
              </Show>
            </div>
            <div>
              <select value={viewMode()} onChange={(e) => setViewMode(e.currentTarget.value as ViewMode)} style={{ padding: '4px 8px', "font-family": 'monospace', "font-size": '14px', border: '1px solid #ccc', "border-radius": '4px', cursor: 'pointer' }}>
                <option value="SpurtTextReadView">*Spurt Read*</option>
                <option value="SpurtDotsFeelView">*Spurt Dots*</option>
              </select>
            </div>
        </div>

        <div style={{ "font-family": 'monospace', "font-size": '16px', "line-height": '1.6' }}>
          
          <Show when={viewMode() === 'SpurtTextReadView'}>
            <div style={{ 
              display: useLineBreaks() ? 'flex' : 'block', // 'block' allows inline children to wrap naturally
              "flex-direction": 'column', 
              gap: useLineBreaks() ? '12px' : '0' 
            }}>
              <For each={displayedItems()}>
                {(item) => {
                  if (item.type === 'spurt') {
                    return renderSpurtText(item.spurt!, useLineBreaks());
                  } else {
                    return (
                      <div style={{ 
                        display: useLineBreaks() ? 'flex' : 'block', 
                        "flex-direction": 'column', 
                        "margin-top": useLineBreaks() ? '0' : '1.5em',
                        "margin-bottom": useLineBreaks() ? '0' : '1.5em', // Paragraph spacing
                        "text-indent": useLineBreaks() ? '0' : '4ch',
                        gap: useLineBreaks() ? '12px' : '0' 
                      }}>
                        <For each={item.spurts}>{(s) => renderSpurtText(s, useLineBreaks())}</For>
                      </div>
                    );
                  }
                }}
              </For>
            </div>
          </Show>

          <Show when={viewMode() === 'SpurtDotsFeelView'}>
             <div style={{ position: 'relative', width: '100%', height: `${dotData().height}px`, border: '1px solid #eee', "border-radius": '4px', "background-color": '#fafbfc', overflow: 'hidden' }}>
              <svg width="100%" height="100%">
                <For each={dotData().burstLines}>
                  {(burstLine) => (
                    <g stroke="#b0bec5" stroke-width={burstLine.strokeWidth} stroke-linecap="round" opacity="0.5" style={{ transition: 'stroke-width 0.2s ease' }}>
                      <For each={burstLine.segments}>
                        {(seg) => <line x1={`${seg.x1}%`} y1={seg.y1} x2={`${seg.x2}%`} y2={seg.y2} style={{ transition: 'x1 0.2s ease, x2 0.2s ease' }}/>}
                      </For>
                    </g>
                  )}
                </For>
                <For each={dotData().dots}>
                  {(dot) => (
                    <circle cx={`${dot.px}%`} cy={dot.py} r={dot.r} fill={activeSpurtMenuId() === dot.id ? '#d32f2f' : '#607d8b'} opacity="0.8" style={{ cursor: 'pointer', transition: 'fill 0.2s ease, r 0.2s ease, cx 0.2s ease' }} onClick={() => setActiveSpurtMenuId(prev => prev === dot.id ? null : dot.id)}>
                      <title>{dot.spurt.spurTents}</title>                    
                    </circle>)}
                </For>
              </svg>
              <For each={dotData().dots}>
                {(dot) => (
                  <Show when={activeSpurtMenuId() === dot.id}>
                    <div style={{ position: 'absolute', left: `${dot.px}%`, top: `${dot.py + dot.r + 5}px`, "z-index": 10 }}>
                      <OptionsFrame options={[{ label: "Delete", onClick: () => deleteSpurt(dot.id) }]} onClose={() => setActiveSpurtMenuId(null)} />
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
