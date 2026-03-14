// src/components/WritersBlock.tsx
import { createEffect, onCleanup, createSignal, type Component } from 'solid-js';
import { 
  tSpurtDelay, 
  setIsWritersBlockEmpty,
  typingStartTime, setTypingStartTime,
  setCurrentSpurtgatoryHolder,
  processNewSpurt, flushSpurtgatoryToStream, type Spurt
} from '../store';

export const WritersBlock: Component = () => {
  let textareaRef: HTMLTextAreaElement | undefined;
  const [currentText, setCurrentText] = createSignal("");
  
  // Initialize Web Worker
  const worker = new Worker(new URL('../workers/timerWorker.ts', import.meta.url), { type: 'module' });

  // Handle worker messages
  worker.onmessage = (e) => {
    if (e.data.type === 'spurt_timeout') {
      commitSpurt();
    }
  };

  onCleanup(() => {
    worker.terminate();
  });

  // Auto-resize textarea height
  createEffect(() => {
    if (textareaRef) {
      textareaRef.style.height = 'auto';
      textareaRef.style.height = textareaRef.scrollHeight + 'px';
    }
    // Update global store for settings disabled state
    setIsWritersBlockEmpty(currentText().length === 0);
  });

  const commitSpurt = () => {
    const text = currentText().trim();
    if (!text) return; // Do nothing if empty

    const now = Date.now();
    const start = typingStartTime() || now;
    
    const newSpurt: Spurt = {
      id: 0, // Temp ID generation
      createDT: now,
      spurTents: text,
      tSpan: now - start,
      delayTSpan: tSpurtDelay() * 1000 // Convert UI seconds to MS
    };

    processNewSpurt(newSpurt);

    // Reset Block
    setCurrentText("");
    setTypingStartTime(null);
    worker.postMessage({ type: 'stop' });
  };

  const flushSpurtgatory = () => {
    console.log("Flushing Spurtgatory to target stream...");
    flushSpurtgatoryToStream();
    setCurrentSpurtgatoryHolder(null);
  };

  const handleKeyDown = (e: KeyboardEvent) => {
    const text = currentText();

    // 1. Intercept Backspace
    if (e.key === 'Backspace') {
      e.preventDefault();
      if (text.length > 0) commitSpurt();
      return;
    }

    // 2. Intercept Enter
    if (e.key === 'Enter') {
      e.preventDefault();
      if (text.length > 0) {
        commitSpurt();
      } else {
        flushSpurtgatory();
      }
      return;
    }

    // 3. Ignore control keys (Shift, Ctrl, etc.) so they don't trigger typing start
    if (e.key.length !== 1) return; 

    // 4. Valid character typed: start/reset timer
    if (!typingStartTime()) {
      setTypingStartTime(Date.now());
    }
    
    worker.postMessage({ 
      type: 'reset', 
      delay: tSpurtDelay() * 1000 // Send delay in milliseconds
    });
  };

  return (
    <div style={{ display: 'flex', "justify-content": "center", "margin-top": "20px" }}>
      {/* Visual Typing Indication (Placeholder) */}
      <div style={{ width: "20px", display: "flex", "align-items": "flex-start", color: "#aaa" }}>
        {currentText().length > 0 ? ">" : ""}
      </div>
      
      <textarea
        ref={textareaRef}
        value={currentText()}
        onInput={(e) => setCurrentText(e.currentTarget.value)}
        onKeyDown={handleKeyDown}
        onPaste={(e) => e.preventDefault()}
        placeholder="Start writing..."
        style={{
          width: '54ch', /* Exactly 54 character widths */
          "min-height": '1.5em',
          "font-family": 'monospace', /* Crucial for 'ch' unit accuracy */
          "font-size": '16px',
          resize: 'none',
          overflow: 'hidden',
          outline: 'none',
          border: '1px solid #ccc',
          padding: '8px',
          "line-height": '1.5'
        }}
      />
    </div>
  );
};
